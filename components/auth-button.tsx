import React from "react";
import { Button } from "./ui/button";

const AuthButton = ({
  type,
  loading,
}: {
  type: "Login" | "Sign up" | "Reset Password" | "Forgot Password";
  loading: boolean;
}) => {
  return (
    <>
      <Button 
      type="submit" 
      className={`${
        loading ? "bg-gray-600" : " bg-blue-600"
      } w-full`}
      >
        {loading ? "Loading..." : type}
      </Button>
    </>
  );
};

export default AuthButton;
