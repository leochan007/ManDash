import { Box, Typography, Select, MenuItem, FormControl, Switch, FormControlLabel, TextField, IconButton } from "@mui/material"
import { ArrowBack, Language, DarkMode, LightMode, Settings as SettingsIcon, NetworkCheck, Notifications } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import { getThemeColors, type Theme } from "./utils/theme"

type Net = "mainnet" | "testnet"

interface SettingsProps {
  net: Net
  theme: Theme
  enableAlert: boolean
  highGwei: number
  lowGwei: number
  onBack: () => void
  onNetChange: (net: Net) => void
  onThemeChange: (theme: Theme) => void
  onEnableAlertChange: (enable: boolean) => void
  onHighGweiChange: (value: number) => void
  onLowGweiChange: (value: number) => void
}

export function Settings({
  net,
  theme,
  enableAlert,
  highGwei,
  lowGwei,
  onBack,
  onNetChange,
  onThemeChange,
  onEnableAlertChange,
  onHighGweiChange,
  onLowGweiChange
}: SettingsProps) {
  const { t, i18n } = useTranslation()
  const colors = getThemeColors(theme)

  const handleLangChange = (lang: "zh" | "en") => {
    i18n.changeLanguage(lang)
  }

  return (
    <Box sx={{ width: "100%", height: "100%", background: colors.bg, color: colors.fg, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", padding: 2, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <IconButton onClick={onBack} sx={{ color: colors.fg, mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <SettingsIcon sx={{ mr: 1, color: colors.fg }} />
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, color: colors.fg }}>
          {t("settings.title")}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 2, "&::-webkit-scrollbar": { width: "8px" }, "&::-webkit-scrollbar-track": { background: colors.bg }, "&::-webkit-scrollbar-thumb": { background: colors.border, borderRadius: "4px" }, "&::-webkit-scrollbar-thumb:hover": { background: colors.subtle } }}>
        <Box sx={{ background: colors.card, borderRadius: 2, padding: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <NetworkCheck sx={{ mr: 1, color: colors.fg }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.fg }}>
              {t("settings.network")}
            </Typography>
          </Box>
          <FormControl fullWidth>
            <Select
              value={net}
              onChange={(e) => onNetChange(e.target.value as Net)}
              sx={{
                background: theme === "dark" ? "#151515" : "#fff",
                color: colors.fg,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "& .MuiSvgIcon-root": {
                  color: colors.fg
                }
              }}
            >
              <MenuItem value="mainnet">{t("settings.mainnet")}</MenuItem>
              <MenuItem value="testnet">{t("settings.testnet")}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ background: colors.card, borderRadius: 2, padding: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Language sx={{ mr: 1, color: colors.fg }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.fg }}>
              {t("settings.language")}
            </Typography>
          </Box>
          <FormControl fullWidth>
            <Select
              value={i18n.language}
              onChange={(e) => handleLangChange(e.target.value as "zh" | "en")}
              sx={{
                background: theme === "dark" ? "#151515" : "#fff",
                color: colors.fg,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border
                },
                "& .MuiSvgIcon-root": {
                  color: colors.fg
                }
              }}
            >
              <MenuItem value="zh">{t("settings.zh")}</MenuItem>
              <MenuItem value="en">{t("settings.en")}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ background: colors.card, borderRadius: 2, padding: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Notifications sx={{ mr: 1, color: colors.fg }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.fg }}>
              {t("settings.alertToggle")}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={enableAlert}
                onChange={(e) => onEnableAlertChange(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: colors.primary
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: colors.primary
                  }
                }}
              />
            }
            label={enableAlert ? t("settings.alertToggle") : ""}
            sx={{ color: colors.fg }}
          />
        </Box>

        {enableAlert && (
          <Box sx={{ background: colors.card, borderRadius: 2, padding: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: colors.fg }}>
              {t("settings.gasThresholds")}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label={t("settings.highThreshold")}
                type="number"
                value={highGwei}
                onChange={(e) => onHighGweiChange(Number(e.target.value))}
                fullWidth
                inputProps={{ step: 0.1, min: 0 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.fg,
                    "& fieldset": {
                      borderColor: colors.border
                    },
                    "&:hover fieldset": {
                      borderColor: colors.border
                    }
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.subtle
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: colors.primary
                  }
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("settings.lowThreshold")}
                type="number"
                value={lowGwei}
                onChange={(e) => onLowGweiChange(Number(e.target.value))}
                fullWidth
                inputProps={{ step: 0.1, min: 0 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.fg,
                    "& fieldset": {
                      borderColor: colors.border
                    },
                    "&:hover fieldset": {
                      borderColor: colors.border
                    }
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.subtle
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: colors.primary
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
