import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery, useGetSupplierFeedbackQuery } from "@/store/api";
import { Package, Droplets, Star, Send, Printer, ChevronDown, ChevronUp, MapPin, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { Badge } from "@/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { Link } from "react-router-dom";

const statusColors = {
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statusLabels = {
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function ReceiptModal({ order, onClose }) {
  const printReceipt = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt - ${(order.id || order._id).slice(-6)}</title>
      <style>body{font-family:system-ui;max-width:400px;margin:40px auto;padding:20px}
      h1{font-size:20px;text-align:center}
      .line{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .total{font-size:18px;font-weight:bold;border-top:2px solid #333;margin-top:8px;padding-top:12px}
      .footer{text-align:center;color:#888;font-size:12px;margin-top:24px}
      </style></head><body>
      <h1>AquaHome Receipt</h1>
      <p style="text-align:center;color:#666">Order #${(order.id || order._id).slice(-6).toUpperCase()}</p>
      <div class="line"><span>Supplier</span><span>${order.supplier?.name ?? "N/A"}</span></div>
      <div class="line"><span>Items</span><span>${order.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}</span></div>
      <div class="line"><span>Date</span><span>${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
      <div class="line"><span>Status</span><span>${order.status}</span></div>
      ${order.deliveryAddress ? `<div class="line"><span>Address</span><span>${order.deliveryAddress}</span></div>` : ""}
      <div class="line total"><span>Total Amount</span><span>₹${Number(order.totalAmount)}</span></div>
      <div class="footer"><p>Thank you for choosing AquaHome!</p></div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e142e] text-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-white/5" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <Printer className="h-8 w-8 mx-auto text-blue-400 mb-2" />
          <h3 className="font-bold text-lg text-white">Payment Receipt</h3>
        </div>
        <div className="space-y-2 text-sm bg-[#090d22] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between"><span className="text-slate-400">Order</span><span className="font-mono text-xs text-white">#{(order.id || order._id).slice(-6).toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Supplier</span><span className="font-semibold text-white">{order.supplier?.name ?? "N/A"}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="text-white">{new Date(order.createdAt).toLocaleDateString("en-IN")}</span></div>
          <div className="flex justify-between border-t border-white/5 pt-2 font-black text-base">
            <span>Total Bill</span><span className="text-blue-400">₹{Number(order.totalAmount)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={printReceipt}>
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // RTK Queries
  const { data: ordersData = {}, isLoading } = useGetOrdersQuery({ limit: 1000 });
  const orders = ordersData.results || [];

  const historyOrders = orders.filter(o => o.status === "delivered" || o.status === "cancelled");
  const filtered = filter === "all" ? historyOrders : historyOrders.filter(o => o.status === filter);
  
  const totalSpent = historyOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const deliveredCount = historyOrders.filter(o => o.status === "delivered").length;
  const cancelledCount = historyOrders.filter(o => o.status === "cancelled").length;

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedOrders = filtered.slice(startIdx, endIdx);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6 py-2 text-slate-200">
      {/* Header banner */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Order History</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {historyOrders.length} dispatches recorded · ₹{totalSpent} total spendings
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Completed", count: historyOrders.length },
          { key: "delivered", label: "Delivered", count: deliveredCount },
          { key: "cancelled", label: "Cancelled", count: cancelledCount },
        ].filter(f => f.count > 0 || f.key === "all").map(f => (
          <button 
            key={f.key} 
            onClick={() => { setFilter(f.key); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              filter === f.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
              filter === f.key ? "bg-white/20 text-white" : "bg-[#070b19] text-slate-400"
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Orders queue */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 font-semibold">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#0e142e]/20 rounded-3xl border border-white/5">
          <Package className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <p className="text-lg font-bold text-white">No historical orders</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Your completed transactions will record here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => {
            const isExpanded = expandedId === (order.id || order._id);
            const isCancelled = order.status === "cancelled";
            const orderHexId = (order.id || order._id).slice(-6).toUpperCase();

            return (
              <div 
                key={order.id || order._id}
                className="bg-[#0e142e]/60 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/15 transition-all duration-300"
              >
                {/* Accordion Row */}
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-white/5 transition-colors" 
                  onClick={() => setExpandedId(isExpanded ? null : (order.id || order._id))}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      isCancelled ? "bg-rose-500/10 border border-rose-500/10 text-rose-400" : "bg-[#090d22] border border-white/5 text-blue-400"
                    }`}>
                      {isCancelled ? "❌" : "💧"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{order.supplier?.name || "Distributor"}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border uppercase tracking-wider ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-blue-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.2 rounded">#{orderHexId}</span>
                        <span className="text-slate-600">•</span>
                        <span>{order.products?.reduce((s, p) => s + p.quantity, 0) || 1} units</span>
                        <span className="text-slate-600">•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-black text-sm ${isCancelled ? "text-slate-500 line-through" : "text-white"}`}>
                      ₹{Number(order.totalAmount)}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </div>

                {/* Details Accordion Panel */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#0a0f24]/30 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#090d22] border border-white/5 rounded-xl p-3">
                        <p className="text-slate-500 font-semibold mb-1">Delivered On</p>
                        <p className="font-bold text-white">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="bg-[#090d22] border border-white/5 rounded-xl p-3">
                        <p className="text-slate-500 font-semibold mb-1">Items Dispatch</p>
                        <p className="font-bold text-white truncate">{order.products?.map(p => `${p.name} (x${p.quantity})`).join(", ")}</p>
                      </div>
                    </div>

                    {isCancelled && (
                      <div className="flex items-center gap-2 text-xs bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-rose-400">
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">This dispatch order was cancelled and refunded.</span>
                      </div>
                    )}
                    
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-white/5 rounded-xl p-3.5 border border-white/5">
                        <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>Address: <span className="text-slate-300 font-medium">{order.deliveryAddress}</span></span>
                      </div>
                    )}

                    {!isCancelled && (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-xl text-xs h-9 bg-[#0e142e] border-white/5 hover:bg-white/5 hover:text-white"
                          onClick={() => setReceiptOrder(order)}
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-blue-400" /> Print Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                )}
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

      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </div>
  );
}
