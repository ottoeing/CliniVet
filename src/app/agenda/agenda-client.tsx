"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Pencil, Search, XCircle } from "lucide-react";

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

export function AgendaClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

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
      <section className="panel form-panel" aria-labelledby="form-title">
        <div className="panel-title">
          <CalendarPlus aria-hidden size={22} />
          <h2 id="form-title">{editingId ? "Editar coleta" : "Nova coleta"}</h2>
        </div>
        <form onSubmit={submitForm}>
          <label htmlFor="clinic">Clínica</label>
          <input id="clinic" value={draft.clinic} onChange={(e) => updateDraft("clinic", e.target.value)} required />
          <label htmlFor="animal">Animal</label>
          <input id="animal" value={draft.animal} onChange={(e) => updateDraft("animal", e.target.value)} required />
          <label htmlFor="examType">Tipo de exame</label>
          <input id="examType" value={draft.examType} onChange={(e) => updateDraft("examType", e.target.value)} required />
          <label htmlFor="scheduledAt">Data e hora da coleta</label>
          <input id="scheduledAt" type="datetime-local" min={minDateTime} value={draft.scheduledAt} onChange={(e) => updateDraft("scheduledAt", e.target.value)} required />
          <label htmlFor="status">Status</label>
          <select id="status" value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="notes">Observações <span className="muted">(opcional)</span></label>
          <textarea id="notes" value={draft.notes ?? ""} onChange={(e) => updateDraft("notes", e.target.value)} rows={3} />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : editingId ? "Salvar alterações" : "Agendar coleta"}</button>
            {editingId && <button className="text-button" onClick={resetForm} type="button">Cancelar edição</button>}
          </div>
        </form>
      </section>

      <section className="panel list-panel" aria-labelledby="list-title">
        <div className="list-header">
          <div><p className="eyebrow">Acompanhamento</p><h2 id="list-title">Coletas agendadas</h2></div>
          <button className="icon-button" aria-label="Atualizar agenda" onClick={() => void loadAppointments()} type="button"><Search aria-hidden size={18} /></button>
        </div>
        <div className="filters">
          <label>Data<input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></label>
          <label>Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        {loading && <p className="state-message">Carregando agenda...</p>}
        {fetchError && <p className="state-message form-error">{fetchError}</p>}
        {!loading && !fetchError && appointments.length === 0 && <p className="state-message">Nenhuma coleta encontrada para estes filtros.</p>}
        {!loading && !fetchError && appointments.length > 0 && <ul className="appointment-list">
          {appointments.map((appointment) => <li key={appointment.id} className="appointment-item">
            <div className="appointment-main"><strong>{appointment.animal}</strong><span>{appointment.clinic} · {appointment.examType}</span><span>{toDisplayDate(appointment.scheduledAt)}</span>{appointment.notes && <small>{appointment.notes}</small>}</div>
            <div className="appointment-actions"><span className={`status status-${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span><button aria-label={`Editar ${appointment.animal}`} className="icon-button" onClick={() => startEdit(appointment)} type="button"><Pencil aria-hidden size={16} /></button>{appointment.status !== "CANCELADO" && <button aria-label={`Cancelar ${appointment.animal}`} className="icon-button danger-button" disabled={pending} onClick={() => void cancelAppointment(appointment)} type="button"><XCircle aria-hidden size={16} /></button>}</div>
          </li>)}
        </ul>}
      </section>
    </div>
  );
}
