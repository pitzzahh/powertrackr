// Thanks to https://github.com/drizzle-team/drizzle-orm/issues/5266#issuecomment-3894116062

import { promises as fs } from "node:fs";
import { resolve, join } from "node:path";

type MigrationEntry = {
  folder: string;
  sourcePath: string;
  targetPath: string;
};

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? "./migrations";
const CLEAN_FLAT = process.env.CLEAN_FLAT === "1";

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readText(path: string) {
  return fs.readFile(path, "utf8");
}

async function safeWrite(path: string, content: string) {
  await fs.writeFile(path, content, "utf8");
}

async function listMigrationFolders(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function collectMigrations(baseDir: string): Promise<MigrationEntry[]> {
  const folders = await listMigrationFolders(baseDir);
  const migrations: MigrationEntry[] = [];

  for (const folder of folders) {
    const sourcePath = join(baseDir, folder, "migration.sql");
    const targetPath = join(baseDir, `${folder}.sql`);
    if (await fileExists(sourcePath)) {
      migrations.push({ folder, sourcePath, targetPath });
    }
  }

  return migrations.sort((a, b) => a.folder.localeCompare(b.folder));
}

async function cleanFlatSqlFiles(baseDir: string, migrations: MigrationEntry[]) {
  const safeNames = new Set(migrations.map((m) => `${m.folder}.sql`));
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name);

  for (const sqlFile of sqlFiles) {
    if (!safeNames.has(sqlFile)) {
      await fs.unlink(join(baseDir, sqlFile));
    }
  }
}

async function flattenMigrations() {
  const baseDir = resolve(MIGRATIONS_DIR);
  if (!(await fileExists(baseDir))) {
    throw new Error(`Migrations directory does not exist: ${baseDir}`);
  }

  const migrations = await collectMigrations(baseDir);

  if (CLEAN_FLAT) {
    await cleanFlatSqlFiles(baseDir, migrations);
  }

  for (const migration of migrations) {
    const content = await readText(migration.sourcePath);
    if (await fileExists(migration.targetPath)) {
      const existing = await readText(migration.targetPath);
      if (existing !== content) {
        throw new Error(
          `Migration conflict: ${migration.targetPath} already exists with different content.`
        );
      }
      continue;
    }

    await safeWrite(migration.targetPath, content);
  }

  if (migrations.length === 0) {
    console.info(`No nested migrations found in ${baseDir}`);
  } else {
    console.info(`Flattened ${migrations.length} migrations into ${baseDir}`);
  }
}

flattenMigrations().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
