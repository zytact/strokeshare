import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

// Check for environment variables and provide meaningful errors
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not defined');
}

if (!process.env.DATABASE_AUTH_TOKEN) {
    throw new Error('DATABASE_AUTH_TOKEN environment variable is not defined');
}

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle({ client });

export { db };
