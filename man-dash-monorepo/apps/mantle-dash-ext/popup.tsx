import { useEffect, useMemo, useRef, useState } from "react"
import { createPublicClient, http, defineChain } from "viem"

type Lang = "zh" | "en"
type Net = "mainnet" | "testnet"

const mantleMainnet = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mantle.xyz"] } },
  blockExplorers: { default: { name: "Mantle Explorer", url: "https://explorer.mantle.xyz" } }
})
const mantleTestnet = defineChain({
  id: 5001,
  name: "Mantle Testnet",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.mantle.xyz"] } },
  blockExplorers: { default: { name: "Mantle Testnet Explorer", url: "https://explorer.testnet.mantle.xyz" } }
})

const dict = {
  zh: {
    title: "Mantle Gas 监控",
    network: "网络",
    language: "语言",
    gasPrice: "当前 Gas 价格",
    lastUpdated: "最后更新",
    highThreshold: "高于阈值(Gwei)",
    lowThreshold: "低于阈值(Gwei)",
    alertToggle: "开启提醒",
    mainnet: "主网",
    testnet: "测试网",
    zh: "中文",
    en: "English"
  },
  en: {
    title: "Mantle Gas Monitor",
    network: "Network",
    language: "Language",
    gasPrice: "Gas Price",
    lastUpdated: "Last Updated",
    highThreshold: "High Threshold (Gwei)",
    lowThreshold: "Low Threshold (Gwei)",
    alertToggle: "Enable Alerts",
    mainnet: "Mainnet",
    testnet: "Testnet",
    zh: "中文",
    en: "English"
  }
} as const

function toGwei(b: bigint) {
  return Number(b) / 1e9
}
function toWeiFromGwei(n: number) {
  return BigInt(Math.floor(n * 1e9))
}

function usePrefersDark() {
  const [dark, setDark] = useState<boolean>(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setDark("matches" in e ? e.matches : e.matches)
    setDark(mq.matches)
    mq.addEventListener?.("change", onChange as any)
    return () => mq.removeEventListener?.("change", onChange as any)
  }, [])
  return dark
}

function IndexPopup() {
  const prefersDark = usePrefersDark()
  const [lang, setLang] = useState<Lang>("zh")
  const [net, setNet] = useState<Net>("mainnet")
  const [gasWei, setGasWei] = useState<bigint | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [enableAlert, setEnableAlert] = useState<boolean>(true)
  const [highGwei, setHighGwei] = useState<number>(50)
  const [lowGwei, setLowGwei] = useState<number>(0.5)
  const t = dict[lang]
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([])

  // restore settings
  useEffect(() => {
    chrome.storage?.local.get(["lang", "net", "enableAlert", "highGwei", "lowGwei"]).then((res) => {
      if (res.lang) setLang(res.lang as Lang)
      if (res.net) setNet(res.net as Net)
      if (typeof res.enableAlert === "boolean") setEnableAlert(res.enableAlert)
      if (typeof res.highGwei === "number") setHighGwei(res.highGwei)
      if (typeof res.lowGwei === "number") setLowGwei(res.lowGwei)
    })
  }, [])
  useEffect(() => {
    chrome.storage?.local.set({ lang, net, enableAlert, highGwei, lowGwei })
  }, [lang, net, enableAlert, highGwei, lowGwei])

  const client = useMemo(() => {
    const chain = net === "mainnet" ? mantleMainnet : mantleTestnet
    return createPublicClient({ chain, transport: http() })
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
            ? `${t.gasPrice}: ${g.toFixed(3)} Gwei > ${highGwei} Gwei`
            : `${t.gasPrice}: ${g.toFixed(3)} Gwei < ${lowGwei} Gwei`
          setToasts((prev) => [...prev, { id: Math.random().toString(36), text: message }])
          chrome.notifications?.create({
            type: "basic",
            iconUrl: "/icon.png",
            title: t.title,
            message
          })
        }
      }
    } catch (e) {
      // noop
    }
  }

  useEffect(() => {
    fetchGas()
    const id = setInterval(fetchGas, 30_000)
    return () => clearInterval(id)
  }, [client, enableAlert, highGwei, lowGwei])

  const isDark = prefersDark
  const bg = isDark ? "#121212" : "#ffffff"
  const fg = isDark ? "#ffffff" : "#1f1f1f"
  const subtle = isDark ? "#999" : "#666"
  const card = isDark ? "#1e1e1e" : "#f6f6f6"

  useEffect(() => {
    if (toasts.length === 0) return
    const id = toasts[toasts.length - 1].id
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [toasts])

  return (
    <div style={{ padding: 16, width: 320, background: bg, color: fg, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
        <div style={{ fontWeight: 600 }}>{t.title}</div>
        <button onClick={() => setMenuOpen((v) => !v)} style={{ background: card, color: fg, border: "1px solid #888", borderRadius: 8, padding: "4px 8px" }}>⋮</button>
        {menuOpen && (
          <div style={{ position: "absolute", right: 0, top: 36, background: card, color: fg, borderRadius: 12, padding: 12, boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.12)", width: 280 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select aria-label={t.network} value={net} onChange={(e) => setNet(e.target.value as Net)} style={{ flex: 1, background: isDark ? "#151515" : "#fff", color: fg, border: "1px solid #888", borderRadius: 8, padding: "6px 8px" }}>
                <option value="mainnet">{t.mainnet}</option>
                <option value="testnet">{t.testnet}</option>
              </select>
              <select aria-label={t.language} value={lang} onChange={(e) => setLang(e.target.value as Lang)} style={{ flex: 1, background: isDark ? "#151515" : "#fff", color: fg, border: "1px solid #888", borderRadius: 8, padding: "6px 8px" }}>
                <option value="zh">{t.zh}</option>
                <option value="en">{t.en}</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={enableAlert} onChange={(e) => setEnableAlert(e.target.checked)} />
              <span>{t.alertToggle}</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: subtle, marginBottom: 4 }}>{t.highThreshold}</div>
                <input type="number" step="0.1" min={0} value={highGwei} onChange={(e) => setHighGwei(Number(e.target.value))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #888", background: isDark ? "#151515" : "#fff", color: fg }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: subtle, marginBottom: 4 }}>{t.lowThreshold}</div>
                <input type="number" step="0.1" min={0} value={lowGwei} onChange={(e) => setLowGwei(Number(e.target.value))} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #888", background: isDark ? "#151515" : "#fff", color: fg }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: card, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, color: subtle }}>{t.gasPrice}</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {gasWei ? `${toGwei(gasWei).toFixed(3)} Gwei` : "--"}
        </div>
        <div style={{ fontSize: 11, color: subtle }}>
          {updatedAt ? `${t.lastUpdated}: ${new Date(updatedAt).toLocaleTimeString()}` : ""}
        </div>
      </div>

      <div style={{ position: "fixed", right: 12, bottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((x) => (
          <div key={x.id} style={{ background: card, color: fg, borderRadius: 8, padding: "8px 12px", boxShadow: isDark ? "0 6px 18px rgba(0,0,0,0.4)" : "0 6px 18px rgba(0,0,0,0.12)" }}>{x.text}</div>
        ))}
      </div>
    </div>
  )
}

export default IndexPopup
