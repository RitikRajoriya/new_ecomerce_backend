const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId }).populate({
      path: 'products.product',
      populate: {
        path: 'subcategory',
        select: 'name'
      }
    });

    if (!wishlist) {
      wishlist = { user: req.userId, products: [] };
    }

    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, products: [] });
    }

    // Check if product already in wishlist
    const existingProduct = wishlist.products.find(item =>
      item.product.toString() === productId
    );

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    wishlist.products.push({ product: productId });
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    wishlist.products = wishlist.products.filter(item =>
      item.product.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};