// Paystack configuration
// The public key is safe to include in frontend code
export const PAYSTACK_PUBLIC_KEY = "pk_test_58f4b0b6d69b01ee0e2b3a78b5de225b1ebd0ed8";

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
  lifetime: {
    oneTime: 5000000, // ₦50,000 one-time
  },
} as const;

export const formatNaira = (kobo: number) => {
  return `₦${(kobo / 100).toLocaleString()}`;
};
