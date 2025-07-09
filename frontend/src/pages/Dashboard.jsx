import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

const Dashboard = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get("/users/me");
      setUserData(response.data.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    try {
      const response = await apiClient.get("/auth/me");
      toast({
        title: "Success",
        description: "Protected route accessed successfully!",
      });
      console.log("Protected route response:", response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access protected route",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName || "User"}!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details from Clerk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Name:</strong> {user?.fullName}
            </div>
            <div>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {new Date(user?.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Information</CardTitle>
            <CardDescription>Your synced data from MongoDB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {userData ? (
              <>
                <div>
                  <strong>Database ID:</strong> {userData._id}
                </div>
                <div>
                  <strong>Email Verified:</strong>{" "}
                  {userData.emailVerified ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Last Sign In:</strong>{" "}
                  {userData.lastSignInAt
                    ? new Date(userData.lastSignInAt).toLocaleDateString()
                    : "Never"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {userData.isActive ? "Active" : "Inactive"}
                </div>
              </>
            ) : (
              <div>No database record found</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Testing</CardTitle>
            <CardDescription>Test your protected routes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testProtectedRoute} className="w-full">
              Test Protected Route
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full">
              Update Profile
            </Button>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Download Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
