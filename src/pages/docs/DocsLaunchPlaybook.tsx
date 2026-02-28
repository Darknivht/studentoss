const DocsLaunchPlaybook = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-foreground">Launch & Marketing Playbook</h1>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Pre-Launch Checklist</h2>
      <div className="space-y-2 text-sm">
        {[
          { task: 'Switch Paystack to live keys', detail: 'Update public key in paystackConfig.ts and secret key in Cloud secrets' },
          { task: 'Set up Google AdSense account', detail: 'Apply at adsense.google.com, get approved, create ad units, update data-ad-client in GoogleAdBanner.tsx' },
          { task: 'Connect custom domain', detail: 'Go to Project Settings → Domains. Point your DNS to Lovable' },
          { task: 'Test all payment flows end-to-end', detail: 'Test Free→Plus, Free→Pro, monthly and yearly for both tiers' },
          { task: 'Seed exam questions', detail: 'Upload past papers via Admin → Exams → PDF Import for WAEC, JAMB, NECO' },
          { task: 'Add store resources', detail: 'Upload textbooks, past papers, video links via Admin → Resources' },
          { task: 'Set up app store listing', detail: 'Register on Google Play Store, build APK from Capacitor project, submit' },
          { task: 'Create social media accounts', detail: 'Instagram, TikTok, Twitter/X, WhatsApp Business' },
          { task: 'Prepare launch announcement', detail: 'Draft posts, create graphics, plan launch day content' },
        ].map((item) => (
          <div key={item.task} className="p-3 rounded-lg border border-border bg-card flex gap-3">
            <input type="checkbox" className="mt-0.5 shrink-0 accent-primary" />
            <div>
              <p className="font-medium text-foreground">{item.task}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Marketing Channels</h2>
      <div className="grid gap-3 text-sm">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">📱 WhatsApp (Highest ROI)</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Join school class group chats and share app link naturally</li>
            <li>Create a StudentOS broadcast list for updates</li>
            <li>Share study tips with app screenshots</li>
            <li>Ask class reps to share with their groups</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">🎵 TikTok / Instagram Reels</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Create "Study with me" content showing the app</li>
            <li>Show AI tutor answering hard questions</li>
            <li>Exam prep tips using the CBT feature</li>
            <li>Before/after grades transformation stories</li>
            <li>Post 2-3 times per week minimum</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">🐦 Twitter/X</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Engage with Nigerian EdTech community</li>
            <li>Share product updates and feature launches</li>
            <li>Create threads on study techniques</li>
            <li>Run polls about study habits</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">🏫 School Partnerships</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Contact school principals and ICT coordinators</li>
            <li>Offer free Pro access for pilot schools</li>
            <li>Present at PTA meetings</li>
            <li>Bulk licensing deals (50+ students)</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">👥 Student Ambassadors</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Recruit 2-3 ambassadors per school</li>
            <li>Give them free Pro access</li>
            <li>Commission per referral or bonus for milestones</li>
            <li>Provide them with content/graphics to share</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Growth Strategy — First 90 Days</h2>
      <div className="space-y-4 text-sm">
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground">Week 1-2: Soft Launch</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Share with friends and family (50-100 users)</li>
            <li>Collect feedback, fix bugs</li>
            <li>Target: 100 sign-ups</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground">Week 3-4: School Push</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Deploy ambassadors in 5-10 schools</li>
            <li>Start social media content</li>
            <li>Target: 500 sign-ups, 5 paid conversions</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground">Month 2: Scale</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Ramp up content (daily posting)</li>
            <li>Launch referral program</li>
            <li>Contact 20+ schools for partnerships</li>
            <li>Target: 2,000 sign-ups, 50 paid users</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground">Month 3: Exam Season Push</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Time launch with WAEC/JAMB prep season</li>
            <li>Heavy promotion of exam prep features</li>
            <li>Limited-time discounts</li>
            <li>Target: 5,000 sign-ups, 200 paid users</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Revenue Projections (Conservative)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-foreground">Metric</th>
              <th className="text-right p-2 text-foreground">Month 1</th>
              <th className="text-right p-2 text-foreground">Month 3</th>
              <th className="text-right p-2 text-foreground">Month 6</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border"><td className="p-2">Total Users</td><td className="p-2 text-right">500</td><td className="p-2 text-right">5,000</td><td className="p-2 text-right">20,000</td></tr>
            <tr className="border-b border-border"><td className="p-2">Paid Users (5%)</td><td className="p-2 text-right">25</td><td className="p-2 text-right">250</td><td className="p-2 text-right">1,000</td></tr>
            <tr className="border-b border-border"><td className="p-2">Subscription Revenue</td><td className="p-2 text-right">₦75,000</td><td className="p-2 text-right">₦750,000</td><td className="p-2 text-right">₦3,000,000</td></tr>
            <tr className="border-b border-border"><td className="p-2">Ad Revenue (est.)</td><td className="p-2 text-right">₦5,000</td><td className="p-2 text-right">₦50,000</td><td className="p-2 text-right">₦200,000</td></tr>
            <tr className="border-b border-border font-semibold"><td className="p-2 text-foreground">Total Revenue</td><td className="p-2 text-right text-foreground">₦80,000</td><td className="p-2 text-right text-foreground">₦800,000</td><td className="p-2 text-right text-foreground">₦3,200,000</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">* Assumes 5% conversion rate and average ₦3,000/user/month revenue. Ad revenue assumes $1 CPM for Nigerian traffic.</p>
    </section>
  </div>
);

export default DocsLaunchPlaybook;
