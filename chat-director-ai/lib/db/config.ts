import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use Supabase service role connection to bypass RLS
// This is secure because server-side code controls access
const client = postgres(process.env.POSTGRES_URL!, {
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  },
});

export const db = drizzle(client);