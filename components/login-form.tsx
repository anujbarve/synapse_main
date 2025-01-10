"use client";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthButton from "./auth-button";
import Image from "next/image";
import OAuthButton from "./oauth-button";
import * as z from "zod";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Zod schema for validation
  const loginSchema = z.object({
    email: z
      .string()
      .email("Invalid email format")
      .nonempty("Email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .nonempty("Password is required"),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate input using Zod
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || "Invalid input");
      setLoading(false);
      return;
    }

    const result = await signIn(formData);

    if (result.status === "success") {
      router.push("/");
    } else {
      setError(result.status);
    }

    setLoading(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Synapse account
                </p>
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <Input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <AuthButton type="Login" loading={loading}></AuthButton>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <OAuthButton type="Github"></OAuthButton>
                <OAuthButton type="Google"></OAuthButton>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/register" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              width={1024}
              height={1024}
              src="/synapse.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
