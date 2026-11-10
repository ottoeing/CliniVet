import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { AgendaClient } from "./agenda-client";

export const instant = false;

export default async function AgendaPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  return (
    <main className="agenda-page"><AgendaClient email={session.email} /></main>
  );
}
