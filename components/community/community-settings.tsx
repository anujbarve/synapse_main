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
import { cn } from "@/lib/utils";
import {
  Settings,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import ChannelManagementForm from "./create-channel";
import ChannelList from "./channel-list";
import MemberList from "./member-list";
import ModeratedMembersList from "./moderate-members-list";
import { toast } from "sonner";

interface CommunitySettingsDialogProps {
  user_id: string | undefined;
  community_id: number;
  isOpen: boolean;
  onClose: () => void;
}

type Section = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const sections: Section[] = [
  { id: "channels", label: "Channels", icon: <Settings className="h-4 w-4" /> },
  { id: "members", label: "Members", icon: <Users className="h-4 w-4" /> },
  { id: "moderation", label: "Moderation", icon: <Shield className="h-4 w-4" /> },
  { id: "danger", label: "Danger Zone", icon: <UserMinus className="h-4 w-4 text-red-500" /> },
];

export function CommunitySettingsDialog({
  user_id,
  community_id,
  isOpen,
  onClose,
}: CommunitySettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("channels");
  const [showAlert, setShowAlert] = React.useState(false);
  const { setCurrentCommunity, leaveCommunity } = useSingleCommunityStore();
  const router = useRouter();

  const handleLeaveCommunity = () => {
    onClose();
    setShowAlert(true);
  };

  const handleConfirmLeave = async () => {
    if (!user_id) return;
    
    try {
      await setCurrentCommunity(0);
      await leaveCommunity(community_id.toString(), user_id);
      toast.success("Successfully left the community");
      router.push('/dashboard');
    } catch (error) {
      toast.error(`${error}`);
    }
    setShowAlert(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "channels":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Create Channel</h2>
              <ChannelManagementForm />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Channel List</h2>
              <ChannelList />
            </div>
          </div>
        );

      case "members":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Member Management</h2>
            <MemberList />
          </div>
        );

      case "moderation":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Moderated Members</h2>
            <ModeratedMembersList />
          </div>
        );

      case "danger":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Actions here cannot be undone. Please proceed with caution.
            </p>
            <Button 
              onClick={handleLeaveCommunity} 
              variant="destructive"
              className="w-full"
            >
              Leave Community
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Community Settings</DialogTitle>
          </DialogHeader>
          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-[200px] border-r">
              <nav className="flex flex-col p-2 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-secondary",
                      activeSection === section.id
                        ? "bg-secondary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              community membership and remove access to all community content.
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