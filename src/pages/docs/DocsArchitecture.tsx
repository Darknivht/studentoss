const DocsArchitecture = () => (
  <div className="prose prose-sm max-w-none dark:prose-invert space-y-8">
    <h1 className="text-2xl font-bold text-foreground">Platform Architecture</h1>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Tech Stack</h2>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2 border-b border-border text-foreground">Layer</th><th className="text-left p-2 border-b border-border text-foreground">Technology</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr><td className="p-2 border-b border-border">Frontend</td><td className="p-2 border-b border-border">React 18 + TypeScript + Vite</td></tr>
          <tr><td className="p-2 border-b border-border">Styling</td><td className="p-2 border-b border-border">Tailwind CSS + shadcn/ui + Framer Motion</td></tr>
          <tr><td className="p-2 border-b border-border">State</td><td className="p-2 border-b border-border">TanStack React Query + React Context</td></tr>
          <tr><td className="p-2 border-b border-border">Backend</td><td className="p-2 border-b border-border">Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage</td></tr>
          <tr><td className="p-2 border-b border-border">Edge Functions</td><td className="p-2 border-b border-border">Deno runtime (serverless)</td></tr>
          <tr><td className="p-2 border-b border-border">AI</td><td className="p-2 border-b border-border">Lovable AI Gateway (Gemini/GPT models)</td></tr>
          <tr><td className="p-2 border-b border-border">Payments</td><td className="p-2 border-b border-border">Paystack V2</td></tr>
          <tr><td className="p-2 border-b border-border">Mobile</td><td className="p-2 border-b border-border">Capacitor (Android) + PWA</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Database Tables</h2>
      <div className="grid gap-2 text-sm text-muted-foreground">
        {[
          'profiles — User profiles, subscription tier, XP, streaks',
          'courses — User-created courses',
          'notes — Study notes with file uploads',
          'flashcards — Spaced-repetition flashcards',
          'quiz_attempts — Quiz history and scores',
          'chat_messages — AI tutor conversation history',
          'focus_sessions — Focus mode tracking',
          'pomodoro_sessions — Pomodoro timer logs',
          'study_sessions — Daily study time tracking',
          'study_goals — User study goals',
          'study_groups — Group study rooms',
          'messages — Chat messages (DM + group)',
          'friendships — Friend connections',
          'peer_challenges — Friend quiz challenges',
          'achievements / user_achievements — Gamification',
          'weekly_xp — Weekly XP aggregation',
          'exam_types / exam_subjects / exam_topics / exam_questions — Exam prep system',
          'exam_attempts / exam_bookmarks — Exam practice tracking',
          'exam_subscriptions — Exam-specific subscriptions',
          'store_resources — Downloadable resources',
          'announcements — Admin announcements',
          'blocked_app_list — Focus mode blocked apps',
          'challenge_claims — Daily challenge claims',
        ].map((t) => <p key={t} className="p-2 rounded bg-muted/50">• {t}</p>)}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Edge Functions</h2>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">ai-study</strong> — AI tutor, quiz generation, flashcard creation, summaries. Enforces per-tier quotas.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">verify-payment</strong> — Paystack transaction verification → updates subscription tier.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">admin-verify</strong> — Admin panel password authentication.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">admin-resources</strong> — Admin analytics and resource management.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">exam-practice</strong> — AI-generated exam questions per subject/topic.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">extract-pdf-text / extract-pdf-text-ocr</strong> — PDF text extraction for exam question import.</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">job-search</strong> — Career page job/internship search.</p>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Authentication Flow</h2>
      <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
        <li>User signs up with email/password → email verification required</li>
        <li>On first auth, a <code className="text-foreground">profiles</code> row is auto-created via database trigger (<code className="text-foreground">handle_new_user</code>)</li>
        <li>Auth state managed via <code className="text-foreground">useAuth</code> hook (React Context wrapping Supabase Auth)</li>
        <li>Protected routes redirect to <code className="text-foreground">/auth</code> if not logged in</li>
        <li>Session persisted in localStorage by Supabase client</li>
      </ol>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Storage Buckets</h2>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">note-files</strong> (private) — User-uploaded study materials (PDF, DOCX)</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">avatars</strong> (public) — Profile pictures</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">chat-media</strong> (public) — Chat image attachments</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">store-resources</strong> (public) — Downloadable educational resources</p>
        <p className="p-2 rounded bg-muted/50"><strong className="text-foreground">exam-pdfs</strong> (private) — Uploaded past exam papers</p>
      </div>
    </section>
  </div>
);

export default DocsArchitecture;
