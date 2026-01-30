const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate({
      path: 'items.product',
      populate: {
        path: 'subcategory',
        select: 'name'
      }
    });

    if (!cart) {
      cart = { user: req.userId, items: [], totalAmount: 0 };
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if size exists in product variations
    const variation = product.variations.find(v => v.size === size);
    if (!variation) {
      return res.status(400).json({
        success: false,
        message: 'Size not available for this product',
      });
    }

    // Check stock
    if (variation.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(item =>
      item.product.toString() === productId && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = variation.price; // Update price in case it changed
    } else {
      cart.items.push({
        product: productId,
        size,
        quantity,
        price: variation.price,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find(item =>
      item.product.toString() === productId && item.size === size
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items = cart.items.filter(cartItem =>
        !(cartItem.product.toString() === productId && cartItem.size === size)
      );
    } else {
      // Check stock
      const product = await Product.findById(productId);
      const variation = product.variations.find(v => v.size === size);

      if (variation.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        });
      }

      item.quantity = quantity;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId, size } = req.params;

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(item =>
      !(item.product.toString() === productId && item.size === size)
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};