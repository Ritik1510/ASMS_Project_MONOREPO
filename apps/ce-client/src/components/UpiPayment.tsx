
import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { QrCode, Copy, CheckCircle } from "lucide-react";

interface UpiPaymentProps {
  amount: number;
  description: string;
  onSuccess?: () => void;
}

export function UpiPayment({ amount, description, onSuccess }: UpiPaymentProps) {
  const [upiId, setUpiId] = React.useState("");
  const [upiName, setUpiName] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState<"idle" | "processing" | "success" | "error">("idle");
  const [qrVisible, setQrVisible] = React.useState(false);
  const { toast } = useToast();
  
  const virtualUpiId = "apartment@upi";
  
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(virtualUpiId);
    toast({
      title: "UPI ID copied",
      description: "The UPI ID has been copied to your clipboard.",
    });
  };

  const handlePayment = async () => {
    if (!upiId) {
      toast({
        variant: "destructive",
        title: "UPI ID required",
        description: "Please enter your UPI ID to continue.",
      });
      return;
    }

    setPaymentStatus("processing");
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would process the payment via API
      // const response = await apiRequest.post("/api/payments/upi", {
      //   upiId,
      //   amount,
      //   description,
      // });
      
      setPaymentStatus("success");
      toast({
        title: "Payment successful",
        description: `₹${amount} paid successfully via UPI.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentStatus("error");
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
      });
    }
  };

  if (paymentStatus === "success") {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Payment Successful</h3>
              <p className="text-sm text-muted-foreground">
                ₹{amount} has been paid successfully.
              </p>
            </div>
            <Button onClick={() => setPaymentStatus("idle")} className="w-full">
              Make Another Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>UPI Payment</CardTitle>
        <CardDescription>Pay ₹{amount} using UPI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {qrVisible ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-4">
              <div className="border border-gray-300 p-4 rounded-lg">
                <QrCode className="h-32 w-32" />
              </div>
              <p className="text-sm text-center">Scan this QR code with any UPI app to pay</p>
              <div className="flex items-center space-x-2 w-full">
                <Input value={virtualUpiId} readOnly />
                <Button size="icon" variant="outline" onClick={handleCopyUpiId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setQrVisible(false)} variant="outline" className="w-full">
                Enter UPI ID manually
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="upi-id">Your UPI ID</Label>
                <Input
                  id="upi-id"
                  placeholder="yourname@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upi-name">Name (Optional)</Label>
                <Input
                  id="upi-name"
                  placeholder="Your name"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                />
              </div>
              <div className="pt-2 flex flex-col space-y-2">
                <Button onClick={handlePayment} disabled={paymentStatus === "processing"} className="w-full">
                  {paymentStatus === "processing" ? "Processing..." : `Pay ₹${amount}`}
                </Button>
                <Button onClick={() => setQrVisible(true)} variant="outline" className="w-full">
                  Pay via QR Code
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
