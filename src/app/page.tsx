import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  redirect((await getSession()) ? "/agenda" : "/login");
}
