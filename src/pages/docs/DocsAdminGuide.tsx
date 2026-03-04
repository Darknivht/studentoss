const DocsAdminGuide = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-foreground">Admin Guide</h1>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Accessing the Admin Panel</h2>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Navigate to <code className="text-foreground">/admin-resources</code> and enter the admin password.</p>
        <p>The password is stored as a Cloud secret named <code className="text-foreground">ADMIN_PANEL_PASSWORD</code>.</p>
        <p>Session persists in browser until you log out or close the tab.</p>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Tab Guide</h2>
      <div className="grid gap-3 text-sm">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">📊 Analytics</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>View total users, active users, resources count, and other platform metrics.</li>
            <li><strong className="text-foreground">Revenue Estimator:</strong> Shows estimated monthly revenue based on current Plus (×₦2,000) and Pro (×₦5,000) subscriber counts.</li>
            <li><strong className="text-foreground">Subscription Pie Chart:</strong> Visual breakdown of Free/Plus/Pro users with percentages.</li>
            <li><strong className="text-foreground">Weekly Retention:</strong> Percentage of last week's active users who returned this week.</li>
            <li><strong className="text-foreground">Charts:</strong> Daily Active Users, Study Minutes, Signups, AI Usage, and Feature Usage over 30 days.</li>
            <li><strong className="text-foreground">Export CSV:</strong> Download all summary stats as a CSV file for spreadsheets.</li>
            <li>Click "Refresh" to fetch latest data.</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">📚 Resources</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li><strong className="text-foreground">Add Resource:</strong> Fill in title, subject, grade level, category, description. Optionally upload a file or add a YouTube URL.</li>
            <li><strong className="text-foreground">Edit:</strong> Click "Edit" on any resource row to modify it.</li>
            <li><strong className="text-foreground">Delete:</strong> Click "Delete" to remove a resource permanently.</li>
            <li>Categories: textbook, past_paper, video, notes, worksheet</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">📝 Exams</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li><strong className="text-foreground">Exam Types:</strong> Create exam categories (WAEC, JAMB, NECO, etc.) with settings like time limit, questions per subject.</li>
            <li><strong className="text-foreground">Subjects:</strong> Add subjects under each exam type. Set AI prompt for question generation.</li>
            <li><strong className="text-foreground">Topics:</strong> Add topics under subjects with difficulty levels.</li>
            <li><strong className="text-foreground">Questions:</strong> Manually add questions or use bulk JSON import.</li>
            <li><strong className="text-foreground">PDF Import:</strong> Upload past exam papers. The system extracts text and uses AI to generate questions automatically.</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">📢 Announcements</h3>
          <p className="text-muted-foreground mt-1">Create app-wide announcements that appear as banners on the Dashboard. Set type (info/warning/success), activation status, and optional expiry date.</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">🏆 Achievements</h3>
          <p className="text-muted-foreground mt-1">Define achievements with requirement types (xp, streak, notes_created, etc.) and XP rewards. Users unlock these automatically as they meet requirements.</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">👥 Users</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Search and view all registered users. See their subscription tier, XP, streak, and grade level.</li>
            <li><strong className="text-foreground">View Detail:</strong> Click the eye icon to see full student profile with activity stats, study trends, subject performance, course progress, and recent activity timeline.</li>
            <li><strong className="text-foreground">Block/Unblock:</strong> Click the shield/ban icon to toggle a user's blocked status. Blocked users cannot access the app.</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-foreground">💳 Payments</h3>
          <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
            <li>Manually resolve subscription issues. Search for a user and update their tier.</li>
            <li><strong className="text-foreground">Duration:</strong> Choose monthly (30 days) or yearly (365 days) when upgrading a user.</li>
            <li>Use this for refunds, manual upgrades, or fixing payment failures.</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3">Common Admin Tasks</h2>
      <div className="space-y-3 text-sm">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Bulk import exam questions from JSON</p>
          <p className="text-muted-foreground mt-1">Go to Exams → Questions → "Bulk Import JSON". Format: array of objects with <code className="text-foreground">{`{question, options: [...], correct_index, explanation, difficulty, topic_id}`}</code></p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Import questions from PDF</p>
          <p className="text-muted-foreground mt-1">Go to Exams → PDF Import. Select exam type and subject, upload the PDF. AI will extract and generate questions. Review and approve.</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Grant a user Pro access manually</p>
          <p className="text-muted-foreground mt-1">Go to Payments tab. Search the user by name/email. Select "pro" tier, choose duration (monthly/yearly), and save. This bypasses the payment flow.</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Post an announcement</p>
          <p className="text-muted-foreground mt-1">Go to Announcements tab. Fill in title and content. Set type and check "Is Active". All users will see the banner on their Dashboard.</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Block a problematic user</p>
          <p className="text-muted-foreground mt-1">Go to Users tab. Search for the user. Click the ban icon (🚫) next to their name. Their status will change to "Blocked". Click the shield icon to unblock.</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-foreground">Export analytics data</p>
          <p className="text-muted-foreground mt-1">Go to Analytics tab. Click "Export CSV" at the bottom. This downloads all summary metrics as a spreadsheet-compatible CSV file.</p>
        </div>
      </div>
    </section>
  </div>
);

export default DocsAdminGuide;
