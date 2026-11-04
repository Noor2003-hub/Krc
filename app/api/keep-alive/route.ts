import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

// يشتغل مرة يومياً من Vercel Cron (vercel.json) عشان مشروع Supabase المجاني ما يتوقف
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.rpc("keep_alive");
  return NextResponse.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 500 : 200 });
}
