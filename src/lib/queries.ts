import { all, get } from "./db";
import { startingPrice } from "./slots";
import { todayISO } from "./time";

export type City = { id: number; name: string; slug: string };
export type Sport = { id: number; name: string; slug: string; icon: string };
export type Venue = {
  id: number; slug: string; name: string; city_id: number; city_name: string; area: string; address: string;
  lat: number | null; lng: number | null; description: string; amenities: string; open_hour: number; close_hour: number;
  rating: number; rating_count: number; free_cancel_hours: number; cancel_fee_pct: number; owner_user_id: number | null;
  theme: string; is_active: number;
};
export type VenueCard = Venue & { sports: Sport[]; starting_price: number };
export type Court = { id: number; venue_id: number; sport_id: number; name: string; is_active: number };
export type Game = {
  id: number; host_user_id: number; host_name: string | null; sport_id: number; sport_name: string; sport_icon: string;
  city_id: number; city_name: string; venue_id: number | null; venue_slug: string | null; location_text: string;
  date: string; start_hour: number; end_hour: number; max_players: number; price_per_player: number;
  skill_level: string; description: string; status: string; accepted_count: number;
};
export type Booking = {
  id: number; code: string; user_id: number; venue_id: number; venue_name: string; venue_slug: string; area: string;
  court_id: number; court_name: string; sport_id: number; sport_name: string; sport_icon: string; date: string;
  start_hour: number; end_hour: number; base_amount: number; convenience_fee: number; karma_redeemed: number;
  total_amount: number; payment_method: string; status: string; refund_amount: number | null; created_at: string;
  user_name?: string | null; user_phone?: string;
};

export const listCities = () => all<City>("SELECT * FROM cities ORDER BY id");
export const listSports = () => all<Sport>("SELECT * FROM sports ORDER BY id");
export const cityBySlug = (slug: string) => get<City>("SELECT * FROM cities WHERE slug = ?", slug);
export const sportBySlug = (slug: string) => get<Sport>("SELECT * FROM sports WHERE slug = ?", slug);

export function sportsForVenue(venueId: number): Sport[] {
  return all<Sport>("SELECT s.* FROM venue_sports vs JOIN sports s ON s.id = vs.sport_id WHERE vs.venue_id = ? ORDER BY s.id", venueId);
}

const VENUE_SELECT = "SELECT v.*, c.name AS city_name FROM venues v JOIN cities c ON c.id = v.city_id";

export function listVenues(opts: { citySlug?: string; sportSlug?: string; q?: string; sort?: string; maxPrice?: number } = {}): VenueCard[] {
  const where: string[] = ["v.is_active = 1"];
  const params: (string | number)[] = [];
  if (opts.citySlug) { where.push("c.slug = ?"); params.push(opts.citySlug); }
  if (opts.sportSlug) { where.push("EXISTS (SELECT 1 FROM venue_sports vs JOIN sports s ON s.id = vs.sport_id WHERE vs.venue_id = v.id AND s.slug = ?)"); params.push(opts.sportSlug); }
  if (opts.q) { where.push("(v.name LIKE ? OR v.area LIKE ?)"); params.push(`%${opts.q}%`, `%${opts.q}%`); }
  const order = opts.sort === "rating" ? "v.rating DESC" : "v.rating_count DESC";
  const rows = all<Venue>(`${VENUE_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order}`, ...params);
  let cards = rows.map((v) => ({ ...v, sports: sportsForVenue(v.id), starting_price: startingPrice(v.id) }));
  if (opts.maxPrice) cards = cards.filter((c) => c.starting_price <= opts.maxPrice!);
  if (opts.sort === "price_asc") cards.sort((a, b) => a.starting_price - b.starting_price);
  if (opts.sort === "price_desc") cards.sort((a, b) => b.starting_price - a.starting_price);
  return cards;
}

export function getVenue(slug: string): VenueCard | undefined {
  const v = get<Venue>(`${VENUE_SELECT} WHERE v.slug = ?`, slug);
  return v ? { ...v, sports: sportsForVenue(v.id), starting_price: startingPrice(v.id) } : undefined;
}
export function getVenueById(id: number): VenueCard | undefined {
  const v = get<Venue>(`${VENUE_SELECT} WHERE v.id = ?`, id);
  return v ? { ...v, sports: sportsForVenue(v.id), starting_price: startingPrice(v.id) } : undefined;
}
export const courtsForVenue = (venueId: number, sportId?: number) =>
  sportId
    ? all<Court>("SELECT * FROM courts WHERE venue_id = ? AND sport_id = ? AND is_active = 1 ORDER BY id", venueId, sportId)
    : all<Court>("SELECT * FROM courts WHERE venue_id = ? AND is_active = 1 ORDER BY id", venueId);

export function reviewsForVenue(venueId: number) {
  return all<{ id: number; rating: number; comment: string; created_at: string; user_name: string | null }>(
    "SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.venue_id = ? ORDER BY r.id DESC LIMIT 20", venueId,
  );
}

