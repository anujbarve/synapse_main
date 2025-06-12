"use client"

import {
  Users,
  Compass,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-sm font-medium">Communities</SidebarGroupLabel>
      <SidebarMenu>
        {loading ? (
          // Enhanced loading state
          <>
            {[1, 2, 3].map((i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuButton className="py-2">
                  <Skeleton className="h-5 w-5 rounded-full mr-2" />
                  <Skeleton className="h-4 w-24" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </>
        ) : projects.length > 0 ? (
          // Improved communities list
          <>
            {projects.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild
                  className="transition-colors hover:bg-accent/60 rounded-md py-2"
                >
                  <a href={item.url} className="flex items-center">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary mr-2">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </>
        ) : (
          // Improved empty state
          <div className="px-3 py-4 text-center">
            <div className="w-full flex justify-center mb-2">
              <div className="bg-muted/50 rounded-full p-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">No communities joined</p>
            <Link 
              href="/explore_communities" 
              className="inline-flex items-center justify-center text-xs bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-3 w-3 mr-1" />
              Find communities
            </Link>
          </div>
        )}
        
        {/* Improved explore more communities link */}
        {projects.length > 0 && (
          <Link href="/explore_communities">
            <SidebarMenuItem>
              <SidebarMenuButton className="mt-2 text-muted-foreground hover:text-foreground transition-colors">
                <Compass className="h-4 w-4" />
                <span>Explore Communities</span>
              </SidebarMenuButton>
            </SidebarMenuItem>  
          </Link>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}