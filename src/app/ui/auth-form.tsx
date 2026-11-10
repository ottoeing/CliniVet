"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

type Mode = "login" | "signup";

type ApiError = {
  message?: string;
  fields?: { email?: string[]; password?: string[] };
};

export function AuthForm({ mode }: { mode: Mode }) {
  const isLogin = mode === "login";
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ApiError["fields"]>();
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors(undefined);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;

    setPending(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível concluir a solicitação.");
      setFieldErrors(data.fields);
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">CliniVet</p>
        <h1 id="auth-title">{isLogin ? "Entrar na agenda" : "Criar sua conta"}</h1>
        <p className="muted">
          {isLogin ? "Use seu e-mail e senha para continuar." : "Cadastre-se para acessar a agenda de coletas."}
        </p>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <div className="input-with-icon">
            <Mail aria-hidden size={18} />
            <input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required />
          </div>
          {fieldErrors?.email?.[0] && <p className="field-error">{fieldErrors.email[0]}</p>}

          <label htmlFor="password">Senha</label>
          <div className="input-with-icon">
            <LockKeyhole aria-hidden size={18} />
            <input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={6} required />
          </div>
          {fieldErrors?.password?.[0] && <p className="field-error">{fieldErrors.password[0]}</p>}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button" disabled={pending} type="submit">
            {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
            <ArrowRight aria-hidden size={18} />
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Ainda não possui conta?" : "Já possui uma conta?"}{" "}
          <Link href={isLogin ? "/cadastro" : "/login"}>{isLogin ? "Cadastre-se" : "Entrar"}</Link>
        </p>
      </section>
    </main>
  );
}
