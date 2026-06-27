import { useState, useEffect, useRef, Component, lazy, Suspense } from "react";
import { connectWallet, getExistingUsername, getReadContract } from "./wallet.js";
import ManagerAI from "./ManagerAI.jsx";

const SquadBuilder = lazy(() => import("./SquadBuilder.jsx"));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: "20px", color: "red" }}>Something went wrong. Refresh the page.</div>;
    }
    return this.props.children;
  }
}

const glass = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 4,
};

const glassGreen = {
  background: "var(--surface2)",
  border: "1px solid var(--line)",
  borderRadius: 4,
};

function PitchBg() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(90deg, var(--line) 1px, transparent 1px)",
        backgroundSize: "64px 100%", opacity: 0.5,
      }} />
    </div>
  );
}

function Logo({ size = 48, sub = false }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: size, fontWeight: 800, letterSpacing: size * 0.04,
        display: "flex", alignItems: "baseline", justifyContent: "center",
        marginBottom: sub ? 10 : 0, fontFamily: '"Space Grotesk", "Inter", sans-serif',
      }}>
        <span style={{ color: "var(--text)" }}>KICK</span>
        <span style={{ color: "var(--grey)", fontWeight: 300 }}>OFF</span>
      </div>
      {sub && (
        <div style={{ fontSize: 9, color: "var(--grey2)", textTransform: "uppercase", letterSpacing: 4, fontWeight: 600 }}>
          Fantasy Football — World Cup 2026
        </div>
      )}
    </div>
  );
}

