import { drizzle } from "drizzle-orm/libsql";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";

const db = drizzle({
  connection: {
    url: DATABASE_URL,
  },
  schema,
  relations,
});

export { db };
