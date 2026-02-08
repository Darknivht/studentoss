import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Clock, Eye, Mail, Lock, AlertTriangle, CheckCircle, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Simple hash function for PIN (not crypto-grade, but adequate for parental PIN)
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'ph_' + Math.abs(hash).toString(36);
};

const ParentalControls = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnder14, setIsUnder14] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [dailyLimit, setDailyLimit] = useState(120);
  const [safeSearchEnabled, setSafeSearchEnabled] = useState(true);
  const [contentFilterEnabled, setContentFilterEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('is_under_14, parent_email, parental_pin, daily_time_limit, safe_search_enabled, content_filter_enabled')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setIsUnder14(data.is_under_14 || false);
      setParentEmail(data.parent_email || '');
      setHasPin(!!(data as any).parental_pin);
      setDailyLimit((data as any).daily_time_limit ?? 120);
      setSafeSearchEnabled((data as any).safe_search_enabled ?? true);
      setContentFilterEnabled((data as any).content_filter_enabled ?? true);
      // If no PIN is set, settings are unlocked by default
      setIsUnlocked(!(data as any).parental_pin);
    }
  };

  const handleSetPin = async () => {
    if (newPin.length !== 4) {
      toast({ title: 'PIN must be 4 digits', variant: 'destructive' });
      return;
    }
    if (pinStep === 'enter') {
      setPinStep('confirm');
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'PINs do not match', variant: 'destructive' });
      setConfirmPin('');
      setPinStep('enter');
      return;
    }

    const hashed = hashPin(newPin);
    await supabase.from('profiles').update({ parental_pin: hashed } as any).eq('user_id', user?.id);
    setHasPin(true);
    setIsUnlocked(true);
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setPinStep('enter');
    toast({ title: '🔒 PIN set successfully' });
  };

  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) return;
    const hashed = hashPin(pinInput);
    const { data } = await supabase.from('profiles').select('parental_pin').eq('user_id', user?.id).maybeSingle();
    if ((data as any)?.parental_pin === hashed) {
      setIsUnlocked(true);
      setShowPinVerify(false);
      setPinInput('');
    } else {
      toast({ title: 'Incorrect PIN', variant: 'destructive' });
      setPinInput('');
    }
  };

  const handleSave = async () => {
    if (isUnder14 && !parentEmail) {
      toast({ title: 'Parent email required', description: 'Users under 14 must provide a parent email.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        is_under_14: isUnder14,
        parent_email: parentEmail || null,
        daily_time_limit: dailyLimit,
        safe_search_enabled: safeSearchEnabled,
        content_filter_enabled: contentFilterEnabled,
      } as any).eq('user_id', user?.id);

      if (error) throw error;
      toast({ title: '✅ Settings saved', description: 'Parental controls have been updated.' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // If PIN exists and not unlocked, show verification
  if (hasPin && !isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="p-8 bg-card border-border text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">PIN Required</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your 4-digit parental PIN to access settings
          </p>
          <div className="flex justify-center mb-4">
            <InputOTP maxLength={4} value={pinInput} onChange={setPinInput}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={handleVerifyPin} disabled={pinInput.length !== 4} className="gradient-primary text-primary-foreground">
            <KeyRound className="w-4 h-4 mr-2" />
            Unlock Settings
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* PIN Setup */}
      {!hasPin && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Set a Parental PIN</p>
              <p className="text-xs text-muted-foreground mt-1">
                Protect these settings with a 4-digit PIN so only parents can change them.
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowPinSetup(true)}>
                Set PIN
              </Button>
            </div>
          </div>
        </Card>
      )}

      {hasPin && (
        <Card className="p-3 bg-green-500/10 border-green-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-foreground">PIN protection is active</span>
          </div>
        </Card>
      )}

      {/* Age Verification */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Age Verification</h3>
            <p className="text-sm text-muted-foreground">Special protections for younger users</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">I am under 14 years old</Label>
              <p className="text-xs text-muted-foreground">Enables additional safety features</p>
            </div>
            <Switch checked={isUnder14} onCheckedChange={setIsUnder14} />
          </div>
          {isUnder14 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Parent/guardian email is required for users under 14.
                </p>
              </div>
              <div>
                <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />Parent/Guardian Email</Label>
                <Input type="email" placeholder="parent@email.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="mt-2" />
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Time Limits */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Daily Time Limit</h3>
            <p className="text-sm text-muted-foreground">Set maximum daily study time</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">{formatTime(dailyLimit)}</span>
            <span className="text-sm text-muted-foreground">per day</span>
          </div>
          <Slider value={[dailyLimit]} onValueChange={(value) => setDailyLimit(value[0])} min={30} max={480} step={15} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30 min</span><span>8 hours</span>
          </div>
        </div>
      </Card>

      {/* Content Filters */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <Eye className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Content Safety</h3>
            <p className="text-sm text-muted-foreground">Filter inappropriate content</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Safe Search</Label>
              <p className="text-xs text-muted-foreground">Filter search results</p>
            </div>
            <Switch checked={safeSearchEnabled} onCheckedChange={setSafeSearchEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Content Filter</Label>
              <p className="text-xs text-muted-foreground">Block inappropriate AI responses</p>
            </div>
            <Switch checked={contentFilterEnabled} onCheckedChange={setContentFilterEnabled} />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>

      {/* PIN Setup Dialog */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{pinStep === 'enter' ? 'Set Parental PIN' : 'Confirm PIN'}</DialogTitle>
            <DialogDescription>
              {pinStep === 'enter' ? 'Choose a 4-digit PIN to protect parental settings.' : 'Enter the same PIN again to confirm.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={4}
              value={pinStep === 'enter' ? newPin : confirmPin}
              onChange={pinStep === 'enter' ? setNewPin : setConfirmPin}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={handleSetPin} className="w-full gradient-primary text-primary-foreground">
            {pinStep === 'enter' ? 'Next' : 'Set PIN'}
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ParentalControls;
