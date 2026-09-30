import { Client } from "pg";

export function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in environment variables.");
  }
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}
