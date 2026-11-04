-- نبضة يومية تمنع Supabase المجاني من إيقاف المشروع بسبب قلة الاستخدام
-- ما ترجع أي بيانات، بس تعمل استعلام بسيط على قاعدة البيانات
create or replace function public.keep_alive()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.settings;
$$;
revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
