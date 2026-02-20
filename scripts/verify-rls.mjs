import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function fail(message) {
  console.error(`RLS_CHECK_FAIL: ${message}`);
  process.exit(1);
}

async function run() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = requireEnv("RLS_TEST_EMAIL");
  const password = requireEnv("RLS_TEST_PASSWORD");

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !authData.user) {
    fail(`Sign-in failed: ${signInError?.message ?? "unknown error"}`);
  }

  const userId = authData.user.id;
  console.log(`RLS_CHECK_USER=${userId}`);

  const { data: members, error: memberListError } = await supabase
    .from("member")
    .select("id, user_id")
    .limit(200);
  if (memberListError) {
    fail(`Cannot list member rows: ${memberListError.message}`);
  }

  const rows = members ?? [];
  const foreignRows = rows.filter((row) => row.user_id !== userId);
  console.log(`RLS_CHECK_MEMBER_ROWS=${rows.length}`);
  console.log(`RLS_CHECK_FOREIGN_ROWS=${foreignRows.length}`);

  if (foreignRows.length > 0) {
    fail("Standard account can read foreign member rows.");
  }

  const { data: selfProfile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, member_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) {
    fail(`Cannot read own profile row: ${profileError.message}`);
  }

  if (!selfProfile) {
    fail("Own profile row is not readable.");
  }

  const foreignMemberId = process.env.RLS_FOREIGN_MEMBER_ID;
  if (foreignMemberId) {
    const { data: foreignMemberRows, error: foreignMemberError } = await supabase
      .from("member")
      .select("id, user_id")
      .eq("id", foreignMemberId);

    if (foreignMemberError) {
      fail(`Foreign member query failed unexpectedly: ${foreignMemberError.message}`);
    }

    if ((foreignMemberRows ?? []).length > 0) {
      fail("Standard account can fetch a known foreign member id.");
    }

    console.log("RLS_CHECK_FOREIGN_MEMBER_ID_QUERY=ok");
  }

  await supabase.auth.signOut();
  console.log("RLS_CHECK_PASS");
}

run().catch((error) => fail(error.message));
