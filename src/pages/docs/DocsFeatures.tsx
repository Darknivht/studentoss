const DocsFeatures = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-foreground">Feature Guide</h1>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Subscription Tiers</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-foreground">Feature</th>
              <th className="text-center p-2 text-foreground">Free</th>
              <th className="text-center p-2 text-foreground">Plus (₦2k/mo)</th>
              <th className="text-center p-2 text-foreground">Pro (₦5k/mo)</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ['AI calls/day', '5', '30', '100'],
              ['Notes/day', '3', '10', 'Unlimited'],
              ['Quizzes/day', '3', '10', 'Unlimited'],
              ['Flashcards/day', '3', '20', 'Unlimited'],
              ['Job searches/month', '5', '20', 'Unlimited'],
              ['Group chat', '❌', '✅', '✅'],
              ['Advanced study tools', '❌', '✅', '✅'],
              ['Exam prep', 'Limited', 'Full', 'Full'],
              ['Ads', 'Google Ads shown', 'No ads', 'No ads'],
            ].map(([feat, free, plus, pro]) => (
              <tr key={feat} className="border-b border-border">
                <td className="p-2 font-medium text-foreground">{feat}</td>
                <td className="p-2 text-center">{free}</td>
                <td className="p-2 text-center">{plus}</td>
                <td className="p-2 text-center">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Core Features</h2>
      <div className="grid gap-3 text-sm">
        {[
          { name: 'Smart Notes', desc: 'Upload PDFs/DOCX or type notes. AI generates summaries, flashcards, and quizzes from notes. Socratic tutor mode for deep learning.' },
          { name: 'AI Tutor', desc: 'Chat-based AI tutor with persona selection (Chill, Strict, Fun, Motivator). Course-aware context. Streams responses in real-time.' },
          { name: 'Flashcards', desc: 'Spaced-repetition system (SM-2 algorithm). Auto-generated from notes or manually created. Review scheduling.' },
          { name: 'Quizzes', desc: 'AI-generated quizzes from notes. Multiple choice format. Score tracking and history. Quiz challenges between friends.' },
          { name: 'Exam Prep (CBT)', desc: 'Computer-Based Test practice for WAEC, JAMB (5 options A-E), NECO, and more. Subject/topic selection. Timer. Session persistence. Mock exam mode. Advanced analytics with radar charts, difficulty breakdown, session history, and improvement tracking.' },
          { name: 'Focus Mode', desc: 'Pomodoro timer with app blocking (Android). Ambient sounds. Session tracking and streaks.' },
          { name: 'Study Planner', desc: 'Smart scheduler, study timetable, progress tracker, weakness detector, sleep calculator, lo-fi radio.' },
          { name: 'Social', desc: 'Study groups with chat, friend system with peer finder, leaderboard, friend challenges.' },
          { name: 'Career Tools', desc: 'Resume builder with 10 templates and PDF export, job/internship search, real-world-why explainer.' },
          { name: 'AI Tools', desc: 'Math solver, code debugger, language translator, YouTube summarizer, book scanner (OCR), diagram interpreter, OCR to LaTeX, lecture recorder.' },
          { name: 'Academic Tools', desc: 'Citation machine, bibliography builder, essay grader, plagiarism checker, research assistant, thesis generator.' },
          { name: 'Gamification', desc: 'XP system, achievements, daily challenges, daily quiz challenge, streaks, leaderboard.' },
          { name: 'Store', desc: 'Downloadable educational resources (textbooks, past papers, videos). YouTube section.' },
          { name: 'Safety', desc: 'Parental controls, content filtering, offline mode, time limits.' },
          { name: 'PDF Export', desc: 'All downloads (notes, cheat sheets, quizzes, flashcards, resumes) export as real PDF files. Works on all devices including mobile.' },
        ].map((f) => (
          <div key={f.name} className="p-3 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-foreground">{f.name}</h3>
            <p className="text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">AI Integration</h2>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>AI is powered by <strong className="text-foreground">Lovable AI Gateway</strong> which routes to Gemini and GPT models without needing API keys.</p>
        <p>Quota enforcement is <strong className="text-foreground">dual-layer</strong>: client-side gating via <code className="text-foreground">useSubscription</code> hook AND server-side enforcement in the <code className="text-foreground">ai-study</code> edge function.</p>
        <p>The <code className="text-foreground">ai-study</code> function validates the user's subscription tier and daily usage count before processing any AI request. This prevents bypass via direct API calls.</p>
        <p>Daily counters reset automatically based on <code className="text-foreground">ai_calls_reset_at</code> timestamp in the profiles table.</p>
      </div>
    </section>
  </div>
);

export default DocsFeatures;
