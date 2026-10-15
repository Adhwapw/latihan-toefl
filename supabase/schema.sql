-- Skema Supabase untuk TOEFL ITP Practice
-- Cara pakai: buat proyek di supabase.com, buka SQL Editor, jalankan file ini.

-- 1) Bank soal: satu baris per soal, payload menyimpan objek soal
--    dengan format yang sama seperti file di /data/*.json
--    (field: id, kind, part/partTitle, stem/script/tokens/marks/passage...,
--     options, answer, explanation, topic/qtype)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('listening', 'structure', 'reading')),
  part text,
  sort_order int not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists questions_section_order_idx on questions (section, sort_order);

-- 2) Upaya latihan (satu baris per sesi latihan/simulasi)
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  mode text not null,                 -- 'full' atau nama section
  total_score int,                    -- estimasi skor total (mode full)
  section_scores jsonb,               -- [{key,title,correct,total,scaled}]
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- 3) Jawaban per soal dalam satu attempt
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_ref text not null,         -- id soal, mis. 'STR-01'
  selected jsonb,                     -- index opsi atau label "A"-"D"
  is_correct boolean not null
);
create index if not exists answers_attempt_idx on answers (attempt_id);

-- 4) Row Level Security: aplikasi latihan publik tanpa login.
--    Soal boleh dibaca siapa pun; attempt/answer boleh ditulis siapa pun.
--    Ketatkan lagi (mis. pakai auth) kalau aplikasinya berkembang.
alter table questions enable row level security;
alter table attempts enable row level security;
alter table answers enable row level security;

drop policy if exists "public read questions" on questions;
create policy "public read questions" on questions
  for select using (true);

drop policy if exists "public insert attempts" on attempts;
create policy "public insert attempts" on attempts
  for insert with check (true);
drop policy if exists "public read attempts" on attempts;
create policy "public read attempts" on attempts
  for select using (true);

drop policy if exists "public insert answers" on answers;
create policy "public insert answers" on answers
  for insert with check (true);
drop policy if exists "public read answers" on answers;
create policy "public read answers" on answers
  for select using (true);
