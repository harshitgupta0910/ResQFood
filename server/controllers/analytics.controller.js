const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// @desc    Get public analytics summary for landing page
// @route   GET /api/analytics/public-overview
const getPublicOverview = async (req, res, next) => {
  try {
    const [deliveredListings, donorCount, ngoCount, totalClaims] = await Promise.all([
      FoodListing.countDocuments({ status: 'delivered' }),
      User.countDocuments({ role: 'donor', isBanned: false }),
      User.countDocuments({ role: 'ngo', isBanned: false }),
      Claim.countDocuments(),
    ]);

    const mealsSavedAgg = await FoodListing.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const mealsRedistributed = mealsSavedAgg[0]?.total || 0;
    const claimRate = totalClaims > 0 ? Math.round((deliveredListings / totalClaims) * 100) : 0;

    res.json({
      success: true,
      data: {
        mealsRedistributed,
        activeDonors: donorCount,
        partnerNgos: ngoCount,
        claimRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
const getOverview = async (req, res, next) => {
  try {
    const [
      totalListings,
      availableListings,
      claimedListings,
      deliveredListings,
      expiredListings,
      totalUsers,
      totalClaims,
      totalPickups,
      completedPickups,
    ] = await Promise.all([
      FoodListing.countDocuments(),
      FoodListing.countDocuments({ status: 'available' }),
      FoodListing.countDocuments({ status: 'claimed' }),
      FoodListing.countDocuments({ status: 'delivered' }),
      FoodListing.countDocuments({ status: 'expired' }),
      User.countDocuments(),
      Claim.countDocuments(),
      Pickup.countDocuments(),
      Pickup.countDocuments({ status: 'delivered' }),
    ]);

    // Meals saved (sum of quantities from delivered listings)
    const mealsSaved = await FoodListing.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    // Distribution by category
    const categoryDistribution = await FoodListing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentListings = await FoodListing.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top donors
    const topDonors = await FoodListing.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: '$donorId',
          deliveries: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { deliveries: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor',
        },
      },
      { $unwind: '$donor' },
      {
        $project: {
          name: '$donor.name',
          email: '$donor.email',
          deliveries: 1,
          totalQuantity: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalListings,
          availableListings,
          claimedListings,
          deliveredListings,
          expiredListings,
          totalUsers,
          totalClaims,
          totalPickups,
          completedPickups,
          mealsSaved: mealsSaved[0]?.total || 0,
        },
        categoryDistribution,
        usersByRole,
        recentListings,
        topDonors,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getPublicOverview };
