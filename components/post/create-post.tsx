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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { toast } from "sonner";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

const postFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  type: z.enum(["Text", "Link", "Image", "Video"]),
  content: z.string().min(1, "Content is required"), // Make content required
  description: z.string().optional(), // Add description field
});

interface IKUploadRef extends HTMLInputElement {
  click: () => void;
}

type PostFormValues = z.infer<typeof postFormSchema>;

export function CreatePostForm() {
  const ikUploadRef = React.useRef<IKUploadRef>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);

  const { createPost } = usePostStore();
  const { user } = useUserStore();
  const { currentCommunity } = useSingleCommunityStore();

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

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit");
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to authenticate upload");
      throw error;
    }
  };

  interface ImageKitResponse {
    url: string;
    fileId: string;
    name: string;
    size: number;
    filePath: string;
    fileType: string;
    height: number;
    width: number;
    thumbnailUrl: string;
  }

  // Define the error type
  type UploadError = {
    message: string;
  };

  // Define the progress type
  interface UploadProgressEvent {
    loaded: number;
    total: number;
  }

  const handleUploadError = (err: UploadError) => {
    console.error("Upload error:", err);
    setIsUploading(false);
    toast.error(err.message || "Failed to upload file");
  };

  const handleUploadSuccess = (res: ImageKitResponse) => {
    console.log("Upload success:", res);
    setIsUploading(false);
    setUploadedUrl(res.url);
    toast.success("File uploaded successfully");
  };

  const handleUploadProgress = (progress: UploadProgressEvent) => {
    setUploadProgress((progress.loaded / progress.total) * 100);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(0);
  };

  const onSubmit = async (data: PostFormValues) => {
    console.log("Form submitted with data:", data);

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

      console.log("Creating post with:", postData);

      await createPost(postData);

      toast.success("Post created successfully");

      form.reset();
      setUploadedUrl(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error creating post:", error);
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
                      setUploadProgress(0);
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
                    <IKUpload
                      fileName={Date.now().toString()}
                      folder={`/posts/${postType.toLowerCase()}s`}
                      validateFile={(file: File) =>
                        file.size <= 100 * 1024 * 1024
                      }
                      onError={handleUploadError}
                      onSuccess={handleUploadSuccess}
                      onUploadProgress={handleUploadProgress}
                      onUploadStart={handleUploadStart}
                      style={{ display: "none" }}
                      ref={ikUploadRef}
                      accept={postType === "Image" ? "image/*" : "video/*"}
                    />
                    <Button
                      type="button"
                      onClick={() => ikUploadRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Choose File"}
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
                  setUploadProgress(0);
                }}
                disabled={isUploading}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </ImageKitProvider>
    </Card>
  );
}
