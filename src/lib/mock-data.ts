export interface Supplier {
  id: string;
  name: string;
  area: string;
  rating: number;
  reviewCount: number;
  pricePerCan: number;
  waterType: string;
  minOrder: number;
  deliveryTime: string;
  image: string;
  available: boolean;
}

export interface Order {
  id: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  totalAmount: number;
  status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt: string;
  deliveryTime: string;
  customerName?: string;
  customerAddress?: string;
}

export interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export const suppliers: Supplier[] = [
  { id: "1", name: "PureFlow Water Co.", area: "Koramangala", rating: 4.8, reviewCount: 234, pricePerCan: 40, waterType: "RO Purified", minOrder: 1, deliveryTime: "30-45 min", image: "/product-images/can-20l.png", available: true },
  { id: "2", name: "AquaPure Solutions", area: "Indiranagar", rating: 4.6, reviewCount: 189, pricePerCan: 35, waterType: "Mineral", minOrder: 2, deliveryTime: "45-60 min", image: "/product-images/bottle-1l.png", available: true },
  { id: "3", name: "Crystal Clear Water", area: "HSR Layout", rating: 4.9, reviewCount: 312, pricePerCan: 45, waterType: "RO + UV", minOrder: 1, deliveryTime: "20-35 min", image: "/product-images/jar-15l.png", available: true },
  { id: "4", name: "FreshDrop Delivery", area: "Whitefield", rating: 4.4, reviewCount: 156, pricePerCan: 30, waterType: "RO Purified", minOrder: 3, deliveryTime: "60-90 min", image: "/product-images/can-20l.png", available: true },
  { id: "5", name: "HydraLife Premium", area: "JP Nagar", rating: 4.7, reviewCount: 278, pricePerCan: 50, waterType: "Mineral + Alkaline", minOrder: 1, deliveryTime: "25-40 min", image: "/product-images/bottle-1l.png", available: false },
  { id: "6", name: "CleanWave Services", area: "BTM Layout", rating: 4.3, reviewCount: 98, pricePerCan: 28, waterType: "RO Purified", minOrder: 2, deliveryTime: "40-55 min", image: "/product-images/can-20l.png", available: true },
];

export const customerOrders: Order[] = [
  { id: "ORD-001", supplierId: "3", supplierName: "Crystal Clear Water", quantity: 5, totalAmount: 225, status: "delivered", createdAt: "2026-04-07T10:30:00", deliveryTime: "2026-04-07T11:05:00" },
  { id: "ORD-002", supplierId: "1", supplierName: "PureFlow Water Co.", quantity: 3, totalAmount: 120, status: "out_for_delivery", createdAt: "2026-04-08T09:00:00", deliveryTime: "2026-04-08T09:40:00" },
  { id: "ORD-003", supplierId: "2", supplierName: "AquaPure Solutions", quantity: 10, totalAmount: 350, status: "confirmed", createdAt: "2026-04-08T14:15:00", deliveryTime: "2026-04-08T15:00:00" },
];

export const supplierOrders: Order[] = [
  { id: "ORD-101", supplierId: "1", supplierName: "PureFlow Water Co.", quantity: 3, totalAmount: 120, status: "placed", createdAt: "2026-04-08T15:00:00", deliveryTime: "2026-04-08T15:40:00", customerName: "Rahul Sharma", customerAddress: "123, 5th Cross, Koramangala" },
  { id: "ORD-102", supplierId: "1", supplierName: "PureFlow Water Co.", quantity: 5, totalAmount: 200, status: "confirmed", createdAt: "2026-04-08T13:30:00", deliveryTime: "2026-04-08T14:15:00", customerName: "Priya Patel", customerAddress: "45, MG Road, Indiranagar" },
  { id: "ORD-103", supplierId: "1", supplierName: "PureFlow Water Co.", quantity: 2, totalAmount: 80, status: "out_for_delivery", createdAt: "2026-04-08T11:00:00", deliveryTime: "2026-04-08T11:35:00", customerName: "Arjun Reddy", customerAddress: "78, 2nd Stage, HSR Layout" },
  { id: "ORD-104", supplierId: "1", supplierName: "PureFlow Water Co.", quantity: 8, totalAmount: 320, status: "delivered", createdAt: "2026-04-07T16:00:00", deliveryTime: "2026-04-07T16:40:00", customerName: "Meera Iyer", customerAddress: "12, Church St, JP Nagar" },
];

export const feedbacks: Feedback[] = [
  { id: "1", customerName: "Rahul S.", rating: 5, comment: "Excellent water quality and super fast delivery!", date: "2026-04-07" },
  { id: "2", customerName: "Priya P.", rating: 4, comment: "Good service, slightly delayed today but water quality is always great.", date: "2026-04-06" },
  { id: "3", customerName: "Arjun R.", rating: 5, comment: "Best water delivery service in the area. Highly recommend!", date: "2026-04-05" },
];

export const adminStats = {
  totalOrders: 1247,
  activeSuppliers: 48,
  activeCustomers: 892,
  totalRevenue: 156800,
  ordersToday: 87,
  pendingOrders: 23,
  deliveredToday: 64,
  avgRating: 4.6,
};

export const monthlyData = [
  { month: "Jan", orders: 680, revenue: 85000 },
  { month: "Feb", orders: 790, revenue: 98000 },
  { month: "Mar", orders: 920, revenue: 115000 },
  { month: "Apr", orders: 1247, revenue: 156800 },
];

export const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  out_for_delivery: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export const statusLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
