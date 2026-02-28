import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, BookOpen, Server, Layers, DollarSign, Rocket, Settings, ChevronLeft } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/docs', label: 'Home', icon: BookOpen },
  { path: '/docs/architecture', label: 'Architecture', icon: Server },
  { path: '/docs/features', label: 'Features', icon: Layers },
  { path: '/docs/business', label: 'Business', icon: DollarSign },
  { path: '/docs/launch', label: 'Launch Playbook', icon: Rocket },
  { path: '/docs/admin', label: 'Admin Guide', icon: Settings },
];

const DocsLayout = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const saved = sessionStorage.getItem('docs_auth');
    if (saved === 'true') setAuthenticated(true);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await supabase.functions.invoke('admin-verify', {
        body: { password },
      });
      if (data?.valid) {
        setAuthenticated(true);
        sessionStorage.setItem('docs_auth', 'true');
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Documentation Portal</h1>
          <p className="text-muted-foreground text-sm">Enter admin password to access</p>
          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Admin password"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Access Docs'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-foreground">StudentOS Docs</h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('docs_auth'); setAuthenticated(false); }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Lock
          </button>
        </div>
      </header>
      <nav className="border-b border-border overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-1 px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DocsLayout;
