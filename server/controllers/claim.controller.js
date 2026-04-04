const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const { calculateFairnessScore } = require('../services/fairness.service');
const { sendMail } = require('../services/mail.service');
const crypto = require('crypto');

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc    Claim a listing (supports partial quantity with verification workflow)
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

    // Reserve requested quantity only if listing still has enough available.
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

    const fullyClaimed = listing.quantity <= 0;
    if (fullyClaimed) {
      listing.status = 'claimed';
      listing.claimedBy = ngoId;
      listing.claimedAt = new Date();
      await listing.save();
    }

    const priorityScore = await calculateFairnessScore(ngoId, listing);

    const now = new Date();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationEmailAt = new Date(now.getTime() + 30 * 1000);
    const verificationDeadline = new Date(now.getTime() + 60 * 1000);

    // Upsert allows re-claim attempts by same NGO for same listing after timeout.
    const claim = await Claim.findOneAndUpdate(
      { listingId: listing._id, ngoId },
      {
        claimedQuantity: requestedQty,
        donorId: listing.donorId?._id || listing.donorId,
        status: 'pending',
        priorityScore,
        notes: req.body.notes || '',
        verificationToken,
        verificationEmailAt,
        verificationEmailSent: false,
        verificationDeadline,
        isPickupConfirmed: false,
        confirmedAt: null,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
    const verifyUrl = `${backendBaseUrl.replace(/\/$/, '')}/api/claims/verify/${verificationToken}`;

    try {
      await sendMail({
        to: req.user.email,
        subject: `Claim received for ${listing.title}`,
        html: `
          <p>Hello ${req.user.name},</p>
          <p>You claimed <strong>${requestedQty} ${listing.unit}</strong> of <strong>${listing.title}</strong>.</p>
          <p>Pickup address: ${listing.address || 'N/A'}</p>
          <p>You will receive a verification mail in 30 seconds.</p>
        `,
        text: `You claimed ${requestedQty} ${listing.unit} of ${listing.title}. Pickup: ${listing.address || 'N/A'}. Verification mail will follow in 30 seconds.`,
      });
    } catch (mailErr) {
      console.error('Immediate claim mail failed:', mailErr.message);
    }

    await Notification.create({
      userId: listing.donorId._id,
      type: 'listing_claimed',
      title: fullyClaimed ? 'Listing Fully Claimed' : 'Partial Claim Received',
      message: `${req.user.name} claimed ${requestedQty} ${listing.unit} from "${listing.title}"`,
      data: { listingId: listing._id, claimId: claim._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${listing.donorId._id}`).emit('listing:claimed', {
        listing,
        claimedQuantity: requestedQty,
        claimedBy: { name: req.user.name, email: req.user.email },
      });

      io.to('role_ngo').emit('listing:updated', listing);

      io.to(`user_${listing.donorId._id}`).emit('notification:new', {
        type: 'listing_claimed',
        title: fullyClaimed ? 'Listing Fully Claimed' : 'Partial Claim Received',
        message: `${req.user.name} claimed ${requestedQty} ${listing.unit} from "${listing.title}"`,
      });
    }

    res.json({
      success: true,
      data: {
        listing,
        claim,
        remainingQuantity: listing.quantity,
        verification: {
          verificationEmailAt,
          verificationDeadline,
          verifyUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify claim by emailed token
// @route   GET /api/claims/verify/:token
const verifyClaimByToken = async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { token } = req.params;
    const claim = await Claim.findOne({ verificationToken: token }).populate('listingId ngoId');

    if (!claim) {
      return res.redirect(`${clientUrl}/ngo/claims?verify=invalid`);
    }

    if (claim.status === 'approved' && claim.isPickupConfirmed) {
      return res.redirect(`${clientUrl}/ngo/claims?verify=already-confirmed`);
    }

    if (claim.status !== 'pending') {
      return res.redirect(`${clientUrl}/ngo/claims?verify=${encodeURIComponent(claim.status)}`);
    }

    if (claim.verificationDeadline && claim.verificationDeadline.getTime() < Date.now()) {
      return res.redirect(`${clientUrl}/ngo/claims?verify=expired`);
    }

    claim.status = 'approved';
    claim.isPickupConfirmed = true;
    claim.confirmedAt = new Date();
    await claim.save();

    const donorId = claim.listingId?.donorId;
    if (donorId) {
      await Notification.create({
        userId: donorId,
        type: 'claim_confirmed',
        title: 'NGO Confirmed Pickup',
        message: `${claim.ngoId?.name || 'NGO'} confirmed pickup for "${claim.listingId?.title || 'listing'}"`,
        data: { listingId: claim.listingId?._id, claimId: claim._id },
      });
    }

    res.redirect(`${clientUrl}/ngo/claims?verify=success`);
  } catch (error) {
    next(error);
  }
};

// @desc    Donor sends delivery OTP to NGO email for approved claim
// @route   POST /api/claims/:claimId/send-delivery-otp
const sendDeliveryOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'donor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only donor can send delivery OTP' });
    }

    const { claimId } = req.params;
    const claim = await Claim.findById(claimId)
      .populate('listingId', 'title donorId status claimedBy')
      .populate('ngoId', 'name email');

    if (!claim || !claim.listingId || !claim.ngoId) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const isOwner = claim.listingId.donorId?.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this claim' });
    }

    if (claim.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'OTP can be sent only for approved claims' });
    }

    const otp = generateOtp();
    claim.deliveryOtpHash = hashOtp(otp);
    claim.deliveryOtpSentAt = new Date();
    claim.deliveryOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await claim.save();

    await sendMail({
      to: claim.ngoId.email,
      subject: `Delivery OTP for ${claim.listingId.title}`,
      html: `
        <p>Hello ${claim.ngoId.name},</p>
        <p>Your delivery OTP is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:2px;">${otp}</p>
        <p>Share this OTP with donor after receiving food.</p>
        <p>This OTP expires in 10 minutes.</p>
      `,
      text: `Delivery OTP: ${otp}. Share this OTP with donor after receiving food. Valid for 10 minutes.`,
    });

    await Notification.create({
      userId: claim.ngoId._id,
      type: 'claim_confirmed',
      title: 'Delivery OTP Sent',
      message: `Delivery OTP has been sent to your email for "${claim.listingId.title}"`,
      data: { listingId: claim.listingId._id, claimId: claim._id },
    });

    res.json({
      success: true,
      message: 'OTP sent to NGO email',
      data: { otpSentAt: claim.deliveryOtpSentAt, otpExpiresAt: claim.deliveryOtpExpiresAt },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Donor verifies delivery OTP and marks claim delivered
// @route   POST /api/claims/:claimId/verify-delivery-otp
const verifyDeliveryOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'donor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only donor can verify delivery OTP' });
    }

    const { claimId } = req.params;
    const otp = String(req.body.otp || '').trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit OTP' });
    }

    const claim = await Claim.findById(claimId)
      .populate('listingId', 'title donorId status claimedBy claimedAt deliveredAt')
      .populate('ngoId', 'name');

    if (!claim || !claim.listingId) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const isOwner = claim.listingId.donorId?.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this claim' });
    }

    if (claim.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Claim is already delivered' });
    }

    if (claim.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved claims can be marked delivered' });
    }

    if (!claim.deliveryOtpHash || !claim.deliveryOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please send OTP first.' });
    }

    if (claim.deliveryOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please send a new OTP.' });
    }

    const incomingHash = hashOtp(otp);
    if (incomingHash !== claim.deliveryOtpHash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    claim.status = 'delivered';
    claim.deliveryOtpHash = '';
    claim.deliveryOtpExpiresAt = null;
    claim.deliveryOtpSentAt = null;
    claim.deliveredAt = new Date();
    await claim.save();

    const listing = claim.listingId;
    if (listing.claimedBy?.toString() === claim.ngoId?._id?.toString() && listing.status === 'claimed') {
      listing.status = 'delivered';
      listing.deliveredAt = new Date();
      await listing.save();
    }

    await Notification.create({
      userId: claim.ngoId._id,
      type: 'claim_confirmed',
      title: 'Delivery Verified',
      message: `Your claim for "${listing.title}" has been marked delivered by donor`,
      data: { listingId: listing._id, claimId: claim._id },
    });

    res.json({
      success: true,
      message: 'Order delivered successfully',
      data: claim,
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

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'approved', 'delivered'] };
    }

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

module.exports = {
  claimListing,
  verifyClaimByToken,
  sendDeliveryOtp,
  verifyDeliveryOtp,
  getMyClaims,
  getAllClaims,
  getClaimsForListing,
  getReceivedClaims,
};
