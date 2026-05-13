import { supabase } from "@/integrations/supabase/client";

// Generate a 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate and save OTP for an order
export async function generateOrderOTP(orderId: string): Promise<string | null> {
    try {
        const otp = generateOTP();
        const generatedAt = new Date().toISOString();

        const { error } = await supabase
            .from("orders")
            .update({
                otp_code: otp,
                otp_generated_at: generatedAt,
                otp_verified: false,
            })
            .eq("id", orderId);

        if (error) {
            console.error("Failed to save OTP:", error);
            return null;
        }

        // Print OTP in console (for development)
        console.log(`\n📦 ORDER OTP GENERATED:\nOrder ID: ${orderId}\nOTP: ${otp}\n`);

        // Also log to audit logs
        await logAuditEvent(null, "otp_generated", "order", orderId, { otp: otp.slice(0, 2) + "****" });

        return otp;
    } catch (error) {
        console.error("Error generating OTP:", error);
        return null;
    }
}

// Verify OTP for delivery
export async function verifyDeliveryOTP(orderId: string, enteredOtp: string): Promise<boolean> {
    try {
        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("otp_code, otp_verified, otp_generated_at")
            .eq("id", orderId)
            .single();

        if (fetchError || !order) {
            console.error("Order not found:", fetchError);
            return false;
        }

        // Check if OTP is still valid (within 30 minutes)
        const generatedTime = new Date(order.otp_generated_at);
        const currentTime = new Date();
        const minutesElapsed = (currentTime.getTime() - generatedTime.getTime()) / (1000 * 60);

        if (minutesElapsed > 30) {
            console.error("OTP expired");
            return false;
        }

        // Verify OTP
        if (order.otp_code !== enteredOtp.trim()) {
            console.error("Invalid OTP");
            return false;
        }

        // Update order status to delivered and mark OTP as verified
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "delivered",
                otp_verified: true,
                otp_verified_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Failed to update order:", updateError);
            return false;
        }

        // Log audit event
        await logAuditEvent(null, "otp_verified", "order", orderId, {});

        return true;
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return false;
    }
}

// Log audit events
export async function logAuditEvent(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, any> = {}
): Promise<void> {
    try {
        await supabase
            .from("audit_logs")
            .insert({
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details,
            });
    } catch (error) {
        console.error("Failed to log audit event:", error);
    }
}

// Get OTP for an order (for display purposes - admin only)
export async function getOrderOTP(orderId: string): Promise<string | null> {
    try {
        const { data: order, error } = await supabase
            .from("orders")
            .select("otp_code")
            .eq("id", orderId)
            .single();

        if (error) return null;
        return order?.otp_code || null;
    } catch (error) {
        console.error("Error fetching OTP:", error);
        return null;
    }
}
