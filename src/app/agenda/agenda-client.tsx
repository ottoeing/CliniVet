"use client";

import { CSSProperties, FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Columns3, Grid3X3, List, LogOut, Pencil, SlidersHorizontal, XCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
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
  const [showFormCalendar, setShowFormCalendar] = useState(false);
  const [openFilter, setOpenFilter] = useState<"date" | "status" | null>(null);
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
    ? `${calendarDate.getDate()} de ${calendarDate.toLocaleDateString("pt-BR", { month: "long" })}`
    : view === "week"
      ? `${weekStart.getDate()} - ${visibleDays[6].getDate()} de ${visibleDays[6].toLocaleDateString("pt-BR", { month: "long" })}`
      : `${calendarDate.toLocaleDateString("pt-BR", { month: "long" })}, ${calendarDate.getFullYear()}`;
  const displayPeriodLabel = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
  const today = new Date();
  const isCurrentPeriod = view === "day"
    ? calendarDate.toDateString() === today.toDateString()
    : view === "week"
      ? today >= weekStart && today < new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)
      : calendarDate.getFullYear() === today.getFullYear() && calendarDate.getMonth() === today.getMonth();
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

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormError("");
    setShowForm(false);
    setShowFormCalendar(false);
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
        <div className="session-info"><span>{email}</span><LogoutButton icon={<LogOut aria-hidden size={18} />} iconOnly /></div>
      </header>
      {showForm && <div className="modal-layer">
        <button className="modal-backdrop" aria-label="Fechar formulário" onClick={resetForm} type="button" />
        <section className="panel form-panel" role="dialog" aria-modal="true" aria-labelledby="form-title">
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
          <label htmlFor="scheduledAtDate">Data e hora da coleta <span className="required">*</span></label>
          <div className="appointment-datetime"><button id="scheduledAtDate" className="date-trigger" aria-expanded={showFormCalendar} onClick={() => setShowFormCalendar((open) => !open)} type="button">{draft.scheduledAt && draft.scheduledAt.slice(0, 10) ? new Date(`${draft.scheduledAt.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Selecionar data"}<CalendarDays size={18} /></button>
          <input aria-label="Horário da coleta no formato HH:MM" type="text" inputMode="numeric" placeholder="HH:MM" pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="Informe o horário no formato HH:MM" value={draft.scheduledAt.slice(11)} onChange={(e) => updateDraft("scheduledAt", `${draft.scheduledAt.slice(0, 10)}T${e.target.value}`)} required /></div>
          <label htmlFor="status">Status <span className="required">*</span></label>
          <select id="status" value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="notes">Observações <span className="muted">(opcional)</span></label>
          <textarea id="notes" value={draft.notes ?? ""} onChange={(e) => updateDraft("notes", e.target.value)} rows={3} />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <button className="secondary-button" onClick={resetForm} type="button">Cancelar</button>
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : editingId ? "Salvar alterações" : "Agendar coleta"}</button>
          </div>
        </form>
        </section>
        {showFormCalendar && <div className="appointment-calendar-layer"><button className="appointment-calendar-backdrop" aria-label="Fechar calendário" onClick={() => setShowFormCalendar(false)} type="button" /><div className="appointment-date-menu" role="dialog" aria-label="Selecionar data da coleta"><DayPicker locale={ptBR} mode="single" selected={draft.scheduledAt && draft.scheduledAt.slice(0, 10) ? new Date(`${draft.scheduledAt.slice(0, 10)}T12:00:00`) : undefined} disabled={{ before: new Date() }} onSelect={(date) => { if (date) { updateDraft("scheduledAt", `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${draft.scheduledAt.slice(11) || "09:00"}`); setShowFormCalendar(false); } }} /></div></div>}
      </div>}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="list-panel" aria-labelledby="list-title">
        <div className="list-header calendar-header">
          <div className="calendar-filter-actions">
            <div className="filter-anchor"><button className={`icon-button${dateFilter ? " filter-active" : ""}`} title="Filtrar por data" aria-label="Filtrar por data" aria-expanded={openFilter === "date"} onClick={() => setOpenFilter(openFilter === "date" ? null : "date")} type="button"><CalendarDays size={18} /></button>
              {openFilter === "date" && <div className="filter-menu date-filter-menu"><DayPicker locale={ptBR} mode="single" selected={selectedFilterDate} onSelect={(date) => { setDateFilter(date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""); setOpenFilter(null); }} /><button className="filter-option" onClick={() => { setDateFilter(""); setOpenFilter(null); }} type="button">Todas as datas</button></div>}</div>
            <div className="filter-anchor"><button className={`icon-button${statusFilter ? " filter-active" : ""}`} title="Filtrar por status" aria-label="Filtrar por status" aria-expanded={openFilter === "status"} onClick={() => setOpenFilter(openFilter === "status" ? null : "status")} type="button"><SlidersHorizontal size={18} /></button>
              {openFilter === "status" && <div className="filter-menu status-filter-menu">{[{ value: "", label: "Todos" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))].map((option) => <button key={option.value} className={`filter-option${statusFilter === option.value ? " selected" : ""}`} onClick={() => { setStatusFilter(option.value); setOpenFilter(null); }} type="button">{option.label}</button>)}</div>}</div>
            <span className="filter-count">{appointments.length} {appointments.length === 1 ? "coleta" : "coletas"}</span>
          </div>
          <div className="period-navigation"><button className="icon-button" aria-label="Período anterior" onClick={() => movePeriod(-1)} type="button"><ChevronLeft size={18} /></button><h2 id="list-title">{displayPeriodLabel}</h2><button className="icon-button" aria-label="Próximo período" onClick={() => movePeriod(1)} type="button"><ChevronRight size={18} /></button></div>
          <div className="calendar-actions">{!isCurrentPeriod && <button className="today-button" onClick={() => setCalendarDate(new Date())} type="button">Hoje</button>}<nav className="view-switch" aria-label="Visualização do calendário">{(["day", "week", "month"] as const).map((item) => { const Icon = { day: List, week: Columns3, month: Grid3X3 }[item]; return <button key={item} title={{ day: "Dia", week: "Semana", month: "Mês" }[item]} aria-label={`Visualização de ${{ day: "dia", week: "semana", month: "mês" }[item]}`} aria-pressed={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)} type="button"><Icon size={18} /></button>; })}</nav></div>
        </div>
        {loading && <p className="state-message">Carregando agenda...</p>}
        {fetchError && <p className="state-message form-error">{fetchError}</p>}
        {!loading && !fetchError && <><motion.div key={`${view}-${calendarDate.getFullYear()}-${calendarDate.getMonth()}-${calendarDate.getDate()}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} style={{ "--calendar-weeks": monthGridLength / 7 } as CSSProperties} className={`calendar-board calendar-${view}`}>
          {(view === "month" || view === "week") && ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span className="weekday" key={day}>{day}</span>)}
          {visibleDays.map((date) => {
            const entries = appointments.filter((item) => new Date(item.scheduledAt).toDateString() === date.toDateString());
            return <div className={`calendar-cell${view === "month" && date.getMonth() !== calendarDate.getMonth() ? " outside-month" : ""}`} key={date.toISOString()}><strong>{view === "day" || view === "week" ? date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }) : date.getDate()}</strong>{entries.map((item) => <button className={`calendar-event event-${item.status.toLowerCase()}`} key={item.id} onClick={() => startEdit(item)} type="button">{toDisplayDate(item.scheduledAt).slice(-5)} · {item.animal}</button>)}</div>;
          })}
        </motion.div>{view === "day" && <SimpleBar className="appointments-scroll"><ul className="appointment-list">
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
