const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendMail } = require('../services/mail.service');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, phone, organizationName, organizationType, address, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'donor',
      phone,
    };

    if (location) {
      userData.location = {
        type: 'Point',
        coordinates: [location.lng || 0, location.lat || 0],
        address: location.address || '',
      };
    }

    const user = await User.create(userData);

    // Create organization if donor or ngo
    if ((role === 'donor' || role === 'ngo') && organizationName) {
      const org = await Organization.create({
        name: organizationName,
        type: organizationType || (role === 'ngo' ? 'ngo' : 'restaurant'),
        address: address || '',
        geo: {
          type: 'Point',
          coordinates: [location?.lng || 0, location?.lat || 0],
        },
        contactEmail: email,
        members: [user._id],
      });

      user.organizationId = org._id;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password').populate('organizationId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organizationId');
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Return the same message even if user does not exist to avoid account enumeration.
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientBase = String(process.env.CLIENT_URL || 'https://res-q-food-00.vercel.app').replace(/\/+$/, '');
    const resetUrl = `${clientBase}/login?resetToken=${resetToken}`;

    const subject = 'Reset your ResQFood password';
    const text = `You requested a password reset. Open this link to reset your password: ${resetUrl}. This link expires in 15 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p>You requested a password reset for your ResQFood account.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 13px; color: #374151; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 13px; color: #6b7280;">This link expires in 15 minutes.</p>
      </div>
    `;

    try {
      await sendMail({ to: user.email, subject, text, html });
    } catch (mailError) {
      console.error('Forgot password email send failed:', {
        email: user.email,
        reason: mailError.message,
      });
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(503).json({
        success: false,
        message: 'Email service is temporarily unavailable. Please try again in a few minutes.',
      });
    }

    res.json({
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired',
      });
    }

    const { password, confirmPassword } = req.body;
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
