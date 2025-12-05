import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

type Alert = { id: number; text: string }

const ToastUI = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg?.type === "gas-alert") {
        const id = Date.now()
        setAlerts((a) => [...a, { id, text: String(msg.text || "Gas Alert") }])
        setTimeout(() => setAlerts((a) => a.filter((i) => i.id !== id)), 5000)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2147483647, display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map((a) => (
        <div key={a.id} style={{ background: "rgba(20,20,20,0.9)", color: "#fff", borderRadius: 8, padding: "10px 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.3)", maxWidth: 320 }}>
          {a.text}
        </div>
      ))}
    </div>
  )
}

export default ToastUI
