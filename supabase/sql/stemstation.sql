-- STEMSTATION: basic score table (idempotent)
create extension if not exists pgcrypto;
create table if not exists "TapGameScore" (
  id uuid primary key default gen_random_uuid(),
  gameId text,
  userId uuid,
  trackId uuid,
  difficulty text,
  score int,
  accuracy numeric,
  maxCombo int,
  clientHash text,
  submittedAt timestamptz default now()
);
create index if not exists idx_tapgamescore_game on "TapGameScore"(gameId);
create index if not exists idx_tapgamescore_track on "TapGameScore"(trackId);
create index if not exists idx_tapgamescore_user on "TapGameScore"(userId);
