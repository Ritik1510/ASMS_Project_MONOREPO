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
import type { Apartment, Payment } from "@ce/db";
import { Building2, Edit, Users, DollarSign, AreaChart, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import { queryClient, apiRequest } from "../lib/queryClient";

export default function PropertiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use different endpoints based on user role
  const queryKey = user?.role === "tenant" ? "/api/apartments" : "/api/apartments/all";
  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: [queryKey],
  });

  // Get tenant's payment history
  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    enabled: user?.role === "tenant",
  });

  // For property creation
  const form = useForm({
    defaultValues: {
      number: "",
      building: "",
      rent: 0,
      area: 0,
      amenities: [],
      societyName: "", // New field for society name
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/apartments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast({
        title: "Success",
        description: user?.role === "manager" ? "New society added successfully" : "New property added successfully",
      });
    },
  });

  // Count owner's properties
  const ownedProperties = apartments?.filter(apt => apt.ownerId === user?.id) || [];
  const canAddMoreProperties = user?.role !== "owner" || ownedProperties.length < 5;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Property Management</h1>
          <p className="text-muted-foreground">
            {user?.role === "tenant"
              ? "View your apartment details"
              : user?.role === "owner"
              ? `Manage your properties (${ownedProperties.length}/5)`
              : "Manage all societies in the complex"}
          </p>
        </div>
        {((user?.role === "manager" || user?.role === "owner") && canAddMoreProperties) && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="mr-2 h-4 w-4" />
                {user?.role === "manager" ? "Add New Society" : "Add New Property"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {user?.role === "manager" ? "Add New Society" : "Add New Property"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createPropertyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="societyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Society Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter society name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Other form fields */}
                  <Button type="submit" className="w-full">Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apartments?.map((apartment: Apartment) => {
          const lastPayment = payments?.find(p => p.apartmentId === apartment.id);

          return (
            <Card key={apartment.id} className="relative">
              {(user?.role === "manager" || (user?.role === "owner" && apartment.ownerId === user.id)) && (
                <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <CardHeader>
                <CardTitle>Apartment {apartment.number}</CardTitle>
                <CardDescription>
                  {apartment.building}
                  {apartment.societyName && ` - ${apartment.societyName}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <AreaChart className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Area: {apartment.area} sq ft</span>
                    </div>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {apartment.amenities?.length || 0} Amenities
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Status</span>
                    </div>
                    <span className="font-medium capitalize">{apartment.status}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{user?.role === "tenant" ? "Rent Status" : "Monthly Rent"}</span>
                    </div>
                    {user?.role === "tenant" ? (
                      <div className="text-right">
                        <span className="font-medium">${apartment.rent}</span>
                        {lastPayment && (
                          <p className="text-sm text-muted-foreground">
                            Last paid: {format(new Date(lastPayment.date), 'PP')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium">${apartment.rent}</span>
                    )}
                  </div>

                  {apartment.lastMaintenanceDate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Last Maintenance</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(apartment.lastMaintenanceDate), 'PP')}
                      </span>
                    </div>
                  )}

                  {/* Additional details for managers and owners */}
                  {(user?.role === "manager" || user?.role === "owner") && (
                    <div className="pt-4 space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="outline">
                            View Maintenance History
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Maintenance History</DialogTitle>
                          </DialogHeader>
                          {/* Add maintenance history content */}
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="outline">
                            View Payment History
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Payment History</DialogTitle>
                          </DialogHeader>
                          {/* Add payment history content */}
                        </DialogContent>
                      </Dialog>

                      {user?.role === "manager" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                              Assign Tenant
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Tenant</DialogTitle>
                            </DialogHeader>
                            {/* Add tenant assignment form */}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}

                  {/* Amenities list */}
                  {apartment.amenities && apartment.amenities.length > 0 && (
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {apartment.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}