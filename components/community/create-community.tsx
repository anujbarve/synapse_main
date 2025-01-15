"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/stores/user_store";

// Define the form schema with Zod
const communityFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  banner_image: z
    .instanceof(File)
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

type CommunityFormValues = z.infer<typeof communityFormSchema>;

export function CommunityFormAndInfo() {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [communityData, setCommunityData] = React.useState({
    title: "",
    description: "",
    banner_image: null as File | null,
  }); // Initialize communityData state

  
  const supabase = createClient();
  const { user } = useUserStore();
  const { toast } = useToast();

  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      title: communityData.title,
      description: communityData.description,
      banner_image: null,
    },
  });

  const handleFormChange = (field: keyof CommunityFormValues, value: CommunityFormValues[typeof field]) => {
    const updatedData = { ...communityData, [field]: value };
    setCommunityData(updatedData);
  };

  async function onSubmit(data: CommunityFormValues) {
    if (user) {
      try {
        // Prepare update data without profile picture
        const insertData: {
          name: string;
          description: string;
          banner_picture: string | null;
          created_by: string;
        } = {
          name: data.title,
          description: data.description,
          created_by: user.id,
          banner_picture: null,
        };

        // Only handle profile picture if it's provided
        if (data.banner_image) {
          try {
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("community")
                .upload(
                  `/banners/${Date.now()}-${data.banner_image.name}`,
                  data.banner_image
                );

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage
              .from("community")
              .getPublicUrl(uploadData.path);

            insertData.banner_picture = publicUrl;
          } catch (uploadError) {
            console.error("Error uploading banner picture:", uploadError);
            // Show warning toast but continue with other updates
            toast({
              title: "Warning",
              description:
                "Failed to upload banner picture, but other changes will be saved",
              variant: "destructive",
            });
          }
        }

        // Update user profile
        const { error: insertError } = await supabase
          .from("community")
          .insert(insertData);
        if (insertError) {
          console.error("Error updating profile:", insertError);
          toast({
            title: "Error",
            description: insertError.message,
            variant: "destructive",
          });
        }

        const { data: community_data } = await supabase
          .from("community")
          .select()
          .eq("name", insertData.name)
          .single();

        if (community_data) {
          const insertMemberData: {
            community_id: number;
            user_id: string;
            role: string;
          } = {
            community_id: community_data.id,
            user_id: user.id,
            role: "admin",
          };

          const { error: insertMemberError } = await supabase
            .from("community_members")
            .insert(insertMemberData);
          if (insertMemberError) {
            console.error("Error inserting member data profile:", insertError);
            toast({
              title: "Error",
              description: insertMemberError.message,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error Creating Community:", error);
        toast({
          title: "Error",
          description: "Failed to Create Community",
          variant: "destructive",
        });
      }
    }
    toast({
      title: "Success",
      description: "Community Created Successfully",
    });
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("banner_image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        handleFormChange("banner_image", reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      handleFormChange("banner_image", null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Create/Edit Community</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter community title"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange("title", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Describe your community"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange("description", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner_image"
              render={() => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {imagePreview && (
                        <div className="relative w-full h-48">
                          <Image
                            src={imagePreview}
                            alt="Banner preview"
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit">Create Community</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>

        <Card className="w-full">
          <div className="relative w-full h-48">
            {imagePreview ? (
              <div className="relative w-full h-48">
                <Image
                  src={imagePreview}
                  alt="Banner preview"
                  fill
                  className="rounded-md object-cover"
                />
              </div>
            ) : (
              <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500 rounded-t-lg">
                No Banner Image
              </div>
            )}
          </div>
          <CardHeader>
            <CardTitle>
              <div>
                <h2 className="text-2xl font-bold">
                  {communityData.title || "CommunityName"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {communityData.title || "CommunityName"}
                </p>
              </div>
            </CardTitle>
            <CardDescription className="mt-4 w-full mx-auto">
              {communityData.description ||
                "Welcome to our community! This is a place to discuss and share everything related to our interests."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-center">
                  <p className="text-xl font-semibold">1.2m</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">2.4k</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">#142</p>
                  <p className="text-xs text-muted-foreground">Ranking</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>Created Jan 25, 2018</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Community Rules</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">1.</span>
                    <span>Be respectful and helpful</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">2.</span>
                    <span>No spam or self-promotion</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">3.</span>
                    <span>Follow the community guidelines</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
