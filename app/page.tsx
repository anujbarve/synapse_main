import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
    <BackgroundBeams className="absolute inset-0 z-0" />
      <div className="relative w-full">
        {/* Background Beams */}
        

        {/* Main Content */}
        <div className="container mx-auto relative z-10">
          <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
            {/* Heading and Description */}
            <div className="flex gap-4 flex-col">
              <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
                Collaborate, Learn, and Grow Together
              </h1>
              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
                Synapse is your go-to platform for collaborative learning. Form
                study groups, share resources, and work on projects with
                like-minded peers. Together, we can redefine the way students
                connect and succeed.
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-row gap-3">
              <Link href="/dashboard" passHref>
                <Button size="lg" className="gap-4">
                  Get Started <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
