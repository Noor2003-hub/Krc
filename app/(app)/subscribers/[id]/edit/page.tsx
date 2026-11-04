import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getSettings, requireAdmin } from "@/lib/auth";
import { todayKuwait } from "@/lib/rules";
import type { Customer } from "@/lib/types";
import { SubscriberForm } from "../../SubscriberForm";

export const metadata = { title: "تعديل مشترك" };

export default async function EditSubscriberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const settings = await getSettings();
  const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={`تعديل: ${data.name}`} back={{ href: "/subscribers", label: "المشتركين" }} />
      <SubscriberForm initial={data as Customer} defaultFee={settings.default_fee} today={todayKuwait()} />
    </>
  );
}
