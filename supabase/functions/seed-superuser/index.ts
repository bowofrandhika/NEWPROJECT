import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = "admin@pbs.local";
    const password = "Admin123!";
    const username = "superadmin";
    const fullName = "Super Admin";

    // Check if auth user exists
    const { data: listData, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = listData?.users?.find((u: { email: string }) => u.email === email);

    let userId: string;

    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
      if (error) throw error;
      userId = existing.id;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (error) throw error;
      userId = data.user.id;
    }

    // Upsert profile
    const { data: existingProfile } = await admin
      .from("app_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      await admin
        .from("app_users")
        .update({ username, full_name: fullName, email, role: "SUPER_USER" })
        .eq("user_id", userId);
    } else {
      await admin
        .from("app_users")
        .insert({ user_id: userId, username, full_name: fullName, email, role: "SUPER_USER" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        credentials: { username, password, email },
        userId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
