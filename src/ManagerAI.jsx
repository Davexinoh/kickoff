import { useState } from "react";
import { getManagerVerdict, generateAISquad, getMatchPrediction, getRivalRoast } from "./aiEngine.js";

const card = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 4, padding: "16px 16px" };
const btn = (active) => ({
  flex: 1, padding: "10px 8px", borderRadius: 4, cursor: "pointer",
  background: active ? "var(--accent)" : "var(--surface2)",
  color: active ? "#000" : "var(--text)",
  border: "1px solid var(--line)", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: 0.5,
});

export default function ManagerAI({ squad, setSquad }) {
  const [tab, setTab] = useState("manager");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [strategy, setStrategy] = useState("balanced");

  async function run(kind) {
    setLoading(true); setOut(null);
    try {
      if (kind === "manager") setOut(await getManagerVerdict(squad));
      if (kind === "predict") setOut(await getMatchPrediction(squad));
      if (kind === "roast") setOut(await getRivalRoast(squad));
      if (kind === "generate") {
        const res = await generateAISquad(strategy);
        setSquad({ selectedPlayerIds: res.selectedPlayerIds, captain: res.captain, viceCaptain: res.viceCaptain });
        setOut({ text: `Generated a ${strategy} squad — ${res.selectedPlayerIds.length} players, ${res.spend.toFixed(1)} 0G spent. Captain set. Head to Squad to review and lock.` });
      }
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: "20px 16px", background: "var(--bg)", minHeight: "100vh", position: "relative" }}>
      <div style={{ fontSize: 11, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>KickOff</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4, fontFamily: '"Space Grotesk", sans-serif' }}>Manager AI</div>
      <div style={{ fontSize: 11, color: "var(--grey)", marginBottom: 20, lineHeight: 1.6 }}>
        Your AI coach. Scout your squad, generate a lineup, predict points, or roast a rival.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button style={btn(tab === "manager")} onClick={() => { setTab("manager"); setOut(null); }}>Scout</button>
        <button style={btn(tab === "generate")} onClick={() => { setTab("generate"); setOut(null); }}>Generate</button>
        <button style={btn(tab === "predict")} onClick={() => { setTab("predict"); setOut(null); }}>Predict</button>
        <button style={btn(tab === "roast")} onClick={() => { setTab("roast"); setOut(null); }}>Roast</button>
      </div>

      {/* Generate strategy picker */}
      {tab === "generate" && (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Strategy</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["attack", "balanced", "bonus"].map(s => (
              <button key={s} style={btn(strategy === s)} onClick={() => setStrategy(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={() => run(tab)}
        disabled={loading}
        style={{
          width: "100%", padding: 14, borderRadius: 4, marginBottom: 16,
          background: loading ? "var(--surface2)" : "var(--accent)",
          color: loading ? "var(--grey)" : "#000", border: "none",
          fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Thinking…" : tab === "manager" ? "Scout My Squad" : tab === "generate" ? "Generate Squad" : tab === "predict" ? "Predict My Points" : "Roast My Squad"}
      </button>

      {/* Output */}
      {out && (
        <div style={{ ...card }}>
          {out.rating != null && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: "var(--accent)", fontFamily: '"Space Grotesk", sans-serif' }}>{out.rating}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{out.verdict}</div>
            </div>
          )}
          {out.projected != null && (
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", marginBottom: 8, fontFamily: '"Space Grotesk", sans-serif' }}>
              {out.projected} <span style={{ fontSize: 13, color: "var(--grey)" }}>pts projected</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7 }}>{out.text}</div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 9, color: "var(--grey2)", textAlign: "center", letterSpacing: 1, textTransform: "uppercase" }}>
        AI runs on 0G — powered by KickOff Intelligence
      </div>
    </div>
  );
}
