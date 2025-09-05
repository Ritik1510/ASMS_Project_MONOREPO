import { Link, useLocation, Redirect } from "wouter";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Building2,
  Wrench,
  CreditCard,
  Users,
  LogOut
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Properties", href: "/properties" },
  { icon: Wrench, label: "Maintenance", href: "/maintenance" },
  { icon: CreditCard, label: "Make Payment", href: "/payment" },
  { icon: Users, label: "Visitors", href: "/visitors" }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth(); 

  const filteredMenuItems = user?.role === "security" ? menuItems.filter(item => item.href === "/visitors") : menuItems;

  // Security guards should be redirected to visitors page directly
  if (user?.role === "security" && location === "/") {
    return <Redirect to="/visitors" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold">Property Management</h1>
        </div>
        <nav className="mt-6">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                  location === item.href ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 w-64 px-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}