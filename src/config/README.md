# 📋 Krolist Configuration Guide

This guide helps you manually update Krolist's affiliate links and promo codes without relying on AI assistance.

---

## 🔗 Updating Affiliate Links

**File:** `src/config/stores.ts`

### How to Update:
1. Open `src/config/stores.ts`
2. Find the store you want to update in the `STORES` object (starts at line 27)
3. Locate the `affiliateUrl` field for that store
4. Replace the URL with your new affiliate link
5. Save the file

### Example:
```typescript
noon: {
  id: 'noon',
  name: 'Noon',
  
  // 💰 UPDATE THIS LINE when Noon affiliate link changes
  affiliateUrl: 'https://s.noon.com/YOUR_NEW_LINK_HERE',
  
  // ... other settings
}
```

### Store List:
- **SHEIN** (line 34) - Currently: `https://onelink.shein.com/17/535mkxhsd9a6`
- **Noon** (line 47) - Currently: `https://s.noon.com/sLVK_sCBGo4`
- **Amazon** (line 60) - Currently: `https://amzn.to/4ny9VLJ`
- **IKEA** (line 73) - Placeholder
- **Abyat** (line 86) - Placeholder
- **Namshi** (line 99) - Placeholder
- **Trendyol** (line 112) - Placeholder
- **ASOS** (line 125) - Placeholder

---

## 🎟️ Managing Krolist Promo Codes

**Access:** Admin Dashboard at `/admin` (requires admin role)

### How to Manage:

#### **Option 1: Using Admin Dashboard (Recommended)**
1. Log in to your Krolist account
2. Navigate to `/admin` in your browser
3. Use the admin panel to add, edit, or delete Krolist promo codes
4. Changes are saved to the database and appear instantly for all users

#### **Option 2: Direct Database Access**
If you need to manually edit in Supabase:
1. Go to: https://supabase.com/dashboard/project/cnmdwgdizfrvyplllmdn/editor
2. Select the `promo_codes` table
3. Filter by `is_krolist = true` to see Krolist codes
4. Edit directly in the table editor

### Krolist Promo Code Structure:
```sql
code: 'KINGDOM'           -- The promo code text
store: 'NOON'             -- Store name
description: 'use this code at checkout to get 10 rial discount and support Krolist'
store_url: 'https://s.noon.com/sLVK_sCBGo4'  -- Affiliate link
expires: '2099-12-31'     -- Expiry date
is_krolist: true          -- MUST be true for Krolist codes
reusable: true            -- Can be used multiple times
used: false               -- Not used yet
```

---

## 🛡️ Assigning Admin Role

To give yourself or another user admin access:

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cnmdwgdizfrvyplllmdn/sql/new
2. Run this SQL (replace `USER_EMAIL` with the actual email):

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'USER_EMAIL';

-- Then assign admin role using the ID from above
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_FROM_ABOVE', 'admin');
```

---

## 📊 Other Admin Settings

**File:** `src/config/admin.ts`

Contains configurable limits and settings:
- Maximum products per user
- Maximum promo codes per user
- Exchange rate API URL
- Donation page link
- Social media links

---

## 🔒 Security Notes

- **Affiliate links** are client-side only (safe to edit in code)
- **Krolist promo codes** are protected by Row-Level Security (RLS)
  - Users CANNOT create codes with `is_krolist = true`
  - Users CANNOT modify existing Krolist codes
  - Only admins can manage Krolist codes
  - All users can VIEW Krolist codes

---

## 📞 Need Help?

If you need to make more complex changes, you can always ask the AI for assistance. This guide is for quick, common updates only.
