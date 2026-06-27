/**
 * KickOff AI Engine
 * Hardcoded rule-based logic now. Swap callModel() for Anthropic API later.
 * Every feature routes through one async function so the upgrade is one place.
 */
import { NATIONS, getAllPlayers } from "./players.js";

const BUDGET = 100;

// ── SWAP POINT ──────────────────────────────────────────────
// Later: replace body with a fetch to your Anthropic-backed endpoint.
// Keep the same return shapes and nothing else in the app changes.
async function callModel(task, payload) {
  await new Promise(r => setTimeout(r, 600)); // simulate think time
  switch (task) {
    case "manager_verdict": return managerVerdict(payload);
    case "generate_squad":  return generateSquad(payload);
    case "predict":         return predictScore(payload);
    case "roast":           return roast(payload);
    default: return { text: "" };
  }
}

function findById(id) {
  for (const arr of Object.values(NATIONS)) {
    const p = arr.find(p => p.id === id);
    if (p) return p;
  }
  return null;
}

function squadStats(ids) {
  const players = ids.map(findById).filter(Boolean);
  const spend = players.reduce((s, p) => s + p.price, 0);
  const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach(p => byPos[p.pos]?.push(p));
  const nations = {};
  players.forEach(p => { nations[p.nation] = (nations[p.nation] || 0) + 1; });
  const bonusNations = Object.entries(nations).filter(([, c]) => c >= 3).map(([n]) => n);
  const attackValue = byPos.FWD.reduce((s, p) => s + p.price, 0) + byPos.MID.reduce((s, p) => s + p.price, 0) * 0.5;
  const defValue = byPos.DEF.reduce((s, p) => s + p.price, 0) + byPos.GK.reduce((s, p) => s + p.price, 0);
  return { players, spend, byPos, nations, bonusNations, attackValue, defValue };
}

// ── 1. MANAGER VERDICT ──────────────────────────────────────
function managerVerdict({ selectedPlayerIds, captain }) {
  const ids = selectedPlayerIds || [];
  if (ids.length < 15) {
    return { text: `Squad incomplete — ${15 - ids.length} slots open. Fill your 15 before I can scout it properly.`, rating: null };
  }
  const st = squadStats(ids);
  const cap = captain ? findById(captain) : null;
  const remaining = BUDGET - st.spend;

  const lines = [];
  if (st.attackValue >= 32) lines.push("Front line is loaded — this squad is built to outscore, not grind.");
  else if (st.attackValue >= 24) lines.push("Balanced attack with enough firepower up top.");
  else lines.push("Attack looks light. You may struggle to chase goals.");

  if (st.defValue >= 28) lines.push("Defensively solid — clean-sheet points are in play.");
  else lines.push("Back line is thin; clean sheets will be rare.");

  if (st.bonusNations.length) lines.push(`${st.bonusNations[0]} bloc active — 1.2x multiplier stacking nicely.`);
  else lines.push("No nation bonus yet — 3+ from one country unlocks 1.2x.");

  if (cap) lines.push(`${cap.name.split(" ").pop()} with the armband doubles your ceiling.`);
  if (remaining > 8) lines.push(`You left ${remaining.toFixed(1)} 0G unspent — upgrade a midfielder.`);

  // rating 0-100
  let rating = 50 + st.attackValue * 0.7 + st.defValue * 0.5 + st.bonusNations.length * 6 - remaining * 0.4;
  rating = Math.max(40, Math.min(99, Math.round(rating)));
  const verdict = rating >= 85 ? "Title contender." : rating >= 72 ? "Top-half squad." : rating >= 60 ? "Mid-table shape." : "Needs work.";

  return { text: lines.join(" "), rating, verdict };
}

