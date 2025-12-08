import { useState, useEffect, useRef } from "react"
import { Card, CardContent, Box, Typography, Select, MenuItem, FormControl, IconButton } from "@mui/material"
import { ShowChart, OpenInNew } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import type { ThemeColors } from "../utils/theme"
import { init as kInit, dispose as kDispose } from "klinecharts"

type KlineInterval = "1M" | "1d" | "4h" | "1h" | "15m" | "5m"

interface KlineBar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface KlineCardProps {
  colors: ThemeColors
  ticker?: string
  dataLoader?: { getBars: ({ callback }: { callback: (bars: KlineBar[]) => void }) => Promise<void> | void }
  fetchBars?: (interval: KlineInterval) => Promise<KlineBar[]>
}

export function KlineCard({ colors, ticker = "MNTUSDT", dataLoader, fetchBars }: KlineCardProps) {
  const { t } = useTranslation()
  const [interval, setInterval] = useState<KlineInterval>("1d")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<any>(null)
  const [chartError, setChartError] = useState<boolean>(false)

  // klinecharts v10 period映射
  const periodMap: Record<KlineInterval, { span: number; type: "minute" | "hour" | "day" | "month" }> = {
    "1M": { span: 1, type: "month" },
    "1d": { span: 1, type: "day" },
    "4h": { span: 4, type: "hour" },
    "1h": { span: 1, type: "hour" },
    "15m": { span: 15, type: "minute" },
    "5m": { span: 5, type: "minute" }
  }

  const makeLoader = () => {
    if (dataLoader) return dataLoader
    if (fetchBars) {
      return {
        getBars: async ({ callback }: { callback: (bars: KlineBar[]) => void }) => {
          try {
            setLoading(true)
            setError(null)
            const bars = await fetchBars(interval)
            callback(Array.isArray(bars) ? bars : [])
          } catch (e: any) {
            setError(e?.message || "获取数据失败")
            callback([])
          } finally {
            setLoading(false)
          }
        }
      }
    }
    return { getBars: ({ callback }: { callback: (bars: KlineBar[]) => void }) => { callback([]) } }
  }

  useEffect(() => {
    if (chartRef.current) {
      const p = periodMap[interval]
      chartRef.current.setPeriod(p)
      chartRef.current.setDataLoader(makeLoader())
    }
  }, [interval, dataLoader, fetchBars])

  useEffect(() => {
    const tryInit = () => {
      const el = containerRef.current
      const w = el?.offsetWidth || 0
      if (!el || chartRef.current) return
      if (w === 0) {
        setTimeout(tryInit, 60)
        return
      }
      try {
        chartRef.current = kInit(el)
        chartRef.current.setSymbol({ ticker })
        const p = periodMap[interval]
        chartRef.current.setPeriod(p)
        chartRef.current.setDataLoader(makeLoader())
        setChartError(false)
      } catch (e) {
        setChartError(true)
      }
    }
    tryInit()
    return () => {
      try {
        if (containerRef.current) {
          kDispose(containerRef.current)
        }
      } catch (e) {
      }
      chartRef.current = null
    }
  }, [ticker])

  // v10 使用 setDataLoader，不再调用 applyNewData

  const renderCandlestick = () => {
    return (
      <Box sx={{ position: "relative" }}>
        <Box ref={containerRef} sx={{ height: 300, width: "100%" }} />
        {(loading || error || chartError) && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="caption" sx={{ color: colors.subtle, fontSize: "11px" }}>
              {loading ? t("kline.loading") : (error || (chartError ? "Chart init failed" : t("kline.noData")))}
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Card
      sx={{
        background: colors.card,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        "&:hover": {
          boxShadow: colors.bg === "#121212" 
            ? "0 4px 12px rgba(0,0,0,0.4)" 
            : "0 4px 12px rgba(0,0,0,0.1)"
        }
      }}
    >
      <CardContent sx={{ padding: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ShowChart sx={{ color: colors.fg, mr: 0.5, fontSize: "16px" }} />
            <Typography variant="caption" sx={{ color: colors.subtle, fontSize: "12px" }}>
              {t("kline.title")}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => chrome.tabs?.create({ url: "https://www.bybit.com/en/trade/spot/MNT/USDT" })} sx={{ color: colors.fg }}>
            <OpenInNew fontSize="small" />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={interval}
              onChange={(e) => setInterval(e.target.value as KlineInterval)}
              sx={{
                background: colors.bg === "#121212" ? "#151515" : "#fff",
                color: colors.fg,
                fontSize: "11px",
                height: "24px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "& .MuiSvgIcon-root": {
                  color: colors.fg,
                  fontSize: "16px"
                },
                "& .MuiSelect-select": {
                  color: colors.fg
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: colors.bg,
                    "& .MuiMenuItem-root": {
                      color: colors.fg,
                      "&:hover": {
                        background: colors.card
                      },
                      "&.Mui-selected": {
                        background: colors.card,
                        color: colors.primary,
                        "&:hover": {
                          background: colors.card
                        }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="1M">{t("kline.1M")}</MenuItem>
              <MenuItem value="1d">{t("kline.1d")}</MenuItem>
              <MenuItem value="4h">{t("kline.4h")}</MenuItem>
              <MenuItem value="1h">{t("kline.1h")}</MenuItem>
              <MenuItem value="15m">{t("kline.15m")}</MenuItem>
              <MenuItem value="5m">{t("kline.5m")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mt: 0.5, overflow: "hidden" }}>
          {renderCandlestick()}
        </Box>
      </CardContent>
    </Card>
  )
}