const GAME_SELECT = `SELECT g.*, u.name AS host_name, s.name AS sport_name, s.icon AS sport_icon, c.name AS city_name, v.slug AS venue_slug,
  (SELECT COUNT(*) FROM game_players gp WHERE gp.game_id = g.id AND gp.status = 'accepted') AS accepted_count
  FROM games g JOIN users u ON u.id = g.host_user_id JOIN sports s ON s.id = g.sport_id JOIN cities c ON c.id = g.city_id
  LEFT JOIN venues v ON v.id = g.venue_id`;

export function listGames(opts: { citySlug?: string; sportSlug?: string; skill?: string; date?: string } = {}): Game[] {
  const where: string[] = ["g.status IN ('open','full')", "g.date >= ?"];
  const params: (string | number)[] = [todayISO()];
  if (opts.citySlug) { where.push("c.slug = ?"); params.push(opts.citySlug); }
  if (opts.sportSlug) { where.push("s.slug = ?"); params.push(opts.sportSlug); }
  if (opts.skill && opts.skill !== "any") { where.push("(g.skill_level = ? OR g.skill_level = 'any')"); params.push(opts.skill); }
  if (opts.date) { where.push("g.date = ?"); params.push(opts.date); }
  return all<Game>(`${GAME_SELECT} WHERE ${where.join(" AND ")} ORDER BY g.date, g.start_hour`, ...params);
}
export const getGame = (id: number) => get<Game>(`${GAME_SELECT} WHERE g.id = ?`, id);
export function gamePlayers(gameId: number) {
  return all<{ user_id: number; name: string | null; status: string; skill: string | null }>(
    `SELECT gp.user_id, u.name, gp.status, us.level AS skill FROM game_players gp JOIN users u ON u.id = gp.user_id
     JOIN games g ON g.id = gp.game_id LEFT JOIN user_skills us ON us.user_id = u.id AND us.sport_id = g.sport_id
     WHERE gp.game_id = ? ORDER BY gp.created_at`, gameId,
  );
}

const BOOKING_SELECT = `SELECT b.*, v.name AS venue_name, v.slug AS venue_slug, v.area, ct.name AS court_name, s.name AS sport_name, s.icon AS sport_icon,
  u.name AS user_name, u.phone AS user_phone
  FROM bookings b JOIN venues v ON v.id = b.venue_id JOIN courts ct ON ct.id = b.court_id JOIN sports s ON s.id = b.sport_id JOIN users u ON u.id = b.user_id`;
export const bookingsForUser = (userId: number) => all<Booking>(`${BOOKING_SELECT} WHERE b.user_id = ? ORDER BY b.date DESC, b.start_hour DESC`, userId);
export const getBooking = (id: number) => get<Booking>(`${BOOKING_SELECT} WHERE b.id = ?`, id);
export const getBookingByCode = (code: string) => get<Booking>(`${BOOKING_SELECT} WHERE b.code = ?`, code);
export const bookingsForVenueDate = (venueId: number, date: string) =>
  all<Booking>(`${BOOKING_SELECT} WHERE b.venue_id = ? AND b.date = ? ORDER BY b.start_hour, ct.id`, venueId, date);

export function gamesForUser(userId: number) {
  return all<Game & { my_status: string }>(
    `${GAME_SELECT.replace("SELECT g.*", "SELECT g.*, gp.status AS my_status")} JOIN game_players gp ON gp.game_id = g.id AND gp.user_id = ?
     ORDER BY g.date DESC, g.start_hour DESC`, userId,
  );
}
export const karmaLedger = (userId: number) =>
  all<{ id: number; delta: number; reason: string; created_at: string }>("SELECT * FROM karma_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 50", userId);
export const userSkills = (userId: number) =>
  all<{ sport_id: number; sport_name: string; icon: string; level: string }>(
    "SELECT us.sport_id, s.name AS sport_name, s.icon, us.level FROM user_skills us JOIN sports s ON s.id = us.sport_id WHERE us.user_id = ?", userId);

export const venuesForOwner = (userId: number) =>
  all<Venue>(`${VENUE_SELECT} WHERE v.owner_user_id = ? ORDER BY v.id`, userId).map((v) => ({ ...v, sports: sportsForVenue(v.id), starting_price: startingPrice(v.id) }));

export type Coach = { id: number; name: string; sport_id: number; sport_name: string; sport_icon: string; city_name: string; area: string; experience_years: number; price_per_session: number; rating: number; bio: string };
export function listCoaches(opts: { citySlug?: string; sportSlug?: string } = {}) {
  const where: string[] = ["1=1"]; const params: string[] = [];
  if (opts.citySlug) { where.push("c.slug = ?"); params.push(opts.citySlug); }
  if (opts.sportSlug) { where.push("s.slug = ?"); params.push(opts.sportSlug); }
  return all<Coach>(`SELECT co.*, s.name AS sport_name, s.icon AS sport_icon, c.name AS city_name FROM coaches co JOIN sports s ON s.id = co.sport_id JOIN cities c ON c.id = co.city_id WHERE ${where.join(" AND ")} ORDER BY co.rating DESC`, ...params);
}
export const getCoach = (id: number) => get<Coach>("SELECT co.*, s.name AS sport_name, s.icon AS sport_icon, c.name AS city_name FROM coaches co JOIN sports s ON s.id = co.sport_id JOIN cities c ON c.id = co.city_id WHERE co.id = ?", id);
