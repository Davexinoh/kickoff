import { useState } from "react";
import { NATIONS } from "./players.js";
import PlayerPickerModal from "./PlayerPickerModal.jsx";
import Pitch from "./Pitch.jsx";
import CaptainSelector from "./CaptainSelector.jsx";
import { submitSquadOnchain } from "./wallet.js";
import SquadCard from "./SquadCard.jsx";

const FORMATIONS = [
  { name: "4-3-3", gk: 1, def: 4, mid: 3, fwd: 3 },
  { name: "3-5-2", gk: 1, def: 3, mid: 5, fwd: 2 },
  { name: "5-2-3", gk: 1, def: 5, mid: 2, fwd: 3 },
  { name: "4-2-4", gk: 1, def: 4, mid: 2, fwd: 4 },
  { name: "3-4-3", gk: 1, def: 3, mid: 4, fwd: 3 },
];

const BUDGET_TOTAL = 100;
const MATCHDAY = 1;

const GLASS = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
};

const GLASS_GREEN = {
  background: "var(--surface2)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--surface2)",
  borderRadius: 12,
};

export default function SquadBuilder({ squad, setSquad, onSquadLocked, squadLocked, txHash: savedTxHash, username }) {
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showSquadCard, setShowSquadCard] = useState(false);
  const [formation, setFormation] = useState(FORMATIONS[0]);
  const [locking, setLocking] = useState(false);
  const [lockStatus, setLockStatus] = useState(squadLocked ? "success" : null);
  const [lockMsg, setLockMsg] = useState("");
  const [lockedTxHash, setLockedTxHash] = useState(savedTxHash || null);

  const budgetSpent = squad.selectedPlayerIds.reduce((sum, id) => {
    const p = findPlayerById(id);
    return sum + (p ? p.price : 0);
  }, 0);
  const budgetRemaining = BUDGET_TOTAL - budgetSpent;
  const budgetPct = Math.min((budgetSpent / BUDGET_TOTAL) * 100, 100);

  function findPlayerById(id) {
    for (const nation of Object.values(NATIONS)) {
      const p = nation.find(p => p.id === id);
      if (p) return p;
    }
    return null;
  }

  function handleAddPlayer(playerId) {
    if (squad.selectedPlayerIds.includes(playerId)) return;
    const player = findPlayerById(playerId);
    if (!player) return;
    if (budgetRemaining < player.price) return;

    const POSITION_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
    const posCount = squad.selectedPlayerIds.filter(id => {
      const p = findPlayerById(id);
      return p && p.pos === player.pos;
    }).length;
    if (posCount >= POSITION_LIMITS[player.pos]) return;

    const nationCount = squad.selectedPlayerIds.filter(id => {
      const p = findPlayerById(id);
      return p && p.nation === player.nation;
    }).length;
    if (nationCount >= 3) return;

    setSquad(prev => ({
      ...prev,
      selectedPlayerIds: [...prev.selectedPlayerIds, playerId],
    }));
  }

  function handleRemovePlayer(playerId) {
    if (squadLocked || lockStatus === "success") return;
    setSquad(prev => ({
      ...prev,
      selectedPlayerIds: prev.selectedPlayerIds.filter(id => id !== playerId),
      captain: prev.captain === playerId ? null : prev.captain,
      viceCaptain: prev.viceCaptain === playerId ? null : prev.viceCaptain,
    }));
  }

  function handleSwapPlayers(id1, id2) {
    if (squadLocked || lockStatus === "success") return;
    const ids = [...squad.selectedPlayerIds];
    const i1 = ids.indexOf(id1);
    const i2 = ids.indexOf(id2);
    if (i1 >= 0 && i2 >= 0) {
      [ids[i1], ids[i2]] = [ids[i2], ids[i1]];
      setSquad(prev => ({ ...prev, selectedPlayerIds: ids }));
    }
  }

  async function handleLockSquad() {
    if (locking || squadLocked || lockStatus === "success") return;
    setLocking(true);
    setLockStatus(null);
    setLockMsg("");
    try {
      const result = await submitSquadOnchain(MATCHDAY, squad.selectedPlayerIds);
      const finalTxHash = result.txHash === "already-submitted"
        ? (savedTxHash || "already-submitted")
        : result.txHash;
      setLockedTxHash(finalTxHash);
      setLockStatus("success");
      setLockMsg(result.txHash === "already-submitted" ? "Squad already locked onchain!" : "Squad locked onchain!");
      if (onSquadLocked) onSquadLocked(finalTxHash);
    } catch (err) {
      setLockStatus("error");
      setLockMsg(err.message || "Transaction failed. Try again.");
    } finally {
      setLocking(false);
    }
  }

  const isSquadComplete = squad.selectedPlayerIds.length === 15;
  const canLockSquad = isSquadComplete && squad.captain && squad.viceCaptain;
  const isLocked = squadLocked || lockStatus === "success";

  return (
    <div style={{
      padding: "16px",
      background: "var(--bg)",
      minHeight: "100vh",
      backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(0,100,40,0.2) 0%, transparent 60%)`,
    }}>

      {/* Header */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 2 }}>
          Squad Builder
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginTop: 2 }}>
          <span style={{ color: "var(--accent)" }}>{squad.selectedPlayerIds.length}</span>
          <span style={{ color: "var(--grey2)" }}>/15</span>
          <span style={{ fontSize: 13, color: "var(--grey)", fontWeight: 400, marginLeft: 8 }}>players</span>
        </div>
        {isLocked && (
          <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 700 }}>
            🔒 Squad locked on 0G Chain
          </div>
        )}
      </div>

      {/* Formation Selector */}
      <div style={{ ...GLASS, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--grey)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
          Formation
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FORMATIONS.map(f => {
            const active = formation.name === f.name;
            return (
              <button
                key={f.name}
                onClick={() => !isLocked && setFormation(f)}
                style={{
                  padding: "7px 12px", borderRadius: 6,
                  border: active ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "var(--surface2)" : "rgba(255,255,255,0.03)",
                  color: active ? "var(--accent)" : "var(--grey)",
                  fontSize: 11, fontWeight: 700,
                  cursor: isLocked ? "default" : "pointer",
                  textTransform: "uppercase", letterSpacing: 0.5,
                  transition: "all 0.15s",
                  opacity: isLocked && !active ? 0.5 : 1,
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Bar */}
      <div style={{ ...GLASS_GREEN, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ color: "var(--grey)", fontWeight: 600 }}>Budget</span>
          <span style={{ color: budgetRemaining < 10 ? "var(--red)" : "var(--accent)", fontWeight: 700 }}>
            {budgetSpent.toFixed(1)} / {BUDGET_TOTAL} 0G
          </span>
        </div>
        <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${budgetPct}%`,
            background: budgetRemaining < 10
              ? "linear-gradient(90deg, var(--red), #ff6b6b)"
              : "var(--accent)",
            borderRadius: 99, transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--grey)", textAlign: "right" }}>
          {budgetRemaining.toFixed(1)} 0G remaining
        </div>
      </div>

      {/* Pitch */}
      <div style={{ ...GLASS, padding: 0, overflow: "hidden", marginBottom: 12 }}>
        <Pitch
          selectedPlayerIds={squad.selectedPlayerIds}
          formation={formation}
          findPlayerById={findPlayerById}
          onSwap={handleSwapPlayers}
          onRemove={handleRemovePlayer}
          captain={squad.captain}
          viceCaptain={squad.viceCaptain}
        />
      </div>

      {/* Add Players Button */}
      {!isSquadComplete && !isLocked && (
        <button
          onClick={() => setShowPickerModal(true)}
          style={{
            width: "100%", marginBottom: 12, padding: "14px", borderRadius: 10,
            background: "var(--accent)",
            color: "#000", border: "none", fontSize: 13, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: 1.5, cursor: "pointer",
            boxShadow: "0 4px 24px var(--surface2)",
          }}
        >
          + Add Players ({15 - squad.selectedPlayerIds.length} remaining)
        </button>
      )}

      {/* Captain Selector */}
      {isSquadComplete && !isLocked && (
        <div style={{ ...GLASS, padding: "14px", marginBottom: 12 }}>
          <CaptainSelector
            squad={squad}
            setSquad={setSquad}
            selectedPlayerIds={squad.selectedPlayerIds}
            findPlayerById={findPlayerById}
          />
        </div>
      )}

      {/* Captain display when locked */}
      {isLocked && squad.captain && (
        <div style={{ ...GLASS_GREEN, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--grey)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Captain</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
              ⭐ {findPlayerById(squad.captain)?.name || squad.captain}
            </div>
          </div>
          {squad.viceCaptain && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--grey)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Vice Captain</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {findPlayerById(squad.viceCaptain)?.name || squad.viceCaptain}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lock Squad Button */}
      {canLockSquad && !isLocked && (
        <button
          onClick={handleLockSquad}
          disabled={locking}
          style={{
            width: "100%", padding: "15px", borderRadius: 10,
            background: locking ? "var(--surface2)" : "var(--accent)",
            color: "#000", border: "none", fontSize: 13, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: 1.5,
            cursor: locking ? "not-allowed" : "pointer",
            boxShadow: locking ? "none" : "none",
            transition: "all 0.2s", marginBottom: 8,
          }}
        >
          {locking ? "⏳ Submitting to 0G Chain..." : "🔒 Lock Squad on 0G Chain"}
        </button>
      )}

      {/* Success state */}
      {isLocked && (
        <div style={{ ...GLASS_GREEN, padding: "20px 16px", textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>
            Squad Locked on 0G Chain!
          </div>
          <div style={{ fontSize: 11, color: "var(--grey)", marginBottom: 16, lineHeight: 1.6 }}>
            Your squad is permanently recorded onchain.<br />Good luck, manager.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowSquadCard(true)}
              style={{
                padding: "11px 18px", borderRadius: 8,
                background: "var(--accent)",
                color: "#000", border: "none", fontSize: 11, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: 1, cursor: "pointer",
                boxShadow: "0 4px 16px var(--surface2)",
              }}
            >
              🖼️ Squad Card
            </button>
            {lockedTxHash && lockedTxHash !== "already-submitted" && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${lockedTxHash}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "11px 18px", borderRadius: 8,
                  background: "var(--surface2)",
                  border: "1px solid var(--surface2)",
                  fontSize: 11, color: "var(--accent)",
                  textDecoration: "none", fontWeight: 700,
                }}
              >
                🔗 Explorer
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {lockStatus === "error" && (
        <div style={{
          ...GLASS, padding: "12px 14px", marginBottom: 8,
          border: "1px solid rgba(255,71,87,0.3)",
          background: "rgba(255,71,87,0.06)",
        }}>
          <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>
            ⚠️ {lockMsg}
          </div>
          <button
            onClick={() => { setLockStatus(null); setLockMsg(""); }}
            style={{
              marginTop: 8, fontSize: 10, color: "var(--grey)",
              background: "none", border: "none", cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Hint */}
      {isSquadComplete && !squad.captain && !isLocked && (
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--grey)", marginTop: 4 }}>
          Set a captain and vice-captain to lock your squad
        </div>
      )}

      {/* Player Picker Modal */}
      {showPickerModal && (
        <PlayerPickerModal
          onClose={() => setShowPickerModal(false)}
          onAddPlayer={handleAddPlayer}
          selectedPlayerIds={squad.selectedPlayerIds}
          budgetRemaining={budgetRemaining}
          formation={formation}
          findPlayerById={findPlayerById}
        />
      )}

      {/* Squad Card Modal */}
      {showSquadCard && (
        <SquadCard
          squad={squad}
          findPlayerById={findPlayerById}
          username={username}
          txHash={lockedTxHash}
          onClose={() => setShowSquadCard(false)}
        />
      )}
    </div>
  );
}
