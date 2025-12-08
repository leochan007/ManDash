import { Box, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"
import type { ThemeColors } from "../utils/theme"
import { getBlockExplorerUrl } from "../utils"

interface StatusBarProps {
  colors: ThemeColors
  blockNumber: bigint | null
  toastMessage: string | null
  gasGwei: number | null
  net: "mainnet" | "testnet"
}

export function StatusBar({ colors, blockNumber, toastMessage, gasGwei, net }: StatusBarProps) {
  const { t } = useTranslation()
  const explorer = getBlockExplorerUrl(net)

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
        <Typography
          variant="caption"
          sx={{ color: colors.subtle, fontFamily: "monospace", cursor: blockNumber ? "pointer" : "default", textDecoration: blockNumber ? "underline" : "none" }}
          onClick={() => {
            if (blockNumber && explorer) {
              chrome.tabs?.create({ url: `${explorer}/block/${blockNumber.toString()}` })
            }
          }}
        >
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

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography
          variant="caption"
          sx={{ color: colors.subtle, fontFamily: "monospace", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => {
            const url = `https://www.quicknode.com/gas-tracker/mantle`
            chrome.tabs?.create({ url })
          }}
        >
          {gasGwei !== null ? `${t("common.gasPrice")}: ${gasGwei.toFixed(3)} gwei` : `${t("common.gasPrice")}: —`}
        </Typography>
      </Box>
    </Box>
  )
}
