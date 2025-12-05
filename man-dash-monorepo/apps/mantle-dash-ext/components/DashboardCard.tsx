import type { ReactNode } from "react"
import { Card, CardContent, Box, Typography } from "@mui/material"
import type { ThemeColors } from "../utils/theme"

interface DashboardCardProps {
  icon: ReactNode
  label: string
  value: string
  subtitle?: string
  colors: ThemeColors
}

export function DashboardCard({ icon, label, value, subtitle, colors }: DashboardCardProps) {
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
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ color: colors.fg, mr: 0.5, display: "flex", alignItems: "center", fontSize: "16px" }}>
            {icon}
          </Box>
          <Typography variant="caption" sx={{ color: colors.subtle, fontSize: "12px" }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25, color: colors.fg, fontSize: "18px" }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: colors.subtle, fontSize: "10px" }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

