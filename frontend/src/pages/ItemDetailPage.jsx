import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageSquare,
  Star,
  MapPin,
  Calendar,
  Package,
  User,
  Coins,
  RefreshCw,
} from "lucide-react";
import { itemService, swapService } from "@/lib/apiServices";
import { toast } from "sonner";

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userItems, setUserItems] = useState([]);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [swapMessage, setSwapMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItem();
    if (isSignedIn) {
      fetchUserItems();
    }
  }, [id, isSignedIn]);

  const fetchItem = async () => {
    try {
      const response = await itemService.getItemById(id);
      setItem(response.data.item);
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to load item details");
      navigate("/items");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      const response = await itemService.getItems({ status: "approved" });
      // Filter out the current item and items not owned by the user
      const filteredItems = response.data.items.filter(
        (userItem) => userItem._id !== id && userItem.owner._id === user?.id
      );
      setUserItems(filteredItems);
    } catch (error) {
      console.error("Error fetching user items:", error);
    }
  };

  const handleSwapRequest = async () => {
    if (!selectedItemId) {
      toast.error("Please select an item to offer in exchange");
      return;
    }

    setSubmitting(true);
    try {
      await swapService.requestSwap({
        requestedItemId: id,
        offeredItemId: selectedItemId,
        message: swapMessage,
      });

      toast.success("Swap request sent successfully!");
      setSwapDialogOpen(false);
      setSelectedItemId("");
      setSwapMessage("");
    } catch (error) {
      console.error("Error requesting swap:", error);
      toast.error("Failed to send swap request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    setSubmitting(true);
    try {
      await swapService.requestSwap({
        requestedItemId: id,
        redeemWithPoints: true,
      });

      toast.success("Item redeemed successfully!");
      setRedeemDialogOpen(false);
      fetchItem(); // Refresh item to update availability
    } catch (error) {
      console.error("Error redeeming item:", error);
      toast.error("Failed to redeem item");
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = item && user && item.owner._id === user.id;
  const canInteract = isSignedIn && !isOwner && item?.status === "approved";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading item details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Item not found</h1>
        <Button onClick={() => navigate("/items")}>Back to Items</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/items")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Items
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            <img
              src={`http://localhost:5000${item.images[currentImageIndex]}`}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge variant="secondary">{item.condition}</Badge>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {item.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                    currentImageIndex === index
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <img
                    src={`http://localhost:5000${image}`}
                    alt={`${item.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <Badge variant="outline">{item.status}</Badge>
              <span className="flex items-center">
                <Coins className="h-4 w-4 mr-1" />
                {item.pointValue} points
              </span>
            </div>
          </div>

          {/* Item Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Category
                  </span>
                  <p className="font-medium">{item.category}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Size</span>
                  <p className="font-medium">{item.size}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium">{item.type}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Condition
                  </span>
                  <p className="font-medium">{item.condition}</p>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={item.owner.profileImageUrl} />
                  <AvatarFallback>
                    {item.owner.firstName?.[0]}
                    {item.owner.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {item.owner.firstName} {item.owner.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{item.owner.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canInteract && (
            <div className="space-y-3">
              <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Swap
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Item Swap</DialogTitle>
                    <DialogDescription>
                      Select one of your items to offer in exchange for "
                      {item.title}"
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="offered-item">Your Item to Offer</Label>
                      <Select
                        value={selectedItemId}
                        onValueChange={setSelectedItemId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item to offer" />
                        </SelectTrigger>
                        <SelectContent>
                          {userItems
                            .filter(
                              (userItem) => userItem._id && userItem._id !== ""
                            )
                            .map((userItem) => (
                              <SelectItem
                                key={userItem._id}
                                value={userItem._id}
                              >
                                {userItem.title} - {userItem.category} (
                                {userItem.size})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="swap-message">Message (Optional)</Label>
                      <Textarea
                        id="swap-message"
                        placeholder="Add a personal message..."
                        value={swapMessage}
                        onChange={(e) => setSwapMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSwapRequest}
                        disabled={submitting || !selectedItemId}
                        className="flex-1"
                      >
                        {submitting ? "Sending..." : "Send Request"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSwapDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={redeemDialogOpen}
                onOpenChange={setRedeemDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="lg">
                    <Coins className="h-4 w-4 mr-2" />
                    Redeem with Points
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redeem Item with Points</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to redeem "{item.title}" for{" "}
                      {item.pointValue} points?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleRedeem}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting
                        ? "Redeeming..."
                        : `Redeem for ${item.pointValue} Points`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRedeemDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Owner
              </Button>
            </div>
          )}

          {isOwner && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate(`/items/${id}/edit`)}
                className="w-full"
                variant="outline"
              >
                Edit Item
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                This is your item
              </p>
            </div>
          )}

          {!isSignedIn && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/sign-in")}
                className="w-full"
                size="lg"
              >
                Sign In to Interact
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
