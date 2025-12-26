import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Crown, Check, Sparkles, Brain, Zap, Shield, 
  MessageSquare, Users, ArrowLeft, Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FREE_FEATURES = [
  '5 AI calls per day',
  '3 quizzes per day',
  '10 flashcards per day',
  '2 notes per day',
  'Basic study tools',
  'Leaderboard access',
];

const PRO_FEATURES = [
  'Unlimited AI calls',
  'Unlimited quizzes',
  'Unlimited flashcards',
  'Unlimited notes',
  'Advanced study tools',
  'Group chat & DMs',
  'Priority support',
  'No ads',
  'Early access to features',
];

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 2500, period: '/month', popular: false },
  { id: 'yearly', name: 'Yearly', price: 20000, period: '/year', popular: true, savings: 'Save 33%' },
];

const Upgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    try {
      // Initialize Paystack
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (!plan) return;

      // @ts-ignore - Paystack inline script
      const handler = window.PaystackPop?.setup({
        key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with actual key
        email: user.email,
        amount: plan.price * 100, // Convert to kobo
        currency: 'NGN',
        ref: `pro_${user.id}_${Date.now()}`,
        metadata: {
          user_id: user.id,
          plan: selectedPlan,
        },
        callback: function(response: any) {
          // Handle success
          toast({
            title: 'Payment successful!',
            description: 'Welcome to Pro! Enjoy unlimited access.',
          });
          // TODO: Verify payment on backend and update subscription
        },
        onClose: function() {
          toast({ title: 'Payment cancelled' });
        },
      });

      if (handler) {
        handler.openIframe();
      } else {
        // Fallback if Paystack not loaded
        toast({
          title: 'Payment system loading...',
          description: 'Please try again in a moment.',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({ title: 'Payment failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Upgrade to Pro</h1>
          <p className="text-muted-foreground text-sm">Unlock unlimited study power</p>
        </div>
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">StudyBuddy Pro</h2>
        <p className="text-muted-foreground text-sm">
          Remove all limits and supercharge your learning
        </p>
      </motion.div>

      {/* Plan Selection */}
      <div className="grid grid-cols-2 gap-3">
        {PLANS.map((plan) => (
          <motion.button
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-4 rounded-2xl border text-left transition-all ${
              selectedPlan === plan.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                Best Value
              </span>
            )}
            <p className="font-semibold text-foreground">{plan.name}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-foreground">₦{plan.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            {plan.savings && (
              <span className="text-xs text-primary mt-1">{plan.savings}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="grid gap-4">
        {/* Pro Features */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Pro Features
          </h3>
          <ul className="space-y-2">
            {PRO_FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        {/* Free Features */}
        <Card className="p-4 bg-muted/30 border-border">
          <h3 className="font-semibold text-muted-foreground mb-3">Free Tier Limits</h3>
          <ul className="space-y-2">
            {FREE_FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border"
      >
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-6 text-lg gradient-primary text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Processing...' : `Upgrade Now - ₦${PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Secure payment via Paystack. Cancel anytime.
        </p>
      </motion.div>
    </div>
  );
};

export default Upgrade;
