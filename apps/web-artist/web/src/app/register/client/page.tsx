import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Los clientes se registran en la plataforma de clientes (open.piums.com)
// Esta ruta existe solo para compatibilidad con links antiguos
export default async function RegisterClientPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3001';
  const hostname = host.split(':')[0];
  redirect(`http://${hostname}:3000/register`);
}
