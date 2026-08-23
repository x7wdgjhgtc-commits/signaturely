import { Link } from "wouter";
import LegalShell from "@/components/LegalShell";

// Plain-English terms — enough to look and act like a real product without
// pretending to be a lawyer-drafted contract. Real deployments should have
// this reviewed before taking payment.
export default function Terms() {
  const updated = "23 August 2026";
  return (
    <LegalShell title="Terms of Service" updated={updated}>
      <p>
        These Terms of Service (<b>Terms</b>) govern your use of Signaturely,
        an email-signature management service operated by{" "}
        <b>Elapid Group Pty Ltd</b> (ACN pending), an Australian proprietary
        limited company (<b>we</b>, <b>us</b>, <b>Elapid</b>).
      </p>
      <p>
        By creating a Signaturely workspace or using the service, you agree to
        these Terms on behalf of yourself and any company or team you sign up.
      </p>

      <h2>1. The service</h2>
      <p>
        Signaturely lets you design, host and share email signatures for your
        team. We host the signature templates and staff records you provide,
        and we make copy-and-paste signatures available at unique share URLs.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for keeping your workspace login credentials
        confidential and for all activity that occurs under your account. If
        you believe your account has been compromised, contact us at{" "}
        <a href="mailto:support@elapidgroup.com">support@elapidgroup.com</a>{" "}
        immediately.
      </p>

      <h2>3. Plans and payment</h2>
      <p>
        Paid plans are billed monthly in Australian dollars via Stripe. You may
        cancel at any time from the billing portal; cancellations take effect
        at the end of your current billing period and no refunds are issued
        for partial months.
      </p>
      <p>
        Free plans are provided as-is and may be limited or discontinued at any
        time. Paid plans include a 14-day free trial that starts on signup.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use Signaturely to:</p>
      <ul>
        <li>Impersonate a person or organisation you don't represent.</li>
        <li>Send unsolicited bulk email or violate anti-spam laws.</li>
        <li>Host signatures containing malware, phishing links or unlawful content.</li>
        <li>Attempt to reverse-engineer, disrupt or overload the service.</li>
      </ul>
      <p>
        We may suspend or terminate accounts that breach these rules.
      </p>

      <h2>5. Your content</h2>
      <p>
        You retain ownership of all logos, photos, contact details and other
        content you upload (<b>Your Content</b>). You grant us a limited
        licence to host, process and display Your Content solely to provide the
        service. You are responsible for having the rights to any content you
        upload.
      </p>

      <h2>6. Data & privacy</h2>
      <p>
        Our handling of personal information is described in our{" "}
        <Link href="/privacy" className="text-teal-700 hover:underline">
          Privacy Policy
        </Link>
        , which forms part of these Terms.
      </p>

      <h2>7. Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted
        service. Scheduled maintenance, third-party outages (Stripe, hosting
        providers, DNS) and events outside our control may cause downtime.
      </p>

      <h2>8. Warranties and liability</h2>
      <p>
        The service is provided on an "as is" and "as available" basis. To the
        maximum extent permitted by Australian Consumer Law, we exclude all
        implied warranties and our aggregate liability to you is limited to
        the fees you paid us in the 12 months preceding the claim.
      </p>
      <p>
        Nothing in these Terms limits any consumer guarantees under the
        Australian Consumer Law that cannot be excluded.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may terminate your account at any time from the billing portal or
        by contacting support. We may suspend or terminate your account for
        material breach of these Terms with reasonable notice, or immediately
        for unlawful activity.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of Queensland, Australia. Any
        dispute is to be dealt with in the courts of Queensland.
      </p>

      <h2>11. Contact</h2>
      <p>
        Elapid Group Pty Ltd
        <br />
        Brisbane, Australia
        <br />
        <a href="mailto:support@elapidgroup.com">support@elapidgroup.com</a>
      </p>
    </LegalShell>
  );
}
