import fs from "fs";
import path from "path";

const SUPABASE_PROJECT_REF = "qaaeshezrdxfsaxlpmzo";
const ACCESS_TOKEN = "sbp_fc1b4f270e7632daf7e84fd0344c4976069ed6f5";

const sql = `
-- 11. WECA PHASE 4: CREDITS, MONETIZATION & PAYOUTS

-- Add is_admin column to profiles if not exists
alter table public.profiles add column if not exists is_admin boolean default false;

-- 11.1 Credit Transactions Table (Immutable audit trail)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  post_id uuid references public.posts(id) on delete set null,
  battle_id uuid references public.battles(id) on delete set null,
  payout_request_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index if not exists idx_credit_transactions_created_at on public.credit_transactions(created_at desc);
create index if not exists idx_credit_transactions_post_id on public.credit_transactions(post_id);
create index if not exists idx_credit_transactions_battle_id on public.credit_transactions(battle_id);

-- 11.2 Payout Requests Table
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  payout_details jsonb not null,
  risk_score int default 0,
  flagged_suspicious boolean default false,
  suspicion_reasons text[] default array[]::text[],
  admin_notes text,
  razorpayx_payout_id text,
  requested_at timestamptz default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_payout_requests_user_id on public.payout_requests(user_id);
create index if not exists idx_payout_requests_status on public.payout_requests(status);
create index if not exists idx_payout_requests_requested_at on public.payout_requests(requested_at desc);

-- 11.3 RLS Policies for Credit Transactions & Payout Requests
alter table public.credit_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- Users can view their own credit transactions
drop policy if exists "Users can view own credit transactions" on public.credit_transactions;
create policy "Users can view own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id or (select coalesce(is_admin, false) from public.profiles where id = auth.uid()));

-- Authenticated users or service role can insert credit transactions
drop policy if exists "Authenticated users can insert credit transactions" on public.credit_transactions;
create policy "Authenticated users can insert credit transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- Users can view their own payout requests; admins can view all
drop policy if exists "Users view own payout requests" on public.payout_requests;
create policy "Users view own payout requests"
  on public.payout_requests for select
  using (auth.uid() = user_id or (select coalesce(is_admin, false) from public.profiles where id = auth.uid()));

-- Users can insert their own payout requests
drop policy if exists "Users insert own payout requests" on public.payout_requests;
create policy "Users insert own payout requests"
  on public.payout_requests for insert
  with check (auth.uid() = user_id);

-- Admins can update payout requests
drop policy if exists "Admins update payout requests" on public.payout_requests;
create policy "Admins update payout requests"
  on public.payout_requests for update
  using ((select coalesce(is_admin, false) from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

-- 11.4 Atomic Credit Modification Function
create or replace function public.apply_credit_change(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_post_id uuid default null,
  p_battle_id uuid default null,
  p_payout_request_id uuid default null
)
returns table(new_balance int, transaction_id uuid) as $$
declare
  t_id uuid;
  updated_balance int;
begin
  insert into public.credit_transactions (
    user_id,
    amount,
    reason,
    post_id,
    battle_id,
    payout_request_id
  )
  values (
    p_user_id,
    p_amount,
    p_reason,
    p_post_id,
    p_battle_id,
    p_payout_request_id
  )
  returning id into t_id;

  update public.profiles
  set credits_balance = coalesce(credits_balance, 0) + p_amount
  where id = p_user_id
  returning credits_balance into updated_balance;

  return query select updated_balance, t_id;
end;
$$ language plpgsql security definer;

-- 11.5 Auto-End Battle Trigger Update with Winner Bonus
create or replace function public.check_battle_auto_end()
returns trigger as $$
declare
  b_record record;
  votes_count int;
  votes_a int;
  votes_b int;
  winner uuid;
  winner_user_id uuid;
  bonus_already_awarded boolean;
begin
  select * into b_record from public.battles where id = new.battle_id;
  if not found or b_record.status = 'ended' then
    return new;
  end if;

  select count(*) into votes_count from public.battle_votes where battle_id = new.battle_id;
  
  if votes_count >= coalesce(b_record.vote_threshold, 50) then
    select count(*) into votes_a from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_a_id;
    select count(*) into votes_b from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_b_id;

    if votes_a > votes_b then
      winner := b_record.post_a_id;
    elsif votes_b > votes_a then
      winner := b_record.post_b_id;
    else
      winner := null;
    end if;

    update public.battles
    set status = 'ended',
        winner_post_id = winner,
        ended_at = now()
    where id = new.battle_id;

    if winner is not null then
      select user_id into winner_user_id from public.posts where id = winner;
      if winner_user_id is not null then
        select exists (
          select 1 from public.credit_transactions
          where battle_id = new.battle_id and reason like '%Battle Victory Bonus%'
        ) into bonus_already_awarded;

        if not bonus_already_awarded then
          perform public.apply_credit_change(
            winner_user_id,
            50,
            'Versus Battle Victory Bonus: Post crowned winner',
            winner,
            new.battle_id,
            null
          );
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
`;

async function main() {
  console.log("Applying Phase 4 SQL migration to Supabase project:", SUPABASE_PROJECT_REF);
  const res = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  console.log("Response status:", res.status);
  console.log("Response body:", body);
  if (!res.ok) {
    process.exit(1);
  }
}

main().catch(console.error);
