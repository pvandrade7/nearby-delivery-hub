
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are viewable by authenticated users"
on public.profiles for select to authenticated using (true);
create policy "users can update own profile"
on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users can insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text,
  product_image text,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,
  seller_ref text,
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id)
);
alter table public.conversations enable row level security;

create policy "participants can view conversations"
on public.conversations for select to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id or seller_id is null);

create policy "buyers can create conversations"
on public.conversations for insert to authenticated
with check (auth.uid() = buyer_id);

create policy "participants can update conversations"
on public.conversations for update to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id or seller_id is null);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index messages_conv_created_idx on public.messages(conversation_id, created_at);

create policy "participants can read messages"
on public.messages for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or c.seller_id is null)
));

create policy "participants can send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or c.seller_id is null)
  )
);

create policy "participants can update read state"
on public.messages for update to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
));

-- When a message is inserted, claim seller_id if open, and update last_message
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conv public.conversations%rowtype;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  if conv.seller_id is null and new.sender_id <> conv.buyer_id then
    update public.conversations set seller_id = new.sender_id where id = conv.id;
  end if;
  update public.conversations
    set last_message = new.content, last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end; $$;

drop trigger if exists trg_on_message_insert on public.messages;
create trigger trg_on_message_insert
after insert on public.messages
for each row execute function public.on_message_insert();

-- Realtime
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
