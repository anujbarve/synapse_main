"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function CommunityBanner() {
    const gradientVariants = [
        "from-blue-500 to-indigo-600",
        "from-cyan-400 to-blue-500",
        "from-teal-500 to-cyan-600",
        "from-indigo-500 to-blue-700",
        "from-lightBlue-400 to-blue-500",
        "from-blue-400 to-cyan-500",
        "from-sky-500 to-indigo-600",
        "from-cyan-600 to-teal-500",
        "from-blue-600 to-sky-500",
        "from-navy-500 to-blue-800",
        "from-indigo-600 to-cyan-500",
        "from-aqua-500 to-teal-600",
        "from-sky-400 to-cyan-600",
        "from-blue-700 to-indigo-500",
      ];

  const [selectedGradient, setSelectedGradient] = React.useState(
    gradientVariants[0]
  );

  React.useEffect(() => {
    // Randomly select a gradient on the client side
    const randomGradient =
      gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
    setSelectedGradient(randomGradient);
  }, []);

  return (
    <div
      className={`w-full bg-gradient-to-r ${selectedGradient} text-white rounded-lg shadow-lg overflow-hidden`}
    >
      <div className="relative w-full h-40">
        {/* Community Banner */}
        <Image
          src="https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="Community Banner"
          className="w-full h-full object-cover"
          height={300}
          width={1080}
        />
      </div>
      <div className="p-6">
        {/* Community Name */}
        <h2 className="text-2xl font-bold">Design Engineering</h2>

        {/* Community Description */}
        <p className="mt-2 text-sm text-gray-100">
          A vibrant community for design enthusiasts, engineers, and creative
          thinkers to share ideas and collaborate.
        </p>

        <div className="flex items-center justify-between mt-4">
          {/* Buttons */}
          <Link href={"/community"}>
            <Button
              variant="outline"
              className="bg-white text-indigo-600 hover:bg-indigo-700"
            >
              View Community
            </Button>
          </Link>
          <Button
            variant="default"
            className="bg-indigo-800 hover:bg-indigo-900"
          >
            Join Community
          </Button>
        </div>
      </div>
    </div>
  );
}
