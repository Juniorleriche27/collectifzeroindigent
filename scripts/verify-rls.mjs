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

function parseBooleanEnv(name) {
  const value = process.env[name];
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }
  fail(`Invalid boolean env ${name}=${value}`);
}

function isMissingUserIdColumn(error) {
  return Boolean(error?.code === "42703" && /user_id/i.test(error?.message ?? ""));
}

async function resolveProfileRole(supabase, userId) {
  const byUserId = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!isMissingUserIdColumn(byUserId.error)) {
    if (byUserId.error) {
      fail(`Cannot read profile role by user_id: ${byUserId.error.message}`);
    }
    return String(byUserId.data?.role ?? "member").trim().toLowerCase() || "member";
  }

  const byId = await supabase
    .from("profile")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (byId.error) {
    fail(`Cannot read profile role by id: ${byId.error.message}`);
  }

  return String(byId.data?.role ?? "member").trim().toLowerCase() || "member";
}

async function readSelfProfile(supabase, userId) {
  const byUserId = await supabase
    .from("profile")
    .select("user_id, member_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!isMissingUserIdColumn(byUserId.error)) {
    if (byUserId.error) {
      fail(`Cannot read own profile row by user_id: ${byUserId.error.message}`);
    }
    return byUserId.data;
  }

  const byId = await supabase
    .from("profile")
    .select("id, member_id")
    .eq("id", userId)
    .maybeSingle();

  if (byId.error) {
    fail(`Cannot read own profile row by id: ${byId.error.message}`);
  }

  return byId.data;
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

  const role = await resolveProfileRole(supabase, userId);
  console.log(`RLS_CHECK_ROLE=${role}`);

  const explicitNetworkReadExpectation = parseBooleanEnv("RLS_EXPECT_NETWORK_READ");
  const roleAllowsNetworkRead = new Set(["member", "pf", "cn", "ca", "admin"]).has(role);
  const expectNetworkRead =
    explicitNetworkReadExpectation === null
      ? roleAllowsNetworkRead
      : explicitNetworkReadExpectation;
  console.log(`RLS_CHECK_EXPECT_NETWORK_READ=${expectNetworkRead}`);

  const { data: members, error: memberListError } = await supabase
    .from("member")
    .select("id, user_id")
    .limit(200);
  if (memberListError) {
    fail(`Cannot list member rows: ${memberListError.message}`);
  }

  const rows = members ?? [];
  const selfRows = rows.filter((row) => row.user_id === userId);
  const foreignRows = rows.filter((row) => row.user_id !== userId);
  console.log(`RLS_CHECK_SELF_ROWS=${selfRows.length}`);
  console.log(`RLS_CHECK_MEMBER_ROWS=${rows.length}`);
  console.log(`RLS_CHECK_FOREIGN_ROWS=${foreignRows.length}`);

  if (selfRows.length === 0) {
    fail("Current account cannot read any self member row.");
  }

  if (!expectNetworkRead && foreignRows.length > 0) {
    fail("Account can read foreign member rows while network read is expected to be disabled.");
  }

  const selfProfile = await readSelfProfile(supabase, userId);
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

    const canReadForeignMemberId = (foreignMemberRows ?? []).length > 0;
    if (expectNetworkRead && !canReadForeignMemberId) {
      fail("Account should read foreign member id but query returned zero rows.");
    }
    if (!expectNetworkRead && canReadForeignMemberId) {
      fail("Account should not read foreign member id but query returned rows.");
    }

    console.log("RLS_CHECK_FOREIGN_MEMBER_ID_QUERY=ok");
  }

  await supabase.auth.signOut();
  console.log("RLS_CHECK_PASS");
}

run().catch((error) => fail(error.message));
