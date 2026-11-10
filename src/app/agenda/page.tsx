import { redirect } from "next/navigation";
import { CalendarDays, LogOut } from "lucide-react";

import { getSession } from "@/lib/auth";
import { LogoutButton } from "../ui/logout-button";
import { AgendaClient } from "./agenda-client";

export const instant = false;

export default async function AgendaPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  return (
    <main className="agenda-page">
      <header className="agenda-topbar"><div className="brand"><CalendarDays aria-hidden size={25} /><div><p className="eyebrow">CliniVet</p><h1>Agenda de coletas</h1></div></div><div className="session-info"><span>{session.email}</span><LogoutButton icon={<LogOut aria-hidden size={16} />} /></div></header>
      <AgendaClient />
    </main>
  );
}
