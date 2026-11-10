import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createSession } from "@/lib/auth";
import { ensureDemoAppointments } from "@/lib/appointments";
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

    await ensureDemoAppointments(user.id);

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
