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
    claimedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'approved',
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

claimSchema.index({ listingId: 1, ngoId: 1 }, { unique: true });
claimSchema.index({ ngoId: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
