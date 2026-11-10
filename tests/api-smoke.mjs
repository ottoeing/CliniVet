import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = process.env.CLINIVET_TEST_URL ?? "http://localhost:3000";
const firstEmail = `smoke-${randomUUID()}@example.test`;
const secondEmail = `smoke-${randomUUID()}@example.test`;
const password = `Teste-${randomUUID()}`;

async function request(path, method = "GET", body, cookie = "") {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
  };
}

try {
  assert.equal((await request("/api/appointments")).status, 401);
  assert.equal((await request("/api/appointments", "POST", { clinic: "Vet" })).status, 401);
  assert.equal((await request("/api/appointments/inexistente", "PATCH", { clinic: "Vet" })).status, 401);
  assert.equal((await request("/api/auth/register", "POST")).status, 400);
  assert.deepEqual((await request("/api/auth/login", "POST")).data, { message: "Credenciais inválidas." });
  const invalidLogin = await request("/api/auth/login", "POST", { email: firstEmail, password: "incorreta" });
  assert.equal(invalidLogin.status, 401);
  assert.equal(invalidLogin.data.message, "Credenciais inválidas.");
  for (const credentials of [
    { email: "sem-arroba", password },
    { email: `teste-@gmail.com`, password },
    { email: firstEmail, password: "curta" },
  ]) {
    const failedRegistration = await request("/api/auth/register", "POST", credentials);
    assert.equal(failedRegistration.status, 400);
    assert.ok(failedRegistration.data.fields);
    const failedLogin = await request("/api/auth/login", "POST", credentials);
    assert.equal(failedLogin.status, 401);
    assert.equal(failedLogin.data.message, "Credenciais inválidas.");
    assert.equal(failedLogin.data.fields, undefined);
  }

  const registration = await request("/api/auth/register", "POST", { email: firstEmail, password });
  assert.equal(registration.status, 201);
  assert.ok(registration.cookie);
  assert.equal((await request("/api/auth/register", "POST", { email: firstEmail, password })).status, 409);
  const firstCookie = registration.cookie;

  const initial = await request("/api/appointments", "GET", undefined, firstCookie);
  assert.equal(initial.status, 200);
  assert.ok(initial.data.appointments.length >= 20);
  assert.deepEqual(
    initial.data.appointments.map((item) => item.scheduledAt),
    initial.data.appointments.map((item) => item.scheduledAt).sort(),
  );
  assert.equal((await request("/api/appointments", "POST", undefined, firstCookie)).status, 400);
  const multipleStatuses = await request("/api/appointments?status=AGENDADO&status=COLETADO", "GET", undefined, firstCookie);
  assert.equal(multipleStatuses.status, 200);
  assert.ok(multipleStatuses.data.appointments.length > 0);
  assert.ok(multipleStatuses.data.appointments.every((item) => item.status === "AGENDADO" || item.status === "COLETADO"));
  assert.ok(multipleStatuses.data.appointments.some((item) => item.status === "AGENDADO"));
  assert.ok(multipleStatuses.data.appointments.some((item) => item.status === "COLETADO"));
  const recordsPerDay = new Map();
  for (const item of initial.data.appointments) {
    const day = new Date(item.scheduledAt).toDateString();
    recordsPerDay.set(day, (recordsPerDay.get(day) ?? 0) + 1);
  }
  assert.ok(Math.max(...recordsPerDay.values()) >= 10);
  const scheduledTimes = initial.data.appointments.filter((item) => item.status === "AGENDADO").map((item) => item.scheduledAt);
  assert.equal(new Set(scheduledTimes).size, scheduledTimes.length);
  assert.equal((await request("/api/auth/login", "POST", { email: firstEmail, password })).status, 200);
  assert.deepEqual((await request("/api/auth/login", "POST", { email: firstEmail, password: `${password}errada` })).data, { message: "Credenciais inválidas." });
  assert.equal((await request("/api/appointments", "GET", undefined, firstCookie)).data.appointments.length, initial.data.appointments.length);

  const future = new Date(Date.now() + 40 * 86_400_000);
  future.setHours(17, 45, 0, 0);
  const appointment = {
    clinic: "Clínica de teste",
    animal: "Animal de teste",
    examType: "Hemograma",
    scheduledAt: future.toISOString(),
    status: "AGENDADO",
    notes: "Teste de integração",
  };
  assert.equal((await request("/api/appointments", "POST", { ...appointment, animal: "" }, firstCookie)).status, 400);
  assert.equal((await request("/api/appointments", "POST", { ...appointment, scheduledAt: new Date(Date.now() - 86_400_000).toISOString() }, firstCookie)).status, 400);
  assert.equal((await request("/api/appointments", "POST", { ...appointment, scheduledAt: "invalid date" }, firstCookie)).status, 400);
  assert.equal((await request("/api/appointments", "POST", { ...appointment, status: "DESCONHECIDO" }, firstCookie)).status, 400);

  const created = await request("/api/appointments", "POST", appointment, firstCookie);
  assert.equal(created.status, 201);
  const id = created.data.appointment.id;
  assert.equal((await request("/api/appointments", "POST", appointment, firstCookie)).status, 400);
  assert.equal((await request(`/api/appointments/${id}`, "PATCH", { ...appointment, examType: "" }, firstCookie)).status, 400);
  assert.equal((await request(`/api/appointments/${id}`, "PATCH", undefined, firstCookie)).status, 400);
  assert.equal((await request(`/api/appointments/${id}`, "PATCH", { ...appointment, scheduledAt: "invalid date" }, firstCookie)).status, 400);
  assert.equal((await request("/api/appointments/inexistente", "PATCH", appointment, firstCookie)).status, 404);

  const dateKey = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  const byDate = await request(`/api/appointments?date=${dateKey}`, "GET", undefined, firstCookie);
  assert.ok(byDate.data.appointments.some((item) => item.id === id));
  const updated = await request(`/api/appointments/${id}`, "PATCH", { ...appointment, animal: "Animal editado" }, firstCookie);
  assert.equal(updated.status, 200);
  assert.equal(updated.data.appointment.animal, "Animal editado");
  const secondFuture = new Date(future.getTime() + 60 * 60_000).toISOString();
  const secondCreated = await request("/api/appointments", "POST", { ...appointment, scheduledAt: secondFuture }, firstCookie);
  assert.equal(secondCreated.status, 201);
  assert.equal((await request(`/api/appointments/${secondCreated.data.appointment.id}`, "PATCH", { ...appointment, scheduledAt: appointment.scheduledAt }, firstCookie)).status, 400);

  const secondRegistration = await request("/api/auth/register", "POST", { email: secondEmail, password });
  assert.equal(secondRegistration.status, 201);
  const secondCookie = secondRegistration.cookie;
  const otherAccount = await request("/api/appointments", "GET", undefined, secondCookie);
  assert.equal(otherAccount.data.appointments.some((item) => item.id === id), false);
  assert.equal((await request(`/api/appointments/${id}`, "PATCH", appointment, secondCookie)).status, 404);

  const cancelled = await request(`/api/appointments/${id}`, "PATCH", { ...appointment, animal: "Animal editado", status: "CANCELADO" }, firstCookie);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.appointment.status, "CANCELADO");
  const byStatus = await request("/api/appointments?status=CANCELADO", "GET", undefined, firstCookie);
  assert.ok(byStatus.data.appointments.some((item) => item.id === id));
  assert.equal((await request("/api/appointments", "POST", appointment, firstCookie)).status, 201);

  const logout = await request("/api/auth/logout", "POST", undefined, firstCookie);
  assert.equal(logout.status, 200);
  assert.equal(logout.cookie, "clinivet_session=");
  assert.equal((await request("/api/appointments")).status, 401);
  console.log("Autenticação, 20 exemplos por conta, mais de 10 em um dia, filtros, criação, edição, cancelamento e isolamento passaram.");
} finally {
  await prisma.user.deleteMany({ where: { email: { in: [firstEmail, secondEmail] } } });
  await prisma.$disconnect();
}
