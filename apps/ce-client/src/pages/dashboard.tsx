import { useAuth } from "../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MaintenanceRequest, Payment, Apartment, Visitor } from "@ce/db";
import { Progress } from "../components/ui/progress";
import {
  Building2,
  WrenchIcon,
  DollarSignIcon,
  LogOutIcon,
  Users,
  UserCheck,
  Clock, // Changed from UserClock to Clock
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: maintenanceRequests } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: visitors } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors"],
  });

  // Group visitors by status
  const visitorsByStatus = visitors?.reduce(
    (acc, visitor) => {
      acc[visitor.status].push(visitor);
      return acc;
    },
    { upcoming: [], current: [], past: [] } as Record<string, Visitor[]>
  ) ?? { upcoming: [], current: [], past: [] };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOutIcon className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Apartments
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apartments?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "tenant" ? "Your apartments" : "Total apartments"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Maintenance Requests
              </CardTitle>
              <WrenchIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceRequests?.length ?? 0}
              </div>
              <Progress
                value={
                  maintenanceRequests?.filter((r) => r.status === "completed")
                    .length ?? 0 / (maintenanceRequests?.length ?? 1) * 100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Payments
              </CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total payments processed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Visitors Management</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Visitors
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {visitorsByStatus.upcoming.length}
                </div>
                <div className="mt-4 space-y-2">
                  {visitorsByStatus.upcoming.map((visitor) => (
                    <div key={visitor.id} className="text-sm">
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-muted-foreground">
                        Expected: {format(new Date(visitor.expectedAt), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Visitors
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {visitorsByStatus.current.length}
                </div>
                <div className="mt-4 space-y-2">
                  {visitorsByStatus.current.map((visitor) => (
                    <div key={visitor.id} className="text-sm">
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-muted-foreground">
                        Entered: {format(new Date(visitor.actualEntryAt!), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Past Visitors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {visitorsByStatus.past.length}
                </div>
                <div className="mt-4 space-y-2">
                  {visitorsByStatus.past.slice(0, 3).map((visitor) => (
                    <div key={visitor.id} className="text-sm">
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-muted-foreground">
                        Visited: {format(new Date(visitor.actualExitAt!), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}