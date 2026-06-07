// Revolver Agency — AI chat backend (Groq, free, no card required)
var MODEL = "llama-3.3-70b-versatile";

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
  var apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Server not configured" }); return; }
  try {
    var body = req.body || {};
    var msgs = body.messages;
    if (!Array.isArray(msgs) || msgs.length === 0) { res.status(400).json({ error: "Bad request" }); return; }
    var chat = [{ role: "system", content: SYSTEM_PROMPT }];
    msgs.slice(-12).forEach(function (m) {
      chat.push({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) });
    });
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model: MODEL, messages: chat, max_tokens: 1024, temperature: 0.7 })
    });
    if (!r.ok) { var t = await r.text(); console.error("GROQ_ERROR", r.status, t); res.status(502).json({ error: "Upstream error", detail: t.slice(0, 400) }); return; }
    var data = await r.json();
    var text = "";
    if (data.choices && data.choices[0] && data.choices[0].message) { text = (data.choices[0].message.content || "").trim(); }
    res.status(200).json({ reply: text });
  } catch (e) {
    console.error("SERVER_ERROR", e && e.message);
    res.status(500).json({ error: "Server error" });
  }
};
