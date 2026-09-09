import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { get, run } from "./db";

export type User = {
  id: number; phone: string; name: string | null; email: string | null;
  city_id: number | null; role: "player" | "partner" | "admin"; karma: number; referral_code: string | null;
};

const SESSION_COOKIE = "pv_session";
const SESSION_DAYS = 30;
export const DEV_OTP = "123456";

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const u = get<User>(
    `SELECT u.id, u.phone, u.name, u.email, u.city_id, u.role, u.karma, u.referral_code
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`,
    token, Date.now(),
  );
  return u ?? null;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("LOGIN_REQUIRED");
  return u;
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

/** Demo mode is on until an SMS provider is configured (SMS_API_KEY); then OTPs are random and must be sent via SMS. */
export function isDemoOtp(): boolean {
  return !process.env.SMS_API_KEY;
}

export function issueOtp(phone: string): string {
  // TODO(production): send `code` through MSG91 / Twilio / AWS SNS when SMS_API_KEY is set.
  const code = isDemoOtp() ? (process.env.PLAYVTH_DEMO_OTP ?? DEV_OTP) : String(Math.floor(100000 + Math.random() * 900000));
  run("INSERT INTO otps(phone, code, expires_at) VALUES (?, ?, ?) ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at",
    phone, code, Date.now() + 10 * 60 * 1000);
  return code;
}

export async function verifyOtpAndLogin(phone: string, code: string): Promise<User | null> {
  const row = get<{ code: string; expires_at: number }>("SELECT code, expires_at FROM otps WHERE phone = ?", phone);
  if (!row || row.code !== code || row.expires_at < Date.now()) return null;
  run("DELETE FROM otps WHERE phone = ?", phone);
  let user = get<User>("SELECT id, phone, name, email, city_id, role, karma, referral_code FROM users WHERE phone = ?", phone);
  if (!user) {
    const cityId = get<{ id: number }>("SELECT id FROM cities WHERE slug = ?", (await cookies()).get("pv_city")?.value ?? "bengaluru")?.id ?? null;
    const referral = "PV" + phone.slice(-4) + randomBytes(2).toString("hex").toUpperCase();
    run("INSERT INTO users(phone, city_id, referral_code) VALUES (?, ?, ?)", phone, cityId, referral);
    user = get<User>("SELECT id, phone, name, email, city_id, role, karma, referral_code FROM users WHERE phone = ?", phone)!;
  }
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 86400000;
  run("INSERT INTO sessions(token, user_id, expires_at) VALUES (?, ?, ?)", token, user.id, expires);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(expires) });
  return user;
}

export async function logoutCurrent() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(SESSION_COOKIE);
}

export async function getCitySlug(): Promise<string> {
  return (await cookies()).get("pv_city")?.value ?? "bengaluru";
}
