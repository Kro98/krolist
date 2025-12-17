-- Insert toggle settings for each ad trigger
INSERT INTO ad_settings (setting_key, setting_value, description)
VALUES 
  ('trigger_page_open_enabled', 'true', 'Show ads on page open'),
  ('trigger_auth_event_enabled', 'true', 'Show ads on login/logout'),
  ('trigger_favorite_add_enabled', 'true', 'Show ads when adding favorites'),
  ('trigger_refresh_enabled', 'true', 'Show ads on page refresh'),
  ('trigger_promo_copy_enabled', 'true', 'Show ads when copying promo codes'),
  ('trigger_shop_open_enabled', 'true', 'Show ads when opening shops'),
  ('trigger_click_enabled', 'true', 'Show ads on clicks'),
  ('trigger_load_screen_enabled', 'true', 'Show ads on load screens')
ON CONFLICT (setting_key) DO NOTHING;