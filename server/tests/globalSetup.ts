import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const DEV_URL = "mysql://root:palatia@localhost:3306/palatia";
const TEST_URL = "mysql://root:palatia@localhost:3306/palatia_test";

// Fresh test DB on every `npm test`: create database, apply migrations, wipe data.
export async function setup() {
  const bootstrap = new PrismaClient({ datasources: { db: { url: DEV_URL } } });
  await bootstrap.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS palatia_test`);
  await bootstrap.$disconnect();

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_URL },
  });
}