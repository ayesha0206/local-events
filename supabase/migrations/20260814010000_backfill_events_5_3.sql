-- Phase 5 / task 5.3 — backfill categories, structured price, empty venue/address
-- Apply after 20260814000000_schema_foundation_5_2.sql. See docs/supabase-setup.md.

-- ---------------------------------------------------------------------------
-- Empty venue / address → null
-- ---------------------------------------------------------------------------
update public.events
set venue_name = null
where venue_name is not null and length(trim(venue_name)) = 0;

update public.events
set address = null
where address is not null and length(trim(address)) = 0;

-- ---------------------------------------------------------------------------
-- Category → fixed set (canonical casing; aliases + unknown → Other)
-- ---------------------------------------------------------------------------
update public.events
set category = case lower(trim(coalesce(category, '')))
  when 'fashion' then 'Fashion'
  when 'crafts' then 'Crafts'
  when 'craft' then 'Crafts'
  when 'music' then 'Music'
  when 'wellness' then 'Wellness'
  when 'outdoors' then 'Outdoors'
  when 'outdoor' then 'Outdoors'
  when 'games' then 'Games'
  when 'game' then 'Games'
  when 'play' then 'Games'
  when 'food' then 'Food'
  when 'history' then 'History'
  when 'other' then 'Other'
  when 'books' then 'Other'
  when 'book' then 'Other'
  when 'sports' then 'Outdoors'
  when 'sport' then 'Outdoors'
  when 'fitness' then 'Wellness'
  when 'yoga' then 'Wellness'
  when 'art' then 'Crafts'
  when 'arts' then 'Crafts'
  when 'concert' then 'Music'
  when 'cooking' then 'Food'
  else 'Other'
end;

-- ---------------------------------------------------------------------------
-- price_label → is_free / price_amount (keep price_label for display)
-- ---------------------------------------------------------------------------
update public.events
set
  is_free = true,
  price_amount = null,
  price_label = case
    when price_label is null or length(trim(price_label)) = 0 then 'Free'
    else price_label
  end
where length(trim(coalesce(price_label, ''))) = 0
   or lower(trim(price_label)) in ('free', 'gratis', '0', '$0', '$0.00');

update public.events
set
  is_free = false,
  price_amount = (
    nullif(regexp_replace(trim(price_label), '[^0-9.]', '', 'g'), '')
  )::numeric
where lower(trim(coalesce(price_label, ''))) not in ('free', 'gratis', '0', '$0', '$0.00')
  and length(trim(coalesce(price_label, ''))) > 0
  and regexp_replace(trim(price_label), '[^0-9.]', '', 'g') ~ '^[0-9]+(\.[0-9]+)?$';

-- Paid-looking / unparseable labels: not free, amount null
update public.events
set
  is_free = false,
  price_amount = null
where lower(trim(coalesce(price_label, ''))) not in ('free', 'gratis', '0', '$0', '$0.00')
  and length(trim(coalesce(price_label, ''))) > 0
  and regexp_replace(trim(price_label), '[^0-9.]', '', 'g') !~ '^[0-9]+(\.[0-9]+)?$';

-- ---------------------------------------------------------------------------
-- Constrain category to the fixed set (safe after backfill)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_category_fixed_set'
  ) then
    alter table public.events
      add constraint events_category_fixed_set
      check (
        category in (
          'Fashion', 'Crafts', 'Music', 'Wellness', 'Outdoors',
          'Games', 'Food', 'History', 'Other'
        )
      );
  end if;
end$$;

comment on column public.events.category is
  'Fixed set: Fashion, Crafts, Music, Wellness, Outdoors, Games, Food, History, Other.';

comment on column public.events.price_label is
  'Display string; structured is_free / price_amount populated by 5.3 backfill and client writes.';
