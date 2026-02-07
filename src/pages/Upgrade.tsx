import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Crown, Check, Sparkles, ArrowLeft, Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'Get started with basics',
    features: [
      '5 AI calls/day',
      '3 quizzes/day',
      '10 flashcards/day',
      '2 notes/day',
      'Direct messages',
      '3 resume templates',
      'Basic study tools',
      'Ads included',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 1500,
    period: '/month',
    description: 'For serious students',
    features: [
      '20 AI calls/day',
      '10 quizzes/day',
      '30 flashcards/day',
      '8 notes/day',
      'Direct messages',
      'Group chat access',
      '7 resume templates',
      '10 job searches/day',
      'No ads',
    ],
    cta: 'Upgrade to Plus',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2500,
    period: '/month',
    description: 'Unlimited everything',
    features: [
      'Unlimited AI calls',
      'Unlimited quizzes',
      'Unlimited flashcards',
      'Unlimited notes',
      'Direct messages',
      'Group chat access',
      'All 10 resume templates',
      'Unlimited job searches',
      'Advanced AI tools (OCR, Code Debugger)',
      'No ads',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlight: false,
  },
];

const Upgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('plus');

  const handleUpgrade = async (tierId: string) => {
    if (!user || tierId === 'free') return;

    setLoading(true);
    try {
      const tier = TIERS.find(t => t.id === tierId);
      if (!tier) return;

      // @ts-ignore - Paystack inline script
      const handler = window.PaystackPop?.setup({
        key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: user.email,
        amount: tier.price * 100,
        currency: 'NGN',
        ref: `${tierId}_${user.id}_${Date.now()}`,
        metadata: {
          user_id: user.id,
          plan: tierId,
        },
        callback: function(response: any) {
          toast({
            title: 'Payment successful!',
            description: `Welcome to ${tier.name}! Enjoy your new features.`,
          });
        },
        onClose: function() {
          toast({ title: 'Payment cancelled' });
        },
      });

      if (handler) {
        handler.openIframe();
      } else {
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
    <div className="p-6 space-y-6 pb-32">
      <header className="flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm">Supercharge your learning</p>
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
        <h2 className="text-xl font-bold text-foreground mb-2">studentOS Plans</h2>
        <p className="text-muted-foreground text-sm">
          Pick the plan that fits your study goals
        </p>
      </motion.div>

      {/* Tier Cards */}
      <div className="space-y-4">
        {TIERS.map((tier, index) => {
          const isCurrent = subscription.tier === tier.id;
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-5 relative overflow-hidden transition-all ${
                  tier.highlight
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border bg-card'
                } ${isCurrent ? 'ring-2 ring-emerald-500/30 border-emerald-500/50' : ''}`}
              >
                {tier.highlight && (
                  <span className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-bl-xl font-medium">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute top-0 left-0 px-3 py-1 bg-emerald-500 text-white text-xs rounded-br-xl font-medium">
                    Current
                  </span>
                )}

                <div className="flex items-baseline gap-2 mb-1 mt-1">
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  {tier.price > 0 && (
                    <span className="text-2xl font-bold text-foreground">₦{tier.price.toLocaleString()}</span>
                  )}
                  {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className={`w-4 h-4 shrink-0 ${tier.highlight ? 'text-primary' : 'text-emerald-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={loading || isCurrent || tier.id === 'free'}
                  className={`w-full ${tier.highlight ? 'gradient-primary text-primary-foreground' : ''}`}
                  variant={tier.highlight ? 'default' : 'outline'}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : tier.id === 'free' ? (
                    'Free Forever'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {tier.cta}
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment via Paystack. Cancel anytime.
      </p>
    </div>
  );
};

export default Upgrade;
