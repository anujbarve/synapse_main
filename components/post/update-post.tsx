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
import { usePostStore, PostWithAuthorAndVote } from "@/stores/post_store";
import { Progress } from "@/components/ui/progress";
import { ImageKitProvider, IKUpload, IKImage, IKVideo } from "imagekitio-next";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

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

interface IKUploadRef extends HTMLInputElement {
  click: () => void;
}

type UpdatePostFormValues = z.infer<typeof updatePostSchema>;

export function UpdatePostForm({ post }: UpdatePostFormProps) {
  const ikUploadRef = React.useRef<IKUploadRef>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);

  const { updatePost } = usePostStore();

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

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit");
      if (!response.ok)
        throw new Error(`Authentication failed: ${response.statusText}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to authenticate upload");
      throw error;
    }
  };

  const handleUploadError = (err: { message: string }) => {
    console.error("Upload error:", err);
    setIsUploading(false);
    toast.error(err.message || "Failed to upload file");
  };

  const handleUploadSuccess = (res: { url: string }) => {
    console.log("Upload success:", res);
    setIsUploading(false);
    setUploadedUrl(res.url);
    toast.success("File uploaded successfully");
  };

  const handleUploadProgress = (progress: {
    loaded: number;
    total: number;
  }) => {
    setUploadProgress((progress.loaded / progress.total) * 100);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(0);
  };

  const handleSubmit = async (data: UpdatePostFormValues) => {
    console.log("Submitting form with data:", data);
    
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

      console.log("Updating post with:", updateData);

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
      <ImageKitProvider
        publicKey={publicKey}
        urlEndpoint={urlEndpoint}
        authenticator={authenticator}
      >
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
                        <IKImage
                          urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                          src={post.content}
                          width={300}
                          height={200}
                          className="object-contain rounded-lg"
                          alt={post.title}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <IKVideo
                          urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                          src={post.content}
                          controls={true}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload New Media */}
                  <IKUpload
                    fileName={Date.now().toString()}
                    folder={`/posts/${post.type.toLowerCase()}s`}
                    validateFile={(file: File) => file.size <= 100 * 1024 * 1024}
                    onError={handleUploadError}
                    onSuccess={handleUploadSuccess}
                    onUploadProgress={handleUploadProgress}
                    onUploadStart={handleUploadStart}
                    style={{ display: "none" }}
                    ref={ikUploadRef}
                    accept={post.type === "Image" ? "image/*" : "video/*"}
                  />

                  <Button
                    type="button"
                    onClick={() => ikUploadRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Choose New File"}
                  </Button>

                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground">
                        Uploading: {Math.round(uploadProgress)}%
                      </p>
                    </div>
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
      </ImageKitProvider>
    </Card>
  );
}
