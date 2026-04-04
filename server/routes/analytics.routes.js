const express = require('express');
const { getOverview, getPublicOverview } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/public-overview', getPublicOverview);

router.use(protect);
router.get('/overview', getOverview);

module.exports = router;
