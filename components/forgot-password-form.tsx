"use client"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useState } from "react"
import AuthButton from "./auth-button"
import { forgotPassword } from "@/actions/auth"
import * as z from "zod"
import { toast } from "sonner"

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {

  const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    // Zod validation
    const validationResult = emailSchema.safeParse({ email });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || "Invalid input");
      setLoading(false);
      return;
    }

    const result = await forgotPassword(formData);

    if (result.status === "success") {
      setError(null);
      toast.success("Password reset link sent to your email");
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
                <h1 className="text-2xl font-bold">Forgot Password</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your email to reset your password
                </p>
              </div>
              <div className="grid gap-2">
                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <AuthButton type="Forgot Password" loading={loading}></AuthButton>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/synapse.png"
              width={1024}
              height={1024}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
