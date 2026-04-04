const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
    },
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rateeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raterRole: {
      type: String,
      enum: ['donor', 'ngo'],
      required: true,
    },
    rateeRole: {
      type: String,
      enum: ['donor', 'ngo'],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.index({ rateeId: 1 });
ratingSchema.index({ claimId: 1, raterId: 1, rateeId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
