const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role); // Pass role to token if needed for future use

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};

// Admin Register
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new admin user
    const admin = new User({
      name,
      email,
      password,
      role: 'admin', // Set role as admin
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id, admin.role); // Pass role to token if needed for future use

    // Remove password from response
    const adminResponse = admin.toJSON();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      token,
      user: adminResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists and get password
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await admin.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is inactive',
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role); // Pass role to token if needed for future use

    // Remove password from response
    const adminResponse = admin.toJSON();

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: adminResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords 
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Google Login - Handle Google Sign-In
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google data
      // Generate a random password since Google users don't have one
      const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
      
      user = new User({
        name,
        email,
        password: randomPassword,
        role: 'user',
        isActive: true,
      });

      await user.save();
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Delete User (Admin only) - Cascade delete all related data
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Cascade delete all related data
    const Order = require('../models/Order');
    const Cart = require('../models/Cart');
    const Wishlist = require('../models/Wishlist');
    const Notification = require('../models/Notification');
    const OrderHelp = require('../models/OrderHelp');
    
    // Delete related data
    await Order.deleteMany({ user: id });
    await Cart.deleteMany({ user: id });
    await Wishlist.deleteMany({ user: id });
    await Notification.deleteMany({ user: id });
    await OrderHelp.deleteMany({ user: id });
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Admin Profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;
    
    // Find admin user
    const admin = await User.findById(req.userId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    if (currentPassword) {
      const isPasswordCorrect = await admin.matchPassword(currentPassword);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }
    
    // Update email if provided
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      admin.email = email;
    }
    
    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      admin.password = newPassword; // Will be hashed by pre-save hook
    }
    
    await admin.save();
    
    // Return updated user without password
    const userResponse = admin.toJSON();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
