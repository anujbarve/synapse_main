import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useUserStore } from "@/stores/user_store";
import{ useRouter }from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface CommunityBannerProps {
  id: string;
  title: string;
  description: string | null;
  banner_picture: string | null;
  isMember: boolean;
}

export function CommunityBanner({
  id,
  title,
  description,
  banner_picture,
  isMember,
}: CommunityBannerProps) {
  const gradientVariants = [
    "from-blue-500 to-indigo-600",
    "from-cyan-400 to-blue-500",
    "from-teal-500 to-cyan-600",
    "from-indigo-500 to-blue-700",
    "from-blue-400 to-cyan-500",
    "from-sky-500 to-indigo-600",
    "from-cyan-600 to-teal-500",
    "from-blue-600 to-sky-500",
    "from-navy-500 to-blue-800",
    "from-indigo-600 to-cyan-500",
  ];

  const [selectedGradient, setSelectedGradient] = React.useState(
    gradientVariants[0]
  );

  const { setCurrentCommunity, joinCommunity } = useSingleCommunityStore();
  const { user } = useUserStore();
  const { toast } = useToast();
  const router  = useRouter();

  React.useEffect(() => {
    // Randomly select a gradient on the client side
    const randomGradient =
      gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
    setSelectedGradient(randomGradient);
  }, []);

  const handleSetCurrentCommunity = () => {
    setCurrentCommunity(parseInt(id));
  };

  const handleJoinCommunity = async () => {
    if (user) {
      try {
        await joinCommunity(id, user.id);
        toast({
          title : "Success",
          description : "Room Joined Successfully"
        });
        router.push(`/community/${id}`); // Navigate to the community after successful join
      } catch (error) {
        console.error("Error joining community:", error);
      }
    }
  };

  return (
    <div
      className={`w-full bg-gradient-to-r ${selectedGradient} text-white rounded-lg shadow-lg overflow-hidden`}
    >
      <div className="relative w-full h-40">
        {banner_picture ? (
          <Image
            src={banner_picture}
            alt="Community Banner"
            className="w-full h-full object-cover"
            height={300}
            width={1080}
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500 rounded-t-lg">
            No Banner Image
          </div>
        )}
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-100">{description}</p>

        {isMember ? (
          <div className="flex items-center justify-between mt-4">
            <Link href={`/community/${id}`}>
              <Button variant="default" onClick={handleSetCurrentCommunity}>
                Switch Community
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-4">
            <Link href={`/community/${id}`}>
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
              onClick={handleJoinCommunity}
            >
              Join Community
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
