import React, { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { useToast } from "@/shared/hooks/use-toast";
import { Check, X, Truck, MapPin, CheckCheck, Clock, Package, ChevronRight, KeyRound, User, Phone, Mail, Calendar, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery, useUpdateOrderStatusMutation, useVerifyOtpMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function ManageOrders() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [otpDialogOrder, setOtpDialogOrder] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [transitProgress] = useState({});
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const { user } = useAuth();

  // RTK Queries & Mutations (query a limit of 1000 so websocket location mapping works for all transits)
  const { data: responseData = {}, isLoading, refetch } = useGetOrdersQuery({ limit: 1000 }, {
    pollingInterval: 12000
  });

  const orders = responseData.results || [];

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  // Simulated Transit Geolocation WebSocket Stream
  useEffect(() => {
    const activeTransits = orders.filter(o => o.status === "out_for_delivery");
    if (activeTransits.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:3001";
    const socket = io(socketUrl);

    // Initialize progress tracking for new transit orders
    activeTransits.forEach(o => {
      const orderId = o.id || o._id;
      if (transitProgress[orderId] === undefined) {
        transitProgress[orderId] = 0; // Starts at 0%
      }
    });

    const intervalId = setInterval(() => {
      activeTransits.forEach(o => {
        const orderId = o.id || o._id;
        
        // Progress advances incrementally up to 100%
        let progress = transitProgress[orderId] || 0;
        if (progress < 1) {
          progress = Math.min(1, progress + 0.05); // +5% closer every 5 seconds (100 seconds total transit)
          transitProgress[orderId] = progress;
        }

        // Interpolate between Supplier Base (pune 18.5204, 73.8567) and customer delivery coordinate
        const startLat = 18.5204;
        const startLng = 73.8567;
        
        // Generate slightly offset target based on the order ID hash to look organic
        const hash = orderId.slice(-4);
        const offsetLat = 0.01 + (parseInt(hash.slice(0, 2), 16) % 100) / 4000;
        const offsetLng = 0.01 + (parseInt(hash.slice(2, 4), 16) % 100) / 4000;
        
        const targetLat = startLat + offsetLat;
        const targetLng = startLng + offsetLng;

        const currentLat = startLat + (targetLat - startLat) * progress;
        const currentLng = startLng + (targetLng - startLng) * progress;

        // Emit simulated coordinate tick to the WebSocket server
        socket.emit("driverLocationUpdate", {
          orderId,
          latitude: currentLat,
          longitude: currentLng
        });
      });
    }, 5000);

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, [orders]);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedOrders = filtered.slice(startIdx, endIdx);

  const pendingOrders = filtered.filter(o => o.status === "placed");
  const selectedPending = pendingOrders.filter(o => selected.has(o.id || o._id));

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPending.length === pendingOrders.length && pendingOrders.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingOrders.map(o => o.id || o._id)));
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
      toast({ 
        title: "Order updated ✅", 
        description: `Order status advanced to ${statusLabels[status]}.` 
      });
      refetch();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e?.data?.error || "Error modifying order status",
        variant: "destructive"
      });
    }
  };

  const handleOpenOtpDialog = (order) => {
    setOtpInput("");
    setPaymentReceived(true);
    setOtpDialogOrder(order);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpDialogOrder || !otpInput) return;

    setOtpVerifying(true);
    try {
      await verifyOtp({
        id: otpDialogOrder.id || otpDialogOrder._id,
        otp: otpInput,
        paymentStatus: paymentReceived ? "paid" : "pending"
      }).unwrap();

      toast({ 
        title: "🎉 Delivery Verified!", 
        description: "Secure OTP matches. Order completed." 
      });
      
      setOtpDialogOrder(null);
      setOtpInput("");
      refetch();
    } catch (e) {
      toast({
        title: "Verification failed ❌",
        description: e?.data?.error || "Invalid 4-digit code entered",
        variant: "destructive"
      });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleBulkAccept = async () => {
    if (selectedPending.length === 0) return;
    
    let accepted = 0;
    for (const o of selectedPending) {
      try {
        await updateOrderStatus({ id: o.id || o._id, status: "confirmed" }).unwrap();
        accepted++;
      } catch (e) {
        console.error("Bulk accept error:", e);
      }
    }

    toast({ title: `Accepted ${accepted} orders! 🎉` });
    setSelected(new Set());
    refetch();
  };

  const filterTabs = [
    { key: "all", label: "All Items", count: orders.length },
    { key: "placed", label: "Pending", count: orders.filter(o => o.status === "placed").length },
    { key: "confirmed", label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length },
    { key: "out_for_delivery", label: "Dispatched", count: orders.filter(o => o.status === "out_for_delivery").length },
    { key: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Manage Orders</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track, dispatch, and secure water deliveries.</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {filterTabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => { setFilter(t.key); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === t.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${filter === t.key ? "bg-white/20 text-white" : "bg-[#070b19] text-slate-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {pendingOrders.length > 0 && (
          <motion.div 
            variants={item} 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-[#0e142e]/60 border border-white/5 rounded-2xl flex items-center gap-3 flex-wrap"
          >
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-white/10 hover:bg-white/5 text-slate-300" onClick={toggleSelectAll}>
              <CheckCheck className="h-4 w-4 text-blue-400" />
              {selectedPending.length === pendingOrders.length ? "Deselect All" : `Select All (${pendingOrders.length})`}
            </Button>
            {selectedPending.length > 0 && (
              <Button size="sm" className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-md shadow-blue-600/10" onClick={handleBulkAccept}>
                <Check className="h-4 w-4" /> Accept {selectedPending.length} order{selectedPending.length > 1 ? "s" : ""}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders queue */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 font-semibold">Loading orders queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/20 rounded-3xl border border-white/5">
          <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <p className="text-lg font-bold text-white">No dispatches found</p>
          <p className="text-slate-500 text-sm mt-1">Pending user orders will automatically show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => {
            const ordId = order.id || order._id;
            const isCancelled = order.status === "cancelled";
            const isDelivered = order.status === "delivered";

            return (
              <div 
                key={ordId} 
                className={`bg-[#0e142e]/60 border rounded-2xl overflow-hidden shadow-md transition-all ${
                  selected.has(ordId) ? "border-blue-600 ring-2 ring-blue-500/10 shadow-lg shadow-blue-500/5" : "border-white/5"
                }`}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {order.status === "placed" && (
                        <Checkbox checked={selected.has(ordId)} onCheckedChange={() => toggleSelect(ordId)} className="mt-0.5 bg-[#090d22] border-white/10" />
                      )}
                      <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-lg shrink-0">
                        🪣
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">#{ordId.slice(-6).toUpperCase()}</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${
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
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-slate-300">
                            {order.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}
                          </span>
                          <span className="text-slate-700">•</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-white text-lg shrink-0">₹{order.totalAmount}</span>
                  </div>

                  {/* Customer Information Block */}
                  <div className="bg-[#090d22]/40 border border-white/5 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                        <User className="h-4 w-4 text-blue-400" />
                        Customer Information
                      </div>
                      {order.customer?.status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          order.customer.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {order.customer.status} account
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="font-semibold text-slate-500 w-16">Name:</span>
                          <span className="text-slate-200 font-bold">{order.customer?.name || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="font-semibold text-slate-500 w-16">Mobile:</span>
                          <span className="text-slate-200 font-semibold">{order.phone || order.customer?.phone || "N/A"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.customer?.email && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="font-semibold text-slate-500 w-16">Email:</span>
                            <span className="text-slate-300">{order.customer.email}</span>
                          </div>
                        )}
                        {order.customer?.createdAt && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="font-semibold text-slate-500 w-16">Joined:</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              {new Date(order.customer.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(order.phone || order.customer?.phone) && (
                      <div className="pt-2 border-t border-white/5 flex justify-end">
                        <a 
                          href={`tel:${order.phone || order.customer?.phone}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 cursor-pointer"
                        >
                          <Phone className="h-3.5 w-3.5 animate-pulse" />
                          Call Customer
                        </a>
                      </div>
                    )}
                  </div>

                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-white/5 border border-white/5 rounded-xl p-3">
                      <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>Deliver to: <span className="text-slate-300 font-semibold">{order.deliveryAddress}</span> (Pincode Area: {order.deliveryPincode})</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {order.status === "placed" && (
                      <>
                        <Button size="sm" className="rounded-xl flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={() => handleStatusChange(ordId, "confirmed")}>
                          Accept Request
                        </Button>
                        <Button size="sm" className="rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 font-bold" onClick={() => handleStatusChange(ordId, "cancelled")}>
                          Reject
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" className="rounded-xl flex-1 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold" onClick={() => handleStatusChange(ordId, "out_for_delivery")}>
                        <Truck className="h-4 w-4 mr-1.5" /> Dispatch Water Truck
                      </Button>
                    )}
                    {order.status === "out_for_delivery" && (
                      <Button size="sm" className="rounded-xl flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => handleOpenOtpDialog(order)}>
                        <KeyRound className="h-4 w-4 mr-1.5" /> Complete Delivery (Enter OTP)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[#070b19]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width: order.status === "placed" ? "25%" :
                             order.status === "confirmed" ? "50%" :
                             order.status === "out_for_delivery" ? "75%" : "100%"
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-md">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Showing {startIdx + 1}-{Math.min(endIdx, filtered.length)} of {filtered.length} orders
          </p>
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-semibold px-2 text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* OTP verification dialog */}
      <Dialog open={!!otpDialogOrder} onOpenChange={() => setOtpDialogOrder(null)}>
        <DialogContent className="bg-[#0e142e] border-white/5 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-400 animate-pulse" /> Verify Delivery OTP
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Ask the customer for their secure 4-digit verification code to complete the delivery of order #{otpDialogOrder ? (otpDialogOrder.id || otpDialogOrder._id).slice(-6).toUpperCase() : ""}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyOtp} className="space-y-4 my-2">
            {otpDialogOrder?.paymentMethod === 'cod' && (
              <div className="space-y-2.5 bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Payment Method:</span>
                  <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/10 uppercase tracking-wider text-[10px]">
                    💵 Cash on Delivery
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400 font-semibold">Amount to Collect:</span>
                  <span className="text-white font-black text-sm">₹{otpDialogOrder.totalAmount}</span>
                </div>
                
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Confirm Payment Status:</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(true)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                        paymentReceived 
                          ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/15' 
                          : 'bg-[#090d22] text-slate-500 border-white/5 hover:text-slate-400'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentReceived(false)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                        !paymentReceived 
                          ? 'bg-amber-600 text-white border-transparent shadow-md shadow-amber-600/15' 
                          : 'bg-[#090d22] text-slate-500 border-white/5 hover:text-slate-400'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="otp" className="text-slate-300">4-Digit Code</Label>
              <Input 
                id="otp"
                type="text" 
                placeholder="e.g. 1234" 
                maxLength={4}
                value={otpInput} 
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="rounded-xl h-12 bg-[#090d22] border-white/5 text-white tracking-widest text-center text-xl font-black placeholder-slate-700 mt-2 focus-visible:ring-blue-500" 
                required
              />
            </div>
            
            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300" onClick={() => setOtpDialogOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-md shadow-blue-600/10" disabled={otpVerifying || otpInput.length !== 4}>
                {otpVerifying ? "Verifying..." : "Verify & Complete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
