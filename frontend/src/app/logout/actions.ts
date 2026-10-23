"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Logout é só apagar o cookie: o token continua válido no backend até expirar,
// mas o navegador não o envia mais.
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}
