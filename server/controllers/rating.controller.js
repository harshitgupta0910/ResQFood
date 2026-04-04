const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Claim = require('../models/Claim');
const FoodListing = require('../models/FoodListing');

const getClaimParticipants = async (claim) => {
  let donorId = claim.donorId;

  if (!donorId && claim.listingId) {
    const listing = await FoodListing.findById(claim.listingId).select('donorId');
    donorId = listing?.donorId || null;
  }

  return {
    donorId: donorId ? donorId.toString() : null,
    ngoId: claim.ngoId ? claim.ngoId.toString() : null,
  };
};

const validateRatingAccess = async (reqUser, claim) => {
  if (claim.status !== 'delivered') {
    return { ok: false, statusCode: 400, message: 'Ratings are allowed only for delivered claims' };
  }

  const participants = await getClaimParticipants(claim);
  if (!participants.donorId || !participants.ngoId) {
    return { ok: false, statusCode: 400, message: 'Unable to resolve claim participants for rating' };
  }

  const raterId = reqUser._id.toString();

  if (reqUser.role === 'ngo') {
    if (raterId !== participants.ngoId) {
      return { ok: false, statusCode: 403, message: 'Only NGO participant can rate donor for this claim' };
    }

    return {
      ok: true,
      raterRole: 'ngo',
      rateeRole: 'donor',
      raterId,
      rateeId: participants.donorId,
      listingId: claim.listingId,
    };
  }

  if (reqUser.role === 'donor') {
    if (raterId !== participants.donorId) {
      return { ok: false, statusCode: 403, message: 'Only donor participant can rate NGO for this claim' };
    }

    return {
      ok: true,
      raterRole: 'donor',
      rateeRole: 'ngo',
      raterId,
      rateeId: participants.ngoId,
      listingId: claim.listingId,
    };
  }

  return { ok: false, statusCode: 403, message: 'Only donor or NGO can create ratings' };
};

const getUserSummaryAggregate = async (userId) => {
  const targetId = new mongoose.Types.ObjectId(userId);
  const [summary] = await Rating.aggregate([
    { $match: { rateeId: targetId } },
    {
      $group: {
        _id: '$rateeId',
        averageScore: { $avg: '$score' },
        totalCount: { $sum: 1 },
        one: { $sum: { $cond: [{ $eq: ['$score', 1] }, 1, 0] } },
        two: { $sum: { $cond: [{ $eq: ['$score', 2] }, 1, 0] } },
        three: { $sum: { $cond: [{ $eq: ['$score', 3] }, 1, 0] } },
        four: { $sum: { $cond: [{ $eq: ['$score', 4] }, 1, 0] } },
        five: { $sum: { $cond: [{ $eq: ['$score', 5] }, 1, 0] } },
      },
    },
  ]);

  if (!summary) {
    return {
      averageScore: 0,
      totalCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  return {
    averageScore: Number(summary.averageScore?.toFixed(2) || 0),
    totalCount: summary.totalCount || 0,
    distribution: {
      1: summary.one || 0,
      2: summary.two || 0,
      3: summary.three || 0,
      4: summary.four || 0,
      5: summary.five || 0,
    },
  };
};

// @desc    Create or update rating for delivered claim
// @route   POST /api/ratings
const upsertRating = async (req, res, next) => {
  try {
    const { claimId, score, review = '' } = req.body;

    if (!claimId) {
      return res.status(400).json({ success: false, message: 'claimId is required' });
    }

    const parsedScore = Number(score);
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      return res.status(400).json({ success: false, message: 'score must be an integer from 1 to 5' });
    }

    if (String(review).length > 500) {
      return res.status(400).json({ success: false, message: 'review must be at most 500 characters' });
    }

    const claim = await Claim.findById(claimId).select('status ngoId donorId listingId');
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const access = await validateRatingAccess(req.user, claim);
    if (!access.ok) {
      return res.status(access.statusCode).json({ success: false, message: access.message });
    }

    if (access.raterId === access.rateeId) {
      return res.status(400).json({ success: false, message: 'Users cannot rate themselves' });
    }

    const rating = await Rating.findOneAndUpdate(
      {
        claimId,
        raterId: access.raterId,
        rateeId: access.rateeId,
      },
      {
        listingId: access.listingId,
        raterRole: access.raterRole,
        rateeRole: access.rateeRole,
        score: parsedScore,
        review: String(review || '').trim(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )
      .populate('raterId', 'name avatar role')
      .populate('rateeId', 'name avatar role');

    res.json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit own rating
// @route   PATCH /api/ratings/:id
const updateRating = async (req, res, next) => {
  try {
    const { score, review = '' } = req.body;
    const parsedScore = Number(score);

    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      return res.status(400).json({ success: false, message: 'score must be an integer from 1 to 5' });
    }

    if (String(review).length > 500) {
      return res.status(400).json({ success: false, message: 'review must be at most 500 characters' });
    }

    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }

    if (rating.raterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this rating' });
    }

    const claim = await Claim.findById(rating.claimId).select('status');
    if (!claim || claim.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered claim ratings can be edited' });
    }

    rating.score = parsedScore;
    rating.review = String(review || '').trim();
    await rating.save();

    await rating.populate('raterId', 'name avatar role');
    await rating.populate('rateeId', 'name avatar role');

    res.json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ratings for a claim
// @route   GET /api/ratings/claim/:claimId
const getRatingsByClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.claimId).select('ngoId donorId listingId status');
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const participants = await getClaimParticipants(claim);
    const userId = req.user._id.toString();
    const isParticipant = userId === participants.ngoId || userId === participants.donorId;

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this claim ratings' });
    }

    const ratings = await Rating.find({ claimId: req.params.claimId })
      .populate('raterId', 'name avatar role')
      .populate('rateeId', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: ratings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rating summary for a user
// @route   GET /api/ratings/user/:userId/summary
const getUserRatingSummary = async (req, res, next) => {
  try {
    const summary = await getUserSummaryAggregate(req.params.userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertRating,
  updateRating,
  getRatingsByClaim,
  getUserRatingSummary,
  getUserSummaryAggregate,
};
