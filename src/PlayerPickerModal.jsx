import { useState } from "react";
import { NATIONS, getNationList } from "./players.js";

// Full squad limits: 2 GK, 5 DEF, 5 MID, 3 FWD = 15
const SQUAD_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };

const NATION_FLAGS = {
  France: "🇫🇷", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Brazil: "🇧🇷", Germany: "🇩🇪",
  Portugal: "🇵🇹", Spain: "🇪🇸", Argentina: "🇦🇷", Belgium: "🇧🇪",
  Netherlands: "🇳🇱", Croatia: "🇭🇷",
};

const POS_COLORS = {
  GK: { bg: "var(--surface2)", text: "var(--grey)" },
  DEF: { bg: "var(--surface2)", text: "var(--grey)" },
  MID: { bg: "var(--surface2)", text: "var(--accent)" },
  FWD: { bg: "var(--surface2)", text: "var(--grey)" },
};

function PlayerCard({ player, isSelected, canAdd, onAdd }) {
  const flag = NATION_FLAGS[player.nation] || "🏳️";
  const posStyle = POS_COLORS[player.pos] || POS_COLORS.MID;
  // Jersey number from id e.g. fr_018 → 18
  const jerseyNum = player.id.split("_")[1]?.replace(/^0+/, "") || "?";

  return (
    <div
      onClick={() => canAdd && onAdd(player.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 8,
        border: isSelected
          ? "1px solid var(--accent)"
          : canAdd
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.03)",
        background: isSelected
          ? "var(--surface2)"
          : "rgba(255,255,255,0.02)",
        cursor: canAdd ? "pointer" : "default",
        opacity: !canAdd && !isSelected ? 0.4 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {/* Jersey card */}
      <div style={{
        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${posStyle.bg.replace("0.15", "0.3")}, ${posStyle.bg})`,
        border: `1px solid ${posStyle.text}33`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 1,
      }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{flag}</div>
        <div style={{ fontSize: 9, fontWeight: 800, color: posStyle.text, lineHeight: 1 }}>
          #{jerseyNum}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "var(--text)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {player.name}
        </div>
        <div style={{ fontSize: 10, color: "var(--grey)", marginTop: 2 }}>
          {player.club}
        </div>
      </div>

      {/* Position badge */}
      <div style={{
        padding: "3px 7px", borderRadius: 4,
        background: posStyle.bg, fontSize: 9,
        fontWeight: 800, color: posStyle.text,
        letterSpacing: 0.5, flexShrink: 0,
      }}>
        {player.pos}
      </div>

      {/* Price */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: "var(--accent)",
        minWidth: 36, textAlign: "right", flexShrink: 0,
      }}>
        {player.price}
      </div>

      {/* State indicator */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: isSelected ? "var(--accent)" : canAdd ? "var(--surface2)" : "transparent",
        border: isSelected ? "none" : canAdd ? "1px solid var(--accent)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: isSelected ? "#000" : "var(--accent)",
      }}>
        {isSelected ? "✓" : canAdd ? "+" : ""}
      </div>
    </div>
  );
}

export default function PlayerPickerModal({
  onClose, onAddPlayer, selectedPlayerIds, budgetRemaining, findPlayerById,
}) {
  const [selectedNation, setSelectedNation] = useState("France");
  const [selectedPos, setSelectedPos] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const nationPlayers = NATIONS[selectedNation] || [];

  let filteredPlayers = nationPlayers;
  if (selectedPos) filteredPlayers = filteredPlayers.filter(p => p.pos === selectedPos);
  if (searchQuery) filteredPlayers = filteredPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function canAddPlayer(player) {
    if (selectedPlayerIds.length >= 15) return false;
    if (selectedPlayerIds.includes(player.id)) return false;
    if (budgetRemaining < player.price) return false;

    // Use full squad limits, NOT formation slots
    const posCount = selectedPlayerIds.filter(id => {
      const p = findPlayerById(id);
      return p && p.pos === player.pos;
    }).length;
    if (posCount >= SQUAD_LIMITS[player.pos]) return false;

    // Nation limit: max 3 per nation
    const nationCount = selectedPlayerIds.filter(id => {
      const p = findPlayerById(id);
      return p && p.nation === player.nation;
    }).length;
    if (nationCount >= 3) return false;

    return true;
  }

  // Position counts for header badges
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  selectedPlayerIds.forEach(id => {
    const p = findPlayerById(id);
    if (p) counts[p.pos] = (counts[p.pos] || 0) + 1;
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(8,14,26,0.97)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1 }}>
              Pick Players
            </div>
            <div style={{ fontSize: 11, color: "var(--grey)", marginTop: 2 }}>
              {selectedPlayerIds.length}/15 selected • {budgetRemaining.toFixed(1)} 0G left
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none",
            color: "var(--text)", fontSize: 18, cursor: "pointer",
            width: 36, height: 36, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Position quota badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {Object.entries(SQUAD_LIMITS).map(([pos, limit]) => {
            const c = counts[pos] || 0;
            const full = c >= limit;
            const posStyle = POS_COLORS[pos];
            return (
              <div key={pos} style={{
                flex: 1, padding: "6px 4px", borderRadius: 6, textAlign: "center",
                background: full ? posStyle.bg : "rgba(255,255,255,0.03)",
                border: `1px solid ${full ? posStyle.text : "rgba(255,255,255,0.08)"}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: full ? posStyle.text : "var(--grey)", letterSpacing: 0.5 }}>{pos}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: full ? posStyle.text : "var(--text)" }}>{c}/{limit}</div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "var(--text)", fontSize: 12, marginBottom: 10, boxSizing: "border-box",
            outline: "none",
          }}
        />

        {/* Nation + Position row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <select
            value={selectedNation}
            onChange={e => setSelectedNation(e.target.value)}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              color: "var(--text)", fontSize: 12, outline: "none",
            }}
          >
            {getNationList().map(nation => (
              <option key={nation} value={nation} style={{ background: "#080e1a" }}>
                {NATION_FLAGS[nation] || ""} {nation}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 4 }}>
            {["GK", "DEF", "MID", "FWD"].map(pos => {
              const posStyle = POS_COLORS[pos];
              const active = selectedPos === pos;
              return (
                <button
                  key={pos}
                  onClick={() => setSelectedPos(active ? null : pos)}
                  style={{
                    padding: "8px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    border: active ? `1px solid ${posStyle.text}` : "1px solid rgba(255,255,255,0.1)",
                    background: active ? posStyle.bg : "rgba(255,255,255,0.04)",
                    color: active ? posStyle.text : "var(--grey)",
                    cursor: "pointer", letterSpacing: 0.5,
                  }}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredPlayers.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--grey)", fontSize: 12, marginTop: 40 }}>
            No players found
          </div>
        ) : filteredPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isSelected={selectedPlayerIds.includes(player.id)}
            canAdd={canAddPlayer(player)}
            onAdd={onAddPlayer}
          />
        ))}
      </div>
    </div>
  );
}
