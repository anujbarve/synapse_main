"use client"
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountSettingsSection } from "@/components/settings/account";

export default function Page() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Homepage</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid w-full gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3 md:order-1 lg:col-span-5 space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            {/* Account Settings Card */}
            <AccountSettingsSection></AccountSettingsSection>

            {/* Preferences Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Preferences</h2>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span className="font-medium">Language</span>
                  <span className="text-muted-foreground">English</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span className="font-medium">Theme</span>
                  <span className="text-muted-foreground">Light</span>
                </div>
                <Button variant="outline" className="w-full md:w-auto">Save Preferences</Button>
              </div>
            </Card>

            {/* Notification Settings Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" />
                    <span>Email notifications for replies</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" />
                    <span>Push notifications for messages</span>
                  </label>
                </div>
                <Button className="w-full md:w-auto">Save Notifications</Button>
              </div>
            </Card>

            {/* Privacy Settings Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" />
                    <span>Make profile public</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" />
                    <span>Show online status</span>
                  </label>
                </div>
                <Button className="w-full md:w-auto">Update Privacy</Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 md:col-span-1 md:order-2 lg:col-span-3 md:sticky md:top-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Download Your Data
                </Button>
                <Button variant="outline" className="w-full">
                  Security Check
                </Button>
                <Button variant="outline" className="w-full">
                  Privacy Review
                </Button>
              </div>
            </Card>

            <Card className="p-6 mt-4">
              <h2 className="text-lg font-semibold mb-4">Help & Support</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Need help with your settings? Check our documentation or contact support.
                </p>
                <Button variant="link" className="p-0">View Documentation</Button>
                <Button variant="link" className="p-0">Contact Support</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}