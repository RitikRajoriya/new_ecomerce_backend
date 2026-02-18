const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Get platform analytics (Admin only)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Get active users (users that are active)
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get approved vendors (users with admin role or vendor role - adjust based on your system)
    const approvedVendors = await User.countDocuments({ role: 'admin' });

    // Get pending vendor requests (initial implementation - set to 0, update based on your vendor system)
    const pendingVendorRequests = 0;

    // Platform overview response
    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        totalOverview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalCategories,
        },
        platformOverview: {
          activeUsers,
          approvedVendors,
          pendingVendorRequests,
        },
        platformDistribution: {
          users: totalUsers,
          products: totalProducts,
          categories: totalCategories,
          orders: totalOrders,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get detailed analytics with charts data
exports.getDetailedAnalytics = async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Active counts
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Orders aggregation
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$subcategory',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'subcategoryInfo',
        },
      },
      {
        $unwind: { path: '$subcategoryInfo', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          subcategory: '$subcategoryInfo.name',
          productCount: '$count',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Detailed analytics retrieved successfully',
      data: {
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalOrders,
          totalProducts,
          totalCategories,
        },
        orderMetrics: orderStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
        },
        productsByCategory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
