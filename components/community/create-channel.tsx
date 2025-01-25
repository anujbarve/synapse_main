"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChannelStore } from "@/stores/channel_store";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useUserStore } from "@/stores/user_store";

// Zod Schema for Validation
const channelSchema = z.object({
  name: z.string().min(3, "Channel name must be at least 3 characters."),
  type: z.enum(["Text", "Voice"]),
  description: z.string().optional(),
});

type ChannelFormData = z.infer<typeof channelSchema>;

export default function ChannelAddForm() {
  const [error, setError] = useState<string | null>(null);
  const { currentCommunity, members } = useSingleCommunityStore();
  const { addChannel, fetchChannels, loading } = useChannelStore();
  const { user } = useUserStore();

  // Get current user's role (Replace with actual authenticated user ID logic)
  const currentUserId = user?.id ?? ""; // Replace with logic to fetch current user's ID
  const currentUser = members.find((member) => member.id === currentUserId);
  const isAdminOrModerator = currentUser?.role === "admin" || currentUser?.role === "moderator";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      type: "Text",
    },
  });

  const onSubmit = async (data: ChannelFormData) => {
    if (!isAdminOrModerator) {
      setError("You do not have permission to create channels.");
      return;
    }

    if (!currentCommunity) {
      setError("No community selected.");
      return;
    }

    try {
      await addChannel({
        community_id: currentCommunity,
        name: data.name,
        type: data.type,
        description: data.description || null,
      });

      setError(null);
      reset();
      fetchChannels(currentCommunity.toString());
    } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while updating the channel.");
        } else {
          setError("An unknown error occurred.");
        }
      }
      
  };

  return (
    <Card className="mx-auto">
      <CardHeader>
        <CardTitle>Manage Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {!isAdminOrModerator ? (
          <Alert className="mb-4" variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be an admin or moderator to manage channels.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert className="mb-4" variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Channel Name */}
            <div>
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                placeholder="Enter channel name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Channel Type */}
            <div>
              <Label htmlFor="type">Channel Type</Label>
              <Select
                onValueChange={(value) => setValue("type", value as "Text" | "Voice")}
                defaultValue="Text"
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Text">Text</SelectItem>
                  <SelectItem value="Voice">Voice</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Channel"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
