import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const APPOINTMENT_STATUSES = ["AGENDADO", "COLETADO", "CANCELADO"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const textField = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`);

export const appointmentSchema = z.object({
  clinic: textField("Clínica"),
  animal: textField("Animal"),
  examType: textField("Tipo de exame"),
  scheduledAt: z.string().min(1, "Data e hora da coleta são obrigatórias."),
  status: z.enum(APPOINTMENT_STATUSES).default("AGENDADO"),
  notes: z.string().trim().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export function parseScheduledAt(value: string): { scheduledAt: Date } | { error: string } {
  const scheduledAt = new Date(value);

  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Informe uma data e hora válidas." };
  }

  if (scheduledAt.getTime() <= Date.now()) {
    return { error: "A data e hora da coleta não podem estar no passado." };
  }

  return { scheduledAt };
}

export async function hasScheduledConflict(scheduledAt: Date, excludedId?: string) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      scheduledAt,
      status: "AGENDADO",
      ...(excludedId ? { id: { not: excludedId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(conflict);
}

export function validationResponse(message: string, fields?: Record<string, string[]>) {
  return Response.json({ message, fields }, { status: 400 });
}
