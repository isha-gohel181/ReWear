import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Camera,
  ArrowLeft,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { itemService } from "@/lib/apiServices";
import { toast } from "sonner";

// Form validation schema
const itemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  category: z.string().min(1, "Please select a category"),
  type: z.string().min(1, "Please specify the type"),
  size: z.string().min(1, "Please select a size"),
  condition: z.string().min(1, "Please select the condition"),
  tags: z.string().optional(),
  pointValue: z
    .number()
    .min(1, "Point value must be at least 1")
    .max(100, "Point value cannot exceed 100"),
});

const AddItemPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      pointValue: 10,
    },
  });

  const categories = [
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Shoes",
    "Accessories",
    "Bags",
    "Jewelry",
    "Activewear",
    "Formal",
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];
  const conditions = [
    "New with tags",
    "New without tags",
    "Like new",
    "Very good",
    "Good",
    "Fair",
  ];

  const conditionDescriptions = {
    "New with tags": "Brand new item with original tags attached",
    "New without tags": "Brand new item without tags, never worn",
    "Like new": "Worn once or twice, excellent condition",
    "Very good": "Minor signs of wear, great condition",
    Good: "Some signs of wear but still in good shape",
    Fair: "Noticeable wear but still functional and wearable",
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 6,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 6));
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error("File too large. Maximum size is 5MB");
          } else if (error.code === "file-invalid-type") {
            toast.error("Invalid file type. Please use JPEG, PNG, or WebP");
          }
        });
      });
    },
  });

  const removeImage = (imageId) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imageId);
      // Revoke object URL to prevent memory leaks
      const removedImage = prev.find((img) => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return filtered;
    });
  };

  const addTag = () => {
    if (
      tagInput.trim() &&
      !selectedTags.includes(tagInput.trim()) &&
      selectedTags.length < 10
    ) {
      setSelectedTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];

    if (step === 1) {
      if (images.length === 0) {
        toast.error("Please add at least one image");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      fieldsToValidate = ["title", "description"];
    } else if (step === 3) {
      fieldsToValidate = [
        "category",
        "type",
        "size",
        "condition",
        "pointValue",
      ];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data) => {
    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // Append form fields
      Object.keys(data).forEach((key) => {
        if (key === "tags") {
          formData.append(key, selectedTags.join(","));
        } else {
          formData.append(key, data[key]);
        }
      });

      // Append images
      images.forEach((image) => {
        formData.append("images", image.file);
      });

      const response = await itemService.createItem(formData);

      toast.success("Item listed successfully!");
      navigate(`/items/${response.data.item._id}`);
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item listing");
    } finally {
      setUploading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Upload Photos";
      case 2:
        return "Item Details";
      case 3:
        return "Specifications";
      case 4:
        return "Review & Submit";
      default:
        return "Add Item";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Item</h1>
            <p className="text-muted-foreground">
              List your item for swapping or redemption
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Step {step} of 4: {getStepTitle()}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / 4) * 100)}% Complete
            </span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Upload Photos */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Upload Photos
              </CardTitle>
              <CardDescription>
                Add up to 6 high-quality photos of your item. The first photo
                will be the main image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${images.length >= 6 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} disabled={images.length >= 6} />
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive
                        ? "Drop photos here"
                        : "Drag & drop photos here"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Or click to browse • Max 6 photos • Up to 5MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2">
                          Main Photo
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No photos uploaded yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Item Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Provide a clear title and detailed description of your item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Vintage Denim Jacket"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item's condition, style, brand, and any other relevant details..."
                  className="min-h-[120px]"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Add relevant tags like brand, style, color, etc. (max 10 tags)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Specifications */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Item Specifications</CardTitle>
              <CardDescription>
                Provide specific details about your item's category, size, and
                condition.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    onValueChange={(value) => setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Type/Subtype *</Label>
                  <Input
                    id="type"
                    placeholder="e.g., T-shirt, Jeans, Sneakers"
                    {...register("type")}
                  />
                  {errors.type && (
                    <p className="text-sm text-destructive mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="size">Size *</Label>
                  <Select onValueChange={(value) => setValue("size", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.size && (
                    <p className="text-sm text-destructive mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.size.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pointValue">Point Value *</Label>
                  <Input
                    id="pointValue"
                    type="number"
                    min="1"
                    max="100"
                    {...register("pointValue", { valueAsNumber: true })}
                  />
                  {errors.pointValue && (
                    <p className="text-sm text-destructive mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.pointValue.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select onValueChange={(value) => setValue("condition", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.condition.message}
                  </p>
                )}
                {watch("condition") && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {conditionDescriptions[watch("condition")]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Listing</CardTitle>
              <CardDescription>
                Please review all details before submitting your item for
                approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images Preview */}
              <div>
                <h3 className="font-medium mb-2">Photos ({images.length})</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {images.map((image, index) => (
                    <div key={image.id} className="aspect-square relative">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded border"
                      />
                      {index === 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute bottom-1 left-1 text-xs"
                        >
                          Main
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Item Details Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Item Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>{" "}
                      {watch("title")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{" "}
                      {watch("category")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {watch("type")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>{" "}
                      {watch("size")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Condition:</span>{" "}
                      {watch("condition")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Point Value:
                      </span>{" "}
                      {watch("pointValue")}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {watch("description")}
                  </p>

                  {selectedTags.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag, index) => (
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
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Review Process</p>
                    <p className="text-blue-700 mt-1">
                      Your item will be reviewed by our moderation team before
                      becoming visible to other users. This usually takes 24-48
                      hours.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Previous
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={uploading}>
              {uploading ? "Submitting..." : "Submit for Review"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddItemPage;
