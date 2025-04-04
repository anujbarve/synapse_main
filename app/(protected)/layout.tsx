"use client";

import { useEffect } from 'react';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useUserStore } from '@/stores/user_store';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fetchUser = useUserStore(state => state.fetchUser);

  // Initialize user data when the app loads
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}