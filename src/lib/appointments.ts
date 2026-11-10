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
  const existing = await prisma.appointment.findMany({ where: { userId }, select: { animal: true, clinic: true, scheduledAt: true, status: true } });
  const first = new Date();
  first.setDate(first.getDate() + 1); first.setHours(10, 0, 0, 0);
  const second = new Date(first); second.setDate(second.getDate() + 1); second.setHours(14, 30, 0, 0);
  const third = new Date(second); third.setDate(third.getDate() + 1); third.setHours(9, 15, 0, 0);
  const onFirstDay = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return new Date(first.getFullYear(), first.getMonth(), first.getDate(), hour, minute);
  };
  const busyDay = [
    { time: "08:00", clinic: "Clínica Patas & Cia", animal: "Mel", examType: "Hemograma", status: "AGENDADO", notes: "Coleta em jejum." },
    { time: "08:30", clinic: "Vet Central", animal: "Bob", examType: "Bioquímico", status: "AGENDADO", notes: null },
    { time: "09:00", clinic: "Bicho Feliz", animal: "Pipoca", examType: "Cultura", status: "AGENDADO", notes: "Confirmar chegada da amostra." },
    { time: "09:30", clinic: "Clínica Horizonte", animal: "Simba", examType: "Parasitológico", status: "COLETADO", notes: "Amostra recebida." },
    { time: "10:30", clinic: "Vida Animal", animal: "Belinha", examType: "Hemograma", status: "AGENDADO", notes: null },
    { time: "11:00", clinic: "Clínica São Francisco", animal: "Toby", examType: "Hormonal", status: "AGENDADO", notes: "Tutor virá pela manhã." },
    { time: "11:30", clinic: "Vet Central", animal: "Kiara", examType: "Cultura", status: "CANCELADO", notes: "Tutor solicitou remarcação." },
    { time: "13:00", clinic: "Clínica Patas & Cia", animal: "Apolo", examType: "Bioquímico", status: "AGENDADO", notes: "Jejum de 8 horas." },
    { time: "13:30", clinic: "Bicho Feliz", animal: "Frida", examType: "Citologia", status: "AGENDADO", notes: null },
    { time: "14:00", clinic: "Clínica Horizonte", animal: "Duke", examType: "Hemograma", status: "AGENDADO", notes: "Coleta com responsável presente." },
    { time: "14:30", clinic: "Vida Animal", animal: "Jade", examType: "Sorologia", status: "COLETADO", notes: "Amostra encaminhada." },
    { time: "15:00", clinic: "Clínica São Francisco", animal: "Nala", examType: "Bioquímico", status: "AGENDADO", notes: null },
  ];
  const examples = [
    { clinic: "Clínica Patas & Cia", animal: "Luna", examType: "Hemograma", scheduledAt: first, status: "AGENDADO", notes: "Coleta em jejum.", userId },
    { clinic: "Vet Central", animal: "Thor", examType: "Bioquímico", scheduledAt: second, status: "AGENDADO", notes: "Confirmar responsável.", userId },
    { clinic: "Clínica Vida Animal", animal: "Mia", examType: "Cultura", scheduledAt: third, status: "COLETADO", notes: "Amostra encaminhada.", userId },
    { clinic: "Bicho Feliz", animal: "Bento", examType: "Hemograma", scheduledAt: new Date(first.getFullYear(), first.getMonth(), first.getDate() + 2, 11, 0), status: "AGENDADO", notes: "Tutor virá pela manhã.", userId },
    { clinic: "Vet Central", animal: "Nina", examType: "Ultrassom", scheduledAt: new Date(first.getFullYear(), first.getMonth(), first.getDate() + 4, 15, 0), status: "AGENDADO", notes: null, userId },
    { clinic: "Patas & Cia", animal: "Max", examType: "Cultura", scheduledAt: new Date(first.getFullYear(), first.getMonth(), first.getDate() + 6, 9, 30), status: "COLETADO", notes: "Amostra recebida.", userId },
    { clinic: "Vida Animal", animal: "Amora", examType: "Bioquímico", scheduledAt: new Date(first.getFullYear(), first.getMonth(), first.getDate() + 8, 13, 0), status: "AGENDADO", notes: "Jejum de 8 horas.", userId },
    { clinic: "Clínica Horizonte", animal: "Fred", examType: "Hemograma", scheduledAt: new Date(first.getFullYear(), first.getMonth(), first.getDate() + 10, 16, 30), status: "CANCELADO", notes: "Remarcado pelo tutor.", userId },
    ...busyDay.map(({ time, ...item }) => ({ ...item, scheduledAt: onFirstDay(time), userId })),
  ];
  if (existing.length >= examples.length) return;
  const missing = examples.filter((example) =>
    !existing.some((item) => item.animal === example.animal && item.clinic === example.clinic) &&
    (example.status !== "AGENDADO" || !existing.some((item) => item.status === "AGENDADO" && item.scheduledAt.getTime() === example.scheduledAt.getTime())));
  if (missing.length) await prisma.appointment.createMany({ data: missing });
}
