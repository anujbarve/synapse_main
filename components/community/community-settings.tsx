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
import { cn } from "@/lib/utils";
import {
  Bell,
  Settings,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ChannelManagementForm from "./create-channel";
import ChannelList from "./channel-list";
import MemberList from "./member-list";

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
  { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
  { id: "create_channel", label: "Create Channel", icon: <Settings className="h-4 w-4" /> },
  { id: "channel_list", label: "Channel List", icon: <Shield className="h-4 w-4" /> },
  { id: "member_list", label: "Member List", icon: <Shield className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "privacy", label: "Privacy & Security", icon: <Shield className="h-4 w-4" /> },
  { id: "members", label: "Members", icon: <Users className="h-4 w-4" /> },
  { id: "danger", label: "Danger Zone", icon: <UserMinus className="h-4 w-4 text-red-500" /> },
];

export function CommunitySettingsDialog({
  user_id,
  community_id,
  isOpen,
  onClose,
}: CommunitySettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("general");
  const [showAlert, setShowAlert] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const { setCurrentCommunity, leaveCommunity } = useSingleCommunityStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLeaveCommunity = () => {
    onClose();
    setShowAlert(true);
  };

  const handleConfirmLeave = async () => {
    if (!user_id) return;
    
    try {
      await setCurrentCommunity(0);
      await leaveCommunity(community_id.toString(), user_id);
      toast({
        title: "Success",
        description: "Successfully left the community",
        variant: "default",
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: `${error}`,
        variant: "destructive",
      });
    }
    setShowAlert(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">General Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name</label>
                <Select defaultValue="public">
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "create_channel":
        return (
          <ChannelManagementForm />
      );

      case "channel_list":
        return (
          <ChannelList/>
      );

      case "member_list":
        return (
          <MemberList/>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new posts
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Email Frequency</h4>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Profile Visibility</h4>
                <Select defaultValue="members">
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="members">Members Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "members":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Member Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage member roles and permissions
            </p>
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
        <DialogContent className="sm:max-w-[700px] p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Community Settings</DialogTitle>
          </DialogHeader>
          <div className="flex h-[500px]">
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
            <div className="flex-1 p-6">
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