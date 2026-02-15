// Paystack configuration
// The public key is safe to include in frontend code
export const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Plan pricing in Kobo (NGN smallest unit)
export const PLAN_PRICING = {
  plus: {
    monthly: 150000,  // ₦1,500
    yearly: 1500000,  // ₦15,000 (10 months price = 2 months free)
  },
  pro: {
    monthly: 250000,  // ₦2,500
    yearly: 2500000,  // ₦25,000 (10 months price = 2 months free)
  },
} as const;

export const formatNaira = (kobo: number) => {
  return `₦${(kobo / 100).toLocaleString()}`;
};
