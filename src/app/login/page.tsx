import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { AuthForm } from "../ui/auth-form";

export const instant = false;

export default async function LoginPage() {
  if (await getSession()) redirect("/agenda");

  return <AuthForm mode="login" />;
}
