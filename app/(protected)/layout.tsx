import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserProvider } from "@/providers/user";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <UserProvider>
        <SidebarProvider>
          <AppSidebar />
          <main>{children}</main>
        </SidebarProvider>
      </UserProvider>
    </>
  );
}
