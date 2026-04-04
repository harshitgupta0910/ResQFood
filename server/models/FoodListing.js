const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'servings', 'packets', 'boxes', 'items'],
      default: 'servings',
    },
    category: {
      type: String,
      enum: [
        'cooked_meals',
        'raw_vegetables',
        'fruits',
        'dairy',
        'bakery',
        'canned_goods',
        'beverages',
        'grains',
        'mixed',
        'other',
      ],
      required: true,
    },
    condition: {
      type: String,
      enum: ['fresh', 'near_expiry', 'packaged'],
      default: 'fresh',
    },
    photos: [
      {
        url: String,
        publicId: String,
      },
    ],
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    address: {
      type: String,
      default: '',
    },
    expiryAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    readyAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['available', 'claimed', 'picked_up', 'delivered', 'expired', 'cancelled', 'flagged'],
      default: 'available',
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    claimedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

foodListingSchema.index({ geo: '2dsphere' });
foodListingSchema.index({ status: 1, expiryAt: 1 });
foodListingSchema.index({ donorId: 1, status: 1 });
foodListingSchema.index({ category: 1 });

module.exports = mongoose.model('FoodListing', foodListingSchema);
