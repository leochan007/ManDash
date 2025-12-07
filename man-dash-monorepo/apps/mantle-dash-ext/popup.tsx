import { useEffect, useMemo, useRef, useState } from "react"
import { Box, IconButton, Typography } from "@mui/material"
import { Settings as SettingsIcon, AttachMoney, LightMode, DarkMode, ShowChart, Speed, Storage } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import { Settings } from "./settings"
import { DashboardCard } from "./components/DashboardCard"
import { StatusBar } from "./components/StatusBar"
import { KlineCard } from "./components/KlineCard"
import { getThemeColors, type Theme } from "./utils/theme"
import "./i18n"
import { createClientForNet, getGasPriceWei, getBlockInfo, getMntPrice as getMntPriceUtil, getCirculatingSupply, computeMarketCap, getTxsAndTps, getRollupInfoByNet } from "./utils"

const iconSvgUrl = new URL("./assets/icon.svg", import.meta.url).href

type Net = "mainnet" | "testnet"

function toGwei(b: bigint) {
  return Number(b) / 1e9
}

function IndexPopup() {
  const { t, i18n } = useTranslation()
  const [net, setNet] = useState<Net>("mainnet")
  const [theme, setTheme] = useState<Theme>("dark")
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [gasWei, setGasWei] = useState<bigint | null>(null)
  const [mntPrice, setMntPrice] = useState<number | null>(null)
  const [mntEthPrice, setMntEthPrice] = useState<number | null>(null)
  const [mntChangePct, setMntChangePct] = useState<number | null>(null)
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [circulatingSupply, setCirculatingSupply] = useState<number | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null)
  const [blockTimeSec, setBlockTimeSec] = useState<number | null>(null)
  const [tps, setTps] = useState<number | null>(null)
  const [totalTxCount, setTotalTxCount] = useState<number | null>(null)
  const [l1TxnBatch, setL1TxnBatch] = useState<number | null>(null)
  const [l1StateBatch, setL1StateBatch] = useState<number | null>(null)
  const [enableAlert, setEnableAlert] = useState<boolean>(true)
  const [highGwei, setHighGwei] = useState<number>(20)
  const [lowGwei, setLowGwei] = useState<number>(0.5)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const colors = getThemeColors(theme)

  // restore settings
  useEffect(() => {
    chrome.storage?.local.get(["net", "theme", "enableAlert", "highGwei", "lowGwei", "lang"]).then((res) => {
      if (res.net) setNet(res.net as Net)
      if (res.theme) setTheme(res.theme as Theme)
      if (typeof res.enableAlert === "boolean") setEnableAlert(res.enableAlert)
      if (typeof res.highGwei === "number") setHighGwei(res.highGwei)
      if (typeof res.lowGwei === "number") setLowGwei(res.lowGwei)
      if (res.lang && (res.lang === "zh" || res.lang === "en")) {
        i18n.changeLanguage(res.lang)
      }
    })
  }, [i18n])
  useEffect(() => {
    chrome.storage?.local.set({ net, theme, enableAlert, highGwei, lowGwei, lang: i18n.language })
  }, [net, theme, enableAlert, highGwei, lowGwei, i18n.language])

  const client = useMemo(() => {
    return createClientForNet(net)
  }, [net])

  const lastAlertRef = useRef<number>(0)

  async function fetchGas() {
    try {
      const gp = await getGasPriceWei(client)
      setGasWei(gp)
      setUpdatedAt(Date.now())
      if (enableAlert) {
        const g = toGwei(gp)
        const shouldHigh = g > highGwei
        const shouldLow = g < lowGwei
        const now = Date.now()
        if ((shouldHigh || shouldLow) && now - lastAlertRef.current > 10_000) {
          lastAlertRef.current = now
          const message = shouldHigh
            ? t("alerts.gasHigh", { gasPrice: t("common.gasPrice"), value: g.toFixed(3), threshold: highGwei })
            : t("alerts.gasLow", { gasPrice: t("common.gasPrice"), value: g.toFixed(3), threshold: lowGwei })
          setToastMessage(message)
          setTimeout(() => setToastMessage(null), 4000)
          chrome.notifications?.create({
            type: "basic",
            iconUrl: "/icon.png",
            title: t("common.title"),
            message
          })
        }
      }
    } catch (e) {
      // noop
    }
  }

  async function fetchBlockNumber() {
    try {
      const info = await getBlockInfo(client)
      setBlockNumber(info.blockNumber)
      if (info.blockTimeSec && info.blockTimeSec > 0) setBlockTimeSec(info.blockTimeSec)
    } catch (e) {}
  }

  async function fetchMntPrice() {
    const p = await getMntPriceUtil()
    setMntPrice(p.usd)
    setMntEthPrice(p.eth)
    setMntChangePct(p.change24h)
  }

  async function fetchMarketCap() {
    const supply = await getCirculatingSupply()
    setCirculatingSupply(supply)
  }

  useEffect(() => {
    const cap = computeMarketCap(mntPrice, circulatingSupply)
    if (cap) setMarketCap(cap)
  }, [mntPrice, circulatingSupply])

  async function fetchTpsAndTotals() {
    try {
      const r = await getTxsAndTps(client, 30n)
      setTps(r.tps)
      setTotalTxCount(r.totalTxs)
    } catch (e) {}
  }

  async function fetchRollupInfo() {
    try {
      const info = await getRollupInfoByNet(net)
      if (info.txBatch) setL1TxnBatch(info.txBatch)
      if (info.stateBatch) setL1StateBatch(info.stateBatch)
    } catch (e) {}
  }

  useEffect(() => {
    fetchGas()
    fetchMntPrice()
    fetchBlockNumber()
    fetchMarketCap()
    fetchTpsAndTotals()
    fetchRollupInfo()
    const gasId = setInterval(fetchGas, 7_000)
    const priceId = setInterval(fetchMntPrice, 7_000)
    const blockId = setInterval(fetchBlockNumber, 7_000)
    const capId = setInterval(fetchMarketCap, 10_000)
    const tpsId = setInterval(fetchTpsAndTotals, 10_000)
    const rollupId = setInterval(fetchRollupInfo, 10_000)
    return () => {
      clearInterval(gasId)
      clearInterval(priceId)
      clearInterval(blockId)
      clearInterval(capId)
      clearInterval(tpsId)
      clearInterval(rollupId)
    }
  }, [client, enableAlert, highGwei, lowGwei, t])

  const handleThemeToggle = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    chrome.storage?.local.set({ theme: newTheme })
  }

  useEffect(() => {
    const width = "600px"
    const height = "600px"
    document.documentElement.style.width = width
    document.documentElement.style.height = height
    document.body.style.width = width
    document.body.style.height = height
    document.body.style.margin = "0"
    document.body.style.padding = "0"
    document.body.style.overflow = "hidden"
  }, [])

  if (showSettings) {
    return (
      <Box sx={{ width: 600, height: 600, background: colors.bg, color: colors.fg, overflow: "hidden" }}>
        <Settings
          net={net}
          theme={theme}
          enableAlert={enableAlert}
          highGwei={highGwei}
          lowGwei={lowGwei}
          onBack={() => setShowSettings(false)}
          onNetChange={setNet}
          onThemeChange={setTheme}
          onEnableAlertChange={setEnableAlert}
          onHighGweiChange={setHighGwei}
          onLowGweiChange={setLowGwei}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: 600,
        height: 600,
        padding: 2,
        background: colors.bg,
        color: colors.fg,
        fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overflowY: "hidden",
        position: "relative",
        boxSizing: "border-box",
        userSelect: "none"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={iconSvgUrl} alt="logo" style={{ width: 24, height: 24 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: colors.fg }}>
            {t("common.title")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleThemeToggle}
            sx={{
              color: colors.fg,
              padding: 1,
              "&:hover": {
                background: colors.card
              }
            }}
            title={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
          >
            {theme === "dark" ? <LightMode /> : <DarkMode />}
          </IconButton>
          <IconButton
            onClick={() => setShowSettings(true)}
            sx={{
              color: colors.fg,
              padding: 1,
              "&:hover": {
                background: colors.card
              }
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, minHeight: 0, overflow: "hidden", paddingBottom: 56 }}>
        {/* 第一行：紧凑信息 */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 1.5, flexShrink: 0 }}>
          <DashboardCard
            icon={<AttachMoney />}
            label={t("common.mntPrice")}
            value={mntPrice !== null ? `$${mntPrice.toFixed(2)} @ ${(mntEthPrice ?? 0).toFixed(8)} ETH${mntChangePct !== null ? ` (${mntChangePct >= 0 ? "+" : ""}${mntChangePct.toFixed(2)}%)` : ""}` : "--"}
            colors={colors}
          />
          <DashboardCard
            icon={<Storage />}
            label={t("common.latestBlock")}
            value={blockNumber ? `${blockNumber.toString()}` : "--"}
            subtitle={blockTimeSec ? `(${blockTimeSec.toFixed(2)}s)` : undefined}
            colors={colors}
          />
          <DashboardCard
            icon={<Speed />}
            label={t("common.transactions")}
            value={
              totalTxCount !== null
                ? totalTxCount >= 1_000_000
                  ? `${(totalTxCount / 1_000_000).toFixed(2)} M`
                  : String(totalTxCount)
                : "—"
            }
            subtitle={tps !== null ? `(${t("common.tps", { value: tps.toFixed(1) })})` : undefined}
            colors={colors}
          />
        </Box>

        {/* 第二行：市值 + L1 批次 */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 1.5, flexShrink: 0 }}>
          <DashboardCard
            icon={<ShowChart />}
            label={t("common.marketCap")}
            value={marketCap !== null ? `$${marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}
            subtitle={marketCap !== null ? `(${((marketCap ?? 0) / 1_000_000_000).toFixed(2)} B)` : undefined}
            colors={colors}
          />
          <DashboardCard
            icon={<Storage />}
            label={t("common.latestL1TxnBatch")}
            value={l1TxnBatch !== null ? String(l1TxnBatch) : "--"}
            colors={colors}
          />
          <DashboardCard
            icon={<Storage />}
            label={t("common.latestL1StateBatch")}
            value={l1StateBatch !== null ? String(l1StateBatch) : "--"}
            colors={colors}
          />
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <KlineCard colors={colors} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <StatusBar colors={colors} blockNumber={blockNumber} toastMessage={toastMessage} gasGwei={gasWei !== null ? toGwei(gasWei) : null} />
      </Box>
    </Box>
  )
}

export default IndexPopup
