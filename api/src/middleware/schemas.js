const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    role: z.enum(['customer', 'supplier', 'admin']).optional(),
    pincode: z.string().optional(),
    address: z.string().optional(),
    businessName: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const createOrderSchema = z.object({
  body: z.object({
    deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters'),
    deliveryPincode: z.string().min(6, 'Pincode must be at least 6 characters'),
    phone: z.string().min(10, 'Contact phone number must be at least 10 characters'),
    deliveryDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid delivery date'),
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
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
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
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than zero'),
    category: z.string().min(1, 'Category is required'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal(''))
  })
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    category: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
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
