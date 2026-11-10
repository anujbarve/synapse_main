// components/UpdatePostForm.tsx
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
import { usePostStore, PostWithAuthorAndVote } from "@/stores/post_store";
import Image from "next/image";
import { uploadMedia, MAX_UPLOAD_BYTES } from "@/lib/media";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


const updatePostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  type: z.enum(["Text", "Link", "Image", "Video"]),
  content: z.string(), // Make content required
  description: z.string().optional(), // Add description field
});

interface UpdatePostFormProps {
  post: PostWithAuthorAndVote;
}

type UpdatePostFormValues = z.infer<typeof updatePostSchema>;

export function UpdatePostForm({ post }: UpdatePostFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);

  const { updatePost } = usePostStore();
  const { user } = useUserStore();

  const form = useForm<UpdatePostFormValues>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      title: post.title,
      content: post.content ,
      type: post.type, 
      description: post.description || "",
    },
  });

  const router = useRouter();

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
        `posts/${user.id}/${post.type.toLowerCase()}s`
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

  const handleSubmit = async (data: UpdatePostFormValues) => {
    
    try {
      let finalContent = data.content;

      // For media posts
      if (post.type === "Image" || post.type === "Video") {
        // Use new URL if uploaded, otherwise keep existing content
        finalContent = uploadedUrl || post.content;
      }

      const updateData = {
        title: data.title,
        content: finalContent,
        description: data.description,
      };


      // Call the update function
      await updatePost(post.id, updateData);
      
      toast.success("Post updated successfully");
      router.back();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error((error as Error).message);
    }
  };


  return (
    <Card className="p-6">
      <>
        <h2 className="text-lg font-semibold mb-4">Update Post</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate={true}>
            {/* Title Field */}
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

            {/* Description Field */}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Field for Text/Link posts */}
            {(post.type === "Text" || post.type === "Link") && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{post.type === "Text" ? "Content" : "Link URL"}</FormLabel>
                    <FormControl>
                      {post.type === "Text" ? (
                        <Textarea
                          placeholder="Write your post content"
                          className="min-h-[200px]"
                          {...field}
                        />
                      ) : (
                        <Input placeholder="Enter URL" {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Media Upload for Image/Video posts */}
            {(post.type === "Image" || post.type === "Video") && (
              <FormItem>
                <FormLabel>Current {post.type}</FormLabel>
                <div className="space-y-4">
                  {/* Current Media Preview */}
                  <div className="mb-4">
                    {post.type === "Image" ? (
                      <div className="relative w-full max-h-[300px] overflow-hidden rounded-lg">
                        <Image
                          src={post.content}
                          width={300}
                          height={200}
                          className="object-contain rounded-lg"
                          alt={post.title}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <video
                          src={post.content}
                          controls={true}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload New Media */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={post.type === "Image" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                  />

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Choose New File"}
                  </Button>

                  {isUploading && (
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  )}

                  {uploadedUrl && (
                    <p className="text-sm text-green-600">
                      New file uploaded successfully
                    </p>
                  )}
                </div>
              </FormItem>
            )}

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button 
                type="submit"
                disabled={isUploading}
              >
                Update Post
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </>
    </Card>
  );
}
