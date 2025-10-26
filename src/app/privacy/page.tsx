import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8" suppressHydrationWarning={true}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Welcome to LMSkills ("we," "us," or "our"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.
          </p>
          <p className="text-muted-foreground mb-4">
            By using LMSkills, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
          <p className="text-muted-foreground mb-4">
            We collect information that you voluntarily provide when using the Platform:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Account information (username, email address, profile information)</li>
            <li>Skills and content you submit, including code, documentation, and metadata</li>
            <li>Comments, ratings, and feedback you provide on skills</li>
            <li>Communications with us through the Platform</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Information from Third-Party Services</h3>
          <p className="text-muted-foreground mb-4">
            When you authenticate or link your account using third-party services (such as GitHub), we may receive:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Your public profile information (name, username, avatar)</li>
            <li>Your email address</li>
            <li>Repository information for skills you submit</li>
            <li>Any other information you authorize the third-party service to share</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Automatically Collected Information</h3>
          <p className="text-muted-foreground mb-4">
            We automatically collect certain information when you use the Platform:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Log data (IP address, browser type, operating system, pages visited)</li>
            <li>Device information (device type, unique device identifiers)</li>
            <li>Usage data (features used, time spent, interaction patterns)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Provide, maintain, and improve the Platform</li>
            <li>Create and manage your user account</li>
            <li>Display your public profile and submitted skills</li>
            <li>Enable features such as ratings, comments, and user interactions</li>
            <li>Communicate with you about the Platform, including updates and announcements</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Public Information</h3>
          <p className="text-muted-foreground mb-4">
            The following information is public and visible to all users and visitors:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Your profile information (username, avatar, bio)</li>
            <li>Skills you submit, including all associated content and metadata</li>
            <li>Comments and ratings you post</li>
            <li>Your activity on the Platform (submissions, favorites, etc.)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Service Providers</h3>
          <p className="text-muted-foreground mb-4">
            We may share your information with third-party service providers who perform services on our behalf, such as:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Hosting and infrastructure providers</li>
            <li>Authentication services (e.g., GitHub OAuth)</li>
            <li>Analytics providers</li>
            <li>Email service providers</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Legal Requirements</h3>
          <p className="text-muted-foreground mb-4">
            We may disclose your information if required to do so by law or in response to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Legal processes (subpoenas, court orders)</li>
            <li>Governmental requests</li>
            <li>Investigations of potential violations of our Terms of Service</li>
            <li>Protection of our rights, property, or safety, or that of others</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.4 Business Transfers</h3>
          <p className="text-muted-foreground mb-4">
            If LMSkills is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="text-muted-foreground mb-4">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze Platform usage and performance</li>
            <li>Provide personalized features and content</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p className="text-muted-foreground mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Monitoring for security threats</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p className="text-muted-foreground mb-4">
            We retain your personal information for as long as necessary to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Provide the Platform and its features</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes. Note that public content you submitted may remain visible even after account deletion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
          <p className="text-muted-foreground mb-4">
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Access: Request a copy of your personal information</li>
            <li>Correction: Request correction of inaccurate or incomplete information</li>
            <li>Deletion: Request deletion of your personal information</li>
            <li>Objection: Object to processing of your personal information</li>
            <li>Portability: Request transfer of your data to another service</li>
            <li>Withdraw consent: Withdraw consent for data processing where applicable</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            To exercise these rights, please contact us through the Platform. We will respond to your request within a reasonable timeframe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills is not intended for children under the age of 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
          <p className="text-muted-foreground mb-4">
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using the Platform, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
          <p className="text-muted-foreground mb-4">
            The Platform may contain links to third-party websites and services, including GitHub repositories. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date at the top of this policy. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
          </p>
          <p className="text-muted-foreground mb-4">
            Your continued use of the Platform after any changes indicates your acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through our Platform or visit our{" "}
            <Link href="/" className="text-primary hover:underline">
              homepage
            </Link>{" "}
            for more information.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By using LMSkills, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
}
