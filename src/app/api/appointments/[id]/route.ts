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

export async function PATCH(request: Request, context: RouteContext<"/api/appointments/[id]">) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
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

  const appointment = await prisma.appointment.findFirst({ where: { id, userId: session.userId }, select: { id: true } });
  if (!appointment) return NextResponse.json({ message: "Agendamento não encontrado." }, { status: 404 });

  const dateResult = parseScheduledAt(scheduledAtValue);
  if ("error" in dateResult) {
    return validationResponse(dateResult.error, { scheduledAt: [dateResult.error] });
  }

  if (
    parsed.data.status === "AGENDADO" &&
    (await hasScheduledConflict(dateResult.scheduledAt, session.userId, appointment.id))
  ) {
    return validationResponse("Já existe uma coleta agendada neste horário.", {
      scheduledAt: ["Já existe uma coleta agendada neste horário."],
    });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      clinic: parsed.data.clinic,
      animal: parsed.data.animal,
      examType: parsed.data.examType,
      scheduledAt: dateResult.scheduledAt,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ appointment: updated });
}
