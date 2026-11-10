import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createSession } from "@/lib/auth";
import { credentialsSchema } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Verifique os dados informados.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: { id: true, email: true },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(14, 30, 0, 0);
    const thirdDay = new Date(dayAfter);
    thirdDay.setDate(thirdDay.getDate() + 1);
    thirdDay.setHours(9, 15, 0, 0);

    await prisma.appointment.createMany({
      data: [
        { clinic: "Clínica Patas & Cia", animal: "Luna", examType: "Hemograma", scheduledAt: tomorrow, status: "AGENDADO", notes: "Coleta em jejum.", userId: user.id },
        { clinic: "Vet Central", animal: "Thor", examType: "Bioquímico", scheduledAt: dayAfter, status: "AGENDADO", notes: "Confirmar responsável.", userId: user.id },
        { clinic: "Clínica Vida Animal", animal: "Mia", examType: "Cultura", scheduledAt: thirdDay, status: "COLETADO", notes: "Amostra encaminhada.", userId: user.id },
      ],
    });

    await createSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Não foi possível criar a conta com estes dados." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Não foi possível criar a conta." }, { status: 500 });
  }
}
