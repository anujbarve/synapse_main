import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import Image from "next/image";

export function ErrorScreen({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6 text-center", className)} {...props}>
        <Card className="p-8 max-w-lg">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
            <p className="text-muted-foreground text-lg">
              Something went wrong. Please try again later.
            </p>
            <Image
            width={1024}
            height={1024}
              src="/synapse.png"
              alt="Error Illustration"
              className="mx-auto object-contain"
            />
          </div>
        </Card>
      </div>
    )
  }