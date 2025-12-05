import { useEffect, useMemo, useRef, useState } from "react"
import { createPublicClient, http } from "viem"
import { Box, IconButton, Typography } from "@mui/material"
import { Settings as SettingsIcon, LocalGasStation, AttachMoney, LightMode, DarkMode } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import { Settings } from "./settings"
import { DashboardCard } from "./components/DashboardCard"
import { WalletConnect } from "./components/WalletConnect"
import { StatusBar } from "./components/StatusBar"
import { KlineCard } from "./components/KlineCard"
import { getThemeColors, type Theme } from "./utils/theme"
import { mantleMainnet, mantleTestnet } from "./chains"
import "./i18n"

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
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null)
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
    const chain = net === "mainnet" ? mantleMainnet : mantleTestnet
    return createPublicClient({
      chain: chain as any,
      transport: http()
    })
  }, [net])

  const lastAlertRef = useRef<number>(0)

  async function fetchGas() {
    try {
      const gp = await client.getGasPrice()
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
      const block = await client.getBlockNumber()
      setBlockNumber(block)
    } catch (e) {
      // noop
    }
  }

  async function fetchMntPrice() {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd")
      const data = await response.json()
      if (data.mantle?.usd) {
        setMntPrice(data.mantle.usd)
      }
    } catch (e) {
      try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=MNTUSDT")
        const data = await response.json()
        if (data.price) {
          setMntPrice(parseFloat(data.price))
        }
      } catch (e2) {
        // noop
      }
    }
  }

  useEffect(() => {
    fetchGas()
    fetchMntPrice()
    fetchBlockNumber()
    const gasId = setInterval(fetchGas, 30_000)
    const priceId = setInterval(fetchMntPrice, 60_000)
    const blockId = setInterval(fetchBlockNumber, 15_000)
    return () => {
      clearInterval(gasId)
      clearInterval(priceId)
      clearInterval(blockId)
    }
  }, [client, enableAlert, highGwei, lowGwei, t])

  const handleThemeToggle = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    chrome.storage?.local.set({ theme: newTheme })
  }

  useEffect(() => {
    const width = "600px"
    const height = "800px"
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
      <Box sx={{ width: 600, height: 800, background: colors.bg, color: colors.fg, overflow: "hidden" }}>
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
        height: 800,
        padding: 2,
        background: colors.bg,
        color: colors.fg,
        fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overflowY: "hidden",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, flexShrink: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: colors.fg }}>
          {t("common.title")}
        </Typography>
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, overflow: "hidden", minHeight: 0, overflowY: "hidden" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, overflow: "hidden", minHeight: 0, overflowY: "hidden" }}>
          {/* Gas Price - 最上面 */}
          <DashboardCard
            icon={<LocalGasStation />}
            label={t("common.gasPrice")}
            value={gasWei ? `${toGwei(gasWei).toFixed(3)} Gwei` : "--"}
            subtitle={updatedAt ? `${t("common.lastUpdated")}: ${new Date(updatedAt).toLocaleTimeString()}` : undefined}
            colors={colors}
          />
          {/* MNT Price - 其次 */}
          <DashboardCard
            icon={<AttachMoney />}
            label={t("common.mntPrice")}
            value={mntPrice !== null ? `$${mntPrice.toFixed(4)}` : "--"}
            subtitle={t("common.usd")}
            colors={colors}
          />
          {/* K线图 */}
          <KlineCard colors={colors} />
        </Box>
      </Box>

      <StatusBar colors={colors} blockNumber={blockNumber} toastMessage={toastMessage} />
    </Box>
  )
}

export default IndexPopup
