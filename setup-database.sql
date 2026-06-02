-- =====================================================
-- Vendy+ — Script completo de criação do banco
-- Cole tudo isso no SQL Editor do Supabase e execute
-- =====================================================

-- TABELA: profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  role text,
  cnpj text,
  verified boolean not null default false,
  extras jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone is not null;
create unique index if not exists profiles_cnpj_unique on public.profiles (cnpj) where cnpj is not null;

-- TABELA: conversations
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
alter table public.conversations replica identity full;
alter publication supabase_realtime add table public.conversations;

-- TABELA: messages
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
alter table public.messages replica identity full;
alter publication supabase_realtime add table public.messages;

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, phone, role, extras)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'role',''),
    coalesce((new.raw_user_meta_data->'extras')::jsonb, '{}'::jsonb)
  ) on conflict (id) do update
    set display_name = excluded.display_name,
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = coalesce(excluded.role, public.profiles.role),
        extras = excluded.extras;
  return new;
end; $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atualiza last_message e associa seller ao receber mensagem
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

revoke execute on function public.on_message_insert() from public, anon, authenticated;

drop trigger if exists trg_on_message_insert on public.messages;
create trigger trg_on_message_insert
  after insert on public.messages
  for each row execute function public.on_message_insert();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- profiles
create policy "users can view own profile"
on public.profiles for select to authenticated using (auth.uid() = id);

-- Permite que clientes vejam perfis de lojistas com loja configurada.
-- Combinada com a policy acima via OR (comportamento padrão do Supabase).
create policy "store profiles are publicly viewable"
on public.profiles for select to authenticated
using (
  extras is not null
  and (extras->>'storeName') is not null
  and trim(extras->>'storeName') <> ''
);

create policy "users can update own profile"
on public.profiles for update to authenticated using (auth.uid() = id);

create policy "users can insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

-- conversations
create policy "participants can view conversations"
on public.conversations for select to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "buyers can create conversations"
on public.conversations for insert to authenticated
with check (auth.uid() = buyer_id);

create policy "participants can update conversations"
on public.conversations for update to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- messages
create policy "participants can read messages"
on public.messages for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = messages.conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
));

create policy "participants can send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create policy "participants can mark read"
on public.messages for update to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = messages.conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
))
with check (exists (
  select 1 from public.conversations c
  where c.id = messages.conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
));

revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- =====================================================
-- STORAGE: bucket de avatares
-- =====================================================

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars individual read"
on storage.objects for select
using (bucket_id = 'avatars' and (storage.foldername(name))[1] is not null);

create policy "Users upload own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own avatars"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own avatars"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
