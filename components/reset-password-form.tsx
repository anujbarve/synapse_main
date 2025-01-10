"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import * as z from "zod";

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  // Zod Schema
  const passwordSchema = z
    .object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one digit"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Zod validation
    const validationResult = passwordSchema.safeParse({ password, confirmPassword });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || "Invalid input");
      setLoading(false);
      return;
    }

    const result = await resetPassword(formData, searchParams.get("code") as string);

    if (result.status === "success") {
      router.push("/login");
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
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your new password below
                </p>
              </div>
              <div className="grid gap-2">
                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
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
    </div>
  );
}
