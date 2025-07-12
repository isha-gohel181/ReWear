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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  MessageSquare,
  Check,
  X,
  Clock,
  Star,
  Package,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { swapService } from "@/lib/apiServices";
import { toast } from "sonner";

const SwapsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [swaps, setSwaps] = useState([]);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responding, setResponding] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const response = await swapService.getUserSwaps();
      setSwaps(response.data.swaps || []);
    } catch (error) {
      console.error("Error fetching swaps:", error);
      toast.error("Failed to load swaps");
    } finally {
      setLoading(false);
    }
  };

  const handleSwapResponse = async (swapId, action) => {
    setResponding(true);
    try {
      await swapService.respondToSwap({
        swapId,
        action, // 'accept' or 'reject'
        message: responseMessage,
      });

      toast.success(`Swap ${action}ed successfully!`);
      setResponseDialogOpen(false);
      setResponseMessage("");
      fetchSwaps(); // Refresh swaps
    } catch (error) {
      console.error(`Error ${action}ing swap:`, error);
      toast.error(`Failed to ${action} swap`);
    } finally {
      setResponding(false);
    }
  };

  const sendMessage = async (swapId, message) => {
    if (!message.trim()) return;

    try {
      await swapService.addMessage({
        swapId,
        message: message.trim(),
      });

      toast.success("Message sent!");
      // In a real app, you'd refresh the messages or use real-time updates
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "accepted":
        return <Check className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categorizeSwaps = () => {
    const incoming = swaps.filter(
      (swap) => swap.provider?._id === user?.id && swap.status === "pending"
    );
    const outgoing = swaps.filter((swap) => swap.requester?._id === user?.id);
    const completed = swaps.filter((swap) => swap.status === "completed");

    return { incoming, outgoing, completed };
  };

  const { incoming, outgoing, completed } = categorizeSwaps();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading swaps...</div>
      </div>
    );
  }

  const SwapCard = ({ swap, type }) => {
    const isIncoming = type === "incoming";
    const otherUser = isIncoming ? swap.requester : swap.provider;
    const myItem = isIncoming ? swap.requestedItem : swap.offeredItem;
    const theirItem = isIncoming ? swap.offeredItem : swap.requestedItem;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser?.profileImageUrl} />
                <AvatarFallback>
                  {otherUser?.firstName?.[0]}
                  {otherUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {otherUser?.firstName} {otherUser?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{otherUser?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(swap.status)}>
                {getStatusIcon(swap.status)}
                <span className="ml-1 capitalize">{swap.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Swap Items Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My Item */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {isIncoming ? "Your Item" : "You Offered"}
                </span>
              </div>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={`http://localhost:5000${myItem?.images?.[0]}`}
                  alt={myItem?.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{myItem?.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {myItem?.category} • {myItem?.size}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {myItem?.pointValue} points
                  </p>
                </div>
              </div>
            </div>

            {/* Exchange Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center space-y-1">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">for</span>
              </div>
            </div>

            {/* Their Item */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {isIncoming ? "They Want" : "You Want"}
                </span>
              </div>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={`http://localhost:5000${theirItem?.images?.[0]}`}
                  alt={theirItem?.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{theirItem?.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {theirItem?.category} • {theirItem?.size}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {theirItem?.pointValue} points
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {swap.message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Message:</p>
                  <p className="text-sm text-muted-foreground">
                    {swap.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(swap.createdAt)}</span>
            </div>
            <span>Swap ID: {swap._id.slice(-6)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            {isIncoming && swap.status === "pending" && (
              <>
                <Dialog
                  open={responseDialogOpen}
                  onOpenChange={setResponseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSwap(swap)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Accept Swap Request</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to accept this swap? This action
                        cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="response-message">
                          Response Message (Optional)
                        </Label>
                        <Textarea
                          id="response-message"
                          placeholder="Add a message for the other user..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            handleSwapResponse(selectedSwap?._id, "accept")
                          }
                          disabled={responding}
                          className="flex-1"
                        >
                          {responding ? "Accepting..." : "Accept Swap"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setResponseDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSwap(swap);
                    handleSwapResponse(swap._id, "reject");
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              </>
            )}

            <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSwap(swap)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chat with {otherUser?.firstName}</DialogTitle>
                  <DialogDescription>
                    Discuss the details of your swap
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Chat messages would go here in a real app */}
                  <div className="h-48 border rounded p-3 bg-muted/20">
                    <p className="text-sm text-muted-foreground text-center">
                      Chat feature coming soon!
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="flex-1"
                      rows={2}
                    />
                    <Button size="sm">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/items/${myItem?._id}`)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Item
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Swaps</h1>
        <p className="text-muted-foreground">
          Manage your swap requests and track your exchanges
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold">{incoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  My Requests
                </p>
                <p className="text-2xl font-bold">{outgoing.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">{completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swaps Tabs */}
      <Tabs defaultValue="incoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming">
            Incoming Requests ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            My Requests ({outgoing.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        {/* Incoming Requests */}
        <TabsContent value="incoming" className="space-y-4">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No incoming requests
                </h3>
                <p className="text-muted-foreground mb-4">
                  When someone wants to swap for your items, requests will
                  appear here.
                </p>
                <Button onClick={() => navigate("/add-item")}>
                  Add More Items
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {incoming.map((swap) => (
                <SwapCard key={swap._id} swap={swap} type="incoming" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outgoing Requests */}
        <TabsContent value="outgoing" className="space-y-4">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No outgoing requests
                </h3>
                <p className="text-muted-foreground mb-4">
                  Browse items and make swap requests to see them here.
                </p>
                <Button onClick={() => navigate("/items")}>Browse Items</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {outgoing.map((swap) => (
                <SwapCard key={swap._id} swap={swap} type="outgoing" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Swaps */}
        <TabsContent value="completed" className="space-y-4">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No completed swaps
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your successful swaps will be recorded here.
                </p>
                <Button onClick={() => navigate("/items")}>
                  Start Swapping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completed.map((swap) => (
                <SwapCard key={swap._id} swap={swap} type="completed" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SwapsPage;
