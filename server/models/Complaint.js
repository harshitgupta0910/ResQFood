const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
    },
    type: {
      type: String,
      enum: ['spoiled_food', 'fake_ngo', 'no_show', 'inappropriate_behavior', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'rejected', 'escalated'],
      default: 'pending',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1 });
complaintSchema.index({ reportedUser: 1 });
complaintSchema.index({ type: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);