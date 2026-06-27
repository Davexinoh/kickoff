import { useState } from "react";

const NATION_FLAGS = {
  France: "🇫🇷", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Brazil: "🇧🇷", Germany: "🇩🇪",
  Portugal: "🇵🇹", Spain: "🇪🇸", Argentina: "🇦🇷", Belgium: "🇧🇪",
  Netherlands: "🇳🇱", Croatia: "🇭🇷",
};

const POS_COLORS = {
  GK: { bg: "var(--surface2)", border: "var(--line)", text: "var(--grey)" },
  DEF: { bg: "var(--surface2)", border: "var(--line)", text: "var(--grey)" },
  MID: { bg: "var(--surface2)", border: "var(--line)", text: "var(--grey)" },
  FWD: { bg: "var(--surface2)", border: "var(--line)", text: "var(--grey)" },
};

export default function Pitch({
  selectedPlayerIds,
  formation,
  findPlayerById,
  onSwap,
  onRemove,
  captain,
  viceCaptain,
}) {
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);

  const gk = selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "GK");
  const def = selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "DEF");
  const mid = selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "MID");
  const fwd = selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "FWD");

  // Bench = players beyond starting formation slots
  const starters = [
    ...gk.slice(0, formation.gk),
    ...def.slice(0, formation.def),
    ...mid.slice(0, formation.mid),
    ...fwd.slice(0, formation.fwd),
  ];
  const bench = selectedPlayerIds.filter(id => !starters.includes(id));

  function handleDragStart(e, playerId) {
    setDraggedPlayerId(playerId);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDropOnPlayer(e, targetPlayerId) {
    e.preventDefault();
    if (draggedPlayerId && draggedPlayerId !== targetPlayerId) {
      onSwap(draggedPlayerId, targetPlayerId);
    }
    setDraggedPlayerId(null);
  }

  function PlayerSlot({ playerId }) {
    const player = findPlayerById(playerId);
    if (!player) return null;

    const isCaptain = captain === playerId;
    const isViceCaptain = viceCaptain === playerId;
    const isDragging = draggedPlayerId === playerId;
    const posStyle = POS_COLORS[player.pos] || POS_COLORS.MID;
    const flag = NATION_FLAGS[player.nation] || "🏳️";
    const jerseyNum = player.id.split("_")[1]?.replace(/^0+/, "") || "?";
    const lastName = player.name.split(" ").pop();

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, playerId)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnPlayer(e, playerId)}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          cursor: "grab",
          opacity: isDragging ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {/* Jersey card */}
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: isCaptain
            ? "var(--surface2)"
            : isViceCaptain
            ? "var(--surface2)"
            : posStyle.bg,
          border: `2px solid ${isCaptain ? "var(--accent)" : isViceCaptain ? "var(--accent)" : posStyle.border}`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 1, position: "relative",
          boxShadow: isCaptain
            ? "none"
            : isViceCaptain
            ? "none"
            : "none",
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
          <span style={{ fontSize: 8, fontWeight: 800, color: posStyle.text, lineHeight: 1 }}>
            #{jerseyNum}
          </span>

          {/* Captain badge */}
          {isCaptain && (
            <div style={{
              position: "absolute", top: -6, right: -6,
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--accent)", color: "#000",
              fontSize: 9, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>C</div>
          )}

          {/* Vice captain badge */}
          {isViceCaptain && (
            <div style={{
              position: "absolute", top: -6, right: -6,
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--accent)", color: "#000",
              fontSize: 9, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>V</div>
          )}

          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(playerId); }}
            style={{
              position: "absolute", bottom: -6, right: -6,
              width: 14, height: 14, borderRadius: "50%",
              background: "var(--red)", border: "none",
              color: "#fff", fontSize: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Player name */}
        <div style={{
          fontSize: 8, fontWeight: 700, color: "#fff",
          textAlign: "center", lineHeight: 1.2,
          maxWidth: 48, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        }}>
          {lastName}
        </div>

        {/* Position tag */}
        <div style={{
          fontSize: 7, fontWeight: 800, color: posStyle.text,
          letterSpacing: 0.5,
        }}>
          {player.pos}
        </div>
      </div>
    );
  }

  function BenchSlot({ playerId }) {
    const player = findPlayerById(playerId);
    if (!player) return null;
    const posStyle = POS_COLORS[player.pos] || POS_COLORS.MID;
    const flag = NATION_FLAGS[player.nation] || "🏳️";
    const jerseyNum = player.id.split("_")[1]?.replace(/^0+/, "") || "?";
    const lastName = player.name.split(" ").pop();

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, playerId)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnPlayer(e, playerId)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          cursor: "grab", opacity: draggedPlayerId === playerId ? 0.5 : 1,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 6,
          background: posStyle.bg,
          border: `1px solid ${posStyle.border}`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 1, position: "relative", opacity: 0.7,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{flag}</span>
          <span style={{ fontSize: 7, fontWeight: 800, color: posStyle.text }}># {jerseyNum}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(playerId); }}
            style={{
              position: "absolute", top: -5, right: -5,
              width: 12, height: 12, borderRadius: "50%",
              background: "var(--red)", border: "none",
              color: "#fff", fontSize: 9, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0,
            }}
          >×</button>
        </div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", textAlign: "center", maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lastName}
        </div>
      </div>
    );
  }

  const startingGK = gk.slice(0, formation.gk);
  const startingDEF = def.slice(0, formation.def);
  const startingMID = mid.slice(0, formation.mid);
  const startingFWD = fwd.slice(0, formation.fwd);

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid var(--line)",
    }}>
      {/* Pitch markings */}
      <div style={{ position: "relative" }}>
        {/* Top penalty box */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%",
          height: 40, border: "1px solid rgba(255,255,255,0.12)",
          borderTop: "none", borderRadius: "0 0 4px 4px",
        }} />
        {/* Center circle */}
        <div style={{
          position: "absolute", top: "46%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 70, height: 70, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          pointerEvents: "none",
        }} />

        {/* Formation label */}
        <div style={{
          textAlign: "center", paddingTop: 10, paddingBottom: 4,
          fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase", letterSpacing: 2, position: "relative", zIndex: 1,
        }}>
          {formation.name}
        </div>

        {/* Pitch rows */}
        <div style={{ padding: "8px 12px 4px", position: "relative", zIndex: 1 }}>

          {/* Forwards */}
          {startingFWD.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-evenly",
              alignItems: "center", marginBottom: 12,
            }}>
              {startingFWD.map(id => <PlayerSlot key={id} playerId={id} />)}
            </div>
          )}

          {/* Midfielders */}
          {startingMID.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-evenly",
              alignItems: "center", marginBottom: 12,
            }}>
              {startingMID.map(id => <PlayerSlot key={id} playerId={id} />)}
            </div>
          )}

          {/* Defenders */}
          {startingDEF.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-evenly",
              alignItems: "center", marginBottom: 12,
            }}>
              {startingDEF.map(id => <PlayerSlot key={id} playerId={id} />)}
            </div>
          )}

          {/* Goalkeeper */}
          {startingGK.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "center",
              alignItems: "center", marginBottom: 8,
            }}>
              {startingGK.map(id => <PlayerSlot key={id} playerId={id} />)}
            </div>
          )}
        </div>

        {/* Bottom penalty box */}
        <div style={{
          margin: "0 20%", height: 12,
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "0 0 4px 4px",
        }} />
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div style={{
          borderTop: "1px dashed rgba(255,255,255,0.1)",
          padding: "10px 12px",
          background: "rgba(0,0,0,0.2)",
        }}>
          <div style={{
            fontSize: 8, color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: 2,
            marginBottom: 8, textAlign: "center", fontWeight: 700,
          }}>
            Bench ({bench.length})
          </div>
          <div style={{ display: "flex", justifyContent: "space-evenly", flexWrap: "wrap", gap: 8 }}>
            {bench.map(id => <BenchSlot key={id} playerId={id} />)}
          </div>
        </div>
      )}
    </div>
  );
}
