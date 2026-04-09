import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "water@admin.com",
    password: "Test@123",
    email_confirm: true,
    user_metadata: { full_name: "Admin" },
  });

  if (authError) {
    // If user already exists, try to find them
    if (authError.message.includes("already")) {
      return new Response(JSON.stringify({ message: "Admin user already exists" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
  }

  const userId = authData.user.id;

  // Insert admin role
  await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });

  // Insert profile
  await supabase.from("profiles").upsert({ user_id: userId, full_name: "Admin" });

  return new Response(JSON.stringify({ message: "Admin created successfully", userId }), {
    headers: { "Content-Type": "application/json" },
  });
});