function VideoSplash({ onDone }) {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const startVideo = () => {
    if (started) return;
    setStarted(true);
    if (videoRef.current) videoRef.current.play().catch(() => onDone());
    setTimeout(() => setShowSkip(true), 3000);
  };

  useEffect(() => {
    if (started) {
      const t = setTimeout(onDone, 42000);
      return () => clearTimeout(t);
    }
  }, [started]);

  return (
    <div onClick={startVideo} style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "#000", overflow: "hidden", cursor: "pointer",
    }}>
      <video
        ref={videoRef} playsInline preload="auto"
        src="/ed19dd204b248c32c2992d1c77faaf95.mp4"
        onEnded={onDone} onError={() => setTimeout(onDone, 500)}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: started ? 1 : 0, transition: "opacity 0.5s ease",
        }}
      />
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
      }} />
      {!started && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          <Logo size={56} sub={true} />
          <div style={{ marginTop: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--surface2)", border: "2px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, animation: "pulse 2s ease-in-out infinite",
              backdropFilter: "blur(8px)",
            }}>▶</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            Tap to enter
          </div>
        </div>
      )}
      {started && showSkip && (
        <div onClick={e => { e.stopPropagation(); onDone(); }} style={{
          position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
          zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
            Tap to skip
          </div>
          <div style={{ width: 120, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--accent)", borderRadius: 99, animation: "splashProgress 42s linear forwards" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectScreen({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setError(""); setLoading(true);
    try {
      const address = await connectWallet();
      onConnect(address);
    } catch (err) {
      setError(err.message || "Connection failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 998, background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, overflow: "hidden",
    }}>
      <PitchBg />
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, var(--surface2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340, animation: "fadeUp 0.6s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Logo size={72} sub={true} />
        </div>
        <div style={{
          ...glassGreen, padding: 28,
          boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
              Welcome to KickOff
            </div>
            <div style={{ fontSize: 11, color: "var(--grey)", lineHeight: 1.7 }}>
              Build your fantasy XI.<br />Compete onchain. Win glory.
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 10,
              background: loading ? "var(--surface2)" : "var(--accent)",
              color: "#000", border: "none", fontSize: 13, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: 1.5,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 24px var(--surface2)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Connecting..." : "⚡ Connect MetaMask"}
          </button>
          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 8,
              background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)",
              fontSize: 11, color: "var(--red)", textAlign: "center", lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.8 }}>
            Your wallet is your identity<br />No email • No password • No data
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
          Powered by <span style={{ color: "var(--accent)" }}>0G</span> — Newton Testnet
        </div>
      </div>
    </div>
  );
}

function SetUsernameScreen({ wallet, onDone }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true); setError("");
    try {
      localStorage.setItem(`kickoff_username_${wallet}`, username);
      localStorage.setItem("kickoff_last_wallet", wallet);
      onDone(username);
    } catch (err) {
      setError(err.message || "Failed. Try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 998, background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, overflow: "hidden",
    }}>
      <PitchBg />
      <div style={{ position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, var(--surface2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340, animation: "fadeUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Logo size={52} />
        </div>
        <div style={{ ...glass, padding: 24, boxShadow: "0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
            Choose Your Manager Name
          </div>
          <div style={{ fontSize: 11, color: "var(--grey)", marginBottom: 20, lineHeight: 1.6 }}>
            This is how you'll appear on the leaderboard
          </div>
          <div style={{ ...glassGreen, padding: "8px 12px", marginBottom: 16, fontSize: 10, fontFamily: "monospace", color: "var(--accent)", wordBreak: "break-all", borderRadius: 8 }}>
            {wallet}
          </div>
          <input
            type="text"
            placeholder="e.g. TacticalGenius_99"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 8,
              border: username.length > 0
                ? isValid ? "1px solid var(--line)" : "1px solid rgba(255,71,87,0.4)"
                : "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text)", fontSize: 13, marginBottom: 8,
              boxSizing: "border-box", outline: "none", transition: "border 0.2s",
            }}
          />
          <div style={{ fontSize: 10, color: "var(--grey)", marginBottom: 16 }}>
            3–20 characters • Letters, numbers, underscores only
          </div>
          {error && (
            <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", fontSize: 11, color: "var(--red)" }}>
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            style={{
              width: "100%", padding: "13px", borderRadius: 10,
              background: isValid ? "var(--accent)" : "rgba(255,255,255,0.06)",
              color: isValid ? "#000" : "var(--grey2)",
              border: "none", fontSize: 13, fontWeight: 800,
              cursor: isValid ? "pointer" : "not-allowed",
              opacity: saving ? 0.7 : 1,
              textTransform: "uppercase", letterSpacing: 1.5,
              boxShadow: isValid ? "0 4px 20px var(--line)" : "none",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving..." : "Enter the Pitch →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ username, squadCount, squadLocked, txHash }) {
  const [managerCount, setManagerCount] = useState(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    getReadContract().getManagerCount()
      .then(count => setManagerCount(count.toString()))
      .catch(() => setManagerCount("—"));
  }, []);

  useEffect(() => {
    const target = new Date("2026-06-11T00:00:00Z");
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) { setCountdown("LIVE NOW"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${d}d ${h}h ${m}m`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <PitchBg />
      <div style={{ position: "relative", zIndex: 1, padding: "20px 16px" }}>

        {/* Countdown */}
        <div style={{
          textAlign: "center", padding: "14px 16px", borderRadius: 12, marginBottom: 16,
          background: "var(--surface)", border: "1px solid var(--line)",
        }}>
          <div style={{ fontSize: 9, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 4 }}>
            World Cup Kickoff
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--accent)", letterSpacing: 2, lineHeight: 1 }}>
            {countdown || "..."}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
            June 11, 2026 • Lock your squad before kickoff
          </div>
        </div>

        {/* Manager card */}
        <div style={{
          ...glassGreen, padding: "20px 16px", marginBottom: 16, textAlign: "center",
          boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>Manager</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 4, textShadow: "0 0 20px var(--line)" }}>
            {username}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase" }}>
            World Cup 2026 • 0G Chain
          </div>
          {squadLocked && (
            <div style={{ marginTop: 10, display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "var(--surface2)", border: "1px solid var(--surface2)", fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>
              🔒 Squad Locked Onchain
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Points", value: "0", icon: "⭐", color: "var(--accent)" },
            { label: "Squad", value: `${squadCount}/15`, icon: "👥", color: squadCount === 15 ? "var(--accent)" : "var(--grey)" },
            { label: "Managers", value: managerCount || "...", icon: "🌍", color: "var(--accent)" },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, padding: "14px 8px", borderRadius: 12, textAlign: "center",
              ...glass, boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: stat.color, marginBottom: 3 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TX link */}
        {squadLocked && txHash && txHash !== "already-submitted" && (
          <div style={{ ...glassGreen, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 20 }}>🔗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 2 }}>Squad TX on 0G Chain</div>
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 10, color: "var(--grey)", textDecoration: "underline", wordBreak: "break-all" }}
              >
                {txHash.slice(0, 24)}...
              </a>
            </div>
          </div>
        )}

        {/* Info cards */}
        {[
          { icon: "⚽", title: "How to Play", body: "Pick 15 players within 100 0G budget. Max 3 from any nation. Set captain (2× points) and vice-captain.", color: "var(--surface)" },
          { icon: "🏅", title: "Scoring", body: "Goals, assists, clean sheets earn points. Country bonus: +10% if 3+ players from same nation in your XI.", color: "var(--surface)" },
          { icon: "🔗", title: "Powered by 0G Chain", body: "Your squad is submitted onchain to 0G Chain — transparent, verifiable, and permanent.", color: "rgba(100,100,255,0.05)" },
        ].map(card => (
          <div key={card.title} style={{
            marginBottom: 10, padding: "14px 16px", borderRadius: 12,
            background: card.color, border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 14, alignItems: "flex-start", backdropFilter: "blur(8px)",
          }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{card.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransfersScreen() {
  return (
    <div style={{ padding: "20px 16px", background: "var(--bg)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <PitchBg />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>KickOff</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 24 }}>Transfers</div>
        <div style={{ ...glass, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Opens June 11</div>
          <div style={{ fontSize: 11, color: "var(--grey)", lineHeight: 1.7 }}>
            Swap players between matchdays.<br />Strategy starts when the tournament begins.
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardScreen() {
  return (
    <div style={{ padding: "20px 16px", background: "var(--bg)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <PitchBg />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>KickOff</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 24 }}>Leaderboard</div>
        <div style={{ ...glass, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Opens June 11</div>
          <div style={{ fontSize: 11, color: "var(--grey)", lineHeight: 1.7 }}>
            Global rankings go live when<br />World Cup kicks off.
          </div>
        </div>
      </div>
    </div>
  );
}

function KickOffAppInner() {
  const lastWallet = localStorage.getItem("kickoff_last_wallet");

  function loadForWallet(addr) {
    return {
      username: localStorage.getItem(`kickoff_username_${addr}`) || null,
      squad: (() => {
        try {
          const s = localStorage.getItem(`kickoff_squad_${addr}`);
          return s ? JSON.parse(s) : { selectedPlayerIds: [], captain: null, viceCaptain: null };
        } catch (_) { return { selectedPlayerIds: [], captain: null, viceCaptain: null }; }
      })(),
      tab: localStorage.getItem(`kickoff_tab_${addr}`) || "home",
      squadLocked: localStorage.getItem(`kickoff_locked_${addr}`) === "true",
      txHash: localStorage.getItem(`kickoff_txhash_${addr}`) || null,
    };
  }

  const [wallet, setWallet] = useState(() => lastWallet || null);
  const [username, setUsername] = useState(() => lastWallet ? loadForWallet(lastWallet).username : null);
  const [activeTab, setActiveTab] = useState(() => lastWallet ? loadForWallet(lastWallet).tab : "home");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [squadLocked, setSquadLocked] = useState(() => lastWallet ? loadForWallet(lastWallet).squadLocked : false);
  const [lockedTxHash, setLockedTxHash] = useState(() => lastWallet ? loadForWallet(lastWallet).txHash : null);
  const [squad, setSquad] = useState(() => lastWallet ? loadForWallet(lastWallet).squad : { selectedPlayerIds: [], captain: null, viceCaptain: null });

  const audioRef = useRef(null);
  const musicStarted = useRef(false);

  useEffect(() => {
    if (!wallet) return;
    localStorage.setItem(`kickoff_squad_${wallet}`, JSON.stringify(squad));
  }, [squad, wallet]);

  useEffect(() => {
    if (!wallet) return;
    localStorage.setItem(`kickoff_tab_${wallet}`, activeTab);
  }, [activeTab, wallet]);

  useEffect(() => {
    if (!musicStarted.current && audioRef.current) {
      musicStarted.current = true;
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {
        const unlock = () => {
          audioRef.current?.play().then(() => setMusicPlaying(true)).catch(() => {});
          window.removeEventListener("click", unlock);
        };
        window.addEventListener("click", unlock, { once: true });
      });
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.play().catch(() => {}); }
    else { audioRef.current.pause(); }
  }, [musicPlaying]);

  const handleConnect = async (address) => {
    const data = loadForWallet(address);
    setWallet(address);
    setUsername(data.username);
    setSquad(data.squad);
    setActiveTab(data.tab);
    setSquadLocked(data.squadLocked);
    setLockedTxHash(data.txHash);
    localStorage.setItem("kickoff_last_wallet", address);
    if (!data.username) {
      try {
        const onchainName = await getExistingUsername(address);
        if (onchainName) {
          setUsername(onchainName);
          localStorage.setItem(`kickoff_username_${address}`, onchainName);
        }
      } catch (_) {}
    }
  };

  const handleUsernameSet = (name) => {
    setUsername(name);
    if (wallet) {
      localStorage.setItem(`kickoff_username_${wallet}`, name);
      localStorage.setItem("kickoff_last_wallet", wallet);
    }
  };

  const handleSquadLocked = (txHash) => {
    setSquadLocked(true);
    setLockedTxHash(txHash);
    if (wallet) {
      localStorage.setItem(`kickoff_locked_${wallet}`, "true");
      localStorage.setItem(`kickoff_txhash_${wallet}`, txHash);
    }
  };

  const handleLogout = () => {
    if (wallet) {
      localStorage.setItem(`kickoff_squad_${wallet}`, JSON.stringify(squad));
      localStorage.setItem(`kickoff_tab_${wallet}`, activeTab);
    }
    setWallet(null);
    setUsername(null);
    setShowLogout(false);
  };

  if (!wallet) return <ConnectScreen onConnect={handleConnect} />;
  if (!username) return <SetUsernameScreen wallet={wallet} onDone={handleUsernameSet} />;

  let tabContent;
  switch (activeTab) {
    case "home":
      tabContent = <HomeScreen username={username} squadCount={squad.selectedPlayerIds.length} squadLocked={squadLocked} txHash={lockedTxHash} />;
      break;
    case "squad":
      tabContent = (
        <Suspense fallback={<div style={{ padding: "40px 20px", textAlign: "center", color: "var(--grey)", fontSize: 12 }}>Loading squad builder...</div>}>
          <SquadBuilder
            squad={squad}
            setSquad={setSquad}
            onSquadLocked={handleSquadLocked}
            squadLocked={squadLocked}
            txHash={lockedTxHash}
            username={username}
          />
        </Suspense>
      );
      break;
    case "ai":
      tabContent = <ManagerAI squad={squad} setSquad={setSquad} />;
      break;
    case "leaderboard":
      tabContent = <LeaderboardScreen />;
      break;
    default:
      tabContent = <HomeScreen username={username} squadCount={squad.selectedPlayerIds.length} />;
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "70px" }}>
        {tabContent}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "62px",
        background: "rgba(8,14,26,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 100,
      }}>
        {[
          { id: "home", label: "Home", icon: "🏠" },
          { id: "squad", label: "Squad", icon: "⚽" },
          { id: "ai", label: "Manager AI", icon: "◆" },
          { id: "leaderboard", label: "Board", icon: "🏆" },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, height: "100%", border: "none", background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, cursor: "pointer",
              color: active ? "var(--accent)" : "rgba(255,255,255,0.3)",
              fontSize: "10px", fontWeight: active ? 700 : 500,
              textTransform: "uppercase", letterSpacing: 0.5,
              transition: "color 0.15s", position: "relative",
            }}>
              {active && <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 2, background: "var(--accent)", borderRadius: "0 0 2px 2px" }} />}
              <div style={{ fontSize: "18px" }}>{tab.icon}</div>
              <div>{tab.label}</div>
            </button>
          );
        })}
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 101, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => setMusicPlaying(p => !p)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(8,14,26,0.7)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: musicPlaying ? "var(--accent)" : "rgba(255,255,255,0.3)",
            fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {musicPlaying ? "🔊" : "🔇"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowLogout(p => !p)}
            style={{
              height: 38, padding: "0 12px", borderRadius: 10,
              background: "rgba(8,14,26,0.7)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text)", fontSize: 11, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, maxWidth: 130,
            }}
          >
            <span style={{ fontSize: 14 }}>👤</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent)" }}>
              {username}
            </span>
          </button>

          {showLogout && (
            <div style={{
              position: "absolute", top: 44, right: 0,
              ...glass, padding: 6, minWidth: 170,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 200,
            }}>
              <div style={{ padding: "8px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4, lineHeight: 1.6 }}>
                <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>{username}</div>
                <div>{wallet?.slice(0, 8)}...{wallet?.slice(-6)}</div>
                {squadLocked && <div style={{ color: "var(--accent)", marginTop: 4 }}>✅ Squad locked</div>}
                <div style={{ marginTop: 2 }}>Squad: {squad.selectedPlayerIds.length}/15</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.15)",
                  color: "var(--red)", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                🚪 Disconnect Wallet
              </button>
              <div style={{ padding: "6px 12px", fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 2 }}>
                Your progress is saved locally
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogout && <div onClick={() => setShowLogout(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />}
      <audio ref={audioRef} loop style={{ display: "none" }} />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(false);

  const handleSplashDone = () => {
  sessionStorage.setItem("kickoff_splash_shown", "1");
  setShowSplash(false);
};

  return (
    <ErrorBoundary>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Inter", -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background: #080e1a; }
        :root {
          --bg: #0B0B0D; --surface: #141416; --surface2: #1C1C1F;
          --text: #FAFAF7; --grey: #9A968C; --grey2: #565049;
          --accent: #E8E4D8; --accent2: #C9C2B0; --line: rgba(250,250,247,0.08);
          --red: #D4564A;
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #080e1a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.8} }
        @keyframes splashProgress { from{width:0%} to{width:100%} }
      `}</style>
      {showSplash ? <VideoSplash onDone={handleSplashDone} /> : <KickOffAppInner />}
    </ErrorBoundary>
  );
}
