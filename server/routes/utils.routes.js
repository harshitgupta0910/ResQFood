const express = require('express');
const { normalizeAddressWithGemini } = require('../services/address.service');

const router = express.Router();

router.get('/normalize-address', async (req, res, next) => {
  try {
    const rawAddress = String(req.query.address || '').trim();
    if (!rawAddress) {
      return res.status(400).json({ success: false, message: 'address query is required' });
    }

    const normalizedAddress = await normalizeAddressWithGemini(rawAddress);
    res.json({ success: true, data: { normalizedAddress } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
