import { useState, useEffect } from "react"
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
import { AccountBalanceWallet } from "@mui/icons-material"
import { useTranslation } from "react-i18next"
import type { ThemeColors } from "../utils/theme"
import { detectMetaMask, connectMetaMask, getMetaMaskAccounts } from "../utils/wallet"

interface WalletConnectProps {
  colors: ThemeColors
}

const WALLETCONNECT_PROJECT_ID = process.env.PLASMO_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

export function WalletConnect({ colors }: WalletConnectProps) {
  const { t } = useTranslation()
  const [address, setAddress] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [connecting, setConnecting] = useState<boolean>(false)
  const [metaMaskAvailable, setMetaMaskAvailable] = useState<boolean>(false)

  useEffect(() => {
    detectMetaMask().then(setMetaMaskAvailable)
    getMetaMaskAccounts().then((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0])
      }
    })
  }, [])

  const handleConnectMetaMask = async () => {
    if (!metaMaskAvailable) {
      alert(t("wallet.metamaskNotDetected"))
      return
    }

    try {
      setConnecting(true)
      const account = await connectMetaMask()
      if (account) {
        setAddress(account)
        setOpen(false)
      } else {
        alert(t("wallet.connectFailed"))
      }
    } catch (error: any) {
      console.error("连接失败:", error)
      const errorMessage = error?.message || t("wallet.connectFailed")
      alert(errorMessage)
    } finally {
      setConnecting(false)
    }
  }

  const handleConnectWalletConnect = async () => {
    if (!WALLETCONNECT_PROJECT_ID) {
      alert(t("wallet.walletconnectNotConfigured"))
      return
    }

    try {
      setConnecting(true)
      alert(t("wallet.walletconnectInDevelopment"))
    } catch (error: any) {
      console.error("WalletConnect 连接失败:", error)
      alert(t("wallet.connectFailed"))
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setAddress(null)
  }

  return (
    <>
      {address ? (
        <Box
          sx={{
            background: colors.card,
            borderRadius: 2,
            padding: 2,
            border: `1px solid ${colors.border}`,
            mb: 2
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWallet sx={{ color: colors.fg }} />
              <Box>
                <Typography variant="body2" sx={{ color: colors.subtle, mb: 0.5 }}>
                  {t("wallet.connected")}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.fg, fontFamily: "monospace" }}>
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDisconnect}
              sx={{
                color: colors.fg,
                borderColor: colors.border,
                "&:hover": {
                  borderColor: colors.primary,
                  background: colors.card
                }
              }}
            >
              {t("wallet.disconnect")}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            background: colors.card,
            borderRadius: 2,
            padding: 2,
            border: `1px solid ${colors.border}`,
            mb: 2,
            textAlign: "center"
          }}
        >
          <AccountBalanceWallet sx={{ fontSize: 48, color: colors.subtle, mb: 1 }} />
          <Typography variant="body2" sx={{ color: colors.subtle, mb: 2 }}>
            {t("wallet.connectToView")}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpen(true)}
            disabled={connecting}
            sx={{
              background: colors.primary,
              color: "#fff",
              "&:hover": {
                background: colors.primary,
                opacity: 0.9
              }
            }}
          >
            {t("wallet.connect")}
          </Button>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            background: colors.bg,
            color: colors.fg,
            zIndex: 9999
          }
        }}
        sx={{
          zIndex: 9999,
          "& .MuiBackdrop-root": {
            zIndex: 9998
          }
        }}
      >
        <DialogTitle sx={{ color: colors.fg }}>{t("wallet.selectWallet")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 300, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={handleConnectMetaMask}
              disabled={connecting || !metaMaskAvailable}
              sx={{
                color: colors.fg,
                borderColor: colors.border,
                "&:hover": {
                  borderColor: colors.primary,
                  background: colors.card
                },
                "&:disabled": {
                  color: colors.subtle,
                  borderColor: colors.border
                }
              }}
            >
              {metaMaskAvailable ? t("wallet.metamask") : t("wallet.metamaskNotDetected")}
            </Button>
            <Button
              variant="outlined"
              onClick={handleConnectWalletConnect}
              disabled={connecting || !WALLETCONNECT_PROJECT_ID}
              sx={{
                color: colors.fg,
                borderColor: colors.border,
                "&:hover": {
                  borderColor: colors.primary,
                  background: colors.card
                },
                "&:disabled": {
                  color: colors.subtle,
                  borderColor: colors.border
                }
              }}
            >
              {WALLETCONNECT_PROJECT_ID ? t("wallet.walletconnect") : t("wallet.walletconnectNotConfigured")}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: colors.fg }}>
            {t("wallet.cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
