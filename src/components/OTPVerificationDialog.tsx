import { useState } from "react";
import { verifyDeliveryOTP, generateOrderOTP } from "@/lib/otp-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

interface OTPVerificationDialogProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function OTPVerificationDialog({ orderId, isOpen, onClose, onSuccess }: OTPVerificationDialogProps) {
    const [step, setStep] = useState<"confirm" | "verify">("confirm");
    const [otp, setOtp] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const handleGenerateOTP = async () => {
        setIsLoading(true);
        try {
            const generated = await generateOrderOTP(orderId);
            if (generated) {
                setGeneratedOtp(generated);
                setStep("verify");
                toast({ title: "OTP Generated", description: "OTP has been generated and printed in console" });
            } else {
                toast({ title: "Failed", description: "Could not generate OTP", variant: "destructive" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            toast({ title: "Error", description: "Please enter OTP", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const verified = await verifyDeliveryOTP(orderId, otp);
            if (verified) {
                toast({ title: "Success", description: "Order marked as delivered!" });
                onSuccess();
                handleClose();
            } else {
                toast({ title: "Invalid OTP", description: "The OTP you entered is incorrect or expired", variant: "destructive" });
                setOtp("");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep("confirm");
        setOtp("");
        setGeneratedOtp(null);
        setIsCopied(false);
        onClose();
    };

    const copyOTP = () => {
        if (generatedOtp) {
            navigator.clipboard.writeText(generatedOtp);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent className="max-w-md">
                {step === "confirm" ? (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Deliver Order with OTP</AlertDialogTitle>
                            <AlertDialogDescription>
                                Generate an OTP code for the customer to verify delivery. The OTP will be printed in the terminal.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-2">Order ID:</p>
                                <p className="text-sm font-mono font-bold text-primary">{orderId.slice(0, 8)}</p>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button onClick={handleGenerateOTP} disabled={isLoading} className="gap-2">
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Generate OTP
                            </Button>
                        </AlertDialogFooter>
                    </>
                ) : (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Verify OTP</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter the OTP that the customer provides to complete the delivery.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 space-y-4">
                            {generatedOtp && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Generated OTP (shown in console):</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-mono font-bold text-green-700 dark:text-green-300">{generatedOtp}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyOTP}
                                            className="h-8 w-8 p-0"
                                        >
                                            {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="otp-input">Enter OTP from Customer</Label>
                                <Input
                                    id="otp-input"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    maxLength={6}
                                    className="mt-1 text-center text-lg font-mono tracking-widest"
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6} className="gap-2">
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Verify & Deliver
                            </Button>
                        </AlertDialogFooter>
                    </>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
