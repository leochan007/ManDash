import { useState, useEffect } from "react"
import { Card, CardContent, Box, Typography, Select, MenuItem, FormControl } from "@mui/material"
import { ShowChart } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import type { ThemeColors } from "../utils/theme"

type KlineInterval = "1M" | "1d" | "4h" | "1h" | "15m" | "5m"

interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface KlineCardProps {
  colors: ThemeColors
}

export function KlineCard({ colors }: KlineCardProps) {
  const { t } = useTranslation()
  const [interval, setInterval] = useState<KlineInterval>("1d")
  const [klineData, setKlineData] = useState<KlineData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Bybit API interval映射
  // 根据Bybit API文档：https://bybit-exchange.github.io/docs/v5/market/kline
  const intervalMap: Record<KlineInterval, string> = {
    "1M": "M",    // 月线
    "1d": "D",    // 日线
    "4h": "240",  // 4小时
    "1h": "60",   // 1小时
    "15m": "15",  // 15分钟
    "5m": "5"     // 5分钟
  }

  const fetchKlineData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 使用 Bybit API 获取 MNT/USDT K线数据
      // API文档：https://bybit-exchange.github.io/docs/v5/market/kline
      const bybitInterval = intervalMap[interval]
      const limit = 50 // 获取最近50根K线
      const symbol = "MNTUSDT" // MNT/USDT交易对
      const category = "spot" // 现货市场
      
      const apiUrl = `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      // Bybit API响应格式：{ retCode: 0, retMsg: "OK", result: { list: [...] } }
      if (result.retCode !== 0) {
        console.error("Bybit API error:", result)
        setError(result.retMsg || "API请求失败")
        setKlineData([])
        return
      }
      
      const data = result.result?.list
      
      if (!Array.isArray(data)) {
        console.error("Invalid response format:", result)
        setError("无效的响应格式")
        setKlineData([])
        return
      }
      
      if (data.length === 0) {
        setError("暂无数据")
        setKlineData([])
        return
      }
      
      // Bybit K线数据格式：[startTime, open, high, low, close, volume, turnover]
      // 注意：Bybit返回的数据是倒序的（最新的在前），需要反转
      const klines: KlineData[] = data
        .reverse()
        .map((item: any[]) => ({
          time: parseInt(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }))
      
      setKlineData(klines)
      setError(null)
    } catch (e: any) {
      console.error("Failed to fetch kline data:", e)
      setError(e.message || "获取数据失败")
      setKlineData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKlineData()
    const intervalId = window.setInterval(() => {
      fetchKlineData()
    }, 60_000) // 每分钟更新一次
    return () => window.clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval])

  const renderCandlestick = () => {
    if (klineData.length === 0) {
      return (
        <Box sx={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="caption" sx={{ color: colors.subtle, fontSize: "11px" }}>
            {loading ? t("kline.loading") : error || t("kline.noData")}
          </Typography>
        </Box>
      )
    }

    const width = 560
    const height = 140
    const padding = 8
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const prices = klineData.flatMap((k) => [k.high, k.low])
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice || 1

    const candleWidth = Math.max(2, (chartWidth / klineData.length) - 1)
    const candleSpacing = 1

    return (
      <svg width={width} height={height} style={{ overflow: "hidden", display: "block" }}>
        {klineData.map((k, index) => {
          const x = padding + (index * (candleWidth + candleSpacing))
          const openY = padding + chartHeight - ((k.open - minPrice) / priceRange) * chartHeight
          const closeY = padding + chartHeight - ((k.close - minPrice) / priceRange) * chartHeight
          const highY = padding + chartHeight - ((k.high - minPrice) / priceRange) * chartHeight
          const lowY = padding + chartHeight - ((k.low - minPrice) / priceRange) * chartHeight
          
          const isGreen = k.close >= k.open
          const candleColor = isGreen ? "#26a69a" : "#ef5350"
          const wickColor = colors.subtle

          return (
            <g key={index}>
              {/* 上影线 */}
              <line
                x1={x + candleWidth / 2}
                y1={highY}
                x2={x + candleWidth / 2}
                y2={Math.min(openY, closeY)}
                stroke={wickColor}
                strokeWidth="1"
              />
              {/* 下影线 */}
              <line
                x1={x + candleWidth / 2}
                y1={Math.max(openY, closeY)}
                x2={x + candleWidth / 2}
                y2={lowY}
                stroke={wickColor}
                strokeWidth="1"
              />
              {/* K线实体 */}
              <rect
                x={x}
                y={Math.min(openY, closeY)}
                width={candleWidth}
                height={Math.abs(closeY - openY) || 1}
                fill={candleColor}
                stroke={candleColor}
                strokeWidth="0.5"
              />
            </g>
          )
        })}
      </svg>
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

