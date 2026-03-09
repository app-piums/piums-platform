import { redirect } from "next/navigation";

// Los clientes se registran en la plataforma de clientes (open.piums.com)
// Esta ruta existe solo para compatibilidad con links antiguos
export default function RegisterClientPage() {
  const clientAppUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || "http://localhost:3000";
  redirect(`${clientAppUrl}/register`);
}
