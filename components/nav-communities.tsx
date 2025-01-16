"use client"

import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface NavProjectsProps {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
  loading?: boolean
}

export function NavProjects({ projects, loading = false }: NavProjectsProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Communities</SidebarGroupLabel>
      <SidebarMenu>
        {loading ? (
          // Loading state
          <>
            {[1, 2, 3].map((i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuButton>
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </>
        ) : projects.length > 0 ? (
          // Communities list
          <>
            {projects.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <Folder className="text-muted-foreground" />
                      <span>View Community</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="text-muted-foreground" />
                      <span>Share Community</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="text-destructive" />
                      <span>Leave Community</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </>
        ) : (
          // Empty state
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Users className="text-muted-foreground" />
              <span className="text-muted-foreground">No communities joined</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        
        {/* Explore more communities link */}
        <Link href="/explore_communities">
          <SidebarMenuItem>
            <SidebarMenuButton>
              <MoreHorizontal />
              <span>Explore Communities</span>
            </SidebarMenuButton>
          </SidebarMenuItem>  
        </Link>
      </SidebarMenu>
    </SidebarGroup>
  )
}