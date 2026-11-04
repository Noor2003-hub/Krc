import { PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/auth";
import { todayKuwait } from "@/lib/rules";
import { SubscriberForm } from "../SubscriberForm";

export const metadata = { title: "إضافة مشترك" };

export default async function NewSubscriberPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="إضافة مشترك ثابت" back={{ href: "/subscribers", label: "المشتركين" }} />
      <SubscriberForm defaultFee={settings.default_fee} today={todayKuwait()} />
    </>
  );
}
