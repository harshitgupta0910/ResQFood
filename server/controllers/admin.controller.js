const User = require('../models/User');
const Organization = require('../models/Organization');
const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const Complaint = require('../models/Complaint');

// Helper error throwing
const createError = (msg, code) => {
    const err = new Error(msg);
    err.statusCode = code;
    return err;
};

// --- USER & ORGANIZATION MANAGEMENT ---

exports.getUsers = async (req, res) => {
  const { role, isVerified, isBanned, search } = req.query;
  const match = {};

  if (role) match.role = role;
  if (isVerified !== undefined) match.isVerified = isVerified === 'true';
  if (isBanned !== undefined) match.isBanned = isBanned === 'true';
  
  if (search) {
    match.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const users = await User.find(match).populate('organizationId', 'name type status').sort('-createdAt');
  res.status(200).json({ status: 'success', results: users.length, data: { users } });
};

exports.updateUserStatus = async (req, res, next) => {
  const { userId } = req.params;
  const { isBanned, isVerified, suspendUntil } = req.body;

  const user = await User.findById(userId);
  if (!user) return next(createError('User not found', 404));

  if (isBanned !== undefined) user.isBanned = isBanned;
  if (isVerified !== undefined) user.isVerified = isVerified;
  if (suspendUntil !== undefined) user.suspendUntil = suspendUntil;

  user.activityLogs.push({
    action: `Status updated by Admin. Banned: ${user.isBanned}, Verified: ${user.isVerified}`,
    ip: req.ip
  });

  await user.save();
  res.status(200).json({ status: 'success', data: { user } });
};

exports.verifyOrganization = async (req, res, next) => {
  const { orgId } = req.params;
  const { status } = req.body; // 'approved', 'rejected'

  const org = await Organization.findByIdAndUpdate(
    orgId,
    { status, verifiedAt: status === 'approved' ? Date.now() : null },
    { new: true, runValidators: true }
  );

  if (!org) return next(createError('Organization not found', 404));
  res.status(200).json({ status: 'success', data: { org } });
};

exports.getUserActivityLogs = async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(userId).select('activityLogs name email');
    if (!user) return next(createError('User not found', 404));

    res.status(200).json({ status: 'success', data: { user } });
};

// --- FOOD LISTING MODERATION ---

exports.getAllListings = async (req, res) => {
  const { status, isFlagged } = req.query;
  const match = {};

  if (status) match.status = status;
  if (isFlagged !== undefined) match.isFlagged = isFlagged === 'true';

  const listings = await FoodListing.find(match)
    .populate('donorId', 'name email')
    .sort('-createdAt');
    
  res.status(200).json({ status: 'success', results: listings.length, data: { listings } });
};

exports.moderateListing = async (req, res, next) => {
  const { listingId } = req.params;
  const { status, isFlagged, flagReason } = req.body;

  const listing = await FoodListing.findById(listingId);
  if (!listing) return next(createError('Listing not found', 404));

  if (status) listing.status = status;
  if (isFlagged !== undefined) {
    listing.isFlagged = isFlagged;
    listing.flagReason = flagReason || '';
  }

  await listing.save();
  res.status(200).json({ status: 'success', data: { listing } });
};

exports.deleteListing = async (req, res, next) => {
  const { listingId } = req.params;
  const listing = await FoodListing.findById(listingId);
  
  if (!listing) return next(createError('Listing not found', 404));
  await listing.remove();
  
  res.status(204).json({ status: 'success', data: null });
};

// --- CLAIM & ALLOCATION CONTROL ---

exports.getAllClaims = async (req, res) => {
  const claims = await Claim.find()
    .populate('listingId', 'title quantity status')
    .populate('ngoId', 'name email')
    .sort('-createdAt');
    
  res.status(200).json({ status: 'success', results: claims.length, data: { claims } });
};

exports.forceAssignClaim = async (req, res, next) => {
  const { claimId } = req.params;
  const { newNgoId } = req.body;

  const claim = await Claim.findById(claimId).populate('listingId');
  if (!claim) return next(createError('Claim not found', 404));

  claim.ngoId = newNgoId;
  const newNgo = await User.findById(newNgoId).select('name email');
  
  await claim.save();
  
  // also update listing
  const listing = await FoodListing.findById(claim.listingId);
  if(listing) {
      listing.claimedBy = newNgoId;
      await listing.save();
  }

  res.status(200).json({ status: 'success', data: { claim, reassignedTo: newNgo } });
};

// --- COMPLAINT & REPORT SYSTEM ---

exports.getComplaints = async (req, res) => {
  const complaints = await Complaint.find()
    .populate('reportedBy', 'name email')
    .populate('reportedUser', 'name email')
    .sort({ status: 1, createdAt: -1 });
    
  res.status(200).json({ status: 'success', results: complaints.length, data: { complaints } });
};

exports.resolveComplaint = async (req, res, next) => {
  const { complaintId } = req.params;
  const { status, resolutionNotes } = req.body;

  const complaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { status, resolutionNotes, resolvedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!complaint) return next(createError('Complaint not found', 404));
  res.status(200).json({ status: 'success', data: { complaint } });
};

// --- LIVE METRICS ---
exports.getLiveMetrics = async (req, res) => {
    const totalListings = await FoodListing.countDocuments();
    const activeListings = await FoodListing.countDocuments({ status: 'available' });
    const usersCount = await User.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    
    // Calculate total meals saved (sum of quantity of completed claims)
    const completedClaims = await Claim.find({ status: 'completed' }).populate('listingId', 'quantity');
    const totalMealsSaved = completedClaims.reduce((acc, curr) => acc + (curr.listingId?.quantity || 0), 0);

    const anomalies = await FoodListing.find({
      $or: [
        { quantity: { $gt: 500 } }, // Unrealistic quantity
        { expiryAt: { $lt: new Date() }, status: 'available' } // Expired but available
      ]
    }).select('-photos -geo');
    
    res.status(200).json({
        status: 'success',
        data: {
            metrics: {
                totalListings,
                activeListings,
                usersCount,
                pendingComplaints,
                totalMealsSaved
            },
            anomalies
        }
    });
};