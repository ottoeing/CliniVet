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

export async function hasScheduledConflict(scheduledAt: Date, userId: string, excludedId?: string) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      scheduledAt,
      userId,
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

export async function ensureDemoAppointments(userId: string) {
  if (await prisma.appointment.count({ where: { userId } })) return;
  const first = new Date();
  first.setDate(first.getDate() + 1); first.setHours(10, 0, 0, 0);
  const second = new Date(first); second.setDate(second.getDate() + 1); second.setHours(14, 30, 0, 0);
  const third = new Date(second); third.setDate(third.getDate() + 1); third.setHours(9, 15, 0, 0);
  await prisma.appointment.createMany({ data: [
    { clinic: "Clínica Patas & Cia", animal: "Luna", examType: "Hemograma", scheduledAt: first, status: "AGENDADO", notes: "Coleta em jejum.", userId },
    { clinic: "Vet Central", animal: "Thor", examType: "Bioquímico", scheduledAt: second, status: "AGENDADO", notes: "Confirmar responsável.", userId },
    { clinic: "Clínica Vida Animal", animal: "Mia", examType: "Cultura", scheduledAt: third, status: "COLETADO", notes: "Amostra encaminhada.", userId },
  ] });
}
