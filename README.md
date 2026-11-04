# نظام الفواتير والرسوم – مركز الكويت للتأهيل (KRC)

موقع داخلي لمسؤولَين اثنين: تسجيل الفواتير يدوياً (كاش / رابط دفع / ومض / أخرى)، متابعة المشتركين الثابتين شهر بشهر، المصروفات الشهرية (إيجار، رواتب، أخرى)، لوحة تحليلات فيها المحصّل والمصروفات والصافي، وطباعة سند قبض.

**التقنيات:** Next.js 16 · Supabase (قاعدة البيانات وتسجيل الدخول) · Tailwind CSS · النشر على Vercel.

---

## خطوات التشغيل (مرة واحدة) — من Vercel مباشرة

1. **Vercel → Add New → Project** واستورد المستودع `Krc` من GitHub، واضغط **Deploy**.
2. في المشروع على Vercel: **Storage → Create Database → Supabase** → اختر المنطقة والخطة → **Connect** للمشروع. التكامل يضيف المتغيرات تلقائياً (`NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`…).
3. افتح Supabase من Vercel (**Storage → Open in Supabase**) → **SQL Editor**: شغّل `supabase/migrations/0001_init.sql` ثم `0002_expenses.sql` ثم `0003_keep_alive.sql`.
4. **Authentication → Sign In / Providers → Email**: اقفل **Allow new users to sign up**.
5. **Authentication → URL Configuration**: `Site URL` = رابط الموقع على Vercel، وأضف `رابط-الموقع/**` في Redirect URLs.
6. **Authentication → Email Templates → Reset Password**: غيّر الرابط إلى
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
   ```
7. **Authentication → Users → Add user → Create new user** لكل مسؤول (البريد + كلمة مرور مؤقتة + Auto Confirm User)، بعدها شغّل `supabase/seed_admins.sql` في SQL Editor.
8. **Vercel → Deployments → Redeploy** عشان المتغيرات تشتغل.

> بديل للخطوة 7 من الطرفية: `npm run create-admins` مع `SUPABASE_URL` و `SUPABASE_SECRET_KEY` و `INITIAL_PASSWORD`.
> **منع إيقاف Supabase المجاني:** `vercel.json` فيه Cron يومي يزور `/api/keep-alive` (يستدعي الدالة `keep_alive`) عشان المشروع ما يتوقف بسبب قلة الاستخدام. اختياري: أضف متغير `CRON_SECRET` في Vercel لحماية الرابط.
> **نسخة احتياطية:** الخطة المجانية ما فيها نسخ يومية — صدّر الفواتير Excel آخر كل شهر واحفظها.
> خطة Vercel المجانية (Hobby) للاستخدام غير التجاري فقط.

### تشغيل محلي
```bash
cp .env.example .env.local   # وعبّي القيم
npm install
npm run dev                  # http://localhost:3000
npm test                     # اختبارات قاعدة «عن شهر» والمبلغ بالحروف والتحليلات
```

---

## كيف يشتغل

| الصفحة | المسار |
|---|---|
| تسجيل الدخول | `/login` |
| لوحة التحكم والتحليلات | `/` |
| الفواتير (بحث، فلاتر، تصدير Excel) | `/invoices` |
| تسجيل فاتورة / تعديل | `/invoices/new` · `/invoices/[id]/edit` |
| تفاصيل الفاتورة + سجل التعديلات | `/invoices/[id]` |
| سند قبض للطباعة / PDF | `/receipt/[id]` |
| المشتركين الثابتين | `/subscribers` |
| المصروفات (إضافة، تعديل، حذف، ملخص 6 شهور) | `/expenses` |
| الإعدادات (الاسم، كلمة المرور، المسؤولين، يوم الفصل) | `/settings` |

**قاعدة «عن شهر»:** الفاتورة من يوم 1 لغاية يوم الفصل (افتراضي 15) ← لنفس الشهر. بعد يوم الفصل ← مقدم للشهر اللي بعده. تنحسب تلقائياً وتقدر تتغير يدوياً. يوم الفصل يتعدّل من الإعدادات.

**المصروفات:** كل مصروف له نوع (إيجار / رواتب / مصروفات أخرى) وشهر يخصه وتاريخ صرف. لوحة التحكم تعرض المحصّل، اللي اتصرف، والصافي = المحصّل − المصروفات، لكل شهر.

**التكرار:** لو المشترك عنده فاتورة عن نفس الشهر، النظام يوقف الحفظ ويطلب تأكيد «حفظ رغم التكرار».

**الحماية:** كل الجداول محمية بـ Row Level Security: بس الحسابات الموجودة في جدول `admins` تقدر تقرأ أو تكتب. سجل التعديلات ما ينمسح ولا يتعدّل، وكل مسؤول يعدّل اسمه هو بس.

**بيانات التواصل في سند القبض** (التلفون، الإنستغرام، الإيميل) في أول ملف `app/receipt/[id]/page.tsx`.
