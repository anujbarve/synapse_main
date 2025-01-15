"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Textarea } from "../ui/textarea";
import { useUserStore } from "@/stores/user_store";

// Define the form schema with Zod
const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  bio: z.string().max(500, "Bio must be less than 500 characters").nullable(),
  profile_picture: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine((file) => {
      if (!file) return true;
      return file.size <= 5 * 1024 * 1024; // 5MB
    }, "File size should be less than 5MB")
    .refine((file) => {
      if (!file) return true;
      return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    }, "Only .jpg, .png, and .webp formats are supported"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function AccountSettingsSection() {
  const { user, updateUser } = useUserStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const supabase = createClient();

  // Initialize the form with current user data
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      profile_picture: null,
    },
  });

  // Handle form submission
  async function onSubmit(data: UserFormValues) {
    if (user) {
      try {
        // Prepare update data without profile picture
        const updateData: {
          username: string;
          bio: string | null;
          profile_picture?: string | null;
          updated_at: string;
        } = {
          username: data.username,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        };

        // Only handle profile picture if it's provided
        if (data.profile_picture) {
          try {
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("profile-pictures")
                .upload(
                  `/${Date.now()}-${data.profile_picture.name}`,
                  data.profile_picture
                );

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage
              .from("profile-pictures")
              .getPublicUrl(uploadData.path);

            updateData.profile_picture = publicUrl;
          } catch (uploadError) {
            console.error("Error uploading profile picture:", uploadError);
            // Show warning toast but continue with other updates
            toast({
              title: "Warning",
              description:
                "Failed to upload profile picture, but other changes will be saved",
              variant: "destructive",
            });
          }
        }

        // Update user profile
        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id);

        if (error) throw error;

        await updateUser(updateData);

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    }
  }

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("profile_picture", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isEditing) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="font-medium">Email address</span>
            <span className="text-muted-foreground">{user?.email}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="font-medium">Username</span>
            <span className="text-muted-foreground">{user?.username}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="font-medium">Bio</span>
            <span className="text-muted-foreground">{user?.bio}</span>
          </div>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => setIsEditing(true)}
          >
            Edit Account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Edit Account Settings</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Write a brief description about yourself.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Single FormField for profile_picture */}
          <FormField
            control={form.control}
            name="profile_picture"
            render={() => (
              // Remove destructuring since we're not using the field props
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="relative w-24 h-24">
                        <Image
                          src={imagePreview}
                          alt="Profile preview"
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a profile picture (max 5MB, .jpg, .png, or .webp)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit">Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
