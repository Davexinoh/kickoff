import { useRef, useEffect } from "react";

const NATION_FLAGS = {
  France: "🇫🇷", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Brazil: "🇧🇷", Germany: "🇩🇪",
  Portugal: "🇵🇹", Spain: "🇪🇸", Argentina: "🇦🇷", Belgium: "🇧🇪",
  Netherlands: "🇳🇱", Croatia: "🇭🇷",
};

const POS_COLORS = {
  GK: "#9A968C", DEF: "#9A968C", MID: "#9A968C", FWD: "#9A968C",
};

export default function SquadCard({ squad, findPlayerById, username, txHash, onClose }) {
  const canvasRef = useRef(null);
  const W = 600;
  const H = 920;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0B0B0D";
    ctx.fillRect(0, 0, W, H);

    // Pitch gradient
    const pitchGrad = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 450);
    pitchGrad.addColorStop(0, "rgba(255,255,255,0.02)");
    pitchGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(0, 0, W, H);

    // Pitch stripes
    ctx.globalAlpha = 0.035;
    for (let y = 0; y < H; y += 48) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, y, W, 24);
    }
    ctx.globalAlpha = 1;

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, 480, 75, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(40, 480); ctx.lineTo(W - 40, 480);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Penalty boxes
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(W * 0.2, 110, W * 0.6, 60);
    ctx.strokeRect(W * 0.2, H - 170, W * 0.6, 60);

    // Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#FAFAF7";
    ctx.font = "800 32px Arial";
    ctx.fillText("KICKOFF", W / 2, 44);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px Arial";
    ctx.fillText("ONCHAIN FANTASY FOOTBALL  •  WORLD CUP 2026", W / 2, 62);

    ctx.beginPath();
    ctx.moveTo(40, 74); ctx.lineTo(W - 40, 74);
    ctx.strokeStyle = "rgba(250,250,247,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.fillText((username || "MANAGER").toUpperCase(), W / 2, 96);

    // Player rows
    const gk = squad.selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "GK");
    const def = squad.selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "DEF");
    const mid = squad.selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "MID");
    const fwd = squad.selectedPlayerIds.filter(id => findPlayerById(id)?.pos === "FWD");

    const startingXI = [
      ...fwd.slice(0, 3),
      ...mid.slice(0, 5),
      ...def.slice(0, 5),
      ...gk.slice(0, 1),
    ];

    const rows = [
      { players: fwd.slice(0, 3), y: 168 },
      { players: mid.slice(0, 5), y: 278 },
      { players: def.slice(0, 5), y: 388 },
      { players: gk.slice(0, 1), y: 495 },
    ];

    function drawPlayer(id, x, y, small = false) {
      const player = findPlayerById(id);
      if (!player) return;
      const flag = NATION_FLAGS[player.nation] || "🏳";
      const jerseyNum = player.id.split("_")[1]?.replace(/^0+/, "") || "?";
      const posColor = POS_COLORS[player.pos] || "#E8E4D8";
      const isCaptain = squad.captain === id;
      const isVice = squad.viceCaptain === id;
      const lastName = player.name.split(" ").pop();

      const cardW = small ? 56 : 68;
      const cardH = small ? 68 : 82;
      const cx = x - cardW / 2;
      const cy = y - cardH / 2;

      // Card bg — no roundRect, use rect for compatibility
      ctx.fillStyle = isCaptain ? "rgba(232,228,216,0.14)" : `${posColor}20`;
      ctx.beginPath();
      ctx.rect(cx, cy, cardW, cardH);
      ctx.fill();

      // Card border
      ctx.strokeStyle = isCaptain ? "#E8E4D8" : isVice ? "#E8E4D8" : posColor;
      ctx.lineWidth = isCaptain ? 2 : 1;
      ctx.beginPath();
      ctx.rect(cx, cy, cardW, cardH);
      ctx.stroke();

      // Flag
      ctx.font = `${small ? 18 : 22}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(flag, x, cy + (small ? 22 : 26));

      // Jersey num
      ctx.fillStyle = posColor;
      ctx.font = `bold ${small ? 9 : 10}px Arial`;
      ctx.fillText(`#${jerseyNum}`, x, cy + (small ? 36 : 42));

      // Captain/Vice badge
      if (isCaptain || isVice) {
        ctx.fillStyle = isCaptain ? "#E8E4D8" : "#E8E4D8";
        ctx.beginPath();
        ctx.arc(cx + cardW - 8, cy + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText(isCaptain ? "C" : "V", cx + cardW - 8, cy + 11);
      }

      // Name
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `bold ${small ? 8 : 9}px Arial`;
      ctx.textAlign = "center";
      const shortName = lastName.length > 9 ? lastName.slice(0, 9) + "." : lastName;
      ctx.fillText(shortName, x, cy + (small ? 52 : 58));

      // Position
      ctx.fillStyle = posColor;
      ctx.font = `bold ${small ? 7 : 8}px Arial`;
      ctx.fillText(player.pos, x, cy + (small ? 63 : 71));
    }

    rows.forEach(({ players, y }) => {
      if (!players.length) return;
      const spacing = (W - 80) / players.length;
      players.forEach((id, i) => {
        const x = 40 + spacing * i + spacing / 2;
        drawPlayer(id, x, y);
      });
    });

    // Bench — fixed: use startingXI not startingII
    const benchPlayers = squad.selectedPlayerIds.filter(id => !startingXI.includes(id));

    if (benchPlayers.length > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.rect(16, 558, W - 32, 100);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(16, 558, W - 32, 100);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText("BENCH", W / 2, 574);

      const bSpacing = (W - 80) / Math.max(benchPlayers.length, 4);
      benchPlayers.forEach((id, i) => {
        drawPlayer(id, 40 + bSpacing * i + bSpacing / 2, 628, true);
      });
    }

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, H - 82, W, 82);

    ctx.beginPath();
    ctx.moveTo(0, H - 82); ctx.lineTo(W, H - 82);
    ctx.strokeStyle = "rgba(250,250,247,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#E8E4D8";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🔒 SQUAD LOCKED ON 0G CHAIN", W / 2, H - 56);

    if (txHash && txHash !== "already-submitted") {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px Arial";
      ctx.fillText(`TX: ${txHash.slice(0, 32)}...`, W / 2, H - 38);
    }

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "9px Arial";
    ctx.fillText("kickoff-nvq8.onrender.com  •  @dontfadedave  •  @0G_labs", W / 2, H - 18);

  }, [squad, username, txHash]);

  function handleDownload() {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `kickoff-${username || "squad"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function handleShare() {
    const captain = findPlayerById(squad.captain);
    const captainName = captain?.name || "TBA";
    const text = `⚽ Just locked my World Cup 2026 fantasy squad onchain!\n\nCaptain: ${captainName} ⭐\n🔒 Verified on 0G Chain\n🎮 kickoff-nvq8.onrender.com\n\n@dontfadedave @0G_labs`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.94)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      padding: "16px 16px 32px", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#E8E4D8" }}>Your Squad Card</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              Download or share on X
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: 18, cursor: "pointer",
            width: 36, height: 36, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            width: "100%", borderRadius: 12,
            border: "1px solid rgba(250,250,247,0.10)",
            display: "block",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: "14px", borderRadius: 10,
              background: "#E8E4D8",
              color: "#000", border: "none", fontSize: 12, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: 1, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(250,250,247,0.10)",
            }}
          >
            ⬇️ Download PNG
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: "14px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 12, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: 1, cursor: "pointer",
            }}
          >
            🐦 Share on X
          </button>
        </div>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
          Tags @dontfadedave and @0G_labs on share
        </div>
      </div>
    </div>
  );
}
