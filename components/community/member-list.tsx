  "use client";

  import { useState } from "react";
  import { useSingleCommunityStore } from "@/stores/single_community_store";
  import { useUserStore } from "@/stores/user_store";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { Input } from "@/components/ui/input";
  import { Info, Crown, MicOff, Ban } from "lucide-react";

  export default function MemberList() {
    const { members, community, promoteMember, muteMember, banMember } =
      useSingleCommunityStore();
    const { user } = useUserStore();

    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    // Separate states for mute and ban details
    const [muteDetails, setMuteDetails] = useState<string>("");
    const [banDetails, setBanDetails] = useState<string>("");
    // Add state to control dialogs
    const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
    const [muteDialogOpen, setMuteDialogOpen] = useState(false);
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // Get current user's role
    const currentUserId = user?.id ?? "";
    const currentUser = members.find((member) => member.id === currentUserId);
    const isAdminOrModerator =
      currentUser?.role === "admin" || currentUser?.role === "moderator";

    // Determine if the current user can act on another user
    const canActOnMember = (targetRole: string) => {
      if (currentUser?.role === "moderator" && targetRole === "admin")
        return false; // Moderator can't act on admin
      if (currentUser?.role === "admin" && targetRole === "admin") return false; // Admin can't act on another admin
      return true;
    };

    const handlePromote = async (memberId: string) => {
      try {
        if (community && selectedRole && currentUserId) {
          await promoteMember(
            community.id.toString(),
            memberId,
            selectedRole,
            currentUserId
          );
          setPromoteDialogOpen(false);
          setSelectedRole(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(
            err.message || "An error occurred while promoting the member."
          );
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    const handleMute = async (memberId: string) => {
      try {
        if (community && currentUserId && muteDetails) {
          await muteMember(
            community.id.toString(),
            memberId,
            currentUserId,
            muteDetails
          );
          setMuteDialogOpen(false);
          setMuteDetails(""); // Clear the details after successful mute
          setSelectedMemberId(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while muting the member.");
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    const handleBan = async (memberId: string) => {
      try {
        if (community && currentUserId && banDetails) {
          await banMember(
            community.id.toString(),
            memberId,
            currentUserId,
            banDetails
          );
          setBanDialogOpen(false);
          setBanDetails(""); // Clear the details after successful ban
          setSelectedMemberId(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while banning the member.");
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    return (
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
        </CardHeader>
        <CardContent>
          {!isAdminOrModerator ? (
            <Alert className="mb-4" variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You must be an admin or moderator to manage members.
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
  
              <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between space-x-4"
                  >
                    <div>
                      <p className="font-semibold">{member.username}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <div className="flex space-x-2">
                      {member.role !== "admin" &&
                        canActOnMember(member?.role ?? "member") && (
                          <Dialog
                            open={promoteDialogOpen && selectedMemberId === member.id}
                            onOpenChange={(open) => {
                              setPromoteDialogOpen(open);
                              if (!open) {
                                setSelectedMemberId(null);
                                setSelectedRole(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedMemberId(member.id)}
                              >
                                <Crown className="h-4 w-4 text-yellow-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Promote {member.username}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={setSelectedRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="moderator">
                                      Moderator
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handlePromote(member.id)}
                                  disabled={!selectedRole}
                                >
                                  Promote
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                      )}
  
                      {canActOnMember(member?.role ?? "member") && (
                        <Dialog
                          open={muteDialogOpen && selectedMemberId === member.id}
                          onOpenChange={(open) => {
                            setMuteDialogOpen(open);
                            if (!open) {
                              setSelectedMemberId(null);
                              setMuteDetails("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMemberId(member.id)}
                            >
                              <MicOff className="h-4 w-4 text-blue-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Mute {member.username}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Enter reason for muting"
                                value={muteDetails}
                                onChange={(e) => setMuteDetails(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleMute(member.id)}
                                disabled={!muteDetails}
                              >
                                Mute
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
  
                      {canActOnMember(member?.role ?? "member") && (
                        <Dialog
                          open={banDialogOpen && selectedMemberId === member.id}
                          onOpenChange={(open) => {
                            setBanDialogOpen(open);
                            if (!open) {
                              setSelectedMemberId(null);
                              setBanDetails("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMemberId(member.id)}
                            >
                              <Ban className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Ban {member.username}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Enter reason for banning"
                                value={banDetails}
                                onChange={(e) => setBanDetails(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleBan(member.id)}
                                disabled={!banDetails}
                                variant="destructive"
                              >
                                Ban
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
