-- Create profiles table for user information
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Product identification
  external_id text,
  title text not null,
  description text,
  image_url text,
  category text,
  
  -- Store information
  store text not null,
  product_url text not null,
  
  -- Current price info
  current_price numeric(10,2) not null,
  currency text default 'SAR',
  
  -- Metadata
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_checked_at timestamptz default now(),
  
  -- Ensure one product per user per URL
  constraint unique_user_product unique (user_id, product_url)
);

alter table public.products enable row level security;

-- RLS Policies for products
create policy "Users can view their own products"
  on products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own products"
  on products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own products"
  on products for update
  using (auth.uid() = user_id);

create policy "Users can delete their own products"
  on products for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_products_user_id on products(user_id);
create index idx_products_active on products(is_active) where is_active = true;
create index idx_products_store on products(store);

-- Create price_history table
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  
  price numeric(10,2) not null,
  original_price numeric(10,2),
  currency text not null,
  
  scraped_at timestamptz default now()
);

alter table public.price_history enable row level security;

-- RLS Policy for price_history
create policy "Users can view price history for their products"
  on price_history for select
  using (
    exists (
      select 1 from products
      where products.id = price_history.product_id
      and products.user_id = auth.uid()
    )
  );

-- Indexes for price_history
create index idx_price_history_product on price_history(product_id);
create index idx_price_history_date on price_history(scraped_at desc);

-- Function to get product stats for analytics
create or replace function get_user_product_stats(user_uuid uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
  total_count int;
  drops_count int;
  increases_count int;
  total_val numeric;
begin
  -- Get total products count
  select count(*) into total_count
  from products
  where user_id = user_uuid and is_active = true;
  
  -- Count price drops and increases
  select 
    count(*) filter (where current_price < prev_price) as drops,
    count(*) filter (where current_price > prev_price) as increases,
    sum(current_price) as total
  into drops_count, increases_count, total_val
  from (
    select 
      p.id,
      p.current_price,
      (
        select ph.price 
        from price_history ph 
        where ph.product_id = p.id 
        order by ph.scraped_at desc 
        limit 1 offset 1
      ) as prev_price
    from products p
    where p.user_id = user_uuid and p.is_active = true
  ) as price_comparison
  where prev_price is not null;
  
  result := json_build_object(
    'total_products', total_count,
    'price_drops', coalesce(drops_count, 0),
    'price_increases', coalesce(increases_count, 0),
    'total_value', coalesce(total_val, 0)
  );
  
  return result;
end;
$$;