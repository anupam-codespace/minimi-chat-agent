import { IDatabaseAdapter } from "./types";
import { PostgresAdapter } from "./postgres";
import { LocalDatabaseAdapter } from "./local";
import { config } from "../config";

let dbInstance: IDatabaseAdapter | null = null;
let initPromise: Promise<IDatabaseAdapter> | null = null;

export async function getDatabase(): Promise<IDatabaseAdapter> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (config.databaseUrl) {
      try {
        const pg = new PostgresAdapter(config.databaseUrl);
        await pg.init();
        console.log("Persistence: connected to primary PostgreSQL database.");
        dbInstance = pg;
        return pg;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `PostgreSQL connection failed (${message}). Falling back to local persistent store.`
        );
      }
    }

    const local = new LocalDatabaseAdapter();
    await local.init();
    console.log("Persistence: using local persistent store (.data/minimi.db.json).");
    dbInstance = local;
    return local;
  })();

  return initPromise;
}

export * from "./types";

