// ينشئ حسابات المسؤولين في Supabase Auth + جدول admins.
// التشغيل (مرة واحدة، من جهازك فقط):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... INITIAL_PASSWORD='...' node scripts/create-admins.mjs
// كلمة المرور مؤقتة: الموقع يطلب تغييرها أول دخول.

import { createClient } from "@supabase/supabase-js";

const ADMINS = [
  { name: "نمر زايد", email: "nimerzayed@icloud.com" },
  { name: "سائد طه", email: "saedtaha1975@gmail.com" },
];

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const password = process.env.INITIAL_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error("محتاج SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY و INITIAL_PASSWORD");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

for (const admin of ADMINS) {
  const email = admin.email.toLowerCase();
  let userId;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: admin.name },
  });

  if (error) {
    // موجود من قبل؟ نجيبه
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    const existing = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) {
      console.error(`✗ ${email}: ${error.message}`);
      continue;
    }
    userId = existing.id;
    console.log(`• ${email} موجود من قبل`);
  } else {
    userId = created.user.id;
    console.log(`✓ أُنشئ ${email}`);
  }

  const { error: rowError } = await supabase
    .from("admins")
    .upsert({ id: userId, name: admin.name, email, must_change_password: true }, { onConflict: "id" });
  if (rowError) console.error(`✗ admins row ${email}: ${rowError.message}`);
}

console.log("تم.");
