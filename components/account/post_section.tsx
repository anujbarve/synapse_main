"use client";
import { useEffect, useState } from "react";
import { usePostStore } from "@/stores/post_store";
import { PostTile } from "../post/post-tile";
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
import { toast } from "sonner";

export function PostsSection({ username }: { username: string }) {
  const { 
    userPosts, 
    userPostsLoading, 
    userPostsError, 
    fetchUserPosts,
    deletePost 
  } = usePostStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchUserPosts(username);
  }, [username, fetchUserPosts]);

  const handleDeletePost = async (postId: number) => {
    setIsDeleting(true);
    try {
      await deletePost(postId);
      toast.success("Post deleted successfully");
      // Optionally refresh the posts list
      fetchUserPosts(username);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  if (userPostsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userPostsError) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading posts: {userPostsError}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {userPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet
          </div>
        ) : (
          userPosts.map((post) => (
            <PostTile 
              key={post.id} 
              post={post}
              onDeleteClick={() => setPostToDelete(post.id)}
              isDeleting={isDeleting && postToDelete === post.id}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={postToDelete !== null} 
        onOpenChange={(open) => !open && setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDeletePost(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
