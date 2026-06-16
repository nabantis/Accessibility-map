create extension if not exists "uuid-ossp"; -- UUID extension

-- Locations
create table public.locations (
    id uuid primary key default uuid_generate_v4() -- ID values based on random numbers
    name text not null,
    description text,
    lat float not null,
    lng float not null,
    created_at timestamptz default now()
)

-- Accessibility features
create table public.accessibility_features (
    id uuid primary key default uuid_generate_v4(),
    location_id uuid references public.locations(id) on delete cascade,
    type text not null, -- 'lift' | 'ramp' | 'automatic_door' | 'tactile_paving' | 'wide_path' | 'crowded_areas'
    status text not null default 'operational',  -- 'operational' | 'under_repair' | 'inaccessible'
    description text,
    created_at timestamptz default now()
)

-- Accessibility preferences
create table public.accessibility preferences (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade unique,
    lift_access boolean default false,
    ramp_access boolean default false,
    wide_paths boolean default false,
    tactile_paving boolean default false,
    automatic_doors boolean default false,
    high_contrast boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()

)

-- User roles
create table public.user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade unique,
    role text not null default 'user'  -- 'user' | 'moderator'
)

-- User reports
create table public.reports (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete set null, -- Account deleted -> reports made have user ID set to null
    feature_id uuid references public.accessibility_features(id) on delete cascade,
    description text not null,
    status text not null default 'pending',  -- 'pending' | 'verified' | 'rejected' | 'under_repair' | 'resolved'
    moderator_note text,
    moderated_by uuid references auth.users(id),
    date_submitted timestamptz default now(),
    date_moderated timestamptz
)

-- Notifications
create table public.notification (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    report_id uuid references public.reports(id) on delete cascade,
    message text not null,
    is_read boolean default false,
    created_at timestamptz default now()
)

-- Row level security for all tables
alter table public.locations enable row level security;
alter table public.accessibility_features enable row level security;
alter table public.accessibility_preferences enable row level security;
alter table public.user_roles enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- Enable replication on tables that need real-time
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.accessibility_features;
alter publication supabase_realtime add table public.notifications;

-- Everyone can read locations & features
create policy "locations_read_all" on public.locations for select using (true);
create policy "features_read_all" on public.accessibility_features for select using (true);
 
-- Authenticated users can read all reports
create policy "reports_read_all" on public.reports for select using (auth.uid() is not null);
 
-- Users manage their own preferences
create policy "prefs_own" on public.accessibility_preferences for all using (auth.uid() = user_id);
 
-- Users manage their own notifications
create policy "notifs_own" on public.notifications for all using (auth.uid() = user_id);
 
-- Authenticated users can insert reports
create policy "reports_insert" on public.reports for insert with check (auth.uid() = user_id);
 
-- Users can read their own role
create policy "roles_read_own" on public.user_roles for select using (auth.uid() = user_id);
 
-- Moderators/admins: update reports and features (use service role or custom function for this)
create policy "reports_update_mod"   on public.reports                  for update using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator','admin'))
);
create policy "features_update_mod" on public.accessibility_features for update using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator','admin'))
);

-- Moderators can insert new locations
create policy "locations_insert_mod"
  on public.locations for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- Moderators can update existing locations
create policy "locations_update_mod"
  on public.locations for update
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- Moderators can delete locations
create policy "locations_delete_mod"
  on public.locations for delete
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- Moderators can insert new accessibility features
create policy "features_insert_mod"
  on public.accessibility_features for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- Moderators can delete accessibility features
create policy "features_delete_mod"
  on public.accessibility_features for delete
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.accessibility_preferences (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;
 
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();