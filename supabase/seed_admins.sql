-- بعد ما تنشئ المستخدمين من Supabase → Authentication → Users → Add user
-- شغّل هذا الملف في SQL Editor عشان يصيرون مسؤولين في النظام

insert into public.admins (id, name, email, must_change_password)
select id, 'نمر زايد', lower(email), true from auth.users where lower(email) = 'nimerzayed@icloud.com'
on conflict (id) do update set name = excluded.name;

insert into public.admins (id, name, email, must_change_password)
select id, 'سائد طه', lower(email), true from auth.users where lower(email) = 'saedtaha1975@gmail.com'
on conflict (id) do update set name = excluded.name;

-- لازم يطلع صفين:
select name, email from public.admins;
