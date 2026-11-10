"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, LogOut, Pencil, XCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import Select from "react-select";
import SimpleBar from "simplebar-react";
import { motion } from "framer-motion";
import "react-day-picker/style.css";
import "simplebar-react/dist/simplebar.min.css";
import { LogoutButton } from "../ui/logout-button";

type Status = "AGENDADO" | "COLETADO" | "CANCELADO";
type Appointment = {
  id: string;
  clinic: string;
  animal: string;
  examType: string;
  scheduledAt: string;
  status: Status;
  notes: string | null;
};

type Draft = Omit<Appointment, "id">;

const emptyDraft: Draft = {
  clinic: "",
  animal: "",
  examType: "",
  scheduledAt: "",
  status: "AGENDADO",
  notes: "",
};

const statusLabels: Record<Status, string> = {
  AGENDADO: "Agendado",
  COLETADO: "Coletado",
  CANCELADO: "Cancelado",
};

function toLocalInputValue(isoDate: string) {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toDisplayDate(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(isoDate),
  );
}

export function AgendaClient({ email }: { email: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const weekStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - calendarDate.getDay());
  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthGridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay());
  const monthGridLength = Math.ceil((monthStart.getDay() + new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate()) / 7) * 7;
  const visibleDays = Array.from({ length: view === "day" ? 1 : view === "week" ? 7 : monthGridLength }, (_, index) => {
    const base = view === "day" ? calendarDate : view === "week" ? weekStart : monthGridStart;
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + index);
  });
  const periodLabel = view === "day"
    ? calendarDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : view === "week"
      ? `${weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${visibleDays[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
      : calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  function movePeriod(direction: number) {
    setCalendarDate((current) => view === "month"
      ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
      : new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction * (view === "week" ? 7 : 1)));
  }
  const selectedFilterDate = dateFilter ? new Date(`${dateFilter}T12:00:00`) : undefined;

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);

    try {
      const response = await fetch(`/api/appointments?${params.toString()}`);
      const data = (await response.json()) as { appointments?: Appointment[]; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível carregar a agenda.");
      setAppointments(data.appointments ?? []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);

    fetch(`/api/appointments?${params.toString()}`)
      .then(async (response) => {
        const data = (await response.json()) as { appointments?: Appointment[]; message?: string };
        if (!response.ok) throw new Error(data.message ?? "Não foi possível carregar a agenda.");
        if (active) {
          setAppointments(data.appointments ?? []);
          setFetchError("");
        }
      })
      .catch((error: unknown) => {
        if (active) setFetchError(error instanceof Error ? error.message : "Não foi possível carregar a agenda.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [dateFilter, statusFilter]);

  const minDateTime = useMemo(() => toLocalInputValue(new Date().toISOString()), []);

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormError("");
    setShowForm(false);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");
    const response = await fetch(editingId ? `/api/appointments/${editingId}` : "/api/appointments", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, notes: draft.notes || undefined }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setPending(false);

    if (!response.ok) {
      setFormError(data.message ?? "Não foi possível salvar o agendamento.");
      return;
    }

    resetForm();
    await loadAppointments();
  }

  function startEdit(appointment: Appointment) {
    setEditingId(appointment.id);
    setDraft({ ...appointment, scheduledAt: toLocalInputValue(appointment.scheduledAt) });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cancelAppointment(appointment: Appointment) {
    if (!window.confirm(`Cancelar a coleta de ${appointment.animal}?`)) return;
    setPending(true);
    const response = await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appointment, scheduledAt: toLocalInputValue(appointment.scheduledAt), status: "CANCELADO" }),
    });
    setPending(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setFetchError(data.message ?? "Não foi possível cancelar o agendamento.");
      return;
    }

    await loadAppointments();
  }

  return (
    <div className="agenda-layout">
      <header className="agenda-topbar">
        <div className="brand"><CalendarDays aria-hidden size={25} /><div><p className="eyebrow">CliniVet</p><h1>Agenda de coletas</h1></div></div>
        <nav className="view-switch" aria-label="Visualização do calendário">{(["day", "week", "month"] as const).map((item) => <button key={item} aria-pressed={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)} type="button">{{ day: "Dia", week: "Semana", month: "Mês" }[item]}</button>)}</nav>
        <div className="session-info"><span>{email}</span><LogoutButton icon={<LogOut aria-hidden size={16} />} /></div>
      </header>
      {showForm && <section className="panel form-panel" aria-labelledby="form-title">
        <div className="panel-title">
          <CalendarPlus aria-hidden size={22} />
          <h2 id="form-title">{editingId ? "Editar coleta" : "Nova coleta"}</h2>
        </div>
        <form onSubmit={submitForm}>
          <label htmlFor="clinic">Clínica <span className="required">*</span></label>
          <input id="clinic" value={draft.clinic} onChange={(e) => updateDraft("clinic", e.target.value)} required />
          <label htmlFor="animal">Animal <span className="required">*</span></label>
          <input id="animal" value={draft.animal} onChange={(e) => updateDraft("animal", e.target.value)} required />
          <label htmlFor="examType">Tipo de exame <span className="required">*</span></label>
          <input id="examType" value={draft.examType} onChange={(e) => updateDraft("examType", e.target.value)} required />
          <label htmlFor="scheduledAt">Data e hora da coleta <span className="required">*</span></label>
          <input id="scheduledAt" type="datetime-local" min={minDateTime} value={draft.scheduledAt} onChange={(e) => updateDraft("scheduledAt", e.target.value)} required />
          <label htmlFor="status">Status <span className="required">*</span></label>
          <select id="status" value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="notes">Observações <span className="muted">(opcional)</span></label>
          <textarea id="notes" value={draft.notes ?? ""} onChange={(e) => updateDraft("notes", e.target.value)} rows={3} />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : editingId ? "Salvar alterações" : "Agendar coleta"}</button>
            <button className="text-button" onClick={resetForm} type="button">Cancelar</button>
          </div>
        </form>
      </section>}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="list-panel" aria-labelledby="list-title">
        <div className="list-header calendar-header">
          <div className="period-navigation"><button className="icon-button" aria-label="Período anterior" onClick={() => movePeriod(-1)} type="button"><ChevronLeft size={18} /></button><h2 id="list-title">{periodLabel}</h2><button className="icon-button" aria-label="Próximo período" onClick={() => movePeriod(1)} type="button"><ChevronRight size={18} /></button></div>
          <button className="text-button" onClick={() => setCalendarDate(new Date())} type="button">Hoje</button>
        </div>
        <div className="filters">
          <label>Data<details className="date-picker"><summary>{selectedFilterDate ? selectedFilterDate.toLocaleDateString("pt-BR") : "Todas as datas"}</summary><DayPicker mode="single" selected={selectedFilterDate} onSelect={(date) => setDateFilter(date ? date.toISOString().slice(0, 10) : "")} /></details></label>
          <label>Status<Select instanceId="status-filter" value={[{ value: "", label: "Todos" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))].find((option) => option.value === statusFilter)} onChange={(option) => setStatusFilter(option?.value ?? "")} options={[{ value: "", label: "Todos" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} classNamePrefix="cv-select" /></label>
        </div>
        {loading && <p className="state-message">Carregando agenda...</p>}
        {fetchError && <p className="state-message form-error">{fetchError}</p>}
        {!loading && !fetchError && <><div className={`calendar-board calendar-${view}`}>
          {(view === "month" || view === "week") && ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span className="weekday" key={day}>{day}</span>)}
          {visibleDays.map((date) => {
            const entries = appointments.filter((item) => new Date(item.scheduledAt).toDateString() === date.toDateString());
            return <div className={`calendar-cell${view === "month" && date.getMonth() !== calendarDate.getMonth() ? " outside-month" : ""}`} key={date.toISOString()}><strong>{view === "day" || view === "week" ? date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }) : date.getDate()}</strong>{entries.map((item) => <button className={`calendar-event event-${item.status.toLowerCase()}`} key={item.id} onClick={() => startEdit(item)} type="button">{toDisplayDate(item.scheduledAt).slice(-5)} · {item.animal}</button>)}</div>;
          })}
        </div>{view === "day" && <SimpleBar className="appointments-scroll"><ul className="appointment-list">
          {appointments.filter((appointment) => new Date(appointment.scheduledAt).toDateString() === calendarDate.toDateString()).map((appointment) => <li key={appointment.id} className="appointment-item">
            <div className="appointment-main"><strong>{appointment.animal}</strong><span>{appointment.clinic} · {appointment.examType}</span><span>{toDisplayDate(appointment.scheduledAt)}</span>{appointment.notes && <small>{appointment.notes}</small>}</div>
            <div className="appointment-actions"><span className={`status status-${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span><button aria-label={`Editar ${appointment.animal}`} className="icon-button" onClick={() => startEdit(appointment)} type="button"><Pencil aria-hidden size={16} /></button>{appointment.status !== "CANCELADO" && <button aria-label={`Cancelar ${appointment.animal}`} className="icon-button danger-button" disabled={pending} onClick={() => void cancelAppointment(appointment)} type="button"><XCircle aria-hidden size={16} /></button>}</div>
          </li>)}
        </ul></SimpleBar>}</>}
      </motion.section>
      <button className="fab" aria-label="Agendar nova coleta" onClick={() => { resetForm(); setShowForm(true); }} type="button"><CalendarPlus aria-hidden size={24} /></button>
    </div>
  );
}
