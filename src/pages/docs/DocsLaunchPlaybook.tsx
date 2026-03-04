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

    {/* Free Tier Strategy */}
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">🎯 Free Tier Strategy</h2>
      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-sm space-y-3">
        <p className="font-semibold text-foreground">Keep the free tier generous — it's your growth engine.</p>
        <ul className="list-disc pl-5 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Core principle:</strong> Give enough value for free that students tell their friends. Gate advanced features (unlimited AI, full exam prep, no ads) behind paid tiers.</li>
          <li><strong className="text-foreground">Free users = ambassadors.</strong> A student who gets value from the free tier will naturally recommend it in WhatsApp groups, class chats, and hostels.</li>
          <li><strong className="text-foreground">Conversion hooks:</strong> After a free user hits their daily AI limit (5 calls), show a gentle prompt: "Upgrade to Plus for 6× more AI power." Don't block — suggest.</li>
          <li><strong className="text-foreground">Freemium metrics to watch:</strong> Free → Plus conversion rate (target: 3-5%), time to first paid action, feature that triggers most upgrades.</li>
        </ul>
      </div>
    </section>

    {/* University/Polytechnic Marketing */}
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">🏫 University & Polytechnic Marketing</h2>
      <p className="text-sm text-muted-foreground mb-3">Since you're a 3rd-year student, you have a massive advantage — you ARE the target user and you're already inside the market.</p>
      <div className="grid gap-3 text-sm">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">1. Start With YOUR Department</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Demo the app in your class before a test/exam — show AI tutor, flashcards, exam prep</li>
            <li>Ask a friendly lecturer if you can do a 5-min demo during class</li>
            <li>Create a class WhatsApp group specifically for sharing study resources via the app</li>
            <li>Get 10-20 classmates using it first — their word-of-mouth is more valuable than any ad</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">2. Study Group Challenge</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Create a challenge: "First study group to hit 1,000 XP gets free Pro for a semester"</li>
            <li>Promotes natural group usage and makes the app viral within friend circles</li>
            <li>Post leaderboard screenshots on your social media weekly</li>
            <li>Low cost to you (one semester of Pro) but creates buzz and engagement</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">3. SUG & Student Body Partnerships</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Meet your Student Union Government (SUG) — propose StudentOS as the "official study app"</li>
            <li>Offer the SUG a dashboard or special page with their branding</li>
            <li>Get them to share the app link during orientations and announcement broadcasts</li>
            <li>Approach academic reps in each department for grassroots distribution</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">4. Exam Season Blitz (2-3 Weeks Before Exams)</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>This is your HIGHEST conversion window — students are desperate for study tools</li>
            <li>Push exam prep features hard: "Practice 500+ JAMB questions before Saturday"</li>
            <li>Print simple posters with QR codes → place in libraries, hostels, lecture halls, cafeterias</li>
            <li>Run a "Cram Week Special" — 50% off Pro for 1 month during exam period</li>
            <li>Post daily on WhatsApp status: study tips + app screenshots</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">5. Cross-Campus Expansion</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Once your school hits 200+ users, recruit 1 ambassador in 3-5 nearby schools</li>
            <li>Give ambassadors free Pro + ₦500 per 10 referrals who sign up</li>
            <li>Target polytechnics and colleges of education too — they have the same exam prep needs</li>
            <li>Create a "Campus Leaderboard" — schools compete for most active students</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Referral Program */}
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">🔗 Referral Program</h2>
      <div className="p-4 rounded-lg border border-border bg-card text-sm space-y-3">
        <p className="text-muted-foreground">You already have invite codes in the database (study groups). Expand this to user-level referrals:</p>
        <ul className="list-disc pl-5 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Structure:</strong> Each user gets a unique referral link/code. For every 3 friends who sign up and are active for 7 days, the referrer gets 1 week of Pro free.</li>
          <li><strong className="text-foreground">Display prominently:</strong> Add a "Share with Friends" button on the profile page and after quiz/exam sessions ("You scored 85%! Challenge a friend 🔥")</li>
          <li><strong className="text-foreground">Track:</strong> Referral source, conversion to paid, and referrer reward claimed. This data helps you understand your best growth channels.</li>
          <li><strong className="text-foreground">Cap:</strong> Max 4 weeks of free Pro per month via referrals (prevents abuse but still motivates)</li>
        </ul>
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
            <li><strong className="text-foreground">WhatsApp Channel:</strong> Create a public channel — post daily study tips, exam reminders, and feature updates. Students subscribe and share with friends.</li>
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
            <li><strong className="text-foreground">Content ideas:</strong> "POV: You found an app that solves maths for you 🤯", "How I'm preparing for JAMB in 2025", "This AI tutor is better than my lecturer 😂"</li>
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
          <h3 className="font-semibold text-foreground">📺 YouTube Shorts</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>"How to pass JAMB with AI" — show the exam prep feature</li>
            <li>"This app turns your notes into flashcards automatically" — demo the feature</li>
            <li>"Study smarter, not harder" — show pomodoro + focus mode</li>
            <li>Aim for 30-60 second clips that show real app usage</li>
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

    {/* Pricing Psychology */}
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">💰 Pricing Psychology</h2>
      <div className="grid gap-3 text-sm">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">Anchor on Yearly Pricing</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Show yearly price first, monthly second — yearly feels like a deal</li>
            <li>Add a "Save 17%" badge on yearly plans</li>
            <li>Example framing: "₦48,000/year (₦4,000/mo)" vs "₦5,000/month" — yearly looks cheaper</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">Launch Promotions</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li><strong className="text-foreground">First month 50% off:</strong> Plus at ₦1,000, Pro at ₦2,500 — removes friction for first purchase</li>
            <li><strong className="text-foreground">"Exam Season Special":</strong> 30% off Pro during WAEC/JAMB months — creates urgency</li>
            <li><strong className="text-foreground">Group discount:</strong> 5+ students from same school get 20% off — encourages group adoption</li>
            <li>Always show what they're missing: "You've hit your 5 AI calls limit. Plus gives you 30!"</li>
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

    {/* Metrics to Track */}
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">📊 Metrics to Track Weekly</h2>
      <div className="space-y-2 text-sm">
        {[
          { metric: 'New signups this week', why: 'Core growth metric — are you attracting new users?' },
          { metric: 'DAU / WAU ratio', why: 'Engagement quality — above 30% is strong for education apps' },
          { metric: 'Free → Paid conversion rate', why: 'Revenue health — target 3-5% for freemium' },
          { metric: 'Referral rate', why: 'Virality — how many users bring at least 1 friend?' },
          { metric: 'Feature adoption', why: 'Which features drive the most engagement? Double down on those in marketing' },
          { metric: 'Churn rate (monthly)', why: 'How many paid users cancel? Below 10% monthly is good' },
          { metric: 'Average session duration', why: 'Are students actually studying or just opening the app?' },
          { metric: 'AI calls per user per day', why: 'Proxy for engagement — higher = more value perceived' },
        ].map(item => (
          <div key={item.metric} className="p-3 rounded-lg border border-border bg-card flex gap-3">
            <input type="checkbox" className="mt-0.5 shrink-0 accent-primary" />
            <div>
              <p className="font-medium text-foreground">{item.metric}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{item.why}</p>
            </div>
          </div>
        ))}
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
