import { redirect } from "next/navigation";
import { CalendarDays, LogOut } from "lucide-react";

import { getSession } from "@/lib/auth";
import { LogoutButton } from "../ui/logout-button";

export const instant = false;

export default async function AgendaPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  return (
    <main className="agenda-shell">
      <section className="agenda-card">
        <div className="agenda-heading">
          <CalendarDays aria-hidden size={28} />
          <div>
            <p className="eyebrow">CliniVet</p>
            <h1>Agenda de coletas</h1>
          </div>
        </div>
        <p className="muted">Sessão ativa: {session.email}</p>
        <p className="muted">A agenda será construída na próxima etapa.</p>
        <LogoutButton icon={<LogOut aria-hidden size={16} />} />
      </section>
    </main>
  );
}
