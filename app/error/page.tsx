import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <ErrorScreen></ErrorScreen>
      </div>
    </div>
  )
}


export function ErrorScreen({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6 text-center", className)} {...props}>
        <Card className="p-8 max-w-lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
            <p className="text-muted-foreground text-lg">
              Something went wrong. Please try again later.
            </p>
            <img
              src="/synapse.png"
              alt="Error Illustration"
              className="mx-auto h-48 w-48 object-contain"
            />
          </div>
        </Card>
      </div>
    )
  }
  