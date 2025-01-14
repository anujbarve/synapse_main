import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          {/* Logo or Hero Image Section */}
          <div>
            {/* You can add a logo or hero image here if needed */}
          </div>

          {/* Heading and Description */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              Collaborate, Learn, and Grow Together
            </h1>
            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Synapse is your go-to platform for collaborative learning. Form study groups, 
              share resources, and work on projects with like-minded peers. Together, we 
              can redefine the way students connect and succeed.
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-row gap-3">
            <Link href={"/dashboard"}>
            <Button size="lg" className="gap-4">
              Get Started <MoveRight className="w-4 h-4" />
            </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
