import { createClientForNet, getGasPriceWei, getBlockInfo, getMntPrice, getCirculatingSupply, getCirculatingSupplyRaw, computeMarketCap, getTxsAndTps, getRollupInfoByNet, type Net } from "../utils"

async function testNet(net: Net) {
  const client = createClientForNet(net)
  const gas = await getGasPriceWei(client)
  console.log(`[${net}] GasWei:`, gas.toString())

  const block = await getBlockInfo(client)
  console.log(`[${net}] Block:`, block.blockNumber.toString(), "BlockTimeSec:", block.blockTimeSec)

  const price = await getMntPrice()
  console.log(`[${net}] 111 MNT Price:`, price)

  const supply = await getCirculatingSupply()
  console.log(`[${net}] CirculatingSupply:`, supply)
  const supplyRaw = await getCirculatingSupplyRaw()
  console.log(`[${net}] CirculatingSupply RAW:`, supplyRaw)
  const cap = computeMarketCap(price.usd, supply)
  console.log(`[${net}] MarketCap(USD):`, cap)

  const rollup = await getRollupInfoByNet(net)
  console.log(`[${net}] Rollup:`, rollup)

  const { totalTxs, tps } = await getTxsAndTps(client, 30n)
  console.log(`[${net}] Txs(30 blocks):`, totalTxs, "TPS:", tps)
}

async function main() {
  await testNet("mainnet")
  await testNet("testnet")
}

main().catch((e) => {
  console.error("UT error:", e)
})
