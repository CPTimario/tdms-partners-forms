import { MongoClient, Db } from "mongodb";

// Use dynamic env lookups inside functions so importing this module
// in browser/test environments does not throw immediately.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB);
}

function ensureEnv() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!(uri && dbName)) {
    throw new Error("Missing MongoDB env: set MONGODB_URI and MONGODB_DB before connecting");
  }
  return { uri, dbName };
}

export async function getDb(): Promise<Db> {
  const { uri, dbName } = ensureEnv();

  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export async function getClient(): Promise<MongoClient> {
  const { uri, dbName } = ensureEnv();

  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(dbName);
  return cachedClient;
}
