/**
 * 钱包连接工具函数
 * 在 Chrome 扩展的 popup 中，需要通过 content script 或注入脚本来访问页面的 window.ethereum
 */

export async function detectMetaMask(): Promise<boolean> {
  try {
    // 方法1: 尝试直接访问（在某些情况下可能可用）
    if (typeof window !== "undefined" && (window as any).ethereum?.isMetaMask) {
      return true
    }

    // 方法2: 通过 chrome.tabs API 注入脚本检测
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return typeof (window as any).ethereum !== "undefined" && (window as any).ethereum.isMetaMask
          }
        })
        return results[0]?.result === true
      } catch (e) {
        // 如果无法注入脚本（例如在 chrome:// 页面），返回 false
        return false
      }
    }

    return false
  } catch (e) {
    return false
  }
}

export async function connectMetaMask(): Promise<string | null> {
  try {
    // 方法1: 尝试直接访问
    if (typeof window !== "undefined" && (window as any).ethereum?.isMetaMask) {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" })
      return accounts?.[0] || null
    }

    // 方法2: 通过注入脚本连接
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: async () => {
            if (typeof (window as any).ethereum !== "undefined" && (window as any).ethereum.isMetaMask) {
              const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" })
              return accounts?.[0] || null
            }
            return null
          }
        })
        return results[0]?.result || null
      } catch (e) {
        console.error("无法注入脚本:", e)
        // 如果无法注入，尝试打开新标签页
        return await connectMetaMaskViaNewTab()
      }
    }

    return null
  } catch (e) {
    console.error("连接 MetaMask 失败:", e)
    return null
  }
}

async function connectMetaMaskViaNewTab(): Promise<string | null> {
  // 如果当前页面无法注入脚本，打开一个新标签页让用户连接
  return new Promise((resolve) => {
    chrome.tabs.create({ url: "https://metamask.io" }, () => {
      // 提示用户在新标签页中连接
      setTimeout(() => {
        resolve(null)
      }, 100)
    })
  })
}

export async function getMetaMaskAccounts(): Promise<string[]> {
  try {
    // 方法1: 尝试直接访问
    if (typeof window !== "undefined" && (window as any).ethereum?.isMetaMask) {
      const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
      return accounts || []
    }

    // 方法2: 通过注入脚本获取
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: async () => {
            if (typeof (window as any).ethereum !== "undefined" && (window as any).ethereum.isMetaMask) {
              const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
              return accounts || []
            }
            return []
          }
        })
        return results[0]?.result || []
      } catch (e) {
        return []
      }
    }

    return []
  } catch (e) {
    return []
  }
}

