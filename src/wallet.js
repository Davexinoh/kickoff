import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x654d599729B051513195318C7D10d35274357992";
const CHAIN_ID = 16602;
const CHAIN_ID_HEX = "0x40da";
const RPC_URL = "https://evmrpc-testnet.0g.ai";

const OG_TESTNET = {
  chainId: CHAIN_ID_HEX,
  chainName: "0G Newton Testnet",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
};

const ABI = [
  {"inputs":[{"internalType":"string","name":"username","type":"string"}],"name":"registerManager","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint8","name":"matchday","type":"uint8"},{"internalType":"string","name":"squadHash","type":"string"}],"name":"submitSquad","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"wallet","type":"address"}],"name":"getManager","outputs":[{"internalType":"string","name":"username","type":"string"},{"internalType":"uint256","name":"registeredAt","type":"uint256"},{"internalType":"uint256","name":"total","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"wallet","type":"address"},{"internalType":"uint8","name":"matchday","type":"uint8"}],"name":"getSquad","outputs":[{"internalType":"string","name":"squadHash","type":"string"},{"internalType":"uint256","name":"submittedAt","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getManagerCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"username","type":"string"}],"name":"isUsernameAvailable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
];

function getInjected() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected. Install MetaMask to continue.");
  }
  return window.ethereum;
}

async function switchToOG() {
  const eth = getInjected();
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (err) {
    if (err.code === 4902) {
      await eth.request({ method: "wallet_addEthereumChain", params: [OG_TESTNET] });
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  const eth = getInjected();
  const accounts = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts || !accounts.length) throw new Error("No account selected.");
  await switchToOG();
  return accounts[0].toLowerCase();
}

export function getReadContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

async function getWriteContract() {
  const eth = getInjected();
  const provider = new ethers.BrowserProvider(eth, "any");
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function getExistingUsername(address) {
  try {
    const c = getReadContract();
    const res = await c.getManager(address);
    if (res && res[3] === true && res[0]) return res[0];
    return null;
  } catch (_) {
    return null;
  }
}

export async function registerManagerOnchain(username) {
  await switchToOG();
  const read = getReadContract();
  const eth = getInjected();
  const accounts = await eth.request({ method: "eth_accounts" });
  const address = accounts[0];
  const existing = await read.getManager(address);
  if (existing && existing[3] === true) return "already-registered";
  const c = await getWriteContract();
  const tx = await c.registerManager(username);
  await tx.wait();
  return tx.hash;
}

export async function submitSquadOnchain(matchday, playerIds) {
  await switchToOG();
  const eth = getInjected();
  const accounts = await eth.request({ method: "eth_accounts" });
  const address = accounts[0].toLowerCase();
  const read = getReadContract();

  // Auto-register manager if needed (flow B)
  const mgr = await read.getManager(address);
  if (!mgr || mgr[3] !== true) {
    const username = localStorage.getItem(`kickoff_username_${address}`) || "Manager";
    const wc = await getWriteContract();
    const regTx = await wc.registerManager(username);
    await regTx.wait();
  }

  // Skip if already submitted this matchday
  const existingSquad = await read.getSquad(address, matchday);
  if (existingSquad && existingSquad[2] === true) {
    return { txHash: "already-submitted", squadHash: existingSquad[0] };
  }

  const squadString = [...playerIds].sort().join(",");
  const squadHash = ethers.keccak256(ethers.toUtf8Bytes(squadString));
  const c = await getWriteContract();
  const tx = await c.submitSquad(matchday, squadHash);
  await tx.wait();
  return { txHash: tx.hash, squadHash };
}
