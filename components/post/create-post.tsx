"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useUserStore } from "@/stores/user_store";
import { usePostStore } from "@/stores/post_store";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadMedia, MAX_UPLOAD_BYTES } from "@/lib/media";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { toast } from "sonner";

const postFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  type: z.enum(["Text", "Link", "Image", "Video"]),
  content: z.string().min(1, "Content is required"), // Make content required
  description: z.string().optional(), // Add description field
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function CreatePostForm() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);

  const { createPost } = usePostStore();
  const { user } = useUserStore();
  const { currentCommunity } = useSingleCommunityStore();

    const { setCurrentCommunity } = useSingleCommunityStore();
  
    React.useEffect(() => {
      setCurrentCommunity(parseInt(currentCommunity.toString() || "0"));
    }, [setCurrentCommunity,currentCommunity]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      type: "Text",
      content: "",
      description: "",
    },
  });

  const postType = form.watch("type");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File must be 100 MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadMedia(
        file,
        `posts/${user.id}/${postType.toLowerCase()}s`
      );
      setUploadedUrl(url);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error((err as Error).message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: PostFormValues) => {

    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    if (currentCommunity === 0) {
      toast.error("You must be in a community to create a post");
      return;
    }

    try {
      let finalContent = data.content; // content is now required

      switch (data.type) {
        case "Text":
        case "Link":
          finalContent = data.content;
          break;
        case "Image":
        case "Video":
          if (!uploadedUrl) {
            toast.error("Please upload a file first");
            return;
          }
          finalContent = uploadedUrl;
          break;
      }

      const postData = {
        community_id: currentCommunity,
        user_id: user.id,
        title: data.title,
        content: finalContent,
        description: data.description || null, // Add description
        type: data.type,
      };


      await createPost(postData);
      // Reload server-loaded post lists so the new post appears
      router.refresh();

      toast.success("Post created successfully");

      form.reset();
      setUploadedUrl(null);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error((error as Error).message);
    }
  };

  return (
    <Card className="p-6">
      <>
        <h2 className="text-lg font-semibold mb-4">Create Post</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setUploadedUrl(null);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Text">Text Post</SelectItem>
                      <SelectItem value="Link">Link Post</SelectItem>
                      <SelectItem value="Image">Image Post</SelectItem>
                      <SelectItem value="Video">Video Post</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {postType === "Text" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your post content"
                        className="min-h-[200px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {postType === "Link" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter URL"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(postType === "Image" || postType === "Video") && (
              <>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a description to your post"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>
                    Upload {postType === "Image" ? "Image" : "Video"}
                  </FormLabel>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={postType === "Image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Choose File"}
                    </Button>
                    {isUploading && (
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    )}
                    {uploadedUrl && (
                      <p className="text-sm text-green-600">
                        File uploaded successfully
                      </p>
                    )}
                  </div>
                </FormItem>
              </>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isUploading}>
                Create Post
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setUploadedUrl(null);
                }}
                disabled={isUploading}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </>
    </Card>
  );
}
