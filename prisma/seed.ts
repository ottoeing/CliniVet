import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    console.log("DEMO_PASSWORD não configurada; crie uma conta pela tela de cadastro.");
    return;
  }
  if (demoPassword.length < 6) throw new Error("DEMO_PASSWORD deve ter ao menos 6 caracteres.");
  const passwordHash = await bcrypt.hash(demoPassword, 12);

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
