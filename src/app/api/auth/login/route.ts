import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth";
import { ensureDemoAppointments } from "@/lib/appointments";
import { credentialsSchema } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";

const INVALID_CREDENTIALS = { message: "Credenciais inválidas." };

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true, passwordHash: true },
  });

  const passwordMatches = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  await ensureDemoAppointments(user.id);
  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
