-- KET 阅读 R_P1 题库（在 Supabase SQL Editor 中执行一次）
-- 导入数据：npm run import:ket-r-p1

create table if not exists ket_exercises (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'KET' check (level = 'KET'),
  part_key text not null,
  title_zh text not null,
  source_label text,
  pdf_ref text,
  item_count int not null default 6,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ket_items (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references ket_exercises(id) on delete cascade,
  order_index int not null check (order_index >= 1 and order_index <= 10),
  stem text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation_zh text,
  unique (exercise_id, order_index)
);

create index if not exists ket_exercises_list_idx
  on ket_exercises (part_key, is_published, sort_order);

alter table ket_exercises enable row level security;
alter table ket_items enable row level security;

drop policy if exists "Public read published exercises" on ket_exercises;
create policy "Public read published exercises"
  on ket_exercises for select
  using (is_published = true);

drop policy if exists "Public read items of published exercises" on ket_items;
create policy "Public read items of published exercises"
  on ket_items for select
  using (
    exists (
      select 1 from ket_exercises e
      where e.id = ket_items.exercise_id and e.is_published = true
    )
  );
