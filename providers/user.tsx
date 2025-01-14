"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

interface UserData {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  profile_picture?: string | null;
  reputation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UserContextType {
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
          console.log("User does not exist or not authenticated");
          setUser(null);
        } else {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          if (userError || !userData) {
            console.error("Error fetching user data:", userError);
            setUser(null);
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Error during user fetch:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);


  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the User context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
