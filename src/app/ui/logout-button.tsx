"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ icon, iconOnly = false }: { icon: ReactNode; iconOnly?: boolean }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="secondary-button" aria-label={pending ? "Saindo" : "Sair"} title="Sair" disabled={pending} onClick={logout} type="button">
      {icon}
      {!iconOnly && (pending ? "Saindo..." : "Sair")}
    </button>
  );
}
