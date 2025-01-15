import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const slug = (await params).id;

  const supabase = await createClient();
  const { data : userdata } = await supabase.from("users").select().eq("username",slug).single();

  return (
    <>
      {/* Header with Sidebar Trigger and Breadcrumb */}
      <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Account : {slug}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

      <div>
        {/* Main Content */}
        <main className="flex flex-1 flex-col lg:flex-row w-full mx-auto gap-6 p-4 max-w-screen-xl">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 bg-card rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-center gap-6">
              {/* User Profile */}
                <Avatar className="h-32 w-32 rounded-lg">
                {userdata.profile_picture ? (
                  <Image
                    height={512}
                    width={512}
                    src={userdata.profile_picture}
                    alt={userdata.name}
                  />
                ) : (
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h1 className="text-xl font-bold text-primary">User : {slug}</h1>
                <p className="text-sm text-muted-foreground">Email : {userdata.email}</p>
              </div>
              {/* User Stats */}
              <div className="flex w-full justify-around text-sm text-muted-foreground">
                <div className="text-center">
                  <p className="font-bold">123</p>
                  <p>Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">456</p>
                  <p>Comments</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">789</p>
                  <p>Karma</p>
                </div>
              </div>
              {/* Follow Button */}
              <Button className="w-full">Follow</Button>
            </div>
          </aside>

          {/* Main Feed */}
          <section className="flex-1 bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-primary">
              Posts by User {slug}
            </h2>
            {/* Posts */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((post) => (
                <div
                  key={post}
                  className="rounded-lg border border-border p-4 hover:shadow-lg"
                >
                  <h3 className="font-bold text-base">
                    Sample Post Title {post}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is a brief description of the post content.
                  </p>
                  <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                    <span>Posted 1 hour ago</span>
                    <span>123 upvotes</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
