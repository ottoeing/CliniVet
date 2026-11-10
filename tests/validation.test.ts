import assert from "node:assert/strict";
import { test } from "node:test";

import { appointmentSchema, parseScheduledAt } from "../src/lib/appointments";
import { credentialsSchema } from "../src/lib/credentials";

test("exige e-mail válido e senha com pelo menos seis caracteres", () => {
  assert.equal(credentialsSchema.safeParse({ email: "sem-arroba", password: "123456" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "pessoa@", password: "123456" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "pessoa@exemplo.com", password: "12345" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "pessoa@exemplo.com", password: "123456" }).success, true);
  assert.equal(credentialsSchema.safeParse({ email: "pessoa-@gmail.com", password: "123456" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "pessoa-@exemplo.com", password: "123456" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email: "pes-soa@gmail.com", password: "123456" }).success, true);
});

test("exige campos da coleta e status conhecido", () => {
  const valid = { clinic: "Vet Central", animal: "Luna", examType: "Hemograma", scheduledAt: "2030-01-01T10:00:00" };
  assert.equal(appointmentSchema.safeParse(valid).success, true);
  assert.equal(appointmentSchema.safeParse({ ...valid, clinic: "  " }).success, false);
  assert.equal(appointmentSchema.safeParse({ ...valid, animal: "" }).success, false);
  assert.equal(appointmentSchema.safeParse({ ...valid, examType: "" }).success, false);
  assert.equal(appointmentSchema.safeParse({ ...valid, scheduledAt: "" }).success, false);
  assert.equal(appointmentSchema.safeParse({ ...valid, status: "DESCONHECIDO" }).success, false);
});

test("rejeita data inválida ou passada e aceita horário futuro", () => {
  assert.equal("error" in parseScheduledAt("invalid date"), true);
  assert.equal("error" in parseScheduledAt(new Date(Date.now() - 60_000).toISOString()), true);
  assert.equal("scheduledAt" in parseScheduledAt(new Date(Date.now() + 86_400_000).toISOString()), true);
});
