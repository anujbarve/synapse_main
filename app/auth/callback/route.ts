import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const siteURL = process.env.SITE_URL; // Using SITE_URL from environment variables

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.log("Error fetching user data : ", userError.message);
        return NextResponse.redirect(`${siteURL}/error`);
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
          return NextResponse.redirect(`${siteURL}/error`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${siteURL}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${siteURL}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${siteURL}/auth/auth-code-error`);
}
