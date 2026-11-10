import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth";
import {
  APPOINTMENT_STATUSES,
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
  const session = await getSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const statuses = [...new Set(searchParams.getAll("status"))].filter((status) =>
    APPOINTMENT_STATUSES.some((allowed) => allowed === status));
  const date = searchParams.get("date");
  const clinic = searchParams.get("clinic")?.trim() ?? "";
  if (clinic.length > 100) {
    return NextResponse.json({ message: "A busca deve ter até 100 caracteres." }, { status: 400 });
  }
  const paginated = searchParams.has("page") || searchParams.has("pageSize");
  const pageText = searchParams.get("page") ?? "1";
  const pageSizeText = searchParams.get("pageSize") ?? "10";
  const page = Number(pageText);
  const pageSize = Number(pageSizeText);
  if (paginated && (!/^[1-9]\d*$/.test(pageText) || !/^[1-9]\d*$/.test(pageSizeText)
    || !Number.isSafeInteger(page) || page > 10000 || !Number.isSafeInteger(pageSize) || pageSize > 50)) {
    return NextResponse.json({ message: "Paginação inválida." }, { status: 400 });
  }
  const dateStart = date ? new Date(`${date}T00:00:00`) : null;
  const dateEnd = date ? new Date(`${date}T23:59:59.999`) : null;

  const where: Prisma.AppointmentWhereInput = {
    userId: session.userId,
    ...(clinic ? { clinic: { contains: clinic } } : {}),
    ...(statuses.length ? { status: { in: statuses } } : {}),
    ...(dateStart && dateEnd && !Number.isNaN(dateStart.getTime())
      ? { scheduledAt: { gte: dateStart, lte: dateEnd } }
      : {}),
  };
  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    ...(paginated ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
  });

  if (!paginated) return NextResponse.json({ appointments });
  const total = await prisma.appointment.count({ where });
  return NextResponse.json({ appointments, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
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

  if (parsed.data.status === "AGENDADO" && (await hasScheduledConflict(dateResult.scheduledAt, session.userId))) {
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
