const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const paginate = require('../utils/pagination');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { supplierId, category, search, pincode } = req.query;
    const query = { isActive: true };

    if (supplierId && supplierId !== 'undefined' && supplierId !== 'null') {
      query.supplier = supplierId;
    } else if (pincode && pincode !== 'undefined' && pincode !== 'null') {
      const suppliers = await Supplier.find({ serviceAreas: pincode, isActive: true });
      const supplierUserIds = suppliers.map(s => s.user);
      query.supplier = { $in: supplierUserIds };
    }

    if (category) {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const populateOptions = [{
      path: 'supplier',
      select: 'name email phone avatarUrl address'
    }];

    const paginatedResult = await paginate(Product, query, req, populateOptions, '', { createdAt: -1 });
    const products = paginatedResult.results;

    const supplierUserIds = products.map(p => p.supplier?._id).filter(Boolean);
    const supplierProfiles = await Supplier.find({ user: { $in: supplierUserIds } });
    const supplierMap = {};
    supplierProfiles.forEach(s => {
      supplierMap[s.user.toString()] = s;
    });

    const productsWithSupplierDetails = products.map(p => {
      const pObj = p.toObject();
      if (pObj.supplier) {
        const sProfile = supplierMap[pObj.supplier._id.toString()];
        pObj.supplierProfile = sProfile ? {
          id: sProfile._id,
          businessName: sProfile.businessName,
          waterType: sProfile.waterType,
          rating: sProfile.rating,
          deliveryCharge: sProfile.deliveryCharge
        } : null;
      }
      return pObj;
    });

    res.success({
      results: productsWithSupplierDetails,
      pagination: paginatedResult.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'supplier',
      select: 'name email phone avatarUrl address'
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product catalog item not found',
        timestamp: new Date().toISOString()
      });
    }

    res.success(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (Supplier Only)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, price, capacityLiters, imageUrl, description, stock } = req.body;

    const product = await Product.create({
      supplier: req.user.id,
      name,
      category,
      price,
      capacityLiters,
      imageUrl: imageUrl || '',
      description: description || '',
      stock: stock !== undefined ? stock : 999
    });

    res.success(product, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product catalog item
// @route   PUT /api/v1/products/:id
// @access  Private (Supplier Only)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product catalog item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify requesting user is indeed the product owner
    if (product.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update products in this catalog',
        timestamp: new Date().toISOString()
      });
    }

    const { name, category, price, capacityLiters, imageUrl, description, stock, isActive } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (category) fieldsToUpdate.category = category;
    if (price !== undefined) fieldsToUpdate.price = price;
    if (capacityLiters !== undefined) fieldsToUpdate.capacityLiters = capacityLiters;
    if (imageUrl !== undefined) fieldsToUpdate.imageUrl = imageUrl;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (stock !== undefined) fieldsToUpdate.stock = stock;
    if (isActive !== undefined) fieldsToUpdate.isActive = isActive;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.success(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product catalog item
// @route   DELETE /api/v1/products/:id
// @access  Private (Supplier Only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product catalog item not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify ownership
    if (product.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete products from this catalog',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.success({ id: product._id, message: 'Product successfully removed from active catalog' });
  } catch (error) {
    next(error);
  }
};
