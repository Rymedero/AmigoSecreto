import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { pass, sorteo_id } = JSON.parse(event.body || "{}");

    if (pass !== process.env.ADMIN_PASS) {
      return { statusCode: 401, body: JSON.stringify({ error: "Clave inválida" }) };
    }

    if (!sorteo_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta sorteo_id" }) };
    }

    const { data: asignaciones, error } = await supabase
      .from("asignaciones")
      .select("giver_email, receiver_nombre")
      .eq("sorteo_id", sorteo_id);

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudieron leer asignaciones" }) };
    }

    let enviados = 0;

    for (const a of asignaciones) {
      await sgMail.send({
        to: a.giver_email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: "🎄 Tu Amigo Secreto",
        html: `
          <p>🎅 ¡Hola!</p>
          <p>Tu amigo secreto es:</p>
          <h2>${a.receiver_nombre}</h2>
          <p>🤫 Mantén el secreto hasta el día del intercambio.</p>
        `
      });
      enviados++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, enviados })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error enviando correos" })
    };
  }
};
