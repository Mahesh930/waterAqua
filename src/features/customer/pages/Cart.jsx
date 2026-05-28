import React, { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Droplets, MapPin, Phone, Truck, ShieldCheck, Tag, Calendar, Clock } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Badge } from "@/ui/badge";
import { Label } from "@/ui/label";
import { useCart } from "@/features/customer/hooks/use-cart";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/shared/hooks/use-toast";
import { useCreateOrderMutation, useVerifyRazorpayPaymentMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const timeSlots = [
  "08:00 AM - 11:00 AM",
  "11:00 AM - 02:00 PM",
  "02:00 PM - 05:00 PM",
  "05:00 PM - 08:00 PM"
];

export default function Cart() {
  const { items, isLoading, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [createOrder, { isLoading: placing }] = useCreateOrderMutation();
  const [verifyRazorpayPayment] = useVerifyRazorpayPaymentMutation();

  // Checkout Form fields
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(timeSlots[0]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (items.length === 0) return;

    if (!address.trim() || address.trim().length < 8) {
      toast({ 
        title: "Address too short", 
        description: "Please enter a complete delivery address.", 
        variant: "destructive" 
      });
      return;
    }

    if (!pincode || pincode.length !== 6) {
      toast({ 
        title: "Invalid Pincode", 
        description: "Please enter a valid 6-digit delivery pincode.", 
        variant: "destructive" 
      });
      return;
    }

    if (!phone || phone.length < 10) {
      toast({ 
        title: "Invalid Phone", 
        description: "Please enter a valid contact phone number.", 
        variant: "destructive" 
      });
      return;
    }

    if (!deliveryDate) {
      toast({ 
        title: "Delivery Date Required", 
        description: "Please select a date for your water delivery.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const payload = {
        deliveryAddress: address.trim(),
        deliveryPincode: pincode,
        phone,
        deliveryDate,
        deliveryTimeSlot,
        paymentMethod,
        notes
      };

      const resOrder = await createOrder(payload).unwrap();

      if (paymentMethod === 'online') {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_MaheshAquahome2026",
          amount: Math.round(resOrder.totalAmount * 100), // paise
          currency: "INR",
          name: "AquaHome Water Network",
          description: `Water Delivery Order #${resOrder._id.slice(-6).toUpperCase()}`,
          image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop",
          order_id: resOrder.razorpayOrderId,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }).unwrap();

              toast({
                title: "🎉 Payment Verified!",
                description: "Your checkout is successfully complete."
              });
              navigate("/customer/track");
            } catch (verifErr) {
              toast({
                title: "Verification failed ❌",
                description: verifErr?.data?.error || "Signature verification failed",
                variant: "destructive"
              });
            }
          },
          prefill: {
            name: "",
            email: "",
            contact: phone
          },
          theme: {
            color: "#2563eb"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast({
            title: "Payment Failed ❌",
            description: resp.error.description || "Declined by bank",
            variant: "destructive"
          });
        });
        rzp.open();
      } else {
        toast({ 
          title: "🎉 Order Placed!", 
          description: "Your Cash on Delivery water order has been successfully generated." 
        });
        navigate("/customer/track");
      }
    } catch (error) {
      const errMsg = error?.data?.error || error?.message || "Checkout failed. Try again.";
      toast({ 
        title: "Checkout failed", 
        description: errMsg, 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#070b19]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6 text-slate-200">
      {/* Page header banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 p-8 shadow-xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/5 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <ShoppingCart className="h-3 w-3 text-white" /> Checkout Portal
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {totalItems > 0 ? `${totalItems} Water Jars Scheduled` : "Your Cart is Empty"}
            </h2>
            <p className="text-sm text-white/80 mt-1 font-medium">Review your items and set delivery timings below.</p>
          </div>
          {totalItems > 0 && (
            <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right">
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-white">₹{totalPrice.toLocaleString()}</p>
            </div>
          )}
        </div>
      </motion.div>

      {items.length === 0 ? (
        <motion.div variants={item} className="p-12 bg-[#0e142e]/30 border border-white/5 rounded-3xl text-center shadow-lg">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Your Cart is Empty</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">Browse water cans, select items, and schedule a delivery.</p>
          <Button onClick={() => navigate("/customer/products")} className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/15">
            Browse Products <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleCheckout} className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* LEFT COLUMN: Items and Delivery forms */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">Scheduled Items</h3>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl font-semibold text-xs"
                onClick={() => clearCart.mutate()}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Clear Cart
              </Button>
            </div>

            {/* List of Cart Items */}
            <div className="p-5 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map(ci => (
                  <motion.div 
                    key={ci.id} 
                    layout 
                    exit={{ opacity: 0, x: -30 }}
                    className="flex items-center gap-4 py-3 border-b last:border-0 border-white/5"
                  >
                    <div className="h-14 w-14 rounded-xl bg-[#090d22] flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                      <img 
                        src={ci.product?.image_url || "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop"} 
                        alt={ci.product?.name} 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{ci.product?.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">₹{ci.product?.price} each · {ci.product?.size_liters}L</p>
                      <p className="text-sm font-bold text-blue-400 mt-1">₹{(ci.product?.price ?? 0) * ci.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#090d22] border border-white/5 rounded-xl p-1 shrink-0">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg hover:bg-white/5 text-slate-400"
                        onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity - 1 })}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center font-bold text-sm text-white">{ci.quantity}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg hover:bg-white/5 text-slate-400"
                        onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity + 1 })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Delivery address & timings */}
            <div className="p-6 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-white tracking-tight">Delivery Schedule</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-slate-300">Delivery Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <Textarea 
                      id="address"
                      placeholder="Enter flat number, wing, building, street landmark..."
                      value={address} 
                      onChange={e => setAddress(e.target.value)}
                      className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500 resize-none" 
                      rows={3} 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pincode" className="text-slate-300">6-Digit Pincode</Label>
                    <div className="relative mt-1">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        id="pincode"
                        placeholder="411001" 
                        value={pincode} 
                        maxLength={6}
                        onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-300">Contact Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        id="phone"
                        placeholder="9876543210" 
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <Label htmlFor="date" className="text-slate-300">Delivery Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        id="date"
                        type="date"
                        value={deliveryDate}
                        onChange={e => setDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Preferred Time Window</Label>
                    <div className="relative mt-1">
                      <select 
                        value={deliveryTimeSlot} 
                        onChange={e => setDeliveryTimeSlot(e.target.value)}
                        className="w-full pl-3.5 pr-10 rounded-xl h-11 bg-[#090d22] border border-white/5 text-white text-sm font-semibold focus-visible:ring-blue-500"
                      >
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot} className="bg-[#0e142e] text-white font-medium">{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-slate-300">Delivery Instruction Notes (optional)</Label>
                  <Textarea 
                    id="notes"
                    placeholder="Leave jar near door, call before arriving, etc..."
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500 resize-none mt-1" 
                    rows={2} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky summary panel */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="p-6 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg ring-1 ring-blue-500/10 space-y-5">
              <h3 className="font-bold text-lg text-white">Order Summary</h3>
              
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Subtotal</span>
                  <span className="font-bold text-white">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Total Cans</span>
                  <span className="font-bold text-white">{totalItems} Cans</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Distributor Delivery</span>
                  <span className="text-emerald-400 font-black">FREE</span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="border-t border-white/5 pt-4 space-y-2.5">
                <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider">Payment Method</Label>
                <div className="flex gap-2">
                  {[
                    { key: "cod", label: "💵 Cash on Delivery" },
                    { key: "online", label: "💳 Online Pay" }
                  ].map(method => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        paymentMethod === method.key 
                          ? "bg-blue-600/10 border-blue-500 text-blue-300" 
                          : "bg-[#090d22] border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-white/5 pt-4 flex justify-between items-end">
                <span className="font-bold text-white">Total Bill</span>
                <div className="text-right">
                  <p className="font-black text-2xl text-blue-400 leading-none">₹{totalPrice.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-1">Inclusive of GST</p>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full py-6 rounded-xl text-sm font-bold gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-xl shadow-blue-500/20 border-0"
                disabled={placing} 
              >
                {placing ? "Processing..." : <>Place Hydration Order <ArrowRight className="h-4 w-4" /></>}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold pt-1 border-t border-white/5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Verified suppliers · Cancel free before delivery</span>
              </div>
            </div>

            {/* Quality Seals */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "💧 Sealed Pure" },
                { label: "⚡ Express Fast" },
                { label: "🛡️ Sanitized" }
              ].map(seal => (
                <div key={seal.label} className="p-2 rounded-xl bg-white/5 border border-white/5 text-center shadow-md">
                  <p className="text-[10px] font-black text-slate-400">{seal.label}</p>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
}
