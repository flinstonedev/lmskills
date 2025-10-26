import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for LMSkills - Review our terms and conditions for using the clade skills directory and submitting Claude AI skills to our platform.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://lmskills.com/terms",
  },
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8" suppressHydrationWarning={true}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mb-4">
            By accessing and using LMSkills ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills is a platform for sharing and discovering Claude skills. The Platform allows users to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Submit and share skills via GitHub repository URLs</li>
            <li>Browse and discover skills created by others</li>
            <li>Rate, comment, and provide feedback on skills</li>
            <li>Maintain user profiles and manage their submitted skills</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-muted-foreground mb-4">
            To use certain features of the Platform, you may be required to create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Promptly update your account information to keep it accurate and current</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Content and Intellectual Property</h2>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Your Content</h3>
          <p className="text-muted-foreground mb-4">
            You retain ownership of any skills, code, documentation, or other content you submit to the Platform ("Your Content"). By submitting Your Content, you grant LMSkills a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute Your Content on the Platform.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Public Content</h3>
          <p className="text-muted-foreground mb-4">
            All skills submitted to LMSkills are public and visible to all users. Do not submit content that you wish to keep private or confidential.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.3 License Requirements</h3>
          <p className="text-muted-foreground mb-4">
            Skills submitted to the Platform should include appropriate open source licenses. You are responsible for ensuring that Your Content complies with all applicable licenses and does not infringe on third-party intellectual property rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
          <p className="text-muted-foreground mb-4">
            You agree not to use the Platform to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Submit content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
            <li>Submit malicious code, viruses, or any code designed to harm users or systems</li>
            <li>Violate any applicable laws, regulations, or third-party rights</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            <li>Interfere with or disrupt the Platform or servers or networks connected to the Platform</li>
            <li>Attempt to gain unauthorized access to any portion of the Platform</li>
            <li>Scrape, data mine, or use automated tools to collect data from the Platform without permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Content Moderation</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills reserves the right to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Review, monitor, and remove any content at our discretion</li>
            <li>Suspend or terminate accounts that violate these Terms</li>
            <li>Refuse service to anyone for any reason at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
          <p className="text-muted-foreground mb-4">
            The Platform integrates with third-party services including GitHub for repository linking and authentication. Your use of these services is subject to their respective terms and conditions. LMSkills is not responsible for any third-party services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
          <p className="text-muted-foreground mb-4">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-muted-foreground mb-4">
            LMSkills does not warrant that:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>The Platform will be uninterrupted, secure, or error-free</li>
            <li>Skills or content on the Platform are accurate, reliable, or safe to use</li>
            <li>Any defects or errors will be corrected</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            You use skills from the Platform at your own risk. Always review and test code before using it in production environments.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p className="text-muted-foreground mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LMSKILLS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Your use or inability to use the Platform</li>
            <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
            <li>Any bugs, viruses, or malicious code obtained from the Platform or submitted content</li>
            <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
          <p className="text-muted-foreground mb-4">
            You agree to indemnify, defend, and hold harmless LMSkills and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Your access to or use of the Platform</li>
            <li>Your violation of these Terms</li>
            <li>Your Content or any content you submit</li>
            <li>Your violation of any third-party rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills reserves the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date at the top of these Terms. Your continued use of the Platform after such modifications constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Platform will immediately cease.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
          <p className="text-muted-foreground mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LMSkills operates, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about these Terms, please contact us through our Platform or visit our{" "}
            <Link href="/" className="text-primary hover:underline">
              homepage
            </Link>{" "}
            for more information.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By using LMSkills, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