// ── 2. SQUAD GENERATOR ──────────────────────────────────────
function generateSquad({ strategy }) {
  // strategy: "attack" | "balanced" | "bonus"
  const all = getAllPlayers();
  const need = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
  const picked = [];
  const nationCount = {};
  let spend = 0;

  function canTake(p) {
    if (picked.find(x => x.id === p.id)) return false;
    if ((nationCount[p.nation] || 0) >= 3) return false;
    const posTaken = picked.filter(x => x.pos === p.pos).length;
    if (posTaken >= need[p.pos]) return false;
    if (spend + p.price > BUDGET) return false;
    return true;
  }

  function take(p) {
    picked.push(p);
    nationCount[p.nation] = (nationCount[p.nation] || 0) + 1;
    spend += p.price;
  }

  let pool = [...all];
  if (strategy === "attack") {
    pool.sort((a, b) => (b.pos === "FWD" || b.pos === "MID" ? b.price : b.price * 0.5) - (a.pos === "FWD" || a.pos === "MID" ? a.price : a.price * 0.5));
  } else if (strategy === "bonus") {
    // favour stacking top 3 nations
    const strongNations = ["France", "England", "Brazil", "Spain", "Argentina"];
    pool.sort((a, b) => {
      const as = strongNations.includes(a.nation) ? 1 : 0;
      const bs = strongNations.includes(b.nation) ? 1 : 0;
      return bs - as || b.price - a.price;
    });
  } else {
    pool.sort((a, b) => b.price - a.price);
  }

  // Fill premium first, then cheap fillers to complete positions
  for (const p of pool) if (canTake(p)) take(p);
  // complete any unfilled slots with cheapest valid
  const cheap = [...all].sort((a, b) => a.price - b.price);
  for (const pos of Object.keys(need)) {
    while (picked.filter(x => x.pos === pos).length < need[pos]) {
      const f = cheap.find(p => p.pos === pos && canTake(p));
      if (!f) break;
      take(f);
    }
  }

  // captain = priciest forward/mid
  const cap = [...picked].filter(p => p.pos === "FWD" || p.pos === "MID").sort((a, b) => b.price - a.price)[0];
  const vice = [...picked].filter(p => p.id !== cap?.id && (p.pos === "FWD" || p.pos === "MID")).sort((a, b) => b.price - a.price)[0];

  return {
    selectedPlayerIds: picked.map(p => p.id),
    captain: cap?.id || null,
    viceCaptain: vice?.id || null,
    spend,
  };
}

// ── 3. MATCH PREDICTOR ──────────────────────────────────────
function predictScore({ selectedPlayerIds, captain }) {
  const st = squadStats(selectedPlayerIds || []);
  if (!st.players.length) return { text: "Pick a squad first.", projected: 0 };
  let base = st.attackValue * 1.8 + st.defValue * 1.1;
  if (st.bonusNations.length) base *= 1.2;
  if (captain) base += 12;
  const projected = Math.round(base);
  const lo = Math.max(0, projected - 14);
  const hi = projected + 14;
  const text = `Projected this matchday: ~${projected} pts (range ${lo}–${hi}). ${
    st.bonusNations.length ? `${st.bonusNations[0]} bonus boosting output.` : "Add a nation bonus to lift the ceiling."
  }`;
  return { text, projected, lo, hi };
}

// ── 4. RIVAL ROAST ──────────────────────────────────────────
function roast({ selectedPlayerIds }) {
  const st = squadStats(selectedPlayerIds || []);
  if (st.players.length < 15) return { text: "Finish your squad before talking trash." };
  const lines = [];
  const remaining = BUDGET - st.spend;
  if (st.attackValue < 24) lines.push("This attack couldn't score in an empty net.");
  if (st.defValue < 22) lines.push("Your defense is a turnstile — opponents say thanks.");
  if (!st.bonusNations.length) lines.push("No nation bonus? Rookie mistake.");
  if (remaining > 10) lines.push(`Left ${remaining.toFixed(0)} 0G on the table — generous of you.`);
  if (!lines.length) lines.push("Honestly? Hard to fault this one. Respect.");
  return { text: lines.join(" ") };
}

// ── PUBLIC API ──────────────────────────────────────────────
export const getManagerVerdict = (squad) => callModel("manager_verdict", squad);
export const generateAISquad   = (strategy) => callModel("generate_squad", { strategy });
export const getMatchPrediction = (squad) => callModel("predict", squad);
export const getRivalRoast      = (squad) => callModel("roast", squad);
