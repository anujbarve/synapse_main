"use client"

import * as React from "react"
import {
  ArrowUpSquareIcon,
  EarthIcon,
  Frame,
  Home,
  LifeBuoy,
  Lightbulb,
  Map,
  PieChart,
  Send
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUserStore } from "@/stores/user_store"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [
      ],
    },
    {
      title: "Popular",
      url: "#",
      icon: ArrowUpSquareIcon,
      items: [
      ],
    },
    {
      title: "Explore",
      url: "#",
      icon: EarthIcon,
      items: [
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/community",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

// const community_mode = {
//   community_name : "Java Developer",
//   navMain: [
//     {
//       title: "Back to Dashboard",
//       url: "/dashboard",
//       icon: StepBack,
//       items: [
//       ],
//     },
//   ],
//   navSecondary: [
//     {
//       title: "Support",
//       url: "#",
//       icon: LifeBuoy,
//     },
//     {
//       title: "Feedback",
//       url: "#",
//       icon: Send,
//     },
//   ],
//   text: [
//     {
//       name: "Discussions",
//       url: "/community",
//       icon: Frame,
//     },
//     {
//       name: "Spring Boot",
//       url: "#",
//       icon: PieChart,
//     },
//     {
//       name: "AWT",
//       url: "#",
//       icon: Map,
//     },
//   ],
//   av: [
//     {
//       name: "Discussions",
//       url: "/community",
//       icon: Frame,
//     },
//     {
//       name: "Spring Boot",
//       url: "#",
//       icon: PieChart,
//     },
//     {
//       name: "AWT",
//       url: "#",
//       icon: Map,
//     },
//   ],
// }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user } = useUserStore();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Lightbulb className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Synapse Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        {/* <NavProjects projects={community_mode.av} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{name : user?.username as string, email : user?.email as string, avatar : user?.profile_picture as string}} />
      </SidebarFooter>
    </Sidebar>
  )
}
