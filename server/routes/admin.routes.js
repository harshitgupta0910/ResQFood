const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin'));

// --- USER & ORGANIZATION MANAGEMENT ---
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.patch('/organizations/:orgId/verify', adminController.verifyOrganization);
router.get('/users/:userId/logs', adminController.getUserActivityLogs);

// --- FOOD LISTING MODERATION ---
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:listingId/moderate', adminController.moderateListing);
router.delete('/listings/:listingId', adminController.deleteListing);

// --- CLAIM & ALLOCATION CONTROL ---
router.get('/claims', adminController.getAllClaims);
router.patch('/claims/:claimId/force-assign', adminController.forceAssignClaim);

// --- COMPLAINT & REPORT SYSTEM ---
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:complaintId/resolve', adminController.resolveComplaint);

// --- LIVE METRICS ---
router.get('/metrics', adminController.getLiveMetrics);

module.exports = router;