const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

// @desc    Get user cart items
// @route   GET /api/v1/cart
// @access  Private (Customer Only)
exports.getCart = async (req, res, next) => {
  try {
    const cartItems = await CartItem.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'name price category capacityLiters imageUrl stock isActive'
      })
      .populate({
        path: 'supplier',
        select: 'name email phone'
      });

    res.success(cartItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private (Customer Only)
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = quantity || 1;

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or currently inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Check if item is already in user's cart
    let cartItem = await CartItem.findOne({ user: req.user.id, product: productId });

    if (cartItem) {
      // Increment quantity
      cartItem.quantity += qty;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        user: req.user.id,
        product: productId,
        supplier: product.supplier,
        quantity: qty
      });
    }

    // Return populated cart item
    cartItem = await cartItem.populate([
      { path: 'product', select: 'name price category capacityLiters imageUrl stock isActive' },
      { path: 'supplier', select: 'name email phone' }
    ]);

    res.success(cartItem, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of cart item
// @route   PATCH /api/v1/cart/items/:id
// @access  Private (Customer Only)
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1',
        timestamp: new Date().toISOString()
      });
    }

    let cartItem = await CartItem.findById(req.params.id);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify owner
    if (cartItem.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this cart item',
        timestamp: new Date().toISOString()
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    cartItem = await cartItem.populate([
      { path: 'product', select: 'name price category capacityLiters imageUrl stock isActive' },
      { path: 'supplier', select: 'name email phone' }
    ]);

    res.success(cartItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:id
// @access  Private (Customer Only)
exports.removeFromCart = async (req, res, next) => {
  try {
    const cartItem = await CartItem.findById(req.params.id);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify ownership
    if (cartItem.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this cart item',
        timestamp: new Date().toISOString()
      });
    }

    await cartItem.deleteOne();

    res.success({ id: req.params.id, message: 'Item successfully removed from cart' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart/clear
// @access  Private (Customer Only)
exports.clearCart = async (req, res, next) => {
  try {
    await CartItem.deleteMany({ user: req.user.id });
    res.success({ message: 'Cart successfully cleared' });
  } catch (error) {
    next(error);
  }
};
