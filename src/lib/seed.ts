import type { DatabaseSync } from "node:sqlite";
import { addDays, todayISO } from "./time";

type VenueSeed = {
  slug: string; name: string; city: string; area: string; address: string;
  lat: number; lng: number; description: string; amenities: string[];
  open: number; close: number; rating: number; ratingCount: number;
  freeCancelHours: number; cancelFeePct: number; theme: string;
  courts: { sport: string; name: string; weekday: number; weekend: number; peakExtra?: number }[];
};

const CITIES = ["Bengaluru", "Hyderabad", "Chennai", "Mumbai", "Delhi NCR", "Pune"];
const SPORTS: [string, string][] = [
  ["Badminton", "🏸"], ["Football", "⚽"], ["Cricket", "🏏"], ["Tennis", "🎾"],
  ["Table Tennis", "🏓"], ["Basketball", "🏀"], ["Pickleball", "🥒"], ["Swimming", "🏊"],
  ["Squash", "🎯"], ["Volleyball", "🏐"],
];

const VENUES: VenueSeed[] = [
  {
    slug: "smash-arena-koramangala", name: "Smash Arena", city: "Bengaluru", area: "Koramangala",
    address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru 560034", lat: 12.9352, lng: 77.6245,
    description: "Eight synthetic-mat badminton courts with tournament-grade lighting, plus two pickleball courts. Non-marking shoes mandatory.",
    amenities: ["Parking", "Changing Room", "Drinking Water", "Washroom", "First Aid", "Equipment Rental", "Cafeteria"],
    open: 6, close: 23, rating: 4.6, ratingCount: 412, freeCancelHours: 24, cancelFeePct: 10, theme: "emerald",
    courts: [
      ...[1, 2, 3, 4, 5, 6].map((i) => ({ sport: "Badminton", name: `Court ${i}`, weekday: 350, weekend: 450, peakExtra: 100 })),
      { sport: "Pickleball", name: "Pickleball 1", weekday: 500, weekend: 600 },
      { sport: "Pickleball", name: "Pickleball 2", weekday: 500, weekend: 600 },
    ],
  },
  {
    slug: "turf-town-hsr", name: "Turf Town", city: "Bengaluru", area: "HSR Layout",
    address: "27th Main Rd, Sector 2, HSR Layout, Bengaluru 560102", lat: 12.9121, lng: 77.6446,
    description: "Two FIFA-approved 5-a-side artificial turfs and a box cricket arena, floodlit till midnight.",
    amenities: ["Parking", "Floodlights", "Washroom", "Drinking Water", "Seating", "Bibs & Balls"],
    open: 6, close: 24, rating: 4.4, ratingCount: 288, freeCancelHours: 12, cancelFeePct: 15, theme: "lime",
    courts: [
      { sport: "Football", name: "Turf A (5-a-side)", weekday: 1200, weekend: 1500, peakExtra: 300 },
      { sport: "Football", name: "Turf B (7-a-side)", weekday: 1800, weekend: 2200, peakExtra: 400 },
      { sport: "Cricket", name: "Box Cricket Arena", weekday: 1400, weekend: 1700, peakExtra: 300 },
    ],
  },
  {
    slug: "ace-tennis-indiranagar", name: "Ace Tennis Academy", city: "Bengaluru", area: "Indiranagar",
    address: "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038", lat: 12.9719, lng: 77.6412,
    description: "Four clay and two hard courts. Ball machine and coaching available on request.",
    amenities: ["Parking", "Changing Room", "Shower", "Pro Shop", "Coaching", "Drinking Water"],
    open: 5, close: 22, rating: 4.7, ratingCount: 156, freeCancelHours: 24, cancelFeePct: 10, theme: "orange",
    courts: [
      { sport: "Tennis", name: "Clay Court 1", weekday: 600, weekend: 750 },
      { sport: "Tennis", name: "Clay Court 2", weekday: 600, weekend: 750 },
      { sport: "Tennis", name: "Hard Court 1", weekday: 700, weekend: 850, peakExtra: 150 },
      { sport: "Squash", name: "Squash Court", weekday: 400, weekend: 500 },
    ],
  },
  {
    slug: "hoops-and-more-whitefield", name: "Hoops & More", city: "Bengaluru", area: "Whitefield",
    address: "ITPL Main Rd, Whitefield, Bengaluru 560066", lat: 12.9698, lng: 77.7500,
    description: "Indoor basketball, volleyball and table tennis under one roof. Air-conditioned TT hall.",
    amenities: ["Parking", "AC (TT Hall)", "Washroom", "Drinking Water", "Equipment Rental"],
    open: 6, close: 22, rating: 4.2, ratingCount: 97, freeCancelHours: 24, cancelFeePct: 20, theme: "violet",
    courts: [
      { sport: "Basketball", name: "Full Court", weekday: 900, weekend: 1100 },
      { sport: "Volleyball", name: "Volleyball Court", weekday: 700, weekend: 850 },
      { sport: "Table Tennis", name: "TT Table 1", weekday: 200, weekend: 250 },
      { sport: "Table Tennis", name: "TT Table 2", weekday: 200, weekend: 250 },
      { sport: "Table Tennis", name: "TT Table 3", weekday: 200, weekend: 250 },
    ],
  },
  {
    slug: "shuttle-hub-gachibowli", name: "Shuttle Hub", city: "Hyderabad", area: "Gachibowli",
    address: "Financial District Rd, Gachibowli, Hyderabad 500032", lat: 17.4401, lng: 78.3489,
    description: "Ten wooden-floor badminton courts with BWF-standard mats. Coaching batches in the mornings.",
    amenities: ["Parking", "Changing Room", "Drinking Water", "Washroom", "Coaching", "Cafeteria"],
    open: 5, close: 23, rating: 4.5, ratingCount: 531, freeCancelHours: 24, cancelFeePct: 10, theme: "emerald",
    courts: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ sport: "Badminton", name: `Court ${i}`, weekday: 300, weekend: 400, peakExtra: 100 })),
  },
  {
    slug: "kick-off-kondapur", name: "Kick Off Arena", city: "Hyderabad", area: "Kondapur",
    address: "Botanical Garden Rd, Kondapur, Hyderabad 500084", lat: 17.4608, lng: 78.3675,
    description: "Rooftop 5-a-side turf with city views and a covered box cricket net.",
    amenities: ["Parking", "Floodlights", "Washroom", "Seating", "Balls Provided"],
    open: 6, close: 24, rating: 4.3, ratingCount: 204, freeCancelHours: 12, cancelFeePct: 15, theme: "lime",
    courts: [
      { sport: "Football", name: "Rooftop Turf", weekday: 1100, weekend: 1400, peakExtra: 300 },
      { sport: "Cricket", name: "Box Cricket", weekday: 1200, weekend: 1500, peakExtra: 300 },
    ],
  },
  {
    slug: "marina-sports-adyar", name: "Marina Sports Club", city: "Chennai", area: "Adyar",
    address: "LB Rd, Adyar, Chennai 600020", lat: 13.0012, lng: 80.2565,
    description: "Six badminton courts, a 25 m swimming pool and two tennis courts near the beach.",
    amenities: ["Parking", "Swimming Pool", "Changing Room", "Shower", "Drinking Water", "Cafeteria"],
    open: 5, close: 22, rating: 4.4, ratingCount: 178, freeCancelHours: 24, cancelFeePct: 10, theme: "sky",
    courts: [
      ...[1, 2, 3, 4].map((i) => ({ sport: "Badminton", name: `Court ${i}`, weekday: 320, weekend: 400 })),
      { sport: "Swimming", name: "Pool Lane Pass", weekday: 250, weekend: 300 },
      { sport: "Tennis", name: "Tennis Court 1", weekday: 550, weekend: 700 },
    ],
  },
  {
    slug: "goal-post-andheri", name: "Goal Post", city: "Mumbai", area: "Andheri West",
    address: "Veera Desai Rd, Andheri West, Mumbai 400053", lat: 19.1360, lng: 72.8296,
    description: "Mumbai's most-booked 7-a-side turf. Two turfs, floodlights, and a viewing deck.",
    amenities: ["Parking", "Floodlights", "Washroom", "Drinking Water", "Seating", "Bibs & Balls"],
    open: 6, close: 24, rating: 4.5, ratingCount: 640, freeCancelHours: 24, cancelFeePct: 20, theme: "lime",
    courts: [
      { sport: "Football", name: "Turf 1 (7-a-side)", weekday: 2200, weekend: 2800, peakExtra: 500 },
      { sport: "Football", name: "Turf 2 (5-a-side)", weekday: 1600, weekend: 2000, peakExtra: 400 },
      { sport: "Cricket", name: "Turf 1 (Cricket)", weekday: 2200, weekend: 2800, peakExtra: 500 },
    ],
  },
  {
    slug: "racket-republic-powai", name: "Racket Republic", city: "Mumbai", area: "Powai",
    address: "Hiranandani Gardens, Powai, Mumbai 400076", lat: 19.1176, lng: 72.9060,
    description: "Air-conditioned badminton and pickleball centre with app-controlled lighting.",
    amenities: ["AC", "Parking", "Changing Room", "Equipment Rental", "Drinking Water"],
    open: 6, close: 23, rating: 4.6, ratingCount: 221, freeCancelHours: 24, cancelFeePct: 10, theme: "emerald",
    courts: [
      ...[1, 2, 3, 4].map((i) => ({ sport: "Badminton", name: `AC Court ${i}`, weekday: 500, weekend: 650, peakExtra: 150 })),
      { sport: "Pickleball", name: "Pickleball Court", weekday: 700, weekend: 850 },
    ],
  },
  {
    slug: "play-park-gurugram", name: "Play Park", city: "Delhi NCR", area: "Gurugram Sector 29",
    address: "Leisure Valley Rd, Sector 29, Gurugram 122001", lat: 28.4670, lng: 77.0670,
    description: "Multi-sport complex: badminton, basketball, football turf and cricket nets.",
    amenities: ["Parking", "Floodlights", "Washroom", "Changing Room", "Cafeteria", "Drinking Water"],
    open: 6, close: 23, rating: 4.3, ratingCount: 302, freeCancelHours: 24, cancelFeePct: 15, theme: "violet",
    courts: [
      ...[1, 2, 3].map((i) => ({ sport: "Badminton", name: `Court ${i}`, weekday: 400, weekend: 500 })),
      { sport: "Basketball", name: "Half Court", weekday: 600, weekend: 750 },
      { sport: "Football", name: "Turf (5-a-side)", weekday: 1500, weekend: 1900, peakExtra: 300 },
      { sport: "Cricket", name: "Cricket Net 1", weekday: 500, weekend: 600 },
    ],
  },
  {
    slug: "deccan-turf-baner", name: "Deccan Turf", city: "Pune", area: "Baner",
    address: "Baner Rd, Baner, Pune 411045", lat: 18.5590, lng: 73.7868,
    description: "Two 5-a-side turfs and four badminton courts with a rooftop café.",
    amenities: ["Parking", "Floodlights", "Cafeteria", "Washroom", "Drinking Water"],
    open: 6, close: 23, rating: 4.4, ratingCount: 143, freeCancelHours: 12, cancelFeePct: 10, theme: "orange",
    courts: [
      { sport: "Football", name: "Turf A", weekday: 1000, weekend: 1300, peakExtra: 200 },
      { sport: "Football", name: "Turf B", weekday: 1000, weekend: 1300, peakExtra: 200 },
      ...[1, 2, 3, 4].map((i) => ({ sport: "Badminton", name: `Court ${i}`, weekday: 300, weekend: 380 })),
    ],
  },
  {
    slug: "aqua-tt-anna-nagar", name: "Aqua & TT Centre", city: "Chennai", area: "Anna Nagar",
    address: "2nd Ave, Anna Nagar, Chennai 600040", lat: 13.0850, lng: 80.2101,
    description: "Heated pool with lane booking and a six-table TT hall.",
    amenities: ["Swimming Pool", "Changing Room", "Shower", "Lockers", "Drinking Water"],
    open: 5, close: 21, rating: 4.1, ratingCount: 88, freeCancelHours: 24, cancelFeePct: 10, theme: "sky",
    courts: [
      { sport: "Swimming", name: "Pool Lane Pass", weekday: 200, weekend: 250 },
      ...[1, 2, 3].map((i) => ({ sport: "Table Tennis", name: `TT Table ${i}`, weekday: 180, weekend: 220 })),
    ],
  },
];

