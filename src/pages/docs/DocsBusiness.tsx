const DocsBusiness = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-foreground">Business & Revenue</h1>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Pricing Model</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-foreground">Plan</th>
              <th className="text-left p-2 text-foreground">Monthly</th>
              <th className="text-left p-2 text-foreground">Yearly</th>
              <th className="text-left p-2 text-foreground">Target</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border"><td className="p-2 font-medium text-foreground">Free</td><td className="p-2">₦0</td><td className="p-2">₦0</td><td className="p-2">Acquisition funnel, ad revenue</td></tr>
            <tr className="border-b border-border"><td className="p-2 font-medium text-foreground">Plus</td><td className="p-2">₦2,000</td><td className="p-2">₦20,000 (17% off)</td><td className="p-2">Regular students, moderate usage</td></tr>
            <tr className="border-b border-border"><td className="p-2 font-medium text-foreground">Pro</td><td className="p-2">₦5,000</td><td className="p-2">₦48,000 (20% off)</td><td className="p-2">Power users, exam season students</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Payment Flow (Paystack)</h2>
      <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
        <li>User selects a plan on <code className="text-foreground">/upgrade</code> page</li>
        <li>Paystack popup opens with amount and reference (format: <code className="text-foreground">tier_period_userId_timestamp</code>)</li>
        <li>On successful payment, the <code className="text-foreground">verify-payment</code> edge function is called with the reference</li>
        <li>Edge function verifies with Paystack API using secret key</li>
        <li>Extracts tier from reference, calculates expiry (1 month or 1 year)</li>
        <li>Updates <code className="text-foreground">subscription_tier</code> and <code className="text-foreground">subscription_expires_at</code> in profiles table</li>
        <li>Client refreshes subscription state</li>
      </ol>
      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
        <p className="font-medium text-foreground">⚠️ Important for Go-Live</p>
        <p className="text-muted-foreground mt-1">Switch Paystack from <strong>test keys</strong> to <strong>live keys</strong> in both:</p>
        <ul className="list-disc pl-5 text-muted-foreground mt-1">
          <li><code className="text-foreground">src/lib/paystackConfig.ts</code> — Public key</li>
          <li>Cloud secrets — <code className="text-foreground">PAYSTACK_SERCET_KEY</code> (update to live secret key)</li>
        </ul>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Revenue Streams</h2>
      <div className="grid gap-3 text-sm">
        <div className="p-3 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">1. Subscriptions (Primary)</h3>
          <p className="text-muted-foreground mt-1">Direct revenue from Plus and Pro plan upgrades via Paystack.</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">2. Google Ads (Secondary)</h3>
          <p className="text-muted-foreground mt-1">AdSense banners shown to free-tier users. Automatically hidden for paid users. CPM for Nigerian traffic typically $0.50–$2.00. Need Google AdSense account approval.</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">3. School Partnerships (Future)</h3>
          <p className="text-muted-foreground mt-1">Bulk licensing deals with schools. Custom branding. Admin dashboard for teachers.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Key Metrics to Track</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['DAU / MAU', 'Daily and monthly active users'],
          ['Conversion Rate', 'Free → Plus → Pro upgrades'],
          ['ARPU', 'Average revenue per user'],
          ['Churn Rate', 'Monthly subscription cancellations'],
          ['Retention D1/D7/D30', 'User return rates'],
          ['AI Calls/Day', 'AI usage vs quota limits'],
          ['Ad Revenue', 'Google AdSense earnings'],
          ['CAC', 'Cost to acquire each user'],
        ].map(([metric, desc]) => (
          <div key={metric} className="p-2 rounded bg-muted/50">
            <p className="font-medium text-foreground">{metric}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Kill Switch</h2>
      <p className="text-sm text-muted-foreground">
        File: <code className="text-foreground">src/lib/subscriptionConfig.ts</code> — Set <code className="text-foreground">SUBSCRIPTION_ENABLED = false</code> to give ALL users full access regardless of plan. Useful for beta testing or promotions.
      </p>
    </section>
  </div>
);

export default DocsBusiness;
