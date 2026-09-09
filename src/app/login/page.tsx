import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next || "/");
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="text-2xl font-extrabold">Login or sign up</h1>
        <p className="mt-1 text-sm text-slate-500">We&apos;ll send a one-time password to your mobile number. No passwords to remember.</p>
        <LoginForm next={next ?? ""} />
        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <b>Demo accounts:</b> partner <code>9999999999</code> · player <code>9000000001</code>. Any new number creates an account. Dev OTP is <code>123456</code>.
        </div>
      </div>
    </div>
  );
}
