import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };
const UPDATED = "9 September 2026";
export default function Privacy() {
  return (
    <div className="container-x max-w-3xl py-10 space-y-6 text-slate-700">
      <div><h1 className="text-3xl font-extrabold text-ink">Privacy policy</h1><p className="mt-1 text-sm text-slate-500">Last updated {UPDATED}</p></div>
      <p>PlayVth (&quot;we&quot;, &quot;us&quot;) operates the PlayVth website and mobile apps, which let you book sports venues, join games and contact coaches. This policy explains what we collect, why, and the choices you have. It applies to the app on iOS, Android and the web.</p>
      <Section title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Account details</b>: mobile number (used to log in with a one-time password), name, email if you add it, home city, and the sports and skill levels you set.</li>
          <li><b>Bookings and games</b>: venues, courts, dates and times you book; games you host or join; reviews you post; coaching enquiries you send.</li>
          <li><b>Payments</b>: payments are processed by Razorpay. We store the Razorpay order, payment and refund identifiers and the amounts. We never see or store your card number, UPI PIN or bank credentials.</li>
          <li><b>Karma points</b>: the points you earn and redeem and the reason for each change.</li>
          <li><b>Device and usage data</b>: IP address, device type, app version and pages visited, collected through standard server logs to keep the service secure and working.</li>
        </ul>
      </Section>
      <Section title="What we use it for">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create and secure your account and to send you the login OTP by SMS.</li>
          <li>To make, confirm, change and refund bookings, and to share your name and phone number with the venue you booked so they can identify you at the door.</li>
          <li>To show hosts who wants to join their game (name and skill level) and to show players who is playing.</li>
          <li>To pass your enquiry, including your name and phone number, to the coach you contacted.</li>
          <li>To send booking confirmations, reminders and game updates by SMS, push notification or email.</li>
          <li>To prevent fraud and abuse and to comply with law, including tax and payment regulations in India.</li>
        </ul>
      </Section>
      <Section title="Who we share it with">
        <p>Venues and coaches you interact with (as described above), Razorpay for payment processing, our SMS and email providers to deliver messages, and our hosting providers. We do not sell your personal data and we do not share it with advertisers.</p>
      </Section>
      <Section title="How long we keep it">
        <p>Account data is kept while your account is active. Booking and payment records are kept for 8 years after the transaction to meet Indian accounting and tax requirements, then deleted or anonymised. Server logs are kept for 90 days.</p>
      </Section>
      <Section title="Your choices and rights">
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Delete your account</b> at any time from Profile → Delete account in the app, or by emailing us. We remove your name, phone number, email, skills and Karma; booking and payment records are anonymised and retained only as required by law.</li>
          <li>Edit your profile details in the app.</li>
          <li>Ask us for a copy of your data, or to correct it, by emailing the address below. Under India&apos;s Digital Personal Data Protection Act you may also nominate someone to exercise these rights for you and may complain to the Data Protection Board.</li>
        </ul>
      </Section>
      <Section title="Children">
        <p>PlayVth is for users aged 13 and above. Bookings and payments must be made by an adult. If you believe a child has created an account, contact us and we will delete it.</p>
      </Section>
      <Section title="Security">
        <p>Data is encrypted in transit (HTTPS). Sessions use secure, HTTP-only cookies. Payment data is handled by Razorpay, which is PCI DSS compliant.</p>
      </Section>
      <Section title="Changes and contact">
        <p>We will post any changes here and update the date above. Questions or requests: <a className="font-semibold text-brand-700" href="mailto:privacy@playvth.com">privacy@playvth.com</a>.</p>
      </Section>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-xl font-bold text-ink">{title}</h2>{children}</section>;
}
