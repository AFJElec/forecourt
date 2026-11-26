-- =====================================================================
-- 0008 STORAGE BUCKETS + DEFAULT CONFIGURABLE SETTINGS / PACKAGES
-- =====================================================================

-- Listing media: public read; uploads only into {user_id}/... folders.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-media', 'listing-media', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dealer-branding', 'dealer-branding', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "listing media public read" on storage.objects for select using (bucket_id = 'listing-media');
create policy "listing media own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing media own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Configurable defaults (edit in admin portal) ------------
insert into public.platform_settings (key, value, description, is_public) values
  ('listing.default_duration_days', '28', 'Default advertisement duration', true),
  ('listing.require_moderation', 'true', 'New ads go to pending_review before publishing', false),
  ('listing.max_photos_private', '20', 'Photo cap for private sellers (package can override)', true),
  ('search.price_assessment_min_comparables', '5', 'Comparable listings required before a price badge is shown', true),
  ('finance.representative_apr', '9.9', 'APR used for ILLUSTRATIVE monthly figures only', true),
  ('finance.default_term_months', '48', 'Illustrative term', true),
  ('finance.default_deposit_pct', '10', 'Illustrative deposit %', true),
  ('finance.regulated_features_enabled', 'false', 'Must stay false until FCA permissions/arrangements exist', false),
  ('messaging.max_messages_per_hour', '30', 'Spam control per user', false)
on conflict (key) do nothing;

-- Placeholder pricing — change in admin; stripe_price_id filled when Stripe is configured.
insert into public.ad_packages (code, audience, name, price_pence, duration_days, max_photos, allows_video, is_featured, search_boost, sort_order) values
  ('private_basic', 'private', 'Basic', 0, 14, 5, false, false, 0, 10),
  ('private_standard', 'private', 'Standard', 1499, 28, 20, false, false, 1, 20),
  ('private_premium', 'private', 'Premium', 2999, 56, 40, true, true, 3, 30),
  ('featured_upgrade', 'private', 'Featured upgrade (7 days)', 999, 7, 0, false, true, 3, 40)
on conflict (code) do nothing;

insert into public.subscription_plans (code, name, monthly_price_pence, stock_limit, featured_slots, staff_seat_limit, location_limit, enhanced_profile, sort_order) values
  ('starter', 'Starter', 19900, 25, 1, 3, 1, false, 10),
  ('growth', 'Growth', 49900, 100, 5, 10, 3, true, 20),
  ('enterprise', 'Enterprise', 129900, null, 20, null, null, true, 30)
on conflict (code) do nothing;
