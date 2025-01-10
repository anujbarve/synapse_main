import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const supabase = await createClient();
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.log("Error fetching user data : ", userError.message);
        return NextResponse.redirect(`${process.env.SITE_URL}/error`);
      }

      // Create a user instance in users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", data.user.email)
        .limit(1)
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert({
          email: data.user.email,
          username: data.user.user_metadata.username,
        });
        if (insertError) {
            console.log("Error inserting user data : ", insertError.message);
            return NextResponse.redirect(`${process.env.SITE_URL}/error`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${process.env.SITE_URL}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${process.env.SITE_URL}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
}
