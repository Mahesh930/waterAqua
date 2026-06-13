import React from "react";
import { Link } from "react-router-dom";
import { Package, CheckCircle, Truck, IndianRupee, ChevronRight, Clock, Star, MapPin, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery, useGetMySupplierQuery } from "@/store/api";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusColors = {
  placed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  out_for_delivery: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statusLabels = {
  placed: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SupplierHome() {
  const { profile } = useAuth();

  // RTK Queries
  const { data: orders = [], isLoading } = useGetOrdersQuery();
  const { data: supplierProfile } = useGetMySupplierQuery();

  const pending = orders.filter(o => o.status === "placed").length;
  const active = orders.filter(o => o.status === "confirmed" || o.status === "out_for_delivery").length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.totalAmount), 0);

  const stats = [
    { icon: Package, label: "Pending Orders", value: pending, iconColor: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/10" },
    { icon: Truck, label: "Dispatched", value: active, iconColor: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
    { icon: CheckCircle, label: "Completed", value: delivered, iconColor: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10" },
    { icon: IndianRupee, label: "Revenue", value: `₹${revenue}`, iconColor: "text-teal-400", bg: "bg-teal-500/5 border-teal-500/10" },
  ];

  const quickActions = [
    { icon: ShoppingBag => <ClipboardList className="h-5 w-5 text-white" />, label: "Manage Orders", desc: "Accept & complete dispatches", path: "/supplier/orders", color: "from-blue-600 to-sky-500", ring: "hover:border-blue-500/15" },
    { icon: ShoppingBag => <Package className="h-5 w-5 text-white" />, label: "Product Catalog", desc: "Edit price & inventory", path: "/supplier/products", color: "from-teal-600 to-emerald-500", ring: "hover:border-teal-500/15" },
    { icon: ShoppingBag => <IndianRupee className="h-5 w-5 text-white" />, label: "Payments", desc: "Review revenue reports", path: "/supplier/payments", color: "from-amber-600 to-orange-500", ring: "hover:border-amber-500/15" },
    { icon: ShoppingBag => <TrendingUp className="h-5 w-5 text-white" />, label: "Business Reports", desc: "View sales projections", path: "/supplier/reports", color: "from-violet-600 to-purple-500", ring: "hover:border-violet-500/15" },
  ];

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 text-slate-200">
      {/* Hero Banner */}
      <motion.div 
        variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 p-8 shadow-xl shadow-blue-500/5"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/5 px-3 py-1 rounded-full text-white">
              {pending > 0 ? `${pending} pending water dispatches` : "All deliveries complete!"}
            </span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Welcome back, {profile?.full_name ? profile.full_name.split(" ")[0] : "Distributor"}!
          </h2>
          <p className="text-sm text-white/80 mt-2 max-w-md leading-relaxed font-medium">
            {supplierProfile?.businessName ? `Managing ${supplierProfile.businessName}` : "Manage water jar requests."}
            {supplierProfile?.serviceAreas?.length > 0 ? ` · Servicing Pincodes: ${supplierProfile.serviceAreas.join(", ")}` : ""}
          </p>
          <div className="flex gap-4 mt-6">
            <Link to="/supplier/orders">
              <Button className="rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-bold px-6 shadow-md shadow-blue-900/10 border-0">
                <ClipboardList className="h-4 w-4 mr-2" /> View Orders Queue
              </Button>
            </Link>
            <Link to="/supplier/profile">
              <Button className="rounded-xl border border-white/20 hover:bg-white/10 bg-white/5 text-white font-semibold px-5">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Widgets */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`p-5 rounded-2xl border bg-[#0e142e]/60 shadow-lg ${s.bg} flex items-center gap-4`}>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <h4 className="text-lg font-bold text-white mt-0.5">{s.value}</h4>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quick Action Navigation */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(action => (
          <Link key={action.path} to={action.path}>
            <div className={`p-6 rounded-2xl bg-[#0e142e]/50 border border-white/5 shadow-md transition-all duration-300 ${action.ring} hover:bg-[#0e142e] group cursor-pointer`}>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-md`}>
                {action.icon()}
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors flex items-center gap-0.5">
                {action.label} <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Active Orders List */}
      {activeOrders.length > 0 && (
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-tight">Active Dispatches</h3>
          <div className="space-y-3">
            {activeOrders.map((ord) => (
              <div key={ord.id || ord._id} className="p-5 rounded-2xl bg-[#0e142e]/80 border border-white/5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 uppercase">
                      Order #{ord.id ? ord.id.slice(-6) : ord._id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${statusColors[ord.status]}`}>
                      {statusLabels[ord.status]}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mt-3 text-white">
                    {ord.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Deliver to: <span className="font-semibold text-slate-300">{ord.deliveryAddress}</span> (Pincode: {ord.deliveryPincode})
                  </p>
                </div>
                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold text-right">Collect Bill</p>
                    <p className="text-lg font-black text-white mt-0.5">₹{ord.totalAmount}</p>
                  </div>
                  <Link to="/supplier/orders" className="mt-3">
                    <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-4 px-4 border-0 shadow-md shadow-blue-600/10">
                      Manage Delivery
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
