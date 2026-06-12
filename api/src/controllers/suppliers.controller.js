const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Product = require('../models/Product');
const paginate = require('../utils/pagination');

// @desc    Get all active suppliers
// @route   GET /api/v1/suppliers
// @access  Public
exports.getSuppliers = async (req, res, next) => {
  try {
    const { pincode, search } = req.query;
    const query = { isActive: true };

    // Filter by service areas pincode
    if (pincode) {
      query.serviceAreas = pincode;
    }

    // Database-level search on businessName or User.name
    if (search) {
      const matchingUsers = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { user: { $in: matchingUserIds } }
      ];
    }

    const populateOptions = [{
      path: 'user',
      select: 'name email phone avatarUrl address'
    }];

    const paginatedResult = await paginate(Supplier, query, req, populateOptions, '', { createdAt: -1 });

    res.success({
      results: paginatedResult.results,
      pagination: paginatedResult.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier details by user/profile ID
// @route   GET /api/v1/suppliers/:id
// @access  Public
exports.getSupplierById = async (req, res, next) => {
  try {
    // Check if the id is the User id or Supplier id
    let supplier = await Supplier.findOne({ user: req.params.id }).populate({
      path: 'user',
      select: 'name email phone avatarUrl address'
    });

    if (!supplier) {
      supplier = await Supplier.findById(req.params.id).populate({
        path: 'user',
        select: 'name email phone avatarUrl address'
      });
    }

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier profile not found',
        timestamp: new Date().toISOString()
      });
    }

    res.success(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in supplier profile
// @route   GET /api/v1/suppliers/me
// @access  Private (Supplier Only)
exports.getMyProfile = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id }).populate({
      path: 'user',
      select: 'name email phone avatarUrl address'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier profile not found for this user',
        timestamp: new Date().toISOString()
      });
    }

    res.success(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier profile
// @route   PUT /api/v1/suppliers/me
// @access  Private (Supplier Only)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      businessName, business_name,
      description,
      deliveryCharge, delivery_charge,
      minOrder, min_order,
      businessHours, business_hours,
      serviceAreas, service_areas,
      pricePerCan, price_per_can,
      pricePerTanker, price_per_tanker,
      waterType, water_type,
      stock,
      deliveryTime, delivery_time,
      tankerCapacity, tanker_capacity,
      driverPhone, driver_phone,
      vehicleNumber, vehicle_number,
      pincode,
      area,
      address,
      latitude,
      longitude,
      isActive, available
    } = req.body;

    const fieldsToUpdate = {};
    const bName = businessName || business_name;
    if (bName) fieldsToUpdate.businessName = bName;
    if (description !== undefined) fieldsToUpdate.description = description;
    
    const dCharge = deliveryCharge !== undefined ? deliveryCharge : delivery_charge;
    if (dCharge !== undefined) fieldsToUpdate.deliveryCharge = dCharge;
    
    const mOrder = minOrder !== undefined ? minOrder : min_order;
    if (mOrder !== undefined) fieldsToUpdate.minOrder = mOrder;
    
    const bHours = businessHours || business_hours;
    if (bHours) fieldsToUpdate.businessHours = bHours;
    
    const sAreas = serviceAreas || service_areas;
    if (sAreas) fieldsToUpdate.serviceAreas = sAreas;

    const pCan = pricePerCan !== undefined ? pricePerCan : price_per_can;
    if (pCan !== undefined) {
      fieldsToUpdate.pricePerCan = pCan;
      await Product.updateMany(
        { supplier: req.user.id, category: '20L Can', isActive: true },
        { $set: { price: pCan } }
      );
    }

    const pTanker = pricePerTanker !== undefined ? pricePerTanker : price_per_tanker;
    if (pTanker !== undefined) {
      fieldsToUpdate.pricePerTanker = pTanker;
      await Product.updateMany(
        { supplier: req.user.id, name: { $regex: /tanker/i }, isActive: true },
        { $set: { price: pTanker } }
      );
    }

    const wType = waterType || water_type;
    if (wType) fieldsToUpdate.waterType = wType;

    if (stock !== undefined) fieldsToUpdate.stock = stock;

    const dTime = deliveryTime || delivery_time;
    if (dTime) fieldsToUpdate.deliveryTime = dTime;

    const tCapacity = tankerCapacity !== undefined ? tankerCapacity : tanker_capacity;
    if (tCapacity !== undefined) fieldsToUpdate.tankerCapacity = tCapacity;

    const dPhone = driverPhone !== undefined ? driverPhone : driver_phone;
    if (dPhone !== undefined) fieldsToUpdate.driverPhone = dPhone;

    const vNum = vehicleNumber !== undefined ? vehicleNumber : vehicle_number;
    if (vNum !== undefined) fieldsToUpdate.vehicleNumber = vNum;

    if (pincode !== undefined) fieldsToUpdate.pincode = pincode;
    if (area !== undefined) fieldsToUpdate.area = area;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (latitude !== undefined) fieldsToUpdate.latitude = latitude;
    if (longitude !== undefined) fieldsToUpdate.longitude = longitude;

    const active = isActive !== undefined ? isActive : available;
    if (active !== undefined) fieldsToUpdate.isActive = active;

    const supplier = await Supplier.findOneAndUpdate(
      { user: req.user.id },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).populate({
      path: 'user',
      select: 'name email phone avatarUrl address'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier profile not found',
        timestamp: new Date().toISOString()
      });
    }

    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      userId: req.user.id,
      action: 'supplier_profile_updated',
      entityType: 'Supplier',
      entityId: supplier._id,
      details: { updatedFields: Object.keys(fieldsToUpdate) },
      req
    });

    res.success(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier feedback
// @route   GET /api/v1/suppliers/:id/feedback
// @access  Public
exports.getSupplierFeedback = async (req, res, next) => {
  try {
    const reviews = await Feedback.find({ supplier: req.params.id })
      .populate({
        path: 'customer',
        select: 'name avatarUrl'
      })
      .sort({ createdAt: -1 });

    res.success(reviews);
  } catch (error) {
    next(error);
  }
};
