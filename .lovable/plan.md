
# Pre-Launch Checklist: What Needs to Be Done

This is a practical checklist of blockers and improvements needed before you can accept real payments and launch.

---

## CRITICAL BLOCKERS (Must fix before launch)

### 1. Replace Paystack Placeholder Key
**File**: `src/lib/paystackConfig.ts`
The public key is literally `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. No payments will work until you replace it with your real Paystack test key (for testing) and then your live key (for launch).

**Action needed from you**: Create a Paystack account at paystack.com, get your public key, and share it so we can update the config.

### 2. Fix verify-payment: Hardcoded "pro" Tier
**File**: `supabase/functions/verify-payment/index.ts` (line 72)
Currently, every successful payment sets `subscription_tier: "pro"` regardless of what the user actually paid for. A user paying for Plus (N1,500) gets Pro access.

**Fix**: Extract the tier from the payment reference string (which already contains `plus_monthly_...` or `pro_yearly_...`) and set the correct tier.

### 3. Fix Paystack Script Version Mismatch
**File**: `index.html` (line 68)
The script loads `v1/inline.js` but the code in `Upgrade.tsx` calls `window.PaystackPop.setup()` which is the v2 API. This will cause a runtime error.

**Fix**: Change to `https://js.paystack.co/v2/inline.js`

### 4. Add Terms of Service and Privacy Policy
Both Paystack and app stores (Google Play) require these. Currently there are none.

**Fix**: Create `/terms` and `/privacy` pages with basic legal content, and link to them from the Upgrade page footer.

---

## IMPORTANT (Should fix before launch)

### 5. Handle Expired Subscriptions Server-Side
Currently, expiry is only checked on the client side. If a user's subscription expires, they keep their tier in the database until they next open the app. This means the verify-payment function could see them as "pro" when they're actually expired.

**Fix**: Add a check in `verify-payment` or create a scheduled function that resets expired subscriptions to "free".

### 6. Add OG/Social Share Images
`index.html` has empty `og:image` and `twitter:image` meta tags. When someone shares the app link, it'll show no preview image.

**Fix**: Add a proper social share image URL (e.g., your app logo or a branded card).

### 7. Add Email Verification Reminder
Users can sign up but there's no visual nudge to verify their email. This could cause support issues.

---

## NICE TO HAVE (Can launch without)

### 8. Payment Receipt / History
No way for users to see past payments or download receipts. Not a blocker but expected by users.

### 9. Cancellation Flow
There's no way for users to cancel their subscription from within the app. The "Cancel anytime" text in the footer is misleading without this.

### 10. Error Tracking
No error tracking service (like Sentry) is configured. You'll want visibility into production errors.

---

## Summary of Code Changes Needed

| Priority | Issue | File(s) | Effort |
|---|---|---|---|
| CRITICAL | Replace Paystack placeholder key | `paystackConfig.ts` | You provide key, 1-line change |
| CRITICAL | Fix hardcoded "pro" in verify-payment | `verify-payment/index.ts` | Small fix |
| CRITICAL | Fix Paystack script version (v1 to v2) | `index.html` | 1-line change |
| CRITICAL | Add Terms and Privacy pages | New files + routes | Medium |
| IMPORTANT | Server-side subscription expiry | `verify-payment/index.ts` | Small |
| IMPORTANT | Add OG share images | `index.html` | 1-line change |
| NICE | Payment history page | New page | Medium |
| NICE | Cancellation flow | New component | Medium |

### What You Need to Provide
1. **Paystack public key** (from your Paystack dashboard > Settings > API Keys)
2. **Paystack secret key** (verify the one already stored is real, not a placeholder)
3. **Terms of Service text** (or let me generate a template)
4. **Privacy Policy text** (or let me generate a template)
5. **Social share image** (a 1200x630px branded image, or I can use the existing logo)

### Recommended Launch Order
1. Fix the 3 critical code bugs (Paystack v2 script, tier extraction, placeholder key)
2. Add Terms/Privacy pages
3. Test a real payment end-to-end with Paystack test mode
4. Switch to Paystack live key
5. Publish
