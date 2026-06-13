import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  "How do I place an order?",
  "What are the delivery charges?",
  "How to track my order?",
  "What payment methods are available?",
];

const BOT_REPLIES = {
  "how do i place an order?": "To place an order, browse the suppliers list, select your preferred water delivery distributor, view their product catalog, add items to your cart, set your delivery date/time slot, and checkout!",
  "what are the delivery charges?": "Each water distributor sets their own delivery charge. You can view the exact delivery charge on their distributor card when browsing suppliers or in your checkout cart.",
  "how to track my order?": "Go to 'Order History' or click the real-time tracking notification on your dashboard. You will see a live status map showing if your order is placed, confirmed, out for delivery, or completed.",
  "what payment methods are available?": "We support Cash on Delivery (COD) and Online Payments. When placing your order, select your preferred payment mode in your cart.",
  "default": "Thanks for writing! AquaBot is here to support you. For order status changes, please head over to your Orders dashboard. If you need immediate distributor assistance, contact your supplier using the phone number listed on their profile."
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! 👋 I'm AquaBot, your water delivery assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate smart bot response latency
    setTimeout(() => {
      const normalizedQuery = text.toLowerCase().trim();
      let replyContent = BOT_REPLIES[normalizedQuery];
      
      if (!replyContent) {
        // Simple keyword matching search
        const match = Object.keys(BOT_REPLIES).find(k => normalizedQuery.includes(k.replace("?", "")));
        replyContent = match ? BOT_REPLIES[match] : BOT_REPLIES["default"];
      }

      setMessages(prev => [...prev, { role: "assistant", content: replyContent }]);
      setLoading(false);
    }, 800);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow border border-blue-500/10">
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-96px)] bg-[#0e142e]/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-blue-500/10">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">AquaBot</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/10">
                      <Bot className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-[#090d22] text-slate-300 border border-white/5 rounded-bl-md"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-600/15 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/10">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2 animate-pulse">
                  <div className="h-7 w-7 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0 border border-blue-500/10">
                    <Bot className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="bg-[#090d22] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick FAQ buttons */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
                {FAQS.map(faq => (
                  <button key={faq} onClick={() => send(faq)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/5 text-blue-400 hover:bg-blue-600/10 transition-colors border border-blue-500/10">
                    {faq}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="rounded-xl h-10 bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500"
                  disabled={loading}
                />
                <Button type="submit" size="icon" className="rounded-xl h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-500 text-white" disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
