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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
                  <BreadcrumbLink href="#">
                    Homepage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 flex justify-center p-4">
          <div className="w-full max-w-full lg:max-w-5xl">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>

            <Tabs defaultValue="account">
              <TabsList className="mb-4 overflow-x-auto">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">General</h2>
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Email address</span>
                      <span>anujbarve27@gmail.com</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Gender</span>
                      <span>Man</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Location customization</span>
                      <span>Use approximate location (based on IP)</span>
                    </div>
                    <Button variant="outline">Edit</Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Profile Settings</h2>
                  {/* Profile settings content */}
                </Card>
              </TabsContent>

              <TabsContent value="privacy">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Privacy Settings</h2>
                  {/* Privacy settings content */}
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Preferences</h2>
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Language</span>
                      <span>English</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Theme</span>
                      <span>Light</span>
                    </div>
                    <Button variant="outline">Save Preferences</Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Notification Settings</h2>
                  <div className="flex flex-col space-y-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Email notifications for replies
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Push notifications for messages
                    </label>
                    <Button variant="default">Save Notifications</Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Todos</h2>
                  {/* Email settings content */}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        </>
  );
}