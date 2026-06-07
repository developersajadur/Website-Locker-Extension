/**
 * Content Script
 *
 * Injected into every page at document_start.
 * Listens for SHOW_LOCK_OVERLAY messages from the background service worker
 * and renders a full-page lock overlay with password verification.
 */

let overlayActive = false;

function createOverlay(url: string, apiBase: string): void {
  if (overlayActive) return;
  overlayActive = true;

  // Block all interaction with the page immediately
  document.documentElement.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.id = 'website-locker-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 40px 36px;
    width: 380px;
    max-width: 90vw;
    text-align: center;
    color: #fff;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
  `;

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /* use raw url */ }

  card.innerHTML = `
    <div style="font-size: 52px; margin-bottom: 16px;">🔒</div>
    <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px;">
      Site Locked
    </h1>
    <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 28px; line-height: 1.5;">
      <strong style="color: rgba(255,255,255,0.9);">${hostname}</strong><br>
      is locked by Website Locker. Enter your password to continue.
    </p>

    <div id="wl-error" style="
      display: none;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: rgba(255, 80, 80, 0.15);
      border: 1px solid rgba(255, 80, 80, 0.3);
      border-radius: 10px;
      color: #ff8080;
      font-size: 13px;
    "></div>

    <input
      id="wl-password"
      type="password"
      placeholder="Enter your password…"
      style="
        width: 100%;
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.08);
        color: #fff;
        font-size: 15px;
        outline: none;
        margin-bottom: 14px;
        box-sizing: border-box;
      "
    />

    <button
      id="wl-submit"
      style="
        width: 100%;
        padding: 13px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.3px;
        transition: opacity 0.2s;
        margin-bottom: 16px;
      "
    >
      Unlock
    </button>

    <p style="font-size: 12px; color: rgba(255,255,255,0.35);">
      Powered by Website Locker Extension
    </p>
  `;

  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);

  // Wire up unlock logic
  const passwordInput = card.querySelector<HTMLInputElement>('#wl-password')!;
  const submitBtn = card.querySelector<HTMLButtonElement>('#wl-submit')!;
  const errorDiv = card.querySelector<HTMLDivElement>('#wl-error')!;

  const showError = (msg: string) => {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    passwordInput.style.borderColor = 'rgba(255,80,80,0.5)';
  };

  const attemptUnlock = () => {
    const password = passwordInput.value;
    if (!password) {
      showError('Please enter your password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying…';
    submitBtn.style.opacity = '0.7';
    errorDiv.style.display = 'none';

    chrome.runtime.sendMessage(
      { type: 'VERIFY_PASSWORD', password, apiBase, url: window.location.href },
      (response: { success: boolean; message?: string }) => {
        if (chrome.runtime.lastError) {
          showError('Extension error. Please reload the extension.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock';
          submitBtn.style.opacity = '1';
          return;
        }

        if (response?.success) {
          // Remove overlay and restore page
          overlayActive = false;
          document.documentElement.style.overflow = '';
          overlay.remove();
        } else {
          showError(response?.message ?? 'Incorrect password. Please try again.');
          passwordInput.value = '';
          passwordInput.focus();
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock';
          submitBtn.style.opacity = '1';
        }
      },
    );
  };

  submitBtn.addEventListener('click', attemptUnlock);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });

  // Focus the password field immediately
  setTimeout(() => passwordInput.focus(), 100);
}

// ── Listen for messages from the background worker ─────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_LOCK_OVERLAY') {
    createOverlay(message.url, message.apiBase);
  }
});

export {};
