import { drizzle } from "drizzle-orm/libsql";
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";

const db = drizzle({
  connection: {
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  },
  schema,
  relations,
});

export { db };
