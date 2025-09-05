import * as React from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { insertVisitorSchema } from "@ce/db";
import type { Visitor } from "@ce/db";
import { format } from "date-fns";
import {
  UserPlus,
  Bell,
  Clock,
  UserCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { queryClient, apiRequest } from "../lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { Badge } from "../components/ui/badge";

const VisitorsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [selectedVisitor, setSelectedVisitor] = React.useState<Visitor | null>(
    null,
  );

  // Fetch visitors
  const { data: visitors = [] } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors"],
  });

  // Fetch apartments for dropdown - for security use all apartments, for others use user's apartments
  const { data: apartments = [] } = useQuery<any[]>({
    queryKey: [
      user?.role === "security" ? "/api/apartments/all" : "/api/apartments",
    ],
    enabled: !!user,
  });

  // Form for creating new visitor requests
  const form = useForm({
    resolver: zodResolver(insertVisitorSchema),
    defaultValues: {
      name: "",
      purpose: "",
      contactNumber: "",
      apartmentId:
        apartments && apartments.length > 0 ? apartments[0]?.id : undefined,
      expectedAt: new Date().toISOString(),
    },
  });

  // Update apartmentId when apartments data loads
  React.useEffect(() => {
    if (apartments && apartments.length > 0 && !form.getValues().apartmentId) {
      form.setValue("apartmentId", apartments[0].id);
    }
  }, [apartments, form]);

  // Create visitor mutation
  const createVisitorMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.apartmentId || data.apartmentId <= 0) {
        throw new Error("Valid apartment ID is required");
      }

      // Make sure date is valid
      if (!data.expectedAt) {
        data.expectedAt = new Date().toISOString();
      }

      // Ensure data is properly formatted
      const visitorData = {
        name: data.name,
        purpose: data.purpose,
        contactNumber: data.contactNumber,
        apartmentId: Number(data.apartmentId),
        expectedAt: data.expectedAt,
        status: "pending",
        pendingApproval: false
      };

      console.log("Sending visitor data to server:", visitorData);

      const res = await apiRequest("POST", "/api/visitors", visitorData);

      if (!res.ok) {
        try {
          const errorData = await res.json();
          console.error("Server error response:", errorData);
          throw new Error(errorData.message || "Failed to create visitor entry");
        } catch (jsonError) {
          throw new Error("Failed to create visitor entry. Server error.");
        }
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      setIsRequestDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Visitor entry created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create visitor entry",
      });
    },
  });

  // Get visitor status
  const getVisitorStatus = (visitor: Visitor) => {
    if (visitor.status === "pending" && visitor.pendingApproval) {
      return "awaiting_approval";
    }
    return visitor.status;
  };

  // Group visitors by status
  const visitorsByStatus = (visitors || []).reduce(
    (acc, visitor) => {
      // Special handling for visitors that need approval
      if (visitor.pendingApproval === true) {
        acc.awaiting_approval.push(visitor);
      } else {
        acc[visitor.status].push(visitor);
      }
      return acc;
    },
    {
      upcoming: [],
      current: [],
      past: [],
      pending: [],
      awaiting_approval: [],
    } as Record<string, Visitor[]>,
  );

  // Request approval mutation (for security guard)
  const requestApprovalMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/visitors/${visitorId}/request-approval`,
        {},
      );
      if (!res.ok) {
        throw new Error("Failed to request approval");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      toast({
        title: "Success",
        description: "Approval request sent to owner and tenant",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to request approval",
      });
    },
  });

  // Notify mutation (for security guard)
  const notifyMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/visitors/${visitorId}/notify`,
        {},
      );
      if (!res.ok) {
        throw new Error("Failed to send notification");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send notification",
      });
    },
  });

  // Update visitor status mutation
  const updateVisitorStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}/status`, {
        status,
      });
      if (!res.ok) {
        throw new Error("Failed to update visitor status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      toast({
        title: "Success",
        description: "Visitor status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update visitor status",
      });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Visitor Management</h1>
        <p className="text-muted-foreground">
          {user?.role === "security"
            ? `Security Guard: ${user?.name} - Manage visitor entries and request approvals`
            : "Review and manage visitors"}
        </p>
      </div>

      {user?.role === "security" && ( //Only show this button if the user IS a security guard.
        <Button className="mb-6" onClick={() => setIsRequestDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          New Visitor Entry
        </Button>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          {user?.role === "security" && (
            <TabsTrigger value="pending">
              New Entries ({visitorsByStatus.pending?.length || 0})
            </TabsTrigger>
          )}
          {(user?.role === "owner" || user?.role === "tenant") && (
            <TabsTrigger value="awaiting_approval">
              Needs Approval ({visitorsByStatus.awaiting_approval?.length || 0})
            </TabsTrigger>
          )}
          <TabsTrigger value="current">
            Approved ({visitorsByStatus.current?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">
            Denied ({visitorsByStatus.past?.length || 0})
          </TabsTrigger>
        </TabsList>

        {["pending", "awaiting_approval", "current", "past"].map((status) => (
          <TabsContent key={status} value={status}>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Name</th>
                    <th className="p-4 text-left font-medium">Phone</th>
                    <th className="p-4 text-left font-medium">Purpose</th>
                    <th className="p-4 text-left font-medium">Visit Date</th>
                    <th className="p-4 text-left font-medium">
                      Status / Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visitorsByStatus[status]?.map((visitor) => (
                    <tr key={visitor.id} className="border-b">
                      <td className="p-4">{visitor.name}</td>
                      <td className="p-4">{visitor.contactNumber}</td>
                      <td className="p-4">{visitor.purpose}</td>
                      <td className="p-4">
                        {format(new Date(visitor.expectedAt), "PPp")}
                      </td>
                      <td className="p-4">
                        {user?.role === "security" && status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              requestApprovalMutation.mutate(visitor.id)
                            }
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Request Approval
                          </Button>
                        )}

                        {user?.role === "security" && status === "current" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => notifyMutation.mutate(visitor.id)}
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Notify
                          </Button>
                        )}

                        {status === "awaiting_approval" &&
                          (user?.role === "owner" ||
                            user?.role === "tenant") && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateVisitorStatusMutation.mutate({
                                    id: visitor.id,
                                    status: "current",
                                  })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() =>
                                  updateVisitorStatusMutation.mutate({
                                    id: visitor.id,
                                    status: "past",
                                  })
                                }
                              >
                                Deny
                              </Button>
                            </div>
                          )}

                        {/* Status badges for approved/denied visitors */}
                        {status === "current" && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Approved
                          </Badge>
                        )}
                        {status === "past" && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Denied
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!visitorsByStatus[status] ||
                    visitorsByStatus[status].length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No visitors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog for creating new visitor entries */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Visitor Entry</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                // Ensure apartmentId is a number and handle potential errors.
                // Make sure expectedAt is a valid date to prevent errors
                if (!data.expectedAt) {
                  form.setError("expectedAt", { 
                    type: "manual", 
                    message: "Expected arrival time is required" 
                  });
                  return;
                }
                
                const formattedData = {
                  ...data,
                  apartmentId: Number(data.apartmentId),
                  expectedAt: new Date(data.expectedAt).toISOString(),
                };
                createVisitorMutation.mutate(formattedData);
              })}
            >
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Visitor Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter visitor name"
                    {...form.register("name", { required: true })}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">Name is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedAt">Expected Arrival Time</Label>
                  <Input
                    id="expectedAt"
                    type="datetime-local"
                    {...form.register("expectedAt", { required: true })}
                  />
                  {form.formState.errors.expectedAt && (
                    <p className="text-sm text-red-500">Expected arrival time is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    placeholder="Enter contact number"
                    {...form.register("contactNumber", { required: true })}
                  />
                  {form.formState.errors.contactNumber && (
                    <p className="text-sm text-red-500">
                      Contact number is required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Visit Purpose</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Reason for visit"
                    {...form.register("purpose", { required: true })}
                  />
                  {form.formState.errors.purpose && (
                    <p className="text-sm text-red-500">Purpose is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedAt">Expected Arrival</Label>
                  <Input
                    id="expectedAt"
                    type="datetime-local" // Use datetime-local for better user experience
                    {...form.register("expectedAt", { required: true })}
                  />
                  {form.formState.errors.expectedAt && (
                    <p className="text-sm text-red-500">
                      Expected arrival time is required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apartmentId">Apartment</Label>
                  <select
                    id="apartmentId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...form.register("apartmentId", {
                      required: true,
                      valueAsNumber: true,
                      onChange: (e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value > 0) {
                          form.setValue("apartmentId", value, {
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                  >
                    <option value="">Select an apartment</option>
                    {apartments && apartments.length > 0 ? (
                      apartments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.building} - {apt.number}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No apartments available
                      </option>
                    )}
                  </select>
                  {form.formState.errors.apartmentId && (
                    <p className="text-sm text-red-500">
                      Please select an apartment
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={createVisitorMutation.isPending}
                >
                  {createVisitorMutation.isPending
                    ? "Creating..."
                    : "Create Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorsPage;