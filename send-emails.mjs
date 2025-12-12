import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const { pass, sorteo_id } = JSON.parse(event.body || "{}");
    if (pass !== process.env.ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: "Clave inválida" }) };

    if (!sorteo_id) return { statusCode: 400, body: JSON.stringify({ error: "Falta sorteo_id" }) };

    const { data: asignaciones, error } = await supabase
      .from("asignaciones")
      .select("giver_email,receiver_nombre")
      .eq("sorteo_id", sorteo_id);

    if (error) return { statusCode: 500, body: JSON.stringify({ error: "No se pudieron leer asignaciones" }) };

    let enviados = 0;
    for (const a of asignaciones) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: a.giver_email,
        subject: "🎄 Tu Amigo Secreto",
        html: `<p>¡Hola! 🎅</p>
               <p>Tu amigo secreto es: <strong>${a.receiver_nombre}</strong></p>
               <p>Recuerda: ¡mantén el secreto! 🤫</p>`
      });
      enviados++;
    }

    await supabase.from("sorteos").update({ estado: "enviado" }).eq("id", sorteo_id);

    return { statusCode: 200, body: JSON.stringify({ ok: true, enviados }) };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "Error interno enviando correos" }) };
  }
};
