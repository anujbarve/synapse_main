import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface CommunitySettingsDialogProps {
  user_id: string | undefined;
  community_id: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CommunitySettingsDialog({
  user_id,
  community_id,
  isOpen,
  onClose,
}: CommunitySettingsDialogProps) {
  const [showAlert, setShowAlert] = React.useState(false);
  const { setCurrentCommunity, leaveCommunity } = useSingleCommunityStore();
  const router = useRouter();
  const {toast} = useToast();

  const handleLeaveCommunity = () => {
    // Close the main dialog when opening the alert
    onClose();
    // Show the alert dialog
    setShowAlert(true);
  };

  const handleConfirmLeave = async () => {
    // Logic to handle leaving the community
    console.log("User is leaving the community");

    if (user_id) {
      try {
        await setCurrentCommunity(0);
        await leaveCommunity(community_id.toString(), user_id);
        toast({
            title : "Success",
            description : "Successfully left the room"
        })
        router.push(`/dashboard`); // Navigate to the community after successful join
      } catch (error) {
        console.error("Error leaving community:", error);
      }
    }
    setShowAlert(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Community Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Manage your community settings here.</p>
            <Button onClick={handleLeaveCommunity} variant="destructive">
              Leave Community
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              community membership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>
              Leave Community
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
