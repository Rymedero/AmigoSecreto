import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildMatches(participants) {
  // participants: [{nombre,email}, ...]
  // Intentos por si sale alguien asignado a sí mismo (raro con el método circular, pero por seguridad)
  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = shuffle([...participants]);
    const matches = [];
    let ok = true;

    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      if (giver.email === receiver.email) { ok = false; break; }
      matches.push({
        giver_email: giver.email,
        receiver_nombre: receiver.nombre,
        receiver_email: receiver.email
      });
    }

    if (ok) return matches;
  }
  throw new Error("No se pudo generar un sorteo válido");
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const { pass } = JSON.parse(event.body || "{}");
    if (pass !== process.env.ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: "Clave inválida" }) };

    const { data: participantes, error: e1 } = await supabase
      .from("participantes")
      .select("nombre,email")
      .order("created_at", { ascending: true });

    if (e1) return { statusCode: 500, body: JSON.stringify({ error: "No se pudo leer participantes" }) };
    if (!participantes || participantes.length < 3) {
      return { statusCode: 400, body: JSON.stringify({ error: "Se requieren al menos 3 participantes" }) };
    }

    // Crea sorteo
    const { data: sorteo, error: e2 } = await supabase
      .from("sorteos")
      .insert([{ estado: "realizado" }])
      .select("id")
      .single();

    if (e2) return { statusCode: 500, body: JSON.stringify({ error: "No se pudo crear sorteo" }) };

    const matches = buildMatches(participantes);
    const rows = matches.map(m => ({ sorteo_id: sorteo.id, ...m }));

    const { error: e3 } = await supabase.from("asignaciones").insert(rows);
    if (e3) return { statusCode: 500, body: JSON.stringify({ error: "No se pudieron guardar asignaciones" }) };

    return { statusCode: 200, body: JSON.stringify({ ok: true, sorteo_id: sorteo.id }) };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "Error interno" }) };
  }
};
