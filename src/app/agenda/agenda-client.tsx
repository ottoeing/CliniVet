"use client";

import { CSSProperties, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Columns3, Grid3X3, List, LogOut, Pencil, SlidersHorizontal, XCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import SimpleBar from "simplebar-react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
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

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function AgendaClient({ email }: { email: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [showFormCalendar, setShowFormCalendar] = useState(false);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const [dateMenuPosition, setDateMenuPosition] = useState<{ left: number; top?: number; bottom?: number; maxHeight: number }>({ left: 12, top: 12, maxHeight: 320 });
  const [openFilter, setOpenFilter] = useState<"date" | "status" | null>(null);
  const [view, setView] = useState<"day" | "week" | "month">("month");
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const useMonthOnMobile = () => { if (mobile.matches) setView("month"); };
    mobile.addEventListener("change", useMonthOnMobile);
    return () => mobile.removeEventListener("change", useMonthOnMobile);
  }, []);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedMobileDate, setSelectedMobileDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{ item: Appointment; left: number; top: number } | null>(null);
  const calendarBoardRef = useRef<HTMLDivElement>(null);
  const [monthCapacity, setMonthCapacity] = useState({ full: 3, withMore: 2 });
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

  const updateDateMenuPosition = useCallback(() => {
    const bounds = dateTriggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const below = window.innerHeight - bounds.bottom - 12;
    const above = bounds.top - 12;
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - Math.min(344, window.innerWidth - 24) - 12));
    setDateMenuPosition(below >= 320 || below >= above
      ? { left, top: bounds.bottom + 6, maxHeight: Math.max(80, below - 6) }
      : { left, bottom: window.innerHeight - bounds.top + 6, maxHeight: Math.max(80, above - 6) });
  }, []);

  useEffect(() => {
    if (!showFormCalendar) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!dateTriggerRef.current?.contains(target) && !dateMenuRef.current?.contains(target)) setShowFormCalendar(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setShowFormCalendar(false); };
    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updateDateMenuPosition);
    window.addEventListener("scroll", updateDateMenuPosition, true);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updateDateMenuPosition);
      window.removeEventListener("scroll", updateDateMenuPosition, true);
    };
  }, [showFormCalendar, updateDateMenuPosition]);

  useEffect(() => {
    if (view !== "month" || loading || fetchError) return;
    const cell = calendarBoardRef.current?.querySelector<HTMLElement>(".calendar-cell");
    if (!cell) return;
    const measure = () => {
      const styles = getComputedStyle(cell);
      const header = cell.querySelector<HTMLElement>(".calendar-day-number");
      const event = calendarBoardRef.current?.querySelector<HTMLElement>(".calendar-cell > .calendar-event-wrap");
      const more = calendarBoardRef.current?.querySelector<HTMLElement>(".calendar-cell > .more-events");
      const available = cell.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom) - (header?.offsetHeight ?? 18) - 3;
      const eventHeight = Math.max(28, event?.getBoundingClientRect().height ?? 28);
      const moreHeight = Math.max(19, more?.getBoundingClientRect().height ?? 19);
      const next = {
        full: Math.max(0, Math.floor(available / eventHeight)),
        withMore: Math.max(0, Math.floor((available - moreHeight) / eventHeight)),
      };
      setMonthCapacity((current) => current.full === next.full && current.withMore === next.withMore ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [view, loading, fetchError, calendarDate, appointments.length]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    const params = new URLSearchParams();
    statusFilter.forEach((status) => params.append("status", status));
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
    statusFilter.forEach((status) => params.append("status", status));
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
    const date = new Date(draft.scheduledAt);
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.scheduledAt) || Number.isNaN(date.getTime())) {
      setFormError("Selecione uma data e informe um horário válido em HH:MM.");
      return;
    }
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
    setHoveredEvent(null);
    setEditingId(appointment.id);
    setDraft({ ...appointment, scheduledAt: toLocalInputValue(appointment.scheduledAt) });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cancelAppointment(appointment: Appointment) {
    setHoveredEvent(null);
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

  function toggleStatusFilter(status: Status) {
    setStatusFilter((current) => current.includes(status)
      ? current.filter((item) => item !== status)
      : [...current, status]);
  }

  function renderStatusFilter() {
    return <div className="filter-menu status-filter-menu" role="group" aria-label="Filtrar por status">
      <button className={`filter-option${statusFilter.length === 0 ? " selected" : ""}`} aria-pressed={statusFilter.length === 0} onClick={() => setStatusFilter([])} type="button">Todos{statusFilter.length === 0 && <Check aria-hidden size={15} />}</button>
      {(Object.entries(statusLabels) as [Status, string][]).map(([value, label]) => {
        const selected = statusFilter.includes(value);
        return <button key={value} className={`filter-option${selected ? " selected" : ""}`} aria-pressed={selected} onClick={() => toggleStatusFilter(value)} type="button">{label}{selected && <Check aria-hidden size={15} />}</button>;
      })}
    </div>;
  }

  function showEventTooltip(item: Appointment, element: HTMLElement) {
    const bounds = element.getBoundingClientRect();
    const width = Math.min(275, window.innerWidth - 24);
    const estimatedHeight = item.notes ? 155 : 115;
    setHoveredEvent({
      item,
      left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)),
      top: bounds.bottom + estimatedHeight + 8 < window.innerHeight
        ? bounds.bottom + 6
        : Math.max(8, bounds.top - estimatedHeight - 6),
    });
  }

  function renderCalendarEvent(item: Appointment) {
    return <div className="calendar-event-wrap" key={item.id} onMouseEnter={(event) => showEventTooltip(item, event.currentTarget)} onMouseLeave={() => setHoveredEvent(null)} onFocusCapture={(event) => showEventTooltip(item, event.currentTarget)} onBlurCapture={() => setHoveredEvent(null)}>
      <button className={`calendar-event event-${item.status.toLowerCase()}`} onClick={() => startEdit(item)} type="button"><span className="event-time">{toDisplayDate(item.scheduledAt).slice(-5)}</span><span className="event-animal">{item.animal}</span></button>
      <button className={`event-action event-action-edit${item.status === "CANCELADO" ? " event-action-solo" : ""}`} aria-label={`Editar ${item.animal}`} onClick={() => startEdit(item)} type="button"><Pencil size={14} /></button>
      {item.status !== "CANCELADO" && <button className="event-action event-action-danger" aria-label={`Cancelar ${item.animal}`} disabled={pending} onClick={() => void cancelAppointment(item)} type="button"><XCircle size={14} /></button>}
    </div>;
  }

  return (
    <div className="agenda-layout">
      <header className="agenda-topbar">
        <div className="brand"><CalendarDays aria-hidden size={25} /><div><p className="eyebrow">CliniVet</p><h1>Agenda de coletas</h1></div></div>
        <div className="mobile-header-filters">
          <div className="filter-anchor"><button className={`icon-button${dateFilter ? " filter-active" : ""}`} aria-label="Filtrar por data" aria-expanded={openFilter === "date"} onClick={() => setOpenFilter(openFilter === "date" ? null : "date")} type="button"><CalendarDays size={18} /></button>{openFilter === "date" && <div className="filter-menu date-filter-menu"><DayPicker locale={ptBR} mode="single" selected={selectedFilterDate} onSelect={(date) => { setDateFilter(date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""); setOpenFilter(null); }} />{dateFilter && <button className="filter-option" onClick={() => { setDateFilter(""); setOpenFilter(null); }} type="button">Limpar filtro</button>}</div>}</div>
          <div className="filter-anchor"><button className={`icon-button${statusFilter.length ? " filter-active" : ""}`} aria-label="Filtrar por status" aria-expanded={openFilter === "status"} onClick={() => setOpenFilter(openFilter === "status" ? null : "status")} type="button"><SlidersHorizontal size={18} /></button>{openFilter === "status" && renderStatusFilter()}</div>
        </div>
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
          <div className="appointment-datetime"><button ref={dateTriggerRef} id="scheduledAtDate" className="date-trigger" aria-expanded={showFormCalendar} onClick={() => { if (showFormCalendar) setShowFormCalendar(false); else { updateDateMenuPosition(); setShowFormCalendar(true); } }} type="button">{draft.scheduledAt && draft.scheduledAt.slice(0, 10) ? new Date(`${draft.scheduledAt.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Selecionar data"}<CalendarDays size={18} /></button>
          <input aria-label="Horário da coleta no formato HH:MM" type="text" inputMode="numeric" placeholder="HH:MM" pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="Informe o horário no formato HH:MM" value={draft.scheduledAt.slice(11)} onChange={(e) => updateDraft("scheduledAt", `${draft.scheduledAt.slice(0, 10)}T${formatTimeInput(e.target.value)}`)} required /></div>
          <label htmlFor="status">Status <span className="required">*</span></label>
          <select id="status" value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="notes">Observações <span className="muted">(opcional)</span></label>
          <textarea id="notes" value={draft.notes ?? ""} onChange={(e) => updateDraft("notes", e.target.value)} rows={3} />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <button className="secondary-button" onClick={resetForm} type="button">Sair</button>
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : editingId ? "Salvar alterações" : "Agendar coleta"}</button>
          </div>
        </form>
        </section>
        {showFormCalendar && createPortal(<div ref={dateMenuRef} className="appointment-date-menu anchored-date-menu" role="dialog" aria-label="Selecionar data da coleta" style={dateMenuPosition}><DayPicker locale={ptBR} mode="single" selected={draft.scheduledAt && draft.scheduledAt.slice(0, 10) ? new Date(`${draft.scheduledAt.slice(0, 10)}T12:00:00`) : undefined} disabled={{ before: new Date() }} onSelect={(date) => { if (date) { updateDraft("scheduledAt", `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${draft.scheduledAt.slice(11) || "09:00"}`); setShowFormCalendar(false); } }} /></div>, document.body)}
      </div>}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="list-panel" aria-labelledby="list-title">
        <div className="list-header calendar-header">
          <div className="calendar-filter-actions">
            <div className="filter-anchor"><button className={`icon-button${dateFilter ? " filter-active" : ""}`} title="Filtrar por data" aria-label="Filtrar por data" aria-expanded={openFilter === "date"} onClick={() => setOpenFilter(openFilter === "date" ? null : "date")} type="button"><CalendarDays size={18} /></button>
              {openFilter === "date" && <div className="filter-menu date-filter-menu"><DayPicker locale={ptBR} mode="single" selected={selectedFilterDate} onSelect={(date) => { setDateFilter(date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""); setOpenFilter(null); }} />{dateFilter && <button className="filter-option" onClick={() => { setDateFilter(""); setOpenFilter(null); }} type="button">Limpar filtro</button>}</div>}</div>
            <div className="filter-anchor"><button className={`icon-button${statusFilter.length ? " filter-active" : ""}`} title="Filtrar por status" aria-label="Filtrar por status" aria-expanded={openFilter === "status"} onClick={() => setOpenFilter(openFilter === "status" ? null : "status")} type="button"><SlidersHorizontal size={18} /></button>
              {openFilter === "status" && renderStatusFilter()}</div>
            <span className="filter-count">{appointments.length} {appointments.length === 1 ? "coleta" : "coletas"}</span>
          </div>
          <div className="period-navigation"><button className="icon-button" aria-label="Período anterior" onClick={() => movePeriod(-1)} type="button"><ChevronLeft size={18} /></button><h2 id="list-title">{displayPeriodLabel}</h2><button className="icon-button" aria-label="Próximo período" onClick={() => movePeriod(1)} type="button"><ChevronRight size={18} /></button></div>
          <div className="calendar-actions">{!isCurrentPeriod && <button className="today-button" onClick={() => setCalendarDate(new Date())} type="button">Hoje</button>}<nav className="view-switch" aria-label="Visualização do calendário">{(["day", "week", "month"] as const).map((item) => { const Icon = { day: List, week: Columns3, month: Grid3X3 }[item]; return <button key={item} title={{ day: "Dia", week: "Semana", month: "Mês" }[item]} aria-label={`Visualização de ${{ day: "dia", week: "semana", month: "mês" }[item]}`} aria-pressed={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)} type="button"><Icon size={18} /></button>; })}</nav></div>
        </div>
        {loading && <p className="state-message">Carregando agenda...</p>}
        {fetchError && <p className="state-message form-error">{fetchError}</p>}
        {!loading && !fetchError && appointments.length === 0 && <p className="state-message" role="status">Nenhuma coleta encontrada.</p>}
        {!loading && !fetchError && <><motion.div ref={calendarBoardRef} key={`${view}-${calendarDate.getFullYear()}-${calendarDate.getMonth()}-${calendarDate.getDate()}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} style={{ "--calendar-weeks": monthGridLength / 7 } as CSSProperties} className={`calendar-board calendar-${view}`}>
          {(view === "month" || view === "week") && ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span className="weekday" key={day}>{day}</span>)}
          {visibleDays.map((date) => {
            const entries = appointments.filter((item) => new Date(item.scheduledAt).toDateString() === date.toDateString());
            const dateKey = date.toDateString();
            const visibleCount = view === "month" && entries.length > monthCapacity.full ? monthCapacity.withMore : entries.length;
            return <div className={`calendar-cell${view === "month" && date.getMonth() !== calendarDate.getMonth() ? " outside-month" : ""}${dateKey === selectedMobileDate.toDateString() ? " selected-day" : ""}`} key={date.toISOString()}><button className="calendar-day-number" aria-label={`Ver coletas de ${date.toLocaleDateString("pt-BR")}`} onClick={() => setSelectedMobileDate(date)} type="button">{view === "day" || view === "week" ? date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }) : date.getDate()}{view === "month" && entries.length > 0 && <span className="day-event-dot" />}</button>{entries.slice(0, visibleCount).map(renderCalendarEvent)}{view === "month" && entries.length > visibleCount && <><button className="more-events" aria-expanded={expandedDate === dateKey} onClick={() => setExpandedDate(expandedDate === dateKey ? null : dateKey)} type="button">Ver mais ({entries.length - visibleCount})</button>{expandedDate === dateKey && <div className="more-events-popover"><div className="more-events-heading">{date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}<button aria-label="Fechar lista" onClick={() => setExpandedDate(null)} type="button">×</button></div><div className="more-events-list">{entries.map(renderCalendarEvent)}</div></div>}</>}</div>;
          })}
        </motion.div>{(view === "day" || view === "month") && <SimpleBar className={`appointments-scroll ${view === "month" ? "mobile-month-events" : ""}`}><div className="mobile-events-title">{(view === "month" ? selectedMobileDate : calendarDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</div><ul className="appointment-list">
          {appointments.filter((appointment) => new Date(appointment.scheduledAt).toDateString() === (view === "month" ? selectedMobileDate : calendarDate).toDateString()).map((appointment) => <li key={appointment.id} className="appointment-item">
            <div className="appointment-main"><strong>{appointment.animal}</strong><span>{appointment.clinic} · {appointment.examType}</span><span>{toDisplayDate(appointment.scheduledAt)}</span>{appointment.notes && <small>{appointment.notes}</small>}</div>
            <div className="appointment-actions"><span className={`status status-${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span><button aria-label={`Editar ${appointment.animal}`} className="icon-button" onClick={() => startEdit(appointment)} type="button"><Pencil aria-hidden size={16} /></button>{appointment.status !== "CANCELADO" && <button aria-label={`Cancelar ${appointment.animal}`} className="icon-button danger-button" disabled={pending} onClick={() => void cancelAppointment(appointment)} type="button"><XCircle aria-hidden size={16} /></button>}</div>
          </li>)}
        </ul>{appointments.filter((appointment) => new Date(appointment.scheduledAt).toDateString() === (view === "month" ? selectedMobileDate : calendarDate).toDateString()).length === 0 && <p className="state-message">Nenhuma coleta neste dia.</p>}</SimpleBar>}</>}
      </motion.section>
      <button className="fab" aria-label="Agendar nova coleta" onClick={() => { resetForm(); setShowForm(true); }} type="button"><CalendarPlus aria-hidden size={24} /></button>
      {hoveredEvent && createPortal(<div className="event-tooltip" role="tooltip" style={{ left: hoveredEvent.left, top: hoveredEvent.top }}><strong>{hoveredEvent.item.animal}</strong><span>{hoveredEvent.item.clinic} · {hoveredEvent.item.examType}</span><span>{toDisplayDate(hoveredEvent.item.scheduledAt)}</span>{hoveredEvent.item.notes && <p>{hoveredEvent.item.notes}</p>}</div>, document.body)}
    </div>
  );
}
