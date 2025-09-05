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
import { 
  MaintenanceRequest, 
  insertMaintenanceRequestSchema,
  Apartment
} from "@ce/db";
import { 
  Wrench,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "../hooks/use-toast";
import { queryClient, apiRequest } from "../lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Textarea } from "../components/ui/textarea";

const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: requests } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(insertMaintenanceRequestSchema),
    defaultValues: {
      description: "",
      apartmentId: apartments && apartments.length > 0 ? apartments[0]?.id : undefined,
      tenantId: user?.id || 0,
      status: "pending" as const
    }
  });

  // Update the form values when apartments data is loaded
  React.useEffect(() => {
    if (apartments && apartments.length > 0) {
      form.setValue('apartmentId', apartments[0].id);
    }
  }, [apartments, form]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: Omit<MaintenanceRequest, "id" | "createdAt">) => {
      // Make sure apartmentId is valid
      if (!data.apartmentId || data.apartmentId <= 0) {
        throw new Error("Valid apartment ID is required");
      }
      const res = await apiRequest("POST", "/api/maintenance", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit maintenance request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Success",
        description: "Maintenance request submitted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Maintenance request error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit maintenance request",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // Check if user is manager for important status changes
      if ((status === "in_progress" || status === "denied" || status === "completed") && user?.role !== "manager") {
        throw new Error("Only managers can approve, deny, or complete maintenance requests");
      }
      
      const res = await apiRequest("PATCH", `/api/maintenance/${id}`, { status });
      if (!res.ok) {
        throw new Error("Failed to update maintenance request status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Success",
        description: `Request ${variables.status === "denied" ? "denied" : "status updated"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update request status",
      });
    }
  });

  // Group requests by status
  const requestsByStatus = requests?.reduce(
    (acc, request) => {
      acc[request.status].push(request);
      return acc;
    },
    { pending: [], in_progress: [], completed: [], denied: [] } as Record<string, MaintenanceRequest[]>
  ) ?? { pending: [], in_progress: [], completed: [], denied: [] };

  const statusIcons = {
    pending: Clock,
    in_progress: Loader2,
    completed: CheckCircle,
    denied: XCircle,
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Maintenance Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === "tenant"
              ? "Submit and track maintenance requests"
              : user?.role === "manager"
              ? "Manage and respond to maintenance requests"
              : "View maintenance requests"}
          </p>
        </div>
        {(user?.role === "tenant" || user?.role === "owner") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Maintenance Request</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => {
                  if (!data.apartmentId && apartments && apartments.length > 0) {
                    data.apartmentId = apartments[0].id;
                  }
                  createRequestMutation.mutate(data as any);
                })} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the issue..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {apartments && apartments.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="apartmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apartment</FormLabel>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={field.value}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          >
                            {apartments.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                {apt.building} - {apt.number}
                              </option>
                            ))}
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="text-sm text-orange-500">No apartments found. Please contact management.</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!apartments || apartments.length === 0 || createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {Object.entries(requestsByStatus).map(([status, requests]) => {
          const Icon = statusIcons[status as keyof typeof statusIcons];
          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{requests.length}</div>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <p className="font-medium">{request.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Submitted: {format(new Date(request.createdAt), 'PPp')}
                      </p>
                      {user?.role === "manager" && status === "pending" && (
                        <div className="mt-4 space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestMutation.mutate({ id: request.id, status: "in_progress" })}
                          >
                            Start Work
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => updateRequestMutation.mutate({ id: request.id, status: "denied" })}
                          >
                            Deny
                          </Button>
                        </div>
                      )}
                      {user?.role === "manager" && status === "in_progress" && (
                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestMutation.mutate({ id: request.id, status: "completed" })}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default MaintenancePage;