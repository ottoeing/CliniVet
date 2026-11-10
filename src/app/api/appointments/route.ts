import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  appointmentSchema,
  hasScheduledConflict,
  parseScheduledAt,
  validationResponse,
} from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await getSession())) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const dateStart = date ? new Date(`${date}T00:00:00`) : null;
  const dateEnd = date ? new Date(`${date}T23:59:59.999`) : null;

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(status === "AGENDADO" || status === "COLETADO" || status === "CANCELADO"
        ? { status }
        : {}),
      ...(dateStart && dateEnd && !Number.isNaN(dateStart.getTime())
        ? { scheduledAt: { gte: dateStart, lte: dateEnd } }
        : {}),
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body: unknown = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return validationResponse("Verifique os dados informados.", parsed.error.flatten().fieldErrors);
  }

  const scheduledAtValue = parsed.data.scheduledAt;
  if (!scheduledAtValue) {
    return validationResponse("Data e hora da coleta são obrigatórias.", {
      scheduledAt: ["Data e hora da coleta são obrigatórias."],
    });
  }

  const dateResult = parseScheduledAt(scheduledAtValue);
  if ("error" in dateResult) {
    return validationResponse(dateResult.error, { scheduledAt: [dateResult.error] });
  }

  if (parsed.data.status === "AGENDADO" && (await hasScheduledConflict(dateResult.scheduledAt))) {
    return validationResponse("Já existe uma coleta agendada neste horário.", {
      scheduledAt: ["Já existe uma coleta agendada neste horário."],
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinic: parsed.data.clinic,
      animal: parsed.data.animal,
      examType: parsed.data.examType,
      scheduledAt: dateResult.scheduledAt,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
