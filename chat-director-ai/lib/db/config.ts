import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use Supabase connection string
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);