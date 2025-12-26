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
import { Shield, Clock, Eye, Mail, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const ParentalControls = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnder14, setIsUnder14] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [dailyLimit, setDailyLimit] = useState(120); // minutes
  const [safeSearchEnabled, setSafeSearchEnabled] = useState(true);
  const [contentFilterEnabled, setContentFilterEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('is_under_14, parent_email')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setIsUnder14(data.is_under_14 || false);
      setParentEmail(data.parent_email || '');
    }
  };

  const handleSave = async () => {
    if (isUnder14 && !parentEmail) {
      toast({
        title: 'Parent email required',
        description: 'Users under 14 must provide a parent email.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_under_14: isUnder14,
          parent_email: parentEmail || null,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: '✅ Settings saved',
        description: 'Parental controls have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Age Verification */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Age Verification</h3>
            <p className="text-sm text-muted-foreground">
              Special protections for younger users
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">I am under 14 years old</Label>
              <p className="text-xs text-muted-foreground">
                Enables additional safety features
              </p>
            </div>
            <Switch checked={isUnder14} onCheckedChange={setIsUnder14} />
          </div>

          {isUnder14 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-border"
            >
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Parent/guardian email is required for users under 14. They will receive activity reports.
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Parent/Guardian Email
                </Label>
                <Input
                  type="email"
                  placeholder="parent@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="mt-2"
                />
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
            <p className="text-sm text-muted-foreground">
              Set maximum daily study time
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">{formatTime(dailyLimit)}</span>
            <span className="text-sm text-muted-foreground">per day</span>
          </div>
          <Slider
            value={[dailyLimit]}
            onValueChange={(value) => setDailyLimit(value[0])}
            min={30}
            max={480}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30 min</span>
            <span>8 hours</span>
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
            <p className="text-sm text-muted-foreground">
              Filter inappropriate content
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Safe Search</Label>
              <p className="text-xs text-muted-foreground">
                Filter search results
              </p>
            </div>
            <Switch checked={safeSearchEnabled} onCheckedChange={setSafeSearchEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Content Filter</Label>
              <p className="text-xs text-muted-foreground">
                Block inappropriate AI responses
              </p>
            </div>
            <Switch checked={contentFilterEnabled} onCheckedChange={setContentFilterEnabled} />
          </div>
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full gradient-primary text-primary-foreground"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </motion.div>
  );
};

export default ParentalControls;
