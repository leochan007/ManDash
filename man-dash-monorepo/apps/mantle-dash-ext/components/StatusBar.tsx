import { Box, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"
import type { ThemeColors } from "../utils/theme"

interface StatusBarProps {
  colors: ThemeColors
  blockNumber: bigint | null
  toastMessage: string | null
}

export function StatusBar({ colors, blockNumber, toastMessage }: StatusBarProps) {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        background: colors.card,
        borderTop: `1px solid ${colors.border}`,
        flexShrink: 0,
        minHeight: 40
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="caption" sx={{ color: colors.subtle, fontFamily: "monospace" }}>
          {blockNumber !== null
            ? t("common.blockNumber", { number: blockNumber.toString() })
            : t("common.blockNumberPlaceholder")}
        </Typography>
      </Box>

      {toastMessage && (
        <Box
          sx={{
            background: colors.primary,
            color: "#fff",
            borderRadius: 1,
            padding: "4px 12px",
            maxWidth: "60%"
          }}
        >
          <Typography variant="caption" sx={{ color: "#fff" }}>
            {toastMessage}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
