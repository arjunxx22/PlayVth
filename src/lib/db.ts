import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.PLAYVTH_DB_PATH || path.join(DB_DIR, "playvth.db");

declare global {
  var __playvthDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);
  const row = db.prepare("SELECT COUNT(*) AS n FROM cities").get() as { n: number };
  if (row.n === 0) seed(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__playvthDb) globalThis.__playvthDb = open();
  return globalThis.__playvthDb;
}

// Small typed helpers around node:sqlite
// node:sqlite returns null-prototype rows; spread them into plain objects so they can cross the RSC boundary.
export function all<T>(sql: string, ...params: (string | number | null)[]): T[] {
  return (getDb().prepare(sql).all(...params) as object[]).map((r) => ({ ...r })) as T[];
}
export function get<T>(sql: string, ...params: (string | number | null)[]): T | undefined {
  const r = getDb().prepare(sql).get(...params) as object | undefined;
  return r ? ({ ...r } as T) : undefined;
}
export function run(sql: string, ...params: (string | number | null)[]) {
  return getDb().prepare(sql).run(...params);
}
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
