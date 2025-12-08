import type { ReactNode } from "react"
import { Card, CardContent, Box, Typography } from "@mui/material"
import type { ThemeColors } from "../utils/theme"

interface DashboardCardProps {
  icon: ReactNode
  label: string
  value: string
  subtitle?: string
  colors: ThemeColors
  onClick?: () => void
  valueColor?: string
  height?: number
}

export function DashboardCard({ icon, label, value, subtitle, colors, onClick, valueColor, height }: DashboardCardProps) {
  const isCompact = typeof height === "number"
  const contentPadding = isCompact ? "8px !important" : "12px !important"
  const iconSize = isCompact ? "14px" : "16px"
  const labelSize = isCompact ? "11px" : "12px"
  const valueSize = isCompact ? "16px" : "18px"
  const subtitleSize = isCompact ? "9px" : "10px"
  return (
    <Card
      sx={{
        background: colors.card,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        height: height,
        "&:hover": {
          boxShadow: colors.bg === "#121212" 
            ? "0 4px 12px rgba(0,0,0,0.4)" 
            : "0 4px 12px rgba(0,0,0,0.1)"
        },
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={onClick}
    >
      <CardContent sx={{ padding: contentPadding }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ color: colors.fg, mr: 0.5, display: "flex", alignItems: "center", fontSize: iconSize }}>
            {icon}
          </Box>
          <Typography variant="caption" sx={{ color: colors.subtle, fontSize: labelSize }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25, color: valueColor ?? colors.fg, fontSize: valueSize }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: colors.subtle, fontSize: subtitleSize }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
