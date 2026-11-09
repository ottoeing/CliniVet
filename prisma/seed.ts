import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Clinivet@2026", 12);

  await prisma.user.upsert({
    where: { email: "admin@clinivet.local" },
    update: { passwordHash },
    create: {
      email: "admin@clinivet.local",
      passwordHash,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
