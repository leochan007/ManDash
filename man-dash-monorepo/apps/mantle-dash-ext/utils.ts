import { createPublicClient, http } from "viem"
import { mantleMainnet, mantleTestnet } from "./chains"

export type Net = "mainnet" | "testnet"

export function createClientForNet(net: Net) {
  const chain = net === "mainnet" ? mantleMainnet : mantleTestnet
  return createPublicClient({ chain: chain as any, transport: http() })
}

export async function getGasPriceWei(client: ReturnType<typeof createClientForNet>) {
  const gp = await client.getGasPrice()
  return gp
}

export async function getBlockInfo(client: ReturnType<typeof createClientForNet>) {
  const block = await client.getBlockNumber()
  const latest = await client.getBlock({ blockNumber: block })
  const prev = block > 0n ? await client.getBlock({ blockNumber: block - 1n }) : latest
  const dt = Number(latest.timestamp) - Number(prev.timestamp)
  return { blockNumber: block, blockTimeSec: dt > 0 ? dt : null }
}

export async function getMntPrice() {
  // try {
  //   const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd,btc&include_24hr_change=true")
  //   const data = await response.json()
  //   console.log("getMntPrice:", data)
  //   const usd = typeof data?.mantle?.usd === "number" ? data.mantle.usd : null
  //   const btc = typeof data?.mantle?.btc === "number" ? data.mantle.btc : null
  //   const change24h = typeof data?.mantle?.usd_24h_change === "number" ? data.mantle.usd_24h_change : null
  //   console.log("usd:", usd, " btc:", btc, " change24h:", change24h)
  //   return { usd, btc, change24h }
  // } catch (e) {
    try {
      const [mntusdtRes, mntbtcRes, btcusdtRes] = await Promise.all([
        fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=MNTUSDT").then((r) => r.json()),
        fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=MNTBTC").then((r) => r.json()).catch(() => null),
        fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT").then((r) => r.json()).catch(() => null)
      ])
      let usd: number | null = null
      let btc: number | null = null
      let change24h: number | null = null
      const usdtList = mntusdtRes?.result?.list
      if (Array.isArray(usdtList) && usdtList.length > 0) {
        const t = usdtList[0]
        if (t?.lastPrice) usd = parseFloat(t.lastPrice)
        if (t?.price24hPcnt) change24h = parseFloat(t.price24hPcnt) * 100
      }
      const btcList = mntbtcRes?.result?.list
      if (Array.isArray(btcList) && btcList.length > 0) {
        const b = btcList[0]
        if (b?.lastPrice) btc = parseFloat(b.lastPrice)
      }
      if (!btc && usd) {
        const bl = btcusdtRes?.result?.list
        if (Array.isArray(bl) && bl.length > 0) {
          const bb = bl[0]
          if (bb?.lastPrice) {
            const btcUsd = parseFloat(bb.lastPrice)
            if (btcUsd > 0) btc = usd / btcUsd
          }
        }
      }
      console.log("usd:", usd, " btc:", btc, " change24h:", change24h)
      return { usd, btc, change24h }
    } catch (e2) {
      console.error(e2)
      return { usd: null, btc: null, change24h: null }
    }
  // }
}

export async function getCirculatingSupply() {
  try {
    const res = await fetch("https://api.mantle.xyz/api/v1/token-data?q=circulatingSupply")
    const json = await res.json()
    const v = Number(json?.circulatingSupply ?? json?.result ?? json ?? 0)
    return v || null
  } catch (e) {
    return null
  }
}

export async function getCirculatingSupplyRaw() {
  try {
    const res = await fetch("https://api.mantle.xyz/api/v1/token-data?q=circulatingSupply")
    const json = await res.json()
    const value = Number(json?.circulatingSupply ?? json?.result ?? json ?? 0) || null
    return { raw: json, value }
  } catch (e) {
    return { raw: null, value: null }
  }
}

export function computeMarketCap(usd: number | null, supply: number | null) {
  if (!usd || !supply) return null
  return usd * supply
}

export async function getTxsAndTps(client: ReturnType<typeof createClientForNet>, windowBlocks: bigint = 30n) {
  const latest = await client.getBlockNumber()
  const start = latest > windowBlocks ? latest - windowBlocks : 0n
  const firstBlock = await client.getBlock({ blockNumber: start })
  const lastBlock = await client.getBlock({ blockNumber: latest })
  let txs = 0
  for (let i = start; i <= latest; i++) {
    const b = await client.getBlock({ blockNumber: i, includeTransactions: true })
    txs += Array.isArray(b.transactions) ? b.transactions.length : 0
  }
  const duration = Math.max(1, Number(lastBlock.timestamp) - Number(firstBlock.timestamp))
  const tps = txs / duration
  return { totalTxs: txs, tps }
}

export async function getRollupInfoByNet(net: Net) {
  const rpc = (net === "mainnet" ? mantleMainnet : mantleTestnet).rpcUrls.default.http[0]
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "rollup_getInfo", params: [] })
    })
    const data = await res.json()
    const info = data?.result || data
    const txBatch = Number(info?.l1TxnBatch ?? info?.latestL1TxnBatch ?? info?.l1_transaction_batch ?? 0) || null
    const stateBatch = Number(info?.l1StateBatch ?? info?.latestL1StateBatch ?? info?.l1_state_batch ?? 0) || null
    return { txBatch, stateBatch, raw: info }
  } catch (e) {
    return { txBatch: null, stateBatch: null, raw: null }
  }
}
