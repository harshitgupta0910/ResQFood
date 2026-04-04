const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'delivered', 'rejected', 'cancelled'],
      default: 'pending',
    },
    verificationToken: {
      type: String,
      default: '',
    },
    verificationEmailAt: {
      type: Date,
    },
    verificationEmailSent: {
      type: Boolean,
      default: false,
    },
    verificationDeadline: {
      type: Date,
    },
    isPickupConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    deliveryOtpHash: {
      type: String,
      default: '',
    },
    deliveryOtpSentAt: {
      type: Date,
      default: null,
    },
    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ listingId: 1, ngoId: 1 });
claimSchema.index({ donorId: 1, status: 1 });
claimSchema.index({ ngoId: 1, status: 1 });
claimSchema.index({ verificationDeadline: 1, status: 1 });
claimSchema.index({ verificationEmailAt: 1, verificationEmailSent: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
