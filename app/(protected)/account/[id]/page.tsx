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
import { PostsSection } from "@/components/account/post_section";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const slug = (await params).id;
  const supabase = await createClient();

  const { data: userdata } = await supabase
    .from("users")
    .select()
    .eq("username", slug)
    .single();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Account: {slug}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div>
        <main className="flex flex-1 flex-col lg:flex-row w-full mx-auto gap-6 p-4 max-w-screen-xl">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 bg-card rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-center gap-6">
              <Avatar className="h-32 w-32 rounded-lg">
                {userdata.profile_picture ? (
                  <Image
                    height={512}
                    width={512}
                    src={userdata.profile_picture}
                    alt="Profile Image"
                  />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    {userdata.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h1 className="text-xl font-bold text-primary">User: {slug}</h1>
                <p className="text-sm text-muted-foreground">
                  Email: {userdata.email}
                </p>
              </div>
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
                  <p>Reputation</p>
                </div>
              </div>
              <Button className="w-full">Follow</Button>
            </div>
          </aside>

          {/* Main Feed */}
          <section className="flex-1">
            <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-6">
                Posts by {slug}
              </h2>
              <PostsSection username={slug} />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
