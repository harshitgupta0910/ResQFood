const express = require('express');
const { createListing, getListings, getListingById, updateListing, deleteListing } = require('../controllers/listing.controller');
const { claimListing } = require('../controllers/claim.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('donor', 'admin'), upload.array('photos', 5), createListing);
router.get('/', getListings);
router.get('/:id', getListingById);
router.patch('/:id', authorize('donor', 'admin', 'ngo'), updateListing);
router.delete('/:id', authorize('donor', 'admin'), deleteListing);

// Claim route
router.post('/:id/claim', authorize('ngo'), claimListing);

module.exports = router;
