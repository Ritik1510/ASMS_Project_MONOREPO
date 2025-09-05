
import * as React from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import type { Apartment, Payment } from "@ce/db";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import { queryClient, apiRequest } from "../lib/queryClient";
import { UpiPayment } from "../components/UpiPayment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CreditCard, IndianRupee, Building2 } from "lucide-react";

export default function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApartment, setSelectedApartment] = React.useState<Apartment | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [paymentPurpose, setPaymentPurpose] = React.useState("rent");
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);

  // Get apartments based on user role
  const queryKey = user?.role === "tenant" ? "/api/apartments" : "/api/apartments/all";
  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: [queryKey],
  });

  // Get payment history
  const { data: payments, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest.post("/api/payments", data);
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded",
        description: "The payment has been recorded successfully.",
      });
      refetchPayments();
      setPaymentModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      apartmentId: "",
      amount: "",
      type: "rent",
    },
  });

  const handlePaymentSuccess = () => {
    if (selectedApartment) {
      createPaymentMutation.mutate({
        apartmentId: selectedApartment.id,
        tenantId: user?.role === "tenant" ? user.id : selectedApartment.tenantId,
        amount: paymentAmount,
        date: new Date().toISOString(),
        type: paymentPurpose,
      });
    }
  };

  const initiatePayment = (apartment: Apartment, amount: number, purpose: string) => {
    setSelectedApartment(apartment);
    setPaymentAmount(amount);
    setPaymentPurpose(purpose);
    setPaymentModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Payments</h1>
          <p className="text-muted-foreground">
            {user?.role === "tenant"
              ? "Make payments for your apartment"
              : user?.role === "security"
              ? "View and manage payment records"
              : "Manage payment records and transactions"}
          </p>
        </div>
        {user?.role === "tenant" && apartments && apartments.length > 0 && (
          <Button onClick={() => initiatePayment(apartments[0], apartments[0].rent, "rent")}>
            <IndianRupee className="mr-2 h-4 w-4" />
            Pay Rent
          </Button>
        )}
      </div>

      {/* Payment history */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {payments && payments.length > 0 ? (
            payments.map((payment) => {
              const apartment = apartments?.find((a) => a.id === payment.apartmentId);
              return (
                <Card key={payment.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      ₹{payment.amount} - {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                    </CardTitle>
                    <CardDescription>
                      {new Date(payment.date).toLocaleDateString()} - Apartment{" "}
                      {apartment?.number || payment.apartmentId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Building {apartment?.building}, Apt {apartment?.number}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground col-span-full">No payment records found.</p>
          )}
        </div>
      </div>

      {/* Payment management for managers/owners */}
      {(user?.role === "manager" || user?.role === "owner") && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    const formattedData = {
                      apartmentId: Number(data.apartmentId),
                      tenantId: apartments?.find((a) => a.id === Number(data.apartmentId))?.tenantId || 0,
                      amount: Number(data.amount),
                      date: new Date().toISOString(),
                      type: data.type,
                    };
                    createPaymentMutation.mutate(formattedData);
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="apartmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select apartment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {apartments?.map((apartment) => (
                              <SelectItem
                                key={apartment.id}
                                value={apartment.id.toString()}
                              >
                                Building {apartment.building}, Apt {apartment.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Amount"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="security">Security Deposit</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Record Payment
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UPI Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upi">UPI</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
            </TabsList>
            <TabsContent value="upi" className="pt-4">
              <UpiPayment
                amount={paymentAmount}
                description={`${paymentPurpose.charAt(0).toUpperCase() + paymentPurpose.slice(1)} payment for Apartment ${selectedApartment?.number}`}
                onSuccess={handlePaymentSuccess}
              />
            </TabsContent>
            <TabsContent value="card" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center mb-4">Card payment integration coming soon.</p>
                  <Button variant="outline" className="w-full" onClick={() => setPaymentModalOpen(false)}>
                    Close
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
