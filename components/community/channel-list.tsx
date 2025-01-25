"use client";

import { useEffect, useState } from "react";
import { useChannelStore } from "@/stores/channel_store";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useUserStore } from "@/stores/user_store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ChannelList() {
  const [editingChannel, setEditingChannel] = useState<null | number>(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedType, setUpdatedType] = useState<"Text" | "Voice">("Text");
  const [error, setError] = useState<string | null>(null);

  const { currentCommunity, members } = useSingleCommunityStore();
  const { channels, fetchChannels, deleteChannel, updateChannel, loading } = useChannelStore();
  const { user } = useUserStore();

  // Get current user's role
  const currentUserId = user?.id ?? "";
  const currentUser = members.find((member) => member.id === currentUserId);
  const isAdminOrModerator = currentUser?.role === "admin" || currentUser?.role === "moderator";

  useEffect(() => {
    if (currentCommunity) {
      fetchChannels(currentCommunity.toString()).catch((err) =>
        setError(err.message || "Failed to fetch channels.")
      );
    }
  }, [currentCommunity, fetchChannels]);

  const handleEdit = (channelId: number, name: string, type: "Text" | "Voice") => {
    setEditingChannel(channelId);
    setUpdatedName(name);
    setUpdatedType(type);
  };

  const handleUpdate = async () => {
    if (!currentCommunity || !editingChannel) return;

    try {
      await updateChannel(editingChannel, {
        name: updatedName,
        type: updatedType,
      });
      setEditingChannel(null);
      fetchChannels(currentCommunity.toString());
    } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while updating the channel.");
        } else {
          setError("An unknown error occurred.");
        }
      }      
  };

  const handleDelete = async (channelId: number) => {
    if (!currentCommunity) return;

    try {
      await deleteChannel(channelId);
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
        <CardTitle>Channel List</CardTitle>
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
          <div className="space-y-4">
            {error && (
              <Alert className="mb-4" variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between space-x-4">
                <div>
                  <p className="font-semibold">{channel.name}</p>
                  <p className="text-sm text-gray-500">{channel.type}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(channel.id, channel.name, channel.type as "Text" | "Voice")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(channel.id)}
                    disabled={loading}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog for Editing a Channel */}
      {editingChannel !== null && (
        <Dialog open={editingChannel !== null} onOpenChange={() => setEditingChannel(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium">
                  Channel Name
                </label>
                <Input
                  id="edit-name"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-type" className="block text-sm font-medium">
                  Channel Type
                </label>
                <select
                  id="edit-type"
                  value={updatedType}
                  onChange={(e) => setUpdatedType(e.target.value as "Text" | "Voice")}
                  className="w-full rounded border px-2 py-1"
                >
                  <option value="Text">Text</option>
                  <option value="Voice">Voice</option>
                </select>
              </div>
              <Button onClick={handleUpdate} disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Channel"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
