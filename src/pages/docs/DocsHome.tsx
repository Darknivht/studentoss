import { Link } from 'react-router-dom';
import { Server, Layers, DollarSign, Rocket, Settings } from 'lucide-react';

const sections = [
  { path: '/docs/architecture', icon: Server, title: 'Platform Architecture', desc: 'Tech stack, database schema, edge functions, auth flow' },
  { path: '/docs/features', icon: Layers, title: 'Feature Guide', desc: 'Every feature explained with subscription tiers and AI details' },
  { path: '/docs/business', icon: DollarSign, title: 'Business & Revenue', desc: 'Pricing, Paystack flow, Google Ads, growth metrics' },
  { path: '/docs/launch', icon: Rocket, title: 'Launch Playbook', desc: 'Step-by-step launch checklist, marketing channels, growth strategy' },
  { path: '/docs/admin', icon: Settings, title: 'Admin Guide', desc: 'How to use the admin panel, manage exams, resources, users' },
];

const DocsHome = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-foreground">StudentOS Documentation</h1>
      <p className="text-muted-foreground mt-2">Internal documentation for the StudentOS platform. Everything you need to understand, manage, and grow the product.</p>
    </div>

    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
      <h2 className="font-semibold text-foreground">Readiness Score: 78/100</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <span className="text-muted-foreground">Core features: <strong className="text-foreground">90%</strong></span>
        <span className="text-muted-foreground">Payment system: <strong className="text-foreground">Fixed ✓</strong></span>
        <span className="text-muted-foreground">Exam prep: <strong className="text-foreground">Functional</strong></span>
        <span className="text-muted-foreground">Social features: <strong className="text-foreground">Working</strong></span>
        <span className="text-muted-foreground">PWA/offline: <strong className="text-foreground">Functional</strong></span>
        <span className="text-muted-foreground">Admin panel: <strong className="text-foreground">Functional</strong></span>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <Link key={s.path} to={s.path} className="p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default DocsHome;
