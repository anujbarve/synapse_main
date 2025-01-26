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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Info, Crown, MicOff, Ban } from "lucide-react";

export default function MemberList() {
    const { members, community, promoteMember, muteMember, banMember } = useSingleCommunityStore();
    const { user } = useUserStore();

    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [details, setDetails] = useState<string>("");

    // Get current user's role
    const currentUserId = user?.id ?? "";
    const currentUser = members.find((member) => member.id === currentUserId);
    const isAdminOrModerator = currentUser?.role === "admin" || currentUser?.role === "moderator";

    // Determine if the current user can act on another user
    const canActOnMember = (targetRole: string) => {
        if (currentUser?.role === "moderator" && targetRole === "admin") return false; // Moderator can't act on admin
        if (currentUser?.role === "admin" && targetRole === "admin") return false; // Admin can't act on another admin
        return true;
    };

    const handlePromote = async (memberId: string) => {
        try {
            if (community && selectedRole) {
                await promoteMember(community.id.toString(), memberId, selectedRole);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
              setError(err.message || "An error occurred while updating the channel.");
            } else {
              setError("An unknown error occurred.");
            }
          }
          
    };

    const handleMute = async (memberId: string) => {
        try {
            if (community) {
                await muteMember(community.id.toString(), memberId, details);
            }
        }catch (err: unknown) {
            if (err instanceof Error) {
              setError(err.message || "An error occurred while updating the channel.");
            } else {
              setError("An unknown error occurred.");
            }
          }
          
    };

    const handleBan = async (memberId: string) => {
        try {
            if (community) {
                await banMember(community.id.toString(), memberId, details);
            }
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
                                        {member.role !== "admin" && canActOnMember(member?.role ?? "member") && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Crown className="h-4 w-4 text-yellow-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Promote Member</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <Select onValueChange={setSelectedRole}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="moderator">Moderator</SelectItem>
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
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MicOff className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Mute Member</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <Input
                                                            placeholder="Enter details"
                                                            value={details}
                                                            onChange={(e) => setDetails(e.target.value)}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={() => handleMute(member.id)}>
                                                            Mute
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        {canActOnMember(member?.role ?? "member" ) && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Ban className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Ban Member</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <Input
                                                            placeholder="Enter details"
                                                            value={details}
                                                            onChange={(e) => setDetails(e.target.value)}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={() => handleBan(member.id)}>Ban</Button>
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
