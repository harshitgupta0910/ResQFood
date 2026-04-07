const Claim = require('../models/Claim');
const FoodListing = require('../models/FoodListing');
const mongoose = require('mongoose');
const { sendMail } = require('../services/mail.service');
const logger = require('../utils/logger');

const sendVerificationEmails = async () => {
  const now = new Date();
  const dueClaims = await Claim.find({
    status: 'pending',
    verificationEmailSent: false,
    verificationEmailAt: { $lte: now },
  })
    .populate('ngoId', 'name email')
    .populate('listingId', 'title unit address');

  for (const claim of dueClaims) {
    const ngo = claim.ngoId;
    const listing = claim.listingId;
    if (!ngo || !listing) continue;

    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'https://resqfood-backend-qqap.onrender.com';
    const verifyUrl = `${backendBaseUrl.replace(/\/$/, '')}/api/claims/verify/${claim.verificationToken}`;

    try {
      await sendMail({
        to: ngo.email,
        subject: `Verify pickup for ${listing.title}`,
        html: `
          <p>Hello ${ngo.name},</p>
          <p>Please confirm that you are coming to collect <strong>${claim.claimedQuantity} ${listing.unit}</strong> of <strong>${listing.title}</strong>.</p>
          <p>Pickup address: ${listing.address || 'N/A'}</p>
          <p><a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">Click here to verify pickup</a></p>
          <p>This link is valid for 10 minutes from claim time.</p>
        `,
        text: `Verify pickup for ${listing.title}: ${verifyUrl}. Link is valid for 10 minutes from claim time.`,
      });

      claim.verificationEmailSent = true;
      await claim.save();
    } catch (error) {
      logger.error(`Verification mail failed for claim ${claim._id}: ${error.message}`);
    }
  }
};

const autoReleaseUnverifiedClaims = async (io) => {
  const now = new Date();
  const expiredClaims = await Claim.find({
    status: 'pending',
    isPickupConfirmed: false,
    verificationDeadline: { $lte: now },
  }).populate('listingId');

  for (const claim of expiredClaims) {
    const listing = claim.listingId;
    if (!listing) {
      claim.status = 'cancelled';
      await claim.save();
      continue;
    }

    listing.quantity += claim.claimedQuantity;
    listing.status = 'available';
    listing.claimedBy = null;
    listing.claimedAt = null;
    await listing.save();

    claim.status = 'cancelled';
    await claim.save();

    if (io) {
      io.to('role_ngo').emit('listing:updated', listing);
    }
  }
};

const runClaimVerificationCycle = async (io) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Skipping claim verification cycle: MongoDB not connected');
      return;
    }

    await sendVerificationEmails();
    await autoReleaseUnverifiedClaims(io);
  } catch (error) {
    logger.error(`Claim verification job error: ${error.message}`);
  }
};

const startClaimVerificationJob = (io, intervalMs = 5000) => {
  logger.info(`Starting claim verification job (interval: ${intervalMs / 1000}s)`);
  runClaimVerificationCycle(io);
  return setInterval(() => runClaimVerificationCycle(io), intervalMs);
};

module.exports = { startClaimVerificationJob, runClaimVerificationCycle };