const COACHES = [
  { name: "Ravi Kumar", sport: "Badminton", city: "Bengaluru", area: "Koramangala", exp: 12, price: 800, rating: 4.8, bio: "Former state-level player. Beginner to advanced batches, footwork and smash clinics." },
  { name: "Priya Nair", sport: "Tennis", city: "Bengaluru", area: "Indiranagar", exp: 9, price: 1200, rating: 4.9, bio: "ITF-certified coach. Junior development and adult club-level programmes." },
  { name: "Coach Fernandes", sport: "Football", city: "Mumbai", area: "Andheri West", exp: 15, price: 1000, rating: 4.7, bio: "AFC B licence. Grassroots and academy training for ages 6 to 18." },
  { name: "Sneha Reddy", sport: "Swimming", city: "Chennai", area: "Adyar", exp: 7, price: 600, rating: 4.6, bio: "Learn-to-swim and stroke correction for adults and kids." },
  { name: "Arjun Mehta", sport: "Cricket", city: "Delhi NCR", area: "Gurugram", exp: 10, price: 900, rating: 4.5, bio: "Ranji Trophy player. Batting and wicket-keeping specialist nets." },
  { name: "Kiran Rao", sport: "Basketball", city: "Hyderabad", area: "Gachibowli", exp: 8, price: 700, rating: 4.4, bio: "College-level coach; shooting form, conditioning and team play." },
  { name: "Meera Iyer", sport: "Pickleball", city: "Mumbai", area: "Powai", exp: 4, price: 900, rating: 4.7, bio: "Certified pickleball instructor. Intro clinics every weekend." },
  { name: "Sanjay Patil", sport: "Table Tennis", city: "Pune", area: "Baner", exp: 11, price: 500, rating: 4.6, bio: "National-level TT player; serve and spin masterclasses." },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function seed(db: DatabaseSync) {
  db.exec("BEGIN");
  try {
    const cityId: Record<string, number> = {};
    for (const c of CITIES) {
      const r = db.prepare("INSERT INTO cities(name, slug) VALUES (?, ?)").run(c, slugify(c));
      cityId[c] = Number(r.lastInsertRowid);
    }
    const sportId: Record<string, number> = {};
    for (const [name, icon] of SPORTS) {
      const r = db.prepare("INSERT INTO sports(name, slug, icon) VALUES (?, ?, ?)").run(name, slugify(name), icon);
      sportId[name] = Number(r.lastInsertRowid);
    }

    const insUser = db.prepare("INSERT INTO users(phone, name, email, city_id, role, karma, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const partnerId = Number(insUser.run("9999999999", "Venue Partner", "partner@example.com", cityId["Bengaluru"], "partner", 0, "PARTNER1").lastInsertRowid);
    const players = [
      ["9000000001", "Aarav Shah", "Bengaluru"], ["9000000002", "Diya Menon", "Bengaluru"],
      ["9000000003", "Rohan Gupta", "Hyderabad"], ["9000000004", "Ishita Rao", "Mumbai"],
      ["9000000005", "Vikram Singh", "Delhi NCR"], ["9000000006", "Ananya Krishnan", "Chennai"],
      ["9000000007", "Kabir Joshi", "Pune"],
    ] as const;
    const playerIds: number[] = [];
    for (const [phone, name, city] of players) {
      playerIds.push(Number(insUser.run(phone, name, null, cityId[city], "player", 12, "REF" + phone.slice(-4)).lastInsertRowid));
    }
    const insSkill = db.prepare("INSERT INTO user_skills(user_id, sport_id, level) VALUES (?, ?, ?)");
    insSkill.run(playerIds[0], sportId["Badminton"], "intermediate");
    insSkill.run(playerIds[0], sportId["Football"], "beginner");
    insSkill.run(playerIds[1], sportId["Badminton"], "advanced");
    insSkill.run(playerIds[2], sportId["Badminton"], "intermediate");
    insSkill.run(playerIds[3], sportId["Football"], "intermediate");
    insSkill.run(playerIds[4], sportId["Cricket"], "advanced");

    const insVenue = db.prepare(`INSERT INTO venues(slug, name, city_id, area, address, lat, lng, description, amenities, open_hour, close_hour,
      rating, rating_count, free_cancel_hours, cancel_fee_pct, owner_user_id, theme) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insVS = db.prepare("INSERT OR IGNORE INTO venue_sports(venue_id, sport_id) VALUES (?, ?)");
    const insCourt = db.prepare("INSERT INTO courts(venue_id, sport_id, name) VALUES (?, ?, ?)");
    const insPrice = db.prepare("INSERT INTO pricing_rules(court_id, day_type, start_hour, end_hour, price) VALUES (?, ?, ?, ?, ?)");
    const venueIds: Record<string, number> = {};
    for (const v of VENUES) {
      // The first four Bengaluru venues belong to the demo partner account.
      const owner = v.city === "Bengaluru" ? partnerId : null;
      const vid = Number(insVenue.run(v.slug, v.name, cityId[v.city], v.area, v.address, v.lat, v.lng, v.description,
        JSON.stringify(v.amenities), v.open, v.close, v.rating, v.ratingCount, v.freeCancelHours, v.cancelFeePct, owner, v.theme).lastInsertRowid);
      venueIds[v.slug] = vid;
      for (const c of v.courts) {
        insVS.run(vid, sportId[c.sport]);
        const cid = Number(insCourt.run(vid, sportId[c.sport], c.name).lastInsertRowid);
        // Pricing engine: off-peak vs peak (18:00–22:00) on weekdays, flat weekend rate.
        const peak = c.peakExtra ?? 0;
        insPrice.run(cid, "weekday", 0, 18, c.weekday);
        insPrice.run(cid, "weekday", 18, 22, c.weekday + peak);
        insPrice.run(cid, "weekday", 22, 24, c.weekday);
        insPrice.run(cid, "weekend", 0, 24, c.weekend);
      }
    }

    const insReview = db.prepare("INSERT INTO reviews(venue_id, user_id, rating, comment) VALUES (?, ?, ?, ?)");
    insReview.run(venueIds["smash-arena-koramangala"], playerIds[0], 5, "Great mats and lighting. Courts 5 and 6 are the best.");
    insReview.run(venueIds["smash-arena-koramangala"], playerIds[1], 4, "Parking gets tight on weekends, otherwise perfect.");
    insReview.run(venueIds["turf-town-hsr"], playerIds[0], 4, "Turf B is spacious. Bring your own bibs on busy nights.");
    insReview.run(venueIds["shuttle-hub-gachibowli"], playerIds[2], 5, "Wooden flooring is easy on the knees. Highly recommended.");
    insReview.run(venueIds["goal-post-andheri"], playerIds[3], 5, "Best turf in the west suburbs.");

    const insCoach = db.prepare("INSERT INTO coaches(name, sport_id, city_id, area, experience_years, price_per_session, rating, bio) VALUES (?,?,?,?,?,?,?,?)");
    for (const c of COACHES) insCoach.run(c.name, sportId[c.sport], cityId[c.city], c.area, c.exp, c.price, c.rating, c.bio);

    // Upcoming games hosted by demo players.
    const today = todayISO();
    const insGame = db.prepare(`INSERT INTO games(host_user_id, sport_id, city_id, venue_id, location_text, date, start_hour, end_hour, max_players, price_per_player, skill_level, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insGP = db.prepare("INSERT INTO game_players(game_id, user_id, status) VALUES (?, ?, ?)");
    const games: [number, string, string, string | null, string, string, number, number, number, number, string, string][] = [
      [playerIds[0], "Badminton", "Bengaluru", "smash-arena-koramangala", "Smash Arena, Koramangala", addDays(today, 1), 19, 20, 4, 120, "intermediate", "Doubles game, need 2 more. Court is booked, split the cost."],
      [playerIds[1], "Badminton", "Bengaluru", "smash-arena-koramangala", "Smash Arena, Koramangala", addDays(today, 2), 7, 8, 4, 100, "advanced", "Morning doubles. Fast-paced, competitive players only."],
      [playerIds[0], "Football", "Bengaluru", "turf-town-hsr", "Turf Town, HSR Layout", addDays(today, 3), 20, 21, 14, 150, "any", "7-a-side friendly. All levels welcome, bibs provided."],
      [playerIds[2], "Badminton", "Hyderabad", "shuttle-hub-gachibowli", "Shuttle Hub, Gachibowli", addDays(today, 1), 18, 19, 4, 90, "intermediate", "Singles/doubles rotation."],
      [playerIds[3], "Football", "Mumbai", "goal-post-andheri", "Goal Post, Andheri West", addDays(today, 2), 21, 22, 14, 200, "intermediate", "Regular Thursday game. Need 5 more."],
      [playerIds[4], "Cricket", "Delhi NCR", "play-park-gurugram", "Play Park, Gurugram", addDays(today, 4), 8, 10, 12, 150, "any", "Box cricket, 6-a-side, 2 hours."],
      [playerIds[5], "Swimming", "Chennai", "marina-sports-adyar", "Marina Sports Club, Adyar", addDays(today, 1), 6, 7, 6, 0, "beginner", "Casual lap swimming group. Free to join, pay the pool pass at the venue."],
      [playerIds[6], "Badminton", "Pune", "deccan-turf-baner", "Deccan Turf, Baner", addDays(today, 2), 19, 20, 4, 90, "beginner", "Beginners welcome, just want to rally."],
    ];
    for (const g of games) {
      const gid = Number(insGame.run(g[0], sportId[g[1]], cityId[g[2]], g[3] ? venueIds[g[3]] : null, g[4], g[5], g[6], g[7], g[8], g[9], g[10], g[11]).lastInsertRowid);
      insGP.run(gid, g[0], "accepted");
    }
    // A couple of accepted co-players so games look alive.
    insGP.run(1, playerIds[1], "accepted");
    insGP.run(3, playerIds[1], "accepted");
    insGP.run(3, playerIds[2], "accepted");
    insGP.run(5, playerIds[0], "accepted");

    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
