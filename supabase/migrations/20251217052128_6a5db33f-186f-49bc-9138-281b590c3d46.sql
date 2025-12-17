-- Insert additional ad settings for trigger thresholds
INSERT INTO ad_settings (setting_key, setting_value, description)
VALUES 
  ('favorite_count_threshold', '2', 'Number of favorites before showing ad'),
  ('refresh_count_threshold', '3', 'Number of refreshes before showing ad'),
  ('load_screen_count_threshold', '5', 'Number of load screens before showing ad')
ON CONFLICT (setting_key) DO NOTHING;