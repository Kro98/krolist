-- Add collection support and YouTube links to krolist_products
ALTER TABLE krolist_products 
ADD COLUMN collection_title TEXT DEFAULT 'Featured Products',
ADD COLUMN youtube_url TEXT;

-- Create index for collection queries
CREATE INDEX idx_krolist_products_collection ON krolist_products(collection_title);

-- Add comment
COMMENT ON COLUMN krolist_products.collection_title IS 'Title of the featured collection this product belongs to';
COMMENT ON COLUMN krolist_products.youtube_url IS 'Optional YouTube review link for the product';