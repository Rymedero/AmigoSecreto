import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async () => {
  const { data, error } = await supabase
    .from("participantes")
    .select("id,nombre,email,created_at")
    .order("created_at", { ascending: true });

  if (error) return { statusCode: 500, body: JSON.stringify({ error: "No se pudo listar" }) };
  return { statusCode: 200, body: JSON.stringify({ participantes: data || [] }) };
};
