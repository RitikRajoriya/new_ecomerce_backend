const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Calculate base price from GST-included price (reverse GST calculation)
const calculateBasePrice = (finalPrice, taxRate) => {
  return finalPrice / (1 + taxRate / 100);
};

// Calculate tax amount from GST-included price
const calculateTaxAmount = (finalPrice, taxRate) => {
  const basePrice = calculateBasePrice(finalPrice, taxRate);
  return finalPrice - basePrice;
};

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

// Add/update cart items (supports bulk update)
exports.addToCart = async (req, res) => {
  try {
    const { items } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Process each item in the bulk update
    for (const item of items) {
      const { productId, size = 'single', quantity, price } = item;

      // Validate required fields
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: productId is required',
        });
      }

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: quantity must be at least 1',
        });
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productId}`,
        });
      }

      // Determine the actual price from product if not provided
      let itemPrice = price;
      if (!itemPrice && product.variations && product.variations.length > 0) {
        const variation = product.variations.find(v => v.size === size);
        itemPrice = variation ? variation.price : product.price || 0;
      } else if (!itemPrice) {
        itemPrice = product.price || 0;
      }

      // Check if item already in cart
      const existingItem = cart.items.find(cartItem =>
        cartItem.product.toString() === productId && cartItem.size === size
      );

      if (existingItem) {
        // Update existing item
        existingItem.quantity = quantity;
        existingItem.price = itemPrice;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          size: size,
          quantity: quantity,
          price: itemPrice,
        });
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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
      // Check stock - handle products with and without variations
      const product = await Product.findById(productId);
      
      if (product.variations && product.variations.length > 0) {
        const variation = product.variations.find(v => v.size === size);
        
        if (!variation) {
          return res.status(400).json({
            success: false,
            message: 'Size not available',
          });
        }
        
        if (variation.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock',
          });
        }
      } else {
        // No variations - check base stock
        if (product.stock !== undefined && product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock',
          });
        }
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
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
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