/**
 * Background Service Worker
 * 
 * Runs persistently in the background. Listens for tab updates and
 * checks if the current URL is in the user's locked sites list.
 * If locked, it sends a message to the content script to show the overlay.
 */

const API_BASE = 'https://website-locker-server.vercel.app/api/v1';

// ── Session Storage Helpers ────────────────────────────────────────────────
// Manifest V3 session storage persists until the browser is closed.
// We also clear it when a tab is closed to meet the user's requirements.

async function isTabUnlocked(tabId: number, url: string): Promise<boolean> {
  const hostname = new URL(url).hostname;
  return new Promise((resolve) => {
    chrome.storage.session.get(`unlocked_${tabId}`, (result) => {
      const unlockedSites: string[] = result[`unlocked_${tabId}`] || [];
      resolve(unlockedSites.includes(hostname));
    });
  });
}

async function setTabUnlocked(tabId: number, url: string): Promise<void> {
  const hostname = new URL(url).hostname;
  return new Promise((resolve) => {
    chrome.storage.session.get(`unlocked_${tabId}`, (result) => {
      const unlockedSites: string[] = result[`unlocked_${tabId}`] || [];
      if (!unlockedSites.includes(hostname)) {
        unlockedSites.push(hostname);
        chrome.storage.session.set({ [`unlocked_${tabId}`]: unlockedSites }, resolve);
      } else {
        resolve();
      }
    });
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('accessToken', (result) => {
      resolve(result.accessToken ?? null);
    });
  });
}

async function fetchLockedSites(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/sites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.sites?.map((s: { url: string }) => s.url) ?? [];
  } catch {
    return [];
  }
}

function matchesLockedSite(url: string, lockedSites: string[]): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return lockedSites.some((site) => {
      const normalized = site.replace(/^www\./, '').replace(/^https?:\/\//, '');
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

// ── Tab listener ───────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when page starts loading and has a URL
  if (changeInfo.status !== 'loading' || !tab.url) return;

  // Skip browser internal pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  const token = await getAccessToken();
  if (!token) return; // User not logged in — do nothing

  const lockedSites = await fetchLockedSites(token);
  if (lockedSites.length === 0) return;

  if (matchesLockedSite(tab.url, lockedSites)) {
    // Check if this specific tab has already unlocked this site in this session
    const unlocked = await isTabUnlocked(tabId, tab.url);
    if (unlocked) return;

    // Notify content script to show the lock overlay
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_LOCK_OVERLAY',
        url: tab.url,
        apiBase: API_BASE,
      });
    } catch {
      // Content script might not be injected yet — retry shortly
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'SHOW_LOCK_OVERLAY',
            url: tab.url,
            apiBase: API_BASE,
          });
        } catch {
          // Tab may have been closed — ignore
        }
      }, 500);
    }
  }
});

// ── Message handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VERIFY_PASSWORD') {
    const { password, apiBase, url } = message;
    const tabId = sender.tab?.id;

    getAccessToken().then(async (token) => {
      if (!token) {
        sendResponse({ success: false, message: 'Not authenticated' });
        return;
      }
      try {
        const res = await fetch(`${apiBase}/auth/verify-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        
        if (data.success && tabId && url) {
          // Store that this tab has unlocked this site for the current session
          await setTabUnlocked(tabId, url);
        }

        sendResponse({ success: data.success });
      } catch {
        sendResponse({ success: false, message: 'Network error' });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// ── Clean up session on tab close ──────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`unlocked_${tabId}`);
});

export {};
