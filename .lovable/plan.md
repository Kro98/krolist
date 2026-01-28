
# Auto-Fill Amazon Product Details in Admin Add Product Dialog

## Overview
Add auto-fill functionality to the Krolist Products Manager admin dialog. When an admin pastes an Amazon product URL in the Product URL field, the system will automatically fetch and populate the product details using the Amazon PA-API's `GetItems` endpoint.

## How It Will Work

1. **User Action**: Admin pastes an Amazon URL in the Product URL field
2. **Detection**: System detects it's an Amazon URL and shows an "Auto-Fill" button
3. **API Call**: Clicking the button extracts the ASIN and calls the PA-API
4. **Auto-Fill**: Form populates with:
   - **Title**: First 200 characters (with "..." if truncated)
   - **Image URL**: Primary product image
   - **Current Price**: Discounted/sale price (or original if no discount)
   - **Original Price**: Full price before discount (if no discount, same as current)
   - **Store**: Automatically set to "Amazon"

## Technical Implementation

### 1. Edge Function Enhancement (`supabase/functions/scrape-products/index.ts`)

Add a new `GetItems` API endpoint for direct ASIN lookup:

| Change | Description |
|--------|-------------|
| Add `extractASIN()` | Helper function to extract ASIN from various Amazon URL formats |
| Add `getAmazonItemByASIN()` | New function using PA-API `GetItems` endpoint for direct product lookup |
| Update `signAmazonRequest()` | Make the API target dynamic (GetItems vs SearchItems) |
| Update request handler | Route Amazon URLs to `getAmazonItemByASIN()`, keywords to `searchAmazonAPI()` |

The `GetItems` API returns exact product data:
- Title
- Primary image (Large)
- Current price (with discounts applied)
- Original price (SavingsBasis - before discounts)
- Prime eligibility

### 2. Admin Dialog Enhancement (`src/pages/admin/KrolistProductsManager.tsx`)

Add auto-fill UI and logic to the product dialog:

| Change | Description |
|--------|-------------|
| Add state variables | `isAutoFilling` (loading state), `autoFillError` (error message) |
| Add `isAmazonUrl()` helper | Detect Amazon URLs (amazon.sa, amazon.ae, amazon.com, etc.) |
| Add `handleAutoFill()` function | Call edge function and populate form fields |
| Update Product URL input | Add "Auto-Fill" button that appears for Amazon URLs |
| Modify form population | Apply 200-char title truncation with "..." and price logic |

### Title Truncation Logic
```text
if (title.length > 200) {
  title = title.substring(0, 199) + "..."
}
```

### Price Mapping Logic
```text
If API returns both price and originalPrice:
  → current_price = price (discounted)
  → original_price = originalPrice (before discount)

If API returns only price (no discount):
  → current_price = "" (empty)
  → original_price = price
```

## UI Changes

The Product URL field in the dialog will be enhanced:

```text
┌─────────────────────────────────────────────────────────┐
│ Product URL                                              │
│ ┌─────────────────────────────────────────────┐ ┌──────┐│
│ │ https://amazon.sa/dp/B0G7FVMQCN...          │ │Auto- ││
│ │                                             │ │Fill  ││
│ └─────────────────────────────────────────────┘ └──────┘│
└─────────────────────────────────────────────────────────┘
```

- The "Auto-Fill" button only appears when a valid Amazon URL is detected
- Button shows loading spinner during fetch
- Success toast confirms data was loaded
- Error toast explains if API fails

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/scrape-products/index.ts` | Add `extractASIN()`, `getAmazonItemByASIN()`, update signing function, add URL routing |
| `src/pages/admin/KrolistProductsManager.tsx` | Add auto-fill button, state, handler function, form population logic |

## Benefits

- **Faster Product Entry**: One click instead of manual copy-paste
- **Accuracy**: Direct ASIN lookup ensures correct product data
- **Affiliate Links**: Automatically includes your affiliate tag (krolist07-21)
- **Consistent Data**: Title truncation and price logic applied uniformly

## Limitations

- Only works for Amazon product URLs
- Subject to PA-API rate limits (existing credentials)
- Requires admin to be authenticated
