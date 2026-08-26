-- keystride cloud sync schema
-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run

create table if not exists practice_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null,
  mode text not null,
  amount int not null,
  wpm int not null,
  raw_wpm int not null,
  accuracy int not null,
  punctuation boolean not null default false,
  numbers boolean not null default false,
  unique (user_id, date)
);

create table if not exists arcade_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null,
  score int not null,
  level int not null,
  words_destroyed int not null,
  best_combo int not null,
  unique (user_id, date)
);

create table if not exists lesson_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked_index int not null default 0,
  best_accuracy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists practice_results_user_id_idx on practice_results (user_id);
create index if not exists arcade_results_user_id_idx on arcade_results (user_id);

alter table practice_results enable row level security;
alter table arcade_results enable row level security;
alter table lesson_progress enable row level security;

-- Each user can only ever read or write their own rows.
create policy "select own practice results" on practice_results for select using (auth.uid() = user_id);
create policy "insert own practice results" on practice_results for insert with check (auth.uid() = user_id);

create policy "select own arcade results" on arcade_results for select using (auth.uid() = user_id);
create policy "insert own arcade results" on arcade_results for insert with check (auth.uid() = user_id);

create policy "select own lesson progress" on lesson_progress for select using (auth.uid() = user_id);
create policy "insert own lesson progress" on lesson_progress for insert with check (auth.uid() = user_id);
create policy "update own lesson progress" on lesson_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
