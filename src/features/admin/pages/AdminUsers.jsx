import React, { useState } from "react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Star, ShieldBan, ShieldCheck, Users, Search, Phone, Mail, Award } from "lucide-react";
import { Input } from "@/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import { useGetAdminUsersQuery, useGetOrdersQuery, useToggleUserStatusMutation } from "@/store/api";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // RTK queries & mutations
  const { data: users = [], isLoading: usersLoading } = useGetAdminUsersQuery(
    selectedRole === "all" ? undefined : { role: selectedRole }
  );
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const [toggleUserStatus] = useToggleUserStatusMutation();

  const isLoading = usersLoading || ordersLoading;

  const handleToggleStatus = async (userRecord) => {
    const nextStatus = userRecord.status === "active" ? "suspended" : "active";
    try {
      await toggleUserStatus({ id: userRecord.id || userRecord._id, status: nextStatus }).unwrap();
      toast({ 
        title: `User ${nextStatus === "suspended" ? "suspended 🚫" : "activated ✅"}`, 
        description: `${userRecord.name || "User"}'s account status has been updated.` 
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error?.data?.error || error?.message || "Could not update status",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(u => 
    !search || 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeStyles = {
    customer: "bg-blue-500/10 text-blue-400 border-blue-500/10 hover:bg-blue-500/20",
    supplier: "bg-violet-500/10 text-violet-400 border-violet-500/10 hover:bg-violet-500/20",
    admin: "bg-amber-500/10 text-amber-400 border-amber-500/10 hover:bg-amber-500/20",
  };

  const roleLabel = {
    customer: "Customer",
    supplier: "Supplier",
    admin: "Admin",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Filtering users registry...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">{filteredUsers.length} registered users found</p>
        </div>
      </motion.div>

      {/* Role Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {[
          { key: "all", label: "All Users" },
          { key: "customer", label: "Customers" },
          { key: "supplier", label: "Suppliers" },
          { key: "admin", label: "Admins" },
        ].map(tab => (
          <button 
            key={tab.key} 
            onClick={() => { setSelectedRole(tab.key); setSearch(""); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRole === tab.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder={`Search by name, phone number, or email in ${selectedRole === "all" ? "all users" : selectedRole + "s"}...`} 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-[#0e142e]/60 border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
        />
      </motion.div>

      {/* Users List */}
      <div className="space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-[#0e142e]/30 border border-white/5 rounded-3xl shadow-lg">
            <Users className="h-12 w-12 mx-auto text-slate-600 mb-2.5" />
            <p className="text-sm text-slate-500 font-semibold">No users found</p>
          </div>
        ) : (
          filteredUsers.map((c) => {
            const customerId = c.id || c._id;
            const customerOrders = orders.filter(o => {
              const oCustId = o.customer?._id || o.customer;
              const oSuppId = o.supplier?._id || o.supplier;
              return oCustId === customerId || oSuppId === customerId;
            });
            const spent = customerOrders
              .filter(o => o.status === "delivered")
              .reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);
              
            return (
              <motion.div 
                key={customerId} 
                variants={item}
                className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg transition-shadow shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-blue-600/10 flex items-center justify-center text-lg shrink-0 border border-blue-500/10">
                    👤
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm truncate">{c.name || "Unnamed"}</p>
                      {c.status === "suspended" && (
                        <Badge className="bg-rose-500/10 border border-rose-500/10 text-rose-400 text-[9px] font-bold py-0 px-2 rounded">
                          SUSPENDED
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 font-semibold mt-1">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" /> {c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-500" /> {c.email}</span>}
                      <span className="text-slate-600">·</span>
                      <span className="flex items-center gap-1"><Award className="h-3 w-3 text-slate-500" /> {customerOrders.length} orders</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400 font-bold">{c.role === 'supplier' ? 'Revenue' : 'Spent'}: ₹{spent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Badge className={`rounded-lg border text-[10px] font-bold py-1 px-2.5 ${roleBadgeStyles[c.role] || roleBadgeStyles.customer}`}>
                    {roleLabel[c.role] || "User"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={c.status === "suspended" ? "default" : "destructive"}
                    className={`rounded-xl text-xs font-bold gap-1.5 h-8 ${
                      c.status === "suspended" 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/10 hover:border-rose-600"
                    }`}
                    onClick={() => handleToggleStatus(c)}
                  >
                    {c.status === "suspended" ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" /> Activate
                      </>
                    ) : (
                      <>
                        <ShieldBan className="h-3.5 w-3.5" /> Suspend
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
