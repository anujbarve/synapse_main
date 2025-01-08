"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Heart,
  MessageSquare,
  Share,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface CommentData {
  userName: string;
  userAvatar: string;
  content: string;
  replies?: CommentData[];
}

interface PostData {
  title: string;
  author: string;
  content: string;
  postType: "text" | "image" | "video" | "poll";
  imageUrl?: string;
  videoUrl?: string;
  pollOptions?: {
    option: string;
    votes: number;
  }[];
  totalVotes?: number;
}

export function RedditPostDetailed() {
  // Example post data
  const postData: PostData = {
    title: "Example Reddit Post Title",
    author: "AuthorName",
    content:
      "This is a placeholder for the post body. Add a detailed description or main text here to provide more context about the post.",
    postType: "text", // Change this to "text", "image", "video", or "poll" to test different types
    imageUrl: "https://via.placeholder.com/800x400",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    pollOptions: [
      { option: "Option 1", votes: 50 },
      { option: "Option 2", votes: 30 },
      { option: "Option 3", votes: 20 },
    ],
    totalVotes: 100,
  };

  // Example comment data
  const comments: CommentData[] = [
    {
      userName: "User1",
      userAvatar: "https://via.placeholder.com/50",
      content: "This is a comment.",
      replies: [
        {
          userName: "User2",
          userAvatar: "https://via.placeholder.com/50",
          content: "This is a reply.",
        },
        {
          userName: "User3",
          userAvatar: "https://via.placeholder.com/50",
          content: "Another reply.",
          replies: [
            {
              userName: "User2",
              userAvatar: "https://via.placeholder.com/50",
              content: "This is a reply.",
            },
            {
              userName: "User3",
              userAvatar: "https://via.placeholder.com/50",
              content: "Another reply.",
            },
          ],
        },
      ],
    },
    // Add more comments as needed
  ];

  // State for poll votes (for demo purposes)
  const [pollVoted, setPollVoted] = React.useState(false);
  const [pollResults, setPollResults] = React.useState(postData.pollOptions);

  // Handle voting in the poll
  const handleVote = (index: number) => {
    if (!pollVoted && pollResults) {
      const updatedPollResults = pollResults.map((option, idx) => {
        if (idx === index) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });
      setPollResults(updatedPollResults);
      setPollVoted(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Post Card with Comments */}
      <Card>
        {/* Post Content */}
        <CardHeader>
          <CardTitle className="text-xl font-bold">{postData.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Posted by {postData.author}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Display content based on postType */}
          {postData.postType === "image" && postData.imageUrl && (
            <div>
              <Image
                src={postData.imageUrl}
                alt="Post"
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
          )}

          {postData.postType === "video" && postData.videoUrl && (
            <div>
              <video
                controls
                src={postData.videoUrl}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          {postData.postType === "poll" && pollResults && (
            <div className="space-y-4">
              {pollVoted ? (
                // Display poll results
                pollResults.map((option, index) => (
                  <div key={index}>
                    <p className="mb-1">{option.option}</p>
                    <Progress
                      value={(option.votes / (postData.totalVotes! + 1)) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {option.votes} votes
                    </p>
                  </div>
                ))
              ) : (
                // Display poll options
                pollResults.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleVote(index)}
                  >
                    {option.option}
                  </Button>
                ))
              )}
              {pollVoted && (
                <p className="text-xs text-muted-foreground">
                  Total votes: {postData.totalVotes! + 1}
                </p>
              )}
            </div>
          )}

          {/* Post Body */}
          {postData.content && (
            <p className="text-base leading-relaxed">{postData.content}</p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          {/* Vote Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <ArrowUpIcon className="mr-1 h-4 w-4" />
              1.2K
            </Button>
            <Button variant="outline">
              <ArrowDownIcon className="mr-1 h-4 w-4" />
              987
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </CardFooter>

        {/* Divider */}
        <div className="border-t border-muted" />

        {/* Comment Input Box */}
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage
                src="https://via.placeholder.com/50"
                alt="User"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                className="resize-none"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <Button variant="default" size="sm">
                  <Send className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Comments Section */}
        <CardContent className="pt-6">
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <Comment key={index} {...comment} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Comment({
    userName,
    userAvatar,
    content,
    replies,
  }: CommentData) {
    const [showReplyBox, setShowReplyBox] = React.useState(false);
  
    return (
      <div>
        <div className="flex items-start space-x-3">
          {/* Avatar and Username Column */}
          <div className="flex flex-col items-center space-y-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName[0]}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium text-muted-foreground">{userName}</p>
          </div>
  
          {/* Comment Content and Actions */}
          <div className="flex-1">
            {/* Comment Content */}
            <div className="bg-muted/20 p-3 rounded-lg">
              <p className="text-sm">{content}</p>
            </div>
  
            {/* Action Buttons */}
            <div className="mt-1 flex items-center space-x-4">
              <Button variant="link" size="sm" className="text-muted-foreground">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                24
              </Button>
              <Button variant="link" size="sm" className="text-muted-foreground">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                3
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowReplyBox(!showReplyBox)}
              >
                Reply
              </Button>
            </div>
  
            {/* Reply Box */}
            {showReplyBox && (
              <div className="mt-2">
                <Textarea
                  placeholder="Write a reply..."
                  className="resize-none"
                  rows={2}
                />
                <div className="mt-1 flex justify-end">
                  <Button variant="default" size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
  
        {/* Replies */}
        {replies && replies.length > 0 && (
          <div className="mt-6 space-y-6 pl-6 border-l-2 border-muted">
            {replies.map((reply, index) => (
              <Comment key={index} {...reply} />
            ))}
          </div>
        )}
      </div>
    );
  }