// Paystack configuration
// The public key is safe to include in frontend code
export const PAYSTACK_PUBLIC_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

// Plan pricing in Kobo (NGN smallest unit)
export const PLAN_PRICING = {
  plus: {
    monthly: 200000, // ₦2,000
    yearly: 2000000, // ₦20,000 (10 months price = 2 months free)
  },
  pro: {
    monthly: 500000, // ₦5,000
    yearly: 4800000, // ₦48,000 (20% off yearly)
  },
} as const;

export const formatNaira = (kobo: number) => {
  return `₦${(kobo / 100).toLocaleString()}`;
};
