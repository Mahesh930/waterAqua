import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Eye, Package, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const actionColors: Record<string, string> = {
    "order_placed": "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    "order_confirmed": "bg-primary/10 text-primary",
    "order_dispatched": "bg-accent/10 text-accent",
    "order_delivered": "bg-success/10 text-success",
    "otp_generated": "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    "otp_verified": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    "user_login": "bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400",
    "user_registered": "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
};

export default function AdminAuditLogs() {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterAction, setFilterAction] = useState("all");
    const itemsPerPage = 15;

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["admin-audit-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as any[];
        },
    });

    const filtered = logs
        .filter(l => filterAction === "all" || l.action === filterAction)
        .filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.entity_id?.toString().includes(search) ||
            l.entity_type.toLowerCase().includes(search.toLowerCase()));

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedLogs = filtered.slice(startIdx, endIdx);

    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const actionCounts = {
        "all": logs.length,
        "order_placed": logs.filter(l => l.action === "order_placed").length,
        "order_confirmed": logs.filter(l => l.action === "order_confirmed").length,
        "order_delivered": logs.filter(l => l.action === "order_delivered").length,
        "otp_generated": logs.filter(l => l.action === "otp_generated").length,
        "otp_verified": logs.filter(l => l.action === "otp_verified").length,
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold">Audit Logs</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Complete activity history and system events</p>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by action, order ID, or entity type..." value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-10 rounded-xl h-11 bg-muted/30 border-0" />
            </motion.div>

            {/* Filter Tabs */}
            <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
                {["all", "order_placed", "order_confirmed", "order_delivered", "otp_generated", "otp_verified"].map(action => (
                    <button key={action} onClick={() => { setFilterAction(action); setCurrentPage(1); }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterAction === action ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
                            }`}>
                        {action.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterAction === action ? "bg-white/20" : "bg-muted"}`}>
                            {actionCounts[action as keyof typeof actionCounts] || 0}
                        </span>
                    </button>
                ))}
            </motion.div>

            {/* Logs */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Eye className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="font-heading font-semibold text-lg">No audit logs found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">
                            Showing {startIdx + 1}-{Math.min(endIdx, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" className="h-8 px-2"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">
                                Page {currentPage} of {Math.max(1, totalPages)}
                            </div>
                            <Button variant="outline" size="sm" className="h-8 px-2"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage >= totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {paginatedLogs.map(log => (
                            <motion.div key={log.id} variants={item}
                                className="glass-card rounded-2xl p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-2">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${actionColors[log.action] || "bg-muted/50 text-muted-foreground"
                                                }`}>
                                                {log.action.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                            </span>
                                            <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md">
                                                {log.entity_type}
                                            </span>
                                            {log.entity_id && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    #{log.entity_id.toString().slice(0, 8)}
                                                </span>
                                            )}
                                        </div>
                                        {log.details && (
                                            <div className="text-sm text-muted-foreground mb-2">
                                                <code className="bg-muted/50 px-2 py-1 rounded text-xs">
                                                    {JSON.stringify(log.details).slice(0, 80)}...
                                                </code>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-0.5">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.created_at).toLocaleString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                            {log.ip_address && (
                                                <>
                                                    <span>·</span>
                                                    <span>{log.ip_address}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
