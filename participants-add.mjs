import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { nombre, email } = JSON.parse(event.body || "{}");
    const cleanNombre = (nombre || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanNombre || !cleanEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nombre y email son requeridos" }) };
    }

    const { error } = await supabase
      .from("participantes")
      .insert([{ nombre: cleanNombre, email: cleanEmail }]);

    if (error) {
      const msg = error.code === "23505" ? "Ese correo ya está registrado" : error.message;
      return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error interno" }) };
  }
};
