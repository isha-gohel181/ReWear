import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  Star,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { userService, itemService, swapService } from "@/lib/apiServices";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [userSwaps, setUserSwaps] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    completedSwaps: 0,
    pendingSwaps: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const profileResponse = await userService.getProfile();
      setUserProfile(profileResponse.data.user);

      // Fetch user's items
      const itemsResponse = await itemService.getItems({
        owner: profileResponse.data.user._id,
      });
      setUserItems(itemsResponse.data.items);

      // Fetch user's swaps
      const swapsResponse = await swapService.getUserSwaps();
      setUserSwaps(swapsResponse.data.swaps || []);

      // Calculate stats
      const totalItems = itemsResponse.data.items.length;
      const activeItems = itemsResponse.data.items.filter(
        (item) => item.status === "approved" && item.isActive
      ).length;
      const completedSwaps =
        swapsResponse.data.swaps?.filter((swap) => swap.status === "completed")
          .length || 0;
      const pendingSwaps =
        swapsResponse.data.swaps?.filter((swap) => swap.status === "pending")
          .length || 0;

      setStats({
        totalItems,
        activeItems,
        completedSwaps,
        pendingSwaps,
        totalPoints: profileResponse.data.user.points || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await itemService.deleteItem(itemId);
      toast.success("Item deleted successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "swapped":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSwapStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your items, track swaps, and explore sustainable fashion.
          </p>
        </div>
        <Button onClick={() => navigate("/add-item")} className="mt-4 md:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Items
                </p>
                <p className="text-2xl font-bold">{stats.activeItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Swaps
                </p>
                <p className="text-2xl font-bold">{stats.completedSwaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Swaps
                </p>
                <p className="text-2xl font-bold">{stats.pendingSwaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Points Balance
                </p>
                <p className="text-2xl font-bold">{stats.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.profileImageUrl} />
              <AvatarFallback className="text-lg">
                {userProfile?.firstName?.[0]}
                {userProfile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {userProfile?.firstName} {userProfile?.lastName}
              </h3>
              <p className="text-muted-foreground">@{userProfile?.username}</p>
              <p className="text-sm text-muted-foreground">
                Member since {formatDate(userProfile?.createdAt)}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">My Items</TabsTrigger>
          <TabsTrigger value="swaps">My Swaps</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* My Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              My Items ({userItems.length})
            </h3>
            <Button variant="outline" onClick={() => navigate("/add-item")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {userItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first item to the community exchange.
                </p>
                <Button onClick={() => navigate("/add-item")}>
                  Add Your First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userItems.map((item) => (
                <Card
                  key={item._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={`http://localhost:5000${item.images[0]}`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold truncate">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • {item.size} • {item.pointValue} pts
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Listed on {formatDate(item.createdAt)}
                    </p>
                    <div className="flex space-x-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/items/${item._id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/items/${item._id}/edit`)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Swaps Tab */}
        <TabsContent value="swaps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              My Swaps ({userSwaps.length})
            </h3>
            <Button variant="outline" onClick={() => navigate("/items")}>
              Browse Items
            </Button>
          </div>

          {userSwaps.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No swaps yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start browsing items to make your first swap request.
                </p>
                <Button onClick={() => navigate("/items")}>Browse Items</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userSwaps.map((swap) => (
                <Card key={swap._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center">
                          {getSwapStatusIcon(swap.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">
                              {swap.requestedItem?.title} ↔{" "}
                              {swap.offeredItem?.title}
                            </h4>
                            <Badge variant="outline">{swap.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <span className="font-medium">Requested:</span>{" "}
                              {swap.requestedItem?.title}
                            </p>
                            <p>
                              <span className="font-medium">Offered:</span>{" "}
                              {swap.offeredItem?.title}
                            </p>
                            <p>
                              <span className="font-medium">With:</span>{" "}
                              {swap.provider?.firstName}{" "}
                              {swap.provider?.lastName}
                            </p>
                            <p>
                              <span className="font-medium">Date:</span>{" "}
                              {formatDate(swap.createdAt)}
                            </p>
                          </div>
                          {swap.message && (
                            <div className="mt-3 p-2 bg-muted rounded text-sm">
                              <span className="font-medium">Message:</span>{" "}
                              {swap.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        {swap.status === "pending" && (
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>

          <div className="space-y-4">
            {/* Sample activity items - in real app, this would come from an activity feed */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">You listed a new item</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Swap request received</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">You earned 15 points</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
