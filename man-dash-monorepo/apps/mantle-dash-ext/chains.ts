import { defineChain } from "viem"

export const mantleMainnet = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mantle.xyz"] } },
  blockExplorers: { default: { name: "Mantle Explorer", url: "https://explorer.mantle.xyz" } }
})

export const mantleTestnet = defineChain({
  id: 5001,
  name: "Mantle Testnet",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.mantle.xyz"] } },
  blockExplorers: { default: { name: "Mantle Testnet Explorer", url: "https://explorer.testnet.mantle.xyz" } }
})

