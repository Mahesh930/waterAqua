const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../middleware/schemas');

router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Supplier-only routes
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload endpoint
router.post('/upload', protect, restrictTo('supplier', 'admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select an image file to upload' });
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.success({ url: fileUrl });
  });
});

router.post('/', protect, restrictTo('supplier', 'admin'), validate(createProductSchema), createProduct);
router.put('/:id', protect, restrictTo('supplier', 'admin'), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, restrictTo('supplier', 'admin'), deleteProduct);

module.exports = router;
