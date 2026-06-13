const { z } = require('zod');

// Reusable Schema Validators
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address');

const phoneSchema = z.string()
  .regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase and number'
  );

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    role: z.enum(['customer', 'supplier']).optional(),
    pincode: z.string()
      .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a valid 6-digit number starting with a non-zero digit')
      .optional(),
    address: z.string().trim().optional(),
    businessName: z.string().trim().optional(),
    referredByCode: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  })
});

const createOrderSchema = z.object({
  body: z.object({
    deliveryAddress: z.string().trim().min(5, 'Delivery address must be at least 5 characters'),
    deliveryPincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Delivery pincode must be a valid 6-digit number starting with a non-zero digit'),
    phone: phoneSchema,
    deliveryDate: z.string().refine(val => {
      if (isNaN(Date.parse(val))) return false;
      return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}(:?\d{2})?))?$/.test(val);
    }, 'Invalid delivery date. Expected YYYY-MM-DD or ISO 8601 datetime'),
    deliveryTimeSlot: z.string().min(1, 'Delivery time slot is required'),
    paymentMethod: z.enum(['cod', 'online']).default('cod'),
    notes: z.string().optional()
  })
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'out_for_delivery', 'cancelled'])
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().regex(/^\d{4}$/, 'OTP must be exactly 4 digits'),
    paymentStatus: z.enum(['paid', 'pending']).optional()
  })
});

const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
    razorpay_signature: z.string().min(1, 'Razorpay signature is required')
  })
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.coerce.number().positive('Price must be greater than zero'),
    category: z.string().trim().min(1, 'Category is required'),
    capacityLiters: z.coerce.number().nonnegative('Capacity cannot be negative'),
    stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
    imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal(''))
  })
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    category: z.string().trim().optional(),
    capacityLiters: z.coerce.number().nonnegative('Capacity cannot be negative').optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isActive: z.boolean().optional()
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  verifyOtpSchema,
  verifyRazorpayPaymentSchema,
  createProductSchema,
  updateProductSchema
};
