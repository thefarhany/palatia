import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const staff = [
    { name: "Admin", email: "admin@palatia.id", role: "ADMIN" },
    { name: "Chef Raka", email: "chef@palatia.id", role: "CHEF" },
    { name: "Waiter Sinta", email: "waiter@palatia.id", role: "WAITER" },
    { name: "Budi Customer", email: "customer@palatia.id", role: "CUSTOMER" },
  ] as const;

  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { ...s, passwordHash },
    });
  }

  console.log("Seeded: 4 default accounts (password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());