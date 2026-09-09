import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Terms of service" };
export default function Terms() {
  return (
    <div className="container-x max-w-3xl py-10 space-y-6 text-slate-700">
      <div><h1 className="text-3xl font-extrabold text-ink">Terms of service</h1><p className="mt-1 text-sm text-slate-500">Last updated 9 September 2026</p></div>
      <p>By creating an account or using PlayVth you agree to these terms. PlayVth is a marketplace: venues, coaches and game hosts provide the activities; we provide the platform to find, book and pay for them.</p>
      {[
        ["Accounts", "You must be 13 or older and provide a mobile number you control. Keep your OTP private. You are responsible for activity on your account."],
        ["Bookings and payments", "Prices are set by venues and shown per court per hour unless stated. Bookings are confirmed instantly with a booking code and are paid at the venue before you play, unless online payment is offered at checkout. Where online payment is used, a convenience fee is added and is non-refundable, and slots are held for 10 minutes while you pay."],
        ["Cancellations and refunds", "Cancel from the app up to 2 hours before the slot start. Pay-at-venue bookings have nothing to refund. For online payments each venue's cancellation window and fee are shown before you pay, approved refunds go back to the original payment method within 5 to 7 working days, and a venue cancellation is refunded in full. See the policies page for details."],
        ["Karma points", "Karma has no cash value, cannot be transferred, and may be adjusted or withdrawn if earned through misuse. Points earned on a booking are reversed if it is cancelled."],
        ["Games and community", "Hosts decide who joins their game. Be on time, play fair and treat others with respect. We may remove content or accounts that harass, discriminate, spam or break the law. Any fees a host collects are between the host and the players unless paid through PlayVth."],
        ["Venues and coaches", "Venues and coaches are independent businesses responsible for their facilities, safety and services. Follow their rules on site. We are not liable for injuries or losses at a venue, except where the law says otherwise."],
        ["Partner listings", "If you list a venue you confirm you are authorised to do so, that prices and availability are accurate, and that you will honour confirmed bookings. We charge a commission per successful booking as agreed in your partner terms."],
        ["Acceptable use", "Do not scrape, reverse engineer, or interfere with the service, make fraudulent bookings, or use another person's payment method without permission."],
        ["Liability", "The service is provided as is. To the extent permitted by law our total liability for any claim is limited to the amount you paid for the booking in question."],
        ["Governing law", "These terms are governed by the laws of India. Disputes are subject to the courts of Bengaluru, Karnataka."],
        ["Changes and contact", "We may update these terms; continued use after an update means you accept it. Contact: support@playvth.com."],
      ].map(([t, d]) => <section key={t}><h2 className="mb-1 text-xl font-bold text-ink">{t}</h2><p>{d}</p></section>)}
      <p className="text-sm"><Link className="font-semibold text-brand-700" href="/privacy">Privacy policy</Link> · <Link className="font-semibold text-brand-700" href="/policies">Cancellation and Karma policies</Link></p>
    </div>
  );
}
