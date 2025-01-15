"use client";

import { useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useUserStore } from '@/providers/user_store';

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
        <main>{children}</main>
      </SidebarProvider>
    </>
  );
}