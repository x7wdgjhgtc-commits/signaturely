import LegalShell from "@/components/LegalShell";

export default function Privacy() {
  const updated = "23 August 2026";
  return (
    <LegalShell title="Privacy Policy" updated={updated}>
      <p>
        This Privacy Policy explains how <b>Elapid Group Pty Ltd</b> (
        <b>we</b>, <b>us</b>) collects, uses, stores and shares personal
        information in connection with the Signaturely service. It is written
        to align with the Australian Privacy Principles under the Privacy Act
        1988 (Cth).
      </p>

      <h2>1. What we collect</h2>
      <p>We collect the following categories of personal information:</p>
      <ul>
        <li>
          <b>Account data</b> — workspace name, admin email address, workspace
          slug and a hashed password. We never store your password in plain
          text.
        </li>
        <li>
          <b>Staff records you enter</b> — names, job titles, work email
          addresses, phone numbers, work addresses, profile photos and social
          links for the people you add to your workspace.
        </li>
        <li>
          <b>Billing data</b> — handled by Stripe, our payment processor. We
          store only a Stripe customer ID and the current status of your
          subscription. Card details never touch our servers.
        </li>
        <li>
          <b>Usage & logs</b> — request timestamps, IP addresses and error
          traces, retained for operational and security purposes.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide the Signaturely service and share the signatures you build.</li>
        <li>To bill you and respond to support requests.</li>
        <li>To send transactional emails (receipts, security notices, service updates).</li>
        <li>To improve the service and detect abuse.</li>
      </ul>
      <p>
        We do not sell your personal information. We do not use your staff
        records for marketing.
      </p>

      <h2>3. Who we share it with</h2>
      <p>
        We share personal information only with subprocessors necessary to run
        the service, on a strict need-to-know basis:
      </p>
      <ul>
        <li><b>Stripe</b> — payment processing.</li>
        <li><b>Render / hosting providers</b> — application hosting and DNS.</li>
        <li><b>Email delivery providers</b> — transactional email delivery.</li>
      </ul>
      <p>
        We may disclose information where required by Australian law or a
        lawful order of a court or regulator.
      </p>

      <h2>4. Where your data lives</h2>
      <p>
        Signaturely data is hosted on servers operated by our hosting
        provider. These servers may be located outside Australia, including
        the United States and the European Union. By using the service you
        consent to your data being processed in those locations.
      </p>

      <h2>5. Retention</h2>
      <p>
        We retain your workspace data for as long as your account is active.
        If you close your account, we delete workspace content within 30 days,
        except records we are required to keep (e.g. tax invoices for seven
        years).
      </p>

      <h2>6. Your rights</h2>
      <p>Under Australian privacy law you have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Ask us to correct it if it is inaccurate.</li>
        <li>Ask us to delete it, subject to legal retention obligations.</li>
        <li>Complain to the Office of the Australian Information Commissioner (OAIC).</li>
      </ul>
      <p>
        Send access, correction or deletion requests to{" "}
        <a href="mailto:privacy@elapidgroup.com">privacy@elapidgroup.com</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        We use HTTPS for all traffic, hash passwords with bcrypt, and restrict
        production database access to authorised staff. No system is perfectly
        secure — you can help by choosing a strong password and keeping it
        confidential.
      </p>

      <h2>8. Children</h2>
      <p>
        Signaturely is a workplace product not directed at children under 16.
        We do not knowingly collect personal information from children.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this Policy from time to time. Material changes will be
        notified by email to workspace admins at least 14 days before taking
        effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Elapid Group Pty Ltd
        <br />
        Brisbane, Australia
        <br />
        <a href="mailto:privacy@elapidgroup.com">privacy@elapidgroup.com</a>
      </p>
    </LegalShell>
  );
}
