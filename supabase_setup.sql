-- タスクテーブル
create table tasks (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  content text not null,
  requester text not null,
  assignee text not null,
  status text not null default '未対応',
  memo text default '',
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 設定テーブル
create table settings (
  key text primary key,
  value jsonb not null
);

-- RLS（行レベルセキュリティ）を有効化し、全員がアクセス可能にする
alter table tasks enable row level security;
alter table settings enable row level security;

create policy "allow all" on tasks for all using (true) with check (true);
create policy "allow all" on settings for all using (true) with check (true);
