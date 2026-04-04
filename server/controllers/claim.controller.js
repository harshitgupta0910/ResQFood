const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const { calculateFairnessScore } = require('../services/fairness.service');

// @desc    Claim a listing (atomic - first valid claim wins)
// @route   POST /api/listings/:id/claim
const claimListing = async (req, res, next) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can claim listings',
      });
    }

    const listingId = req.params.id;
    const ngoId = req.user._id;
    const requestedQty = Number(req.body.quantity);

    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid claim quantity',
      });
    }

    // Atomic update for partial claims: decrement quantity only when enough stock remains.
    const listing = await FoodListing.findOneAndUpdate(
      {
        _id: listingId,
        status: 'available',
        quantity: { $gte: requestedQty },
      },
      {
        $inc: { quantity: -requestedQty },
      },
      {
        new: true,
      }
    ).populate('donorId', 'name email');

    if (!listing) {
      return res.status(409).json({
        success: false,
        message: 'Requested quantity is unavailable or listing is no longer available',
      });
    }

    if (listing.quantity <= 0) {
      listing.status = 'claimed';
      listing.claimedBy = ngoId;
      listing.claimedAt = new Date();
    }

    await listing.save();

    // Calculate fairness score
    const priorityScore = await calculateFairnessScore(ngoId, listing);

    // Create claim record
    const claim = await Claim.create({
      listingId: listing._id,
      ngoId,
      claimedQuantity: requestedQty,
      status: 'approved',
      priorityScore,
      notes: req.body.notes || '',
    });

    // Create notification for donor
    await Notification.create({
      userId: listing.donorId._id,
      type: 'listing_claimed',
      title: 'Listing Claimed',
      message: `Your listing "${listing.title}" has been claimed by ${req.user.name}`,
      data: { listingId: listing._id, claimId: claim._id },
    });

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      // Notify donor
      io.to(`user_${listing.donorId._id}`).emit('listing:claimed', {
        listing,
        claimedQuantity: requestedQty,
        claimedBy: { name: req.user.name, email: req.user.email },
      });

      // Notify NGOs to refresh listing quantity or remove when exhausted.
      io.to('role_ngo').emit('listing:updated', listing);

      // Send notification
      io.to(`user_${listing.donorId._id}`).emit('notification:new', {
        type: 'listing_claimed',
        title: 'Listing Claimed',
        message: `Your listing "${listing.title}" has been claimed`,
      });
    }

    res.json({
      success: true,
      data: { listing, claim, remainingQuantity: listing.quantity },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get claims by NGO
// @route   GET /api/claims
const getMyClaims = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { ngoId: req.user._id };
    if (status) query.status = status;

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .populate({
        path: 'listingId',
        populate: [
          { path: 'donorId', select: 'name email avatar' },
          { path: 'assignedVolunteer', select: 'name email phone' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: claims,
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

// @desc    Get all claims (admin)
// @route   GET /api/claims/all
const getAllClaims = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Claim.countDocuments();
    const claims = await Claim.find()
      .populate('listingId')
      .populate('ngoId', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: claims,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all received claims for donor listings
// @route   GET /api/claims/received
const getReceivedClaims = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {};
    if (req.user.role === 'donor') {
      const donorListings = await FoodListing.find({ donorId: req.user._id }).select('_id');
      query.listingId = { $in: donorListings.map((l) => l._id) };
    }

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .populate({
        path: 'listingId',
        select: 'title quantity unit status donorId address expiryAt',
      })
      .populate({
        path: 'ngoId',
        select: 'name email phone organizationId',
        populate: {
          path: 'organizationId',
          model: 'Organization',
          select: 'name type contactPhone',
        },
      })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: claims,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get claims for a specific listing (donor/admin)
// @route   GET /api/claims/listing/:listingId
const getClaimsForListing = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const listing = await FoodListing.findById(listingId).select('donorId title unit');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const isOwner = listing.donorId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view claims for this listing',
      });
    }

    const claims = await Claim.find({ listingId })
      .populate({
        path: 'ngoId',
        select: 'name email phone organizationId',
        populate: {
          path: 'organizationId',
          model: 'Organization',
          select: 'name type',
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        listing: {
          _id: listing._id,
          title: listing.title,
          unit: listing.unit,
        },
        claims,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { claimListing, getMyClaims, getAllClaims, getClaimsForListing, getReceivedClaims };
