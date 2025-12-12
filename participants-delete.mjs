import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const { pass, id } = JSON.parse(event.body || "{}");

    if (pass !== process.env.ADMIN_PASS) {
      return { statusCode: 401, body: JSON.stringify({ error: "Clave inválida" }) };
    }

    const { error } = await supabase.from("participantes").delete().eq("id", id);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: "No se pudo eliminar" }) };

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "Error interno" }) };
  }
};
