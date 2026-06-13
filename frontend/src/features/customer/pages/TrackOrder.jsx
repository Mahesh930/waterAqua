import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGetOrdersQuery, useUpdateOrderStatusMutation, useCancelOrderMutation, useSubmitFeedbackMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Circle,
  Clock,
  Droplets,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
  XCircle,
  Zap,
  KeyRound,
  Star
} from "lucide-react";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Textarea } from "@/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const statusSteps = [
  { key: "placed", label: "Order Placed", icon: Package, description: "Waiting for supplier to confirm your order", color: "text-amber-400" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Supplier accepted - preparing your delivery", color: "text-blue-400" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, description: "Your driver is heading to you right now.", color: "text-teal-400" },
  { key: "delivered", label: "Delivered", icon: Droplets, description: "Water delivered successfully. Hydration complete!", color: "text-emerald-400" },
];

const statusIndex = {
  placed: 0,
  confirmed: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

const statusColors = {
  placed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  out_for_delivery: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statusLabels = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  out_for_delivery: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const itemsPerPage = 5;

export default function TrackOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [driverLocations, setDriverLocations] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // RTK Queries
  const { data: orders = [], isLoading, refetch } = useGetOrdersQuery(undefined, {
    pollingInterval: 15000 // Fallback query polling
  });

  // Automatically expand first active order when orders are fetched
  useEffect(() => {
    if (orders.length > 0 && !expandedOrderId) {
      const firstActive = orders.find(o => o.status !== "delivered" && o.status !== "cancelled");
      if (firstActive) {
        setExpandedOrderId(firstActive.id || firstActive._id);
      } else {
        setExpandedOrderId(orders[0].id || orders[0]._id);
      }
    }
  }, [orders]);
  
  const [cancelOrderMutation] = useCancelOrderMutation();
  const [submitFeedback] = useSubmitFeedbackMutation();

  // Feedback states
  const [feedbackOrderId, setFeedbackOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackOrderId) return;
    try {
      await submitFeedback({ orderId: feedbackOrderId, rating, comment }).unwrap();
      toast({
        title: "Review Submitted",
        description: "Thank you for rating your delivery supplier!"
      });
      setFeedbackOrderId(null);
      setRating(5);
      setComment("");
    } catch (e) {
      toast({
        title: "Submission failed",
        description: e?.data?.error || "Error submitting review",
        variant: "destructive"
      });
    }
  };

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const allOrders = orders;

  // Real-time Socket.io updates
  useEffect(() => {
    if (!user || activeOrders.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:3001";
    const socket = io(socketUrl);

    // Join room for each active order
    activeOrders.forEach(order => {
      socket.emit("joinOrder", order.id || order._id);
    });

    socket.on("orderStatusChanged", (updatedOrder) => {
      refetch();
      toast({
        title: "Order Status Updated!",
        description: `Your order from ${updatedOrder.supplier?.name || 'supplier'} is now ${statusLabels[updatedOrder.status]}.`
      });
    });

    socket.on("driverLocationChanged", (locationData) => {
      console.log("driverLocationChanged received:", locationData);
      setDriverLocations((prev) => ({
        ...prev,
        [locationData.orderId]: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      }));
    });

    return () => {
      activeOrders.forEach(order => {
        socket.emit("leaveOrder", order.id || order._id);
      });
      socket.disconnect();
    };
  }, [user, activeOrders.length, refetch, toast]);

  const cancelOrder = async (orderId) => {
    try {
      await cancelOrderMutation(orderId).unwrap();
      toast({ 
        title: "Order Cancelled", 
        description: "Your order has been cancelled successfully." 
      });
    } catch (e) {
      toast({ 
        title: "Cancel failed", 
        description: e?.data?.error || "Error cancelling order", 
        variant: "destructive" 
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(allOrders.length / itemsPerPage));
  const pagedOrders = allOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderLiveMapOverlay = (order) => {
    const orderId = order.id || order._id;
    const loc = driverLocations[orderId];
    
    const startLat = 18.5204;
    const startLng = 73.8567;
    
    const hash = orderId.slice(-4);
    const offsetLat = 0.01 + (parseInt(hash.slice(0, 2), 16) % 100) / 4000;
    const offsetLng = 0.01 + (parseInt(hash.slice(2, 4), 16) % 100) / 4000;
    const targetLat = startLat + offsetLat;
    const targetLng = startLng + offsetLng;

    const lat = loc ? loc.latitude : startLat;
    const lng = loc ? loc.longitude : startLng;

    // Proximity calculation
    const totalDist = Math.sqrt(Math.pow(targetLat - startLat, 2) + Math.pow(targetLng - startLng, 2));
    const currentDist = Math.sqrt(Math.pow(lat - startLat, 2) + Math.pow(lng - startLng, 2));
    const progress = totalDist > 0 ? Math.min(1, currentDist / totalDist) : 0;
    const progressPercent = Math.round(progress * 100);
    const etaMin = progress >= 0.98 ? 0 : Math.max(1, Math.round((1 - progress) * 15));

    // Bezier curve calculations for driver position
    const t = progress;
    const driverX = Math.pow(1 - t, 2) * 40 + 2 * (1 - t) * t * 160 + Math.pow(t, 2) * 280;
    const driverY = Math.pow(1 - t, 2) * 120 + 2 * (1 - t) * t * 20 + Math.pow(t, 2) * 60;

    return (
      <div className="mt-4 p-5 rounded-2xl bg-[#0a0f24]/80 border border-white/5 shadow-inner">
        {/* Header indicator */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
            </span>
            <span className="text-xs font-black text-teal-400 tracking-widest uppercase">
              Live Hydration Transit
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Active Geolocation Stream
          </span>
        </div>

        {/* Map visualization area */}
        <div className="relative h-44 rounded-xl bg-[#060814] overflow-hidden border border-white/5 flex items-center justify-center">
          {/* Radial grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
          
          <svg className="w-full h-full" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Total planned route path */}
            <path
              d="M 40,120 Q 160,20 280,60"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Active animated progress route path */}
            <path
              d="M 40,120 Q 160,20 280,60"
              fill="none"
              stroke="url(#route-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8,6"
            />

            {/* Supplier Warehouse Marker */}
            <g transform="translate(40, 120)">
              <circle r="12" fill="#3b82f6" fillOpacity="0.15" />
              <circle r="6" fill="#3b82f6" />
              <text y="24" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Warehouse</text>
            </g>

            {/* Customer Home Marker */}
            <g transform="translate(280, 60)">
              <circle r="12" fill="#10b981" fillOpacity="0.15" className="animate-pulse" />
              <circle r="6" fill="#10b981" />
              <text y="24" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Destination</text>
            </g>

            {/* Moving Driver Dot and Signal */}
            <g transform={`translate(${driverX}, ${driverY})`}>
              <circle r="16" fill="#2dd4bf" fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle r="8" fill="#2dd4bf" filter="url(#glow)" />
              <circle r="4" fill="#ffffff" />
            </g>
          </svg>

          {/* Floater driver status tooltip overlay */}
          <div 
            className="absolute bg-slate-950/90 border border-teal-500/30 text-teal-400 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg pointer-events-none transition-all duration-300"
            style={{
              left: `${Math.min(80, Math.max(10, (driverX / 320) * 100))}%`,
              top: `${Math.min(80, Math.max(10, (driverY / 180) * 100 - 15))}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {progress >= 0.98 ? "Arrived!" : `ETA: ${etaMin} min`}
          </div>
        </div>

        {/* Telemetry data summary grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Estimated Time</p>
            <p className="text-sm font-black text-white mt-1">
              {progress >= 0.98 ? (
                <span className="text-emerald-400">Arrived</span>
              ) : (
                <span>{etaMin} mins</span>
              )}
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Distance Progress</p>
            <p className="text-sm font-black text-teal-400 mt-1">{progressPercent}%</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 col-span-1">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Stream</p>
            <p className="text-[10px] font-mono text-white mt-1.5 truncate">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Informative message footer */}
        <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 leading-normal bg-teal-950/20 border border-teal-500/10 p-2.5 rounded-xl">
          <Truck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <p>
            {progress >= 0.98 
              ? "Driver is at your location. Please share your secure delivery OTP code to collect your order!"
              : "Your supplier's courier is streaming real-time transit telemetry over WebSockets. Keep this screen open to watch live progress!"
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      <motion.div variants={item}>
        <h2 className="text-3xl font-black text-white tracking-tight">Live Tracking</h2>
        <p className="text-slate-400 text-sm mt-0.5">Track your active water jar deliveries and review order history.</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        <button
          onClick={() => {
            setTab("active");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "active" 
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
              : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Truck className="h-4 w-4" /> Active Deliveries ({activeOrders.length})
        </button>
        <button
          onClick={() => {
            setTab("all");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "all" 
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
              : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Package className="h-4 w-4" /> All Orders ({allOrders.length})
        </button>
      </motion.div>

      {tab === "active" ? (
        <>
          {isLoading ? (
            <LoadingState label="Detecting deliveries..." />
          ) : activeOrders.length === 0 ? (
            <motion.div variants={item} className="text-center py-16 bg-[#0e142e]/20 rounded-3xl border border-white/5">
              <div className="relative mx-auto w-24 h-24 mb-5">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-[#0e142e] flex items-center justify-center border border-white/5">
                  <Truck className="h-10 w-10 text-slate-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-white">No active water orders</p>
              <p className="text-slate-500 text-sm mt-1 mb-5">Book a jar delivery in the products tab to start tracking.</p>
              <Link to="/customer/products">
                <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                  <Zap className="h-4 w-4" /> Order Water Jars
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-5">{activeOrders.map((order, idx) => renderOrderCard(order, idx))}</div>
          )}
        </>
      ) : (
        <>
          {isLoading ? (
            <LoadingState label="Loading history..." />
          ) : allOrders.length === 0 ? (
            <div className="text-center py-16 bg-[#0e142e]/20 rounded-3xl border border-white/5">
              <Package className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-lg font-bold text-white">No orders yet</p>
              <p className="text-slate-500 text-sm mt-1">Your placed order list will populate here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-semibold">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, allOrders.length)} of {allOrders.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-semibold px-2 text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-5">{pagedOrders.map((order, idx) => renderOrderCard(order, idx))}</div>
            </div>
          )}
        </>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackOrderId !== null} onOpenChange={(open) => !open && setFeedbackOrderId(null)}>
        <DialogContent className="bg-[#0e142e] border border-white/5 text-slate-200 rounded-3xl max-w-md">
          <form onSubmit={handleFeedbackSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold">Rate Your Supplier</DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                Your feedback helps suppliers improve their water delivery quality.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-3 space-y-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform duration-100"
                  >
                    <Star
                      size={36}
                      className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-amber-400">
                {rating === 5 ? "Excellent Hydration!" : rating === 4 ? "Great Service" : rating === 3 ? "Good" : rating === 2 ? "Below Average" : "Poor Service"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comment (Optional)</label>
              <Textarea
                placeholder="Share your experience with this water jar delivery..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-[#070b19] border border-white/5 text-white rounded-xl placeholder-slate-600 focus-visible:ring-blue-500 h-24"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFeedbackOrderId(null)}
                className="bg-white/5 hover:bg-white/10 text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6"
              >
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  function renderOrderCard(order, idx) {
    const currentIdx = statusIndex[order.status] ?? 0;
    const isCancelled = order.status === "cancelled";
    const progressPercent = isCancelled ? 0 : (Math.max(0, currentIdx) / (statusSteps.length - 1)) * 100;
    const orderHexId = (order.id || order._id).slice(-6).toUpperCase();
    const ordId = order.id || order._id;
    const isExpanded = expandedOrderId === ordId;

    return (
      <motion.div 
        key={ordId} 
        variants={item} 
        className="bg-[#0e142e]/60 border border-white/5 rounded-2xl overflow-hidden shadow-lg"
        transition={{ delay: idx * 0.05 }}
      >
        {/* Card Top bar (Clickable Header) */}
        <div 
          onClick={() => setExpandedOrderId(isExpanded ? null : ordId)}
          className="p-5 border-b border-white/5 bg-[#0a0f24]/50 cursor-pointer hover:bg-[#0d1433]/70 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white truncate text-sm md:text-base">{order.supplier?.name || "Verified Distributor"}</p>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                  <span>{order.products?.reduce((s, p) => s + p.quantity, 0) || 1} Jars</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-white mr-1">₹{order.totalAmount}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${
                    order.paymentMethod === 'online'
                      ? order.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {order.paymentMethod === 'online'
                      ? order.paymentStatus === 'paid'
                        ? '💳 Paid'
                        : '💳 Pay Pending'
                      : '💵 COD'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10">
                  #{orderHexId}
                </span>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedOrderId(isExpanded ? null : ordId);
                  }}
                  className="p-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="mt-4 h-1.5 rounded-full bg-[#070b19] overflow-hidden border border-white/5">
            <motion.div
              className={`h-full rounded-full ${isCancelled ? "bg-red-500" : "bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400"}`}
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.2 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Placed</span>
            <span>Confirmed</span>
            <span>On the Way</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Timeline body (only shown when expanded) */}
        {isExpanded && (
          <div className="p-6">
            {isCancelled ? (
              <div className="flex items-center gap-3 text-red-400">
                <XCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-bold">Order Cancelled</p>
                  <p className="text-xs text-slate-500 mt-0.5">This hydration dispatch is cancelled and offline.</p>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${order.status === "out_for_delivery" ? "lg:grid-cols-12 gap-6" : ""}`}>
                <div className={order.status === "out_for_delivery" ? "lg:col-span-6" : ""}>
                  <div className="space-y-0.5">
                    {statusSteps.map((step, i) => {
                      const StepIcon = step.icon;
                      const isCompleted = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      const isLast = i === statusSteps.length - 1;

                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 + i * 0.15 }}
                              className={`h-6.5 w-6.5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                isCurrent
                                  ? "bg-blue-600 border-blue-500 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30"
                                  : isCompleted
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    : "bg-[#070b19] border-white/5 text-slate-700"
                              }`}
                            >
                              {isCompleted ? <StepIcon className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
                            </motion.div>
                            {!isLast && <div className={`w-0.5 h-6 transition-colors ${isCompleted && i < currentIdx ? "bg-blue-500/20" : "bg-white/5"}`} />}
                          </div>
                          <div className={`pb-3 ${isCurrent ? "" : isCompleted ? "opacity-75" : "opacity-35"}`}>
                            <p className={`text-xs font-bold ${isCurrent ? step.color : "text-white"}`}>{step.label}</p>
                            {isCurrent && (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[11px] text-slate-400 mt-0.5 max-w-md leading-relaxed">
                                {step.description}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {order.status === "out_for_delivery" && (
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    {renderLiveMapOverlay(order)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OTP Code and Actions (only shown when expanded) */}
        {isExpanded && !isCancelled && (
          <div className="p-6 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/5 mt-2 bg-[#090d22]/30">
            {order.status !== "delivered" ? (
              <div className="flex items-center gap-3.5 bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-2xl shrink-0 my-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-400">
                  <KeyRound className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Secure Delivery OTP</p>
                  <p className="text-2xl font-black text-white tracking-widest mt-0.5">{order.otp}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full my-3 gap-4">
                <div className="flex items-center gap-3.5 bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</p>
                    <p className="text-lg font-black text-emerald-400 tracking-wider mt-0.5">COMPLETED</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setFeedbackOrderId(order.id || order._id)}
                  size="sm" 
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4"
                >
                  Rate Supplier
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-[#0e142e] border border-white/5 px-4 py-2.5 rounded-xl">
                <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[200px]">{order.deliveryAddress}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-[#0e142e] border border-white/5 px-4 py-2.5 rounded-xl">
                <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>Slot: {order.deliveryTimeSlot}</span>
              </div>

              {(order.status === "placed" || order.status === "confirmed") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="rounded-xl bg-white/5 border border-white/10 text-red-400 hover:text-white hover:bg-red-500/20 font-bold text-xs h-9 px-4">
                      Cancel Dispatch
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0e142e] border-white/5 text-slate-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-xl font-bold">Cancel Water Delivery?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400 mt-2">
                        Are you sure you want to cancel order #{orderHexId} from {order.supplier?.name || "supplier"}? This cancellation is permanent.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white rounded-xl border-0">Keep Order</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cancelOrder(order.id || order._id)} className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl border-0">
                        Yes, Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  }
}

function LoadingState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
        <Navigation className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
      </div>
      <p className="text-sm text-slate-500 font-semibold">{label}</p>
    </div>
  );
}
