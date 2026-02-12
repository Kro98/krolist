
-- Insert default ad slot ID settings
INSERT INTO ad_settings (setting_key, setting_value, description)
VALUES 
  ('adsense_slot_donation', '', 'AdSense slot ID for the donation/support video ad'),
  ('adsense_slot_product_banner', '', 'AdSense slot ID for affiliate product banner ads'),
  ('adsense_slot_article_inline', '', 'AdSense slot ID for article inline ads'),
  ('adsense_client_id', 'ca-pub-2793689855806571', 'AdSense publisher client ID (ca-pub-XXXXX)')
ON CONFLICT DO NOTHING;
