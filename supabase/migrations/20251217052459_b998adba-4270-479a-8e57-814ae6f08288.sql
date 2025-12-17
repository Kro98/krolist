-- Insert master ad visibility setting
INSERT INTO ad_settings (setting_key, setting_value, description)
VALUES ('ad_visibility_mode', 'all', 'Who sees ads: all, guests_only, users_only, admins_only, disabled')
ON CONFLICT (setting_key) DO NOTHING;