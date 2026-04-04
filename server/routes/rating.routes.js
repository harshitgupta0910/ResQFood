const express = require('express');
const {
  upsertRating,
  updateRating,
  getRatingsByClaim,
  getUserRatingSummary,
} = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', upsertRating);
router.patch('/:id', updateRating);
router.get('/claim/:claimId', getRatingsByClaim);
router.get('/user/:userId/summary', getUserRatingSummary);

module.exports = router;
