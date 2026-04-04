const express = require('express');
const { getMyClaims, getAllClaims, getClaimsForListing, getReceivedClaims } = require('../controllers/claim.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ngo'), getMyClaims);
router.get('/all', authorize('admin'), getAllClaims);
router.get('/received', authorize('donor', 'admin'), getReceivedClaims);
router.get('/listing/:listingId', authorize('donor', 'admin'), getClaimsForListing);

module.exports = router;
