"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ icon }: { icon: ReactNode }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="secondary-button" disabled={pending} onClick={logout} type="button">
      {icon}
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
