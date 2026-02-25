# Настройка базы данных 2FA

## Шаг 1: Создание таблицы user_2fa

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/ovwhuvapliwlkuunpqbc)
2. Перейдите в **SQL Editor** (слева в меню)
3. Нажмите **New Query**
4. Скопируйте и вставьте следующий SQL:

```sql
create table if not exists public.user_2fa (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  secret text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_2fa_email_idx on public.user_2fa (email);

alter table public.user_2fa enable row level security;
```

5. Нажмите **Run** или `Ctrl+Enter`
6. Должно появиться сообщение "Success. No rows returned"

## Шаг 2: Получение Service Role Key

1. В Supabase Dashboard перейдите в **Settings** → **API**
2. Найдите секцию **Project API keys**
3. Скопируйте ключ **service_role** (secret) - это длинный ключ начинающийся с `eyJ...`

⚠️ **ВНИМАНИЕ**: Этот ключ дает полный доступ к базе данных, не делитесь им!

## Шаг 3: Установка Service Role Key в Supabase Secrets

После копирования ключа из шага 2, выполните в терминале:

```powershell
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=ваш_скопированный_ключ
```

Замените `ваш_скопированный_ключ` на ключ из шага 2.

---

После выполнения этих шагов 2FA будет полностью готова к работе! 🎉
