import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-32">
      <header className="flex items-center gap-3">
        <Link to="/upgrade">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold text-foreground">Privacy Policy</h1>
      </header>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground/80">
        <p className="text-muted-foreground text-sm">Last updated: February 2026</p>

        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account info:</strong> Name, email address, school name, grade level.</li>
          <li><strong>Study data:</strong> Notes, flashcards, quiz results, study sessions, and progress.</li>
          <li><strong>Usage data:</strong> Feature usage, session duration, and app interactions.</li>
          <li><strong>Payment info:</strong> Processed by Paystack — we do not store card details.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and improve the App's study tools and AI features.</li>
          <li>To personalize your learning experience.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To send important notifications about your account or streaks.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. AI Processing</h2>
        <p>Your notes and study materials may be processed by AI models to generate summaries, quizzes, flashcards, and tutoring responses. This data is used only for providing the service and is not sold or shared with third parties for advertising.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Data Storage & Security</h2>
        <p>Your data is stored securely using industry-standard encryption. We use secure cloud infrastructure to protect your information.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data only with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Payment processors (Paystack) to handle transactions.</li>
          <li>AI service providers to generate study content (no personally identifiable information is shared).</li>
          <li>Law enforcement if required by law.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">6. Children's Privacy</h2>
        <p>Users under 14 may use the App with parental consent. We provide parental controls including content filtering and usage time limits. Parents can request deletion of their child's data at any time.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access, correct, or delete your personal data.</li>
          <li>Export your study materials.</li>
          <li>Opt out of non-essential notifications.</li>
          <li>Request account deletion.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">8. Cookies & Local Storage</h2>
        <p>We use local storage to save your preferences and enable offline access. No third-party tracking cookies are used.</p>

        <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
        <p>We may update this policy periodically. We will notify you of significant changes via the App.</p>

        <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
        <p>For privacy concerns or data requests, contact us at privacy@studentos.app.</p>
      </div>
    </div>
  );
};

export default Privacy;
