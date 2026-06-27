# KickOff ⚽

Onchain fantasy football for World Cup 2026. Built on 0G.

Spiritual successor to WorldXI (OKX X Cup, 2nd place). Same engine, now on 0G Newton Testnet.

## Stack
- React + Vite
- ethers v6
- 0G Newton Testnet (Chain ID 16602)
- MetaMask wallet auth
- Contract: 0x654d599729B051513195318C7D10d35274357992

## Flow
1. Connect MetaMask
2. Set manager name (saved locally)
3. Build 15-player squad — 100 0G budget, max 3 per nation
4. Set captain + vice-captain
5. Lock squad onchain (auto-registers manager, submits squad hash)

## Setup
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Deploy
Render Static Site — build `npm run build`, publish `dist`.

## Builder
Davexinoh — @dontfadedave — github.com/Davexinoh
