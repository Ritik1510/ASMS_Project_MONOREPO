import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@ce/db";
import type { InsertUser } from "@ce/db";
import { Redirect } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Building2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "tenant",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Apartment Management System</h1>
            <p className="text-muted-foreground">
              Manage your apartment complex efficiently with our comprehensive solution.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={loginForm.handleSubmit((data) =>
                      loginMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        {...loginForm.register("username")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...loginForm.register("password")}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate(data as InsertUser)
                    )}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        {...registerForm.register("username")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...registerForm.register("fullName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        {...registerForm.register("email")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        onValueChange={(value) =>
                          registerForm.setValue("role", value as "tenant" | "manager" | "owner" | "security")
                        }
                        defaultValue="tenant"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="security">Security Guard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        {...registerForm.register("password")}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block">
          <div className="rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 p-8 text-center">
            <Building2 className="mx-auto h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-4">
              Modern Property Management
            </h2>
            <ul className="text-muted-foreground space-y-2 text-left list-disc list-inside">
              <li>Submit and track maintenance requests</li>
              <li>Manage rent payments efficiently</li>
              <li>Access important documents</li>
              <li>Real-time communication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}