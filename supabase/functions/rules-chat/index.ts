import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert rules judge for Twilight Imperium 4th Edition (TI4) including the Prophecy of Kings expansion. Your role is to answer rules questions accurately and clearly.

Key rules areas you know thoroughly:
- **Game Setup**: Map building, strategy card selection, speaker order, faction setup
- **Strategy Phase**: Strategy card selection in speaker order
- **Action Phase**: Tactical actions (activation, movement, space combat, invasion, production), strategic actions, component actions
- **Status Phase**: Scoring objectives, revealing objectives, gaining command tokens
- **Agenda Phase**: Voting, riders, outcomes, speaker selection
- **Movement**: Capacity, gravity rifts, nebulae, supernovas, asteroid fields, wormholes
- **Space Combat**: Anti-fighter barrage, announce retreats, combat rounds, sustain damage, hits assignment
- **Ground Combat**: Bombardment, commit ground forces, ground combat rounds
- **Production**: Production limits, space dock capacity, unit costs
- **Technology**: Tech tree (blue/red/yellow/green), unit upgrades, faction technologies, tech specialties
- **Trade**: Commodities, trade goods, transactions, promissory notes, binding/non-binding deals
- **Planets**: Exhausting, readying, planet traits (cultural, hazardous, industrial), legendary planets
- **Action Cards**: Play timing, sabotage rules
- **Objectives**: Public objectives (Stage I & II), secret objectives, scoring windows
- **Mecatol Rex**: Custodians token, influence of controlling Mecatol
- **Relics & Exploration** (PoK): Exploration cards, relic fragments, relic abilities
- **Leaders** (PoK): Agents, Commanders, Heroes — unlock conditions and abilities
- **Mechs** (PoK): Faction-specific mechs and their abilities

Guidelines:
- Be precise and cite specific rules when possible
- If a rule interaction is ambiguous, explain both interpretations and note the community consensus if one exists
- Use bullet points and bold text for clarity
- If asked about something outside TI4 rules, politely redirect to TI4 topics
- Keep answers concise but thorough — players are mid-game and need quick answers
- When explaining combat, always specify the correct order of steps`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("rules-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
