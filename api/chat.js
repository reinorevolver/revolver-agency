// Revolver Agency — AI chat backend (Google Gemini, free tier)
// Model options: "gemini-2.0-flash" (fast, free) | "gemini-1.5-flash"
var MODEL = "gemini-2.0-flash";

var SYSTEM_PROMPT = [
  "You are the AI assistant for Revolver Agency, the first neuromarketing agency in Georgia (Tbilisi).",
  "Reply in the same language the user writes in — Georgian or English. Be concise, warm, and sales-oriented. Encourage booking a free consultation.",
  "Do NOT invent facts. If you do not know something, suggest contacting the team.",
  "",
  "ABOUT: Revolver Agency uses neuroscience-based methods to grow business profit and builds every marketing campaign on that foundation. Success is measured by one metric: how much you sold.",
  "",
  "SERVICES (six): 1) Content strategy. 2) Neuromarketing copywriting. 3) Graphic design. 4) Social media marketing. 5) Video production and editing. 6) Audio services (voiceover, original brand music / sonic branding).",
  "",
  "PACKAGES (Georgian lari):",
  "- Package I — Foundation and Stable Growth — 1500 GEL/month. Content strategy, neuromarketing copywriting, graphic design, Business Manager setup and management (FB, IG, LinkedIn, TikTok), video production and editing.",
  "- Package II — Aggressive Lead Generation — 2500 GEL/month (MOST POPULAR). Everything in I, plus multi-format ad creative, professional voiceover for video ads, retargeting, precise neuro-segmentation and A/B testing. Includes 90-day results guarantee.",
  "- Package III — Market Domination — 5000 GEL/month. Everything in I and II, plus strategic sales consulting, full brand neuro-identity packaging, original brand music (sonic branding). Includes 90-day results guarantee.",
  "",
  "90-DAY RESULTS GUARANTEE (Packages II and III only): a specific KPI is written into the contract in advance; if the strategy does not reach it within 90 days, the agency keeps working for free until results are delivered.",
  "",
  "PAYMENT: two-stage 50% / 50% (first on signing, second on day 15). Full single payment is also possible.",
  "",
  "ADD-ONS (monthly, GEL): full reel production 350; Google Ads setup and management 600; audio services 800; TikTok 5 videos 1200; TikTok 10 videos 2000.",
  "",
  "CONTACT: email aim@revolver.ge, phone +995 555 451 003, office hours Mon-Sat 10:00-19:00."
].join("\n");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Server not configured" }); return; }
  try {
    var body = req.body || {};
    var messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) { res.status(400).json({ error: "Bad request" }); return; }
    var contents = messages.slice(-12).map(function (m) {
      return { role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content || "").slice(0, 2000) }] };
    });
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + apiKey;
    var r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
      })
    });
    if (!r.ok) { var t = await r.text(); res.status(502).json({ error: "Upstream error", detail: t.slice(0, 400) }); return; }
    var data = await r.json();
    var text = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      text = data.candidates[0].content.parts.map(function (p) { return p.text || ""; }).join("").trim();
    }
    res.status(200).json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
};
