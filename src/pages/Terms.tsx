import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Terms = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-32">
      <header className="flex items-center gap-3">
        <Link to="/upgrade">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold text-foreground">Terms of Service</h1>
      </header>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground/80">
        <p className="text-muted-foreground text-sm">Last updated: February 2026</p>

        <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using StudentOS ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
        <p>StudentOS is an AI-powered study companion that provides tools including smart notes, flashcards, quizzes, AI tutoring, focus mode, and career resources. Some features require a paid subscription.</p>

        <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
        <p>You must create an account to use the App. You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Subscriptions & Payments</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Payments are processed securely via Paystack.</li>
          <li>Subscription plans (Plus, Pro) are billed monthly or yearly as selected.</li>
          <li>All prices are in Nigerian Naira (₦).</li>
          <li>Subscriptions auto-expire at the end of the billing period. There are no automatic renewals.</li>
          <li>Refunds are handled on a case-by-case basis. Contact support within 7 days of payment.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
        <p>You agree not to misuse the App, including but not limited to: attempting to bypass subscription restrictions, sharing accounts, uploading harmful content, or using the AI features for academic dishonesty.</p>

        <h2 className="text-lg font-semibold text-foreground">6. AI-Generated Content</h2>
        <p>The App uses AI to generate study materials, summaries, and tutoring responses. While we strive for accuracy, AI-generated content may contain errors. You are responsible for verifying any critical information.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Intellectual Property</h2>
        <p>Content you create (notes, flashcards) remains yours. The App, its design, and proprietary features are owned by StudentOS.</p>

        <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
        <p>StudentOS is provided "as is" without warranty. We are not liable for any damages arising from your use of the App, including but not limited to academic outcomes.</p>

        <h2 className="text-lg font-semibold text-foreground">9. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.</p>

        <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
        <p>For questions about these terms, contact us at support@studentos.app.</p>
      </div>
    </div>
  );
};

export default Terms;
