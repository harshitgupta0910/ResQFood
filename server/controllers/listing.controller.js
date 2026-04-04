const FoodListing = require('../models/FoodListing');
const { uploadToCloudinary } = require('../config/cloudinary');
const { generateListingChatResponse } = require('../services/gemini.service');
const { generateAudioBuffer } = require('../services/elevenlabs.service');

// @desc    Create food listing
// @route   POST /api/listings
const createListing = async (req, res, next) => {
  try {
    const { title, description, quantity, unit, category, condition, expiryAt, readyAt, address, lat, lng } = req.body;

    // Basic validation before expensive uploads
    if (!title || !quantity || !address || !expiryAt) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields including expiryAt.' });
    }

    // Upload photos to cloudinary
    let photos = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, 'resqfood/listings')
        );
        const results = await Promise.all(uploadPromises);
        photos = results.map((r) => ({ url: r.secure_url, publicId: r.public_id }));
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr.message);
        return res.status(400).json({ success: false, error: 'Failed to upload images. Please try again.' });
      }
    }

    const listing = await FoodListing.create({
      donorId: req.user._id,
      title,
      description,
      quantity: Number(quantity),
      unit: unit || 'servings',
      category,
      condition: condition || 'fresh',
      photos,
      geo: {
        type: 'Point',
        coordinates: [Number(lng) || 0, Number(lat) || 0],
      },
      address: address || '',
      expiryAt: new Date(expiryAt),
      readyAt: readyAt ? new Date(readyAt) : new Date(),
      status: 'available',
    });

    const populatedListing = await FoodListing.findById(listing._id).populate('donorId', 'name email avatar');

    // Emit real-time event to all NGOs
    const io = req.app.get('io');
    if (io) {
      io.to('role_ngo').emit('listing:new', populatedListing);
    }

    res.status(201).json({ success: true, data: populatedListing });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings (with filters)
// @route   GET /api/listings
const getListings = async (req, res, next) => {
  try {
    const {
      status,
      category,
      condition,
      lat,
      lng,
      radius = 50,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      donorId,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (status === 'available') query.quantity = { $gt: 0 };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (donorId) query.donorId = donorId;

    // Geo query for nearby listings
    if (lat && lng) {
      query.geo = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius) * 1000, // km to meters
        },
      };
    }

    const total = await FoodListing.countDocuments(query);
    const listings = await FoodListing.find(query)
      .populate('donorId', 'name email avatar')
      .populate('claimedBy', 'name email')
      .populate('assignedVolunteer', 'name email')
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: listings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
const getListingById = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id)
      .populate({
        path: 'donorId',
        select: 'name email avatar phone location organizationId role',
        populate: {
          path: 'organizationId',
          model: 'Organization',
          select: 'name type verifiedStatus contactPhone'
        }
      })
      .populate('claimedBy', 'name email avatar phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Update listing
// @route   PATCH /api/listings/:id
const updateListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Only donor, ngo or admin can update
    if (listing.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'ngo') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const updates = { ...req.body };
    if (updates.lat && updates.lng) {
      updates.geo = {
        type: 'Point',
        coordinates: [Number(updates.lng), Number(updates.lat)],
      };
      delete updates.lat;
      delete updates.lng;
    }

    const updated = await FoodListing.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('donorId', 'name email avatar');

    const io = req.app.get('io');
    if (io) {
      io.to('role_ngo').emit('listing:updated', updated);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
const deleteListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (listing.status === 'claimed' || listing.status === 'picked_up') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a claimed or in-progress listing',
      });
    }

    await FoodListing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Ask AI assistant about current listing
// @route   POST /api/listings/:id/chatbot
const askListingChatbot = async (req, res, next) => {
  try {
    const { message, preferredLanguage = 'English', includeAudio = true } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const listing = await FoodListing.findById(req.params.id)
      .populate({
        path: 'donorId',
        select: 'name phone organizationId',
        populate: {
          path: 'organizationId',
          model: 'Organization',
          select: 'name contactPhone',
        },
      });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const aiText = await generateListingChatResponse({
      userMessage: message.trim(),
      listing,
      preferredLanguage,
    });

    let audioBase64 = null;
    if (includeAudio) {
      try {
        const audioBuffer = await generateAudioBuffer(aiText);
        if (audioBuffer) {
          audioBase64 = audioBuffer.toString('base64');
        }
      } catch (audioError) {
        console.log('Audio generation skipped:', audioError.message);
      }
    }

    res.json({
      success: true,
      data: {
        reply: aiText,
        audioBase64,
        audioMimeType: audioBase64 ? 'audio/mpeg' : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createListing, getListings, getListingById, updateListing, deleteListing, askListingChatbot };
