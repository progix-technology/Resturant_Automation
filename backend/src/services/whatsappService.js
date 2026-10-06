import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-Tenant Session Map: { [slug]: { socket, qrCodeDataUrl, connectionStatus, connectedUserPhone, isInitializing, isConnected } }
const sessions = {};

const getTenantAuthDir = (slug = 'spice-garden') => {
  const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const dir = path.join(__dirname, `../data/tenants/${safeSlug}/whatsapp_auth`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getSessionState = (slug = 'spice-garden') => {
  const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (!sessions[safeSlug]) {
    sessions[safeSlug] = {
      socket: null,
      qrCodeDataUrl: null,
      connectionStatus: 'DISCONNECTED',
      connectedUserPhone: null,
      isInitializing: false,
      isConnected: false,
    };
  }
  return sessions[safeSlug];
};

/**
 * Checks if tenant has a valid registered WhatsApp session on disk
 */
const isRegisteredSession = (slug = 'spice-garden') => {
  const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const credsFile = path.join(__dirname, `../data/tenants/${safeSlug}/whatsapp_auth/creds.json`);
  if (!fs.existsSync(credsFile)) return false;
  try {
    const raw = fs.readFileSync(credsFile, 'utf8');
    const creds = JSON.parse(raw);
    return !!(creds && (creds.me || creds.myJid || creds.account || creds.registered));
  } catch {
    return false;
  }
};

const getSavedPhone = (slug = 'spice-garden') => {
  const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const credsFile = path.join(__dirname, `../data/tenants/${safeSlug}/whatsapp_auth/creds.json`);
  if (!fs.existsSync(credsFile)) return null;
  try {
    const raw = fs.readFileSync(credsFile, 'utf8');
    const creds = JSON.parse(raw);
    const jid = creds?.me?.id || creds?.myJid || '';
    return jid.split(':')[0] || jid.split('@')[0] || null;
  } catch {
    return null;
  }
};

export const whatsappService = {
  /**
   * Initializes Baileys WhatsApp client for a specific restaurant tenant slug
   */
  async init(slug = 'spice-garden', forceFresh = false) {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const sess = getSessionState(safeSlug);

    // If session is registered on disk, ensure isConnected is true
    if (isRegisteredSession(safeSlug)) {
      sess.isConnected = true;
      sess.connectionStatus = 'CONNECTED';
      if (!sess.connectedUserPhone) {
        sess.connectedUserPhone = getSavedPhone(safeSlug);
      }
    }

    if (!forceFresh && (sess.isInitializing || sess.socket)) {
      return sess;
    }

    if (forceFresh && sess.socket) {
      try {
        sess.socket.end(new Error('Refreshing socket'));
      } catch {}
      sess.socket = null;
    }

    sess.isInitializing = true;
    if (!sess.isConnected) {
      sess.connectionStatus = 'CONNECTING';
    }
    console.log(`[WhatsApp Multi-Tenant Engine] Initializing Baileys for Tenant: [${safeSlug}]...`);

    try {
      const authDir = getTenantAuthDir(safeSlug);
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

      sess.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        markOnlineOnConnect: true,
      });

      sess.socket.ev.on('creds.update', saveCreds);

      sess.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !isRegisteredSession(safeSlug)) {
          sess.connectionStatus = 'QR_READY';
          sess.isConnected = false;
          console.log(`\n==================================================`);
          console.log(`[WhatsApp Service - Tenant: ${safeSlug}] SCAN QR CODE TO CONNECT:`);
          qrcodeTerminal.generate(qr, { small: true });
          console.log(`==================================================\n`);

          try {
            sess.qrCodeDataUrl = await QRCode.toDataURL(qr);
          } catch (err) {
            console.error(`[WhatsApp Service - ${safeSlug}] Error generating QR Data URL:`, err);
          }
        }

        if (connection === 'open') {
          sess.isConnected = true;
          sess.isInitializing = false;
          sess.connectionStatus = 'CONNECTED';
          sess.qrCodeDataUrl = null;

          const userJid = sess.socket?.user?.id || '';
          sess.connectedUserPhone = userJid.split(':')[0] || userJid.split('@')[0] || getSavedPhone(safeSlug) || 'Restaurant Phone';

          console.log(`\n✅ [WhatsApp Tenant SUCCESS: ${safeSlug}] Connected as +${sess.connectedUserPhone}!`);
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          console.log(`[WhatsApp Tenant ${safeSlug}] Closed: ${lastDisconnect?.error?.message || statusCode}. Logged out: ${isLoggedOut}`);

          if (isLoggedOut) {
            sess.isConnected = false;
            sess.isInitializing = false;
            sess.connectionStatus = 'DISCONNECTED';
            sess.connectedUserPhone = null;
            this.clearSessionFiles(safeSlug);
          } else {
            // Temporary restart/network drop — KEEP isConnected TRUE if registered on disk
            if (isRegisteredSession(safeSlug)) {
              sess.isConnected = true;
              sess.connectionStatus = 'CONNECTED';
            } else {
              sess.isConnected = false;
              sess.connectionStatus = 'CONNECTING';
            }
            sess.isInitializing = false;
            setTimeout(() => {
              this.init(safeSlug, true);
            }, 3000);
          }
        }
      });

      return sess;

    } catch (error) {
      console.error(`[WhatsApp Tenant ${safeSlug} Initialise Error]:`, error);
      if (!isRegisteredSession(safeSlug)) {
        sess.isConnected = false;
        sess.connectionStatus = 'DISCONNECTED';
      }
      sess.isInitializing = false;
      return sess;
    }
  },

  /**
   * Clears saved session credentials for a specific tenant
   */
  clearSessionFiles(slug = 'spice-garden') {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    try {
      const authDir = path.join(__dirname, `../data/tenants/${safeSlug}/whatsapp_auth`);
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log(`[WhatsApp Tenant ${safeSlug}] Session files cleared.`);
      }
    } catch (e) {
      console.error(`[WhatsApp Tenant ${safeSlug}] Failed clearing auth files:`, e);
    }
  },

  /**
   * Returns current status, QR Code, and connected phone for a tenant
   */
  async getStatus(slug = 'spice-garden') {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    let sess = getSessionState(safeSlug);

    const registered = isRegisteredSession(safeSlug);

    if (registered) {
      sess.isConnected = true;
      sess.connectionStatus = 'CONNECTED';
      if (!sess.connectedUserPhone) {
        sess.connectedUserPhone = getSavedPhone(safeSlug);
      }
    }

    if (!sess.socket && !sess.isInitializing) {
      await this.init(safeSlug);
    }

    return {
      slug: safeSlug,
      connected: sess.isConnected || registered,
      status: registered ? 'CONNECTED' : sess.connectionStatus,
      qrCodeDataUrl: sess.qrCodeDataUrl,
      connectedUserPhone: sess.connectedUserPhone || getSavedPhone(safeSlug),
    };
  },

  /**
   * Explicit logout & session reset for a tenant
   */
  async logout(slug = 'spice-garden') {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const sess = getSessionState(safeSlug);

    try {
      if (sess.socket) {
        await sess.socket.logout();
      }
    } catch (e) {
      console.warn(`[WhatsApp Tenant ${safeSlug} Logout Warning]:`, e.message);
    }

    this.clearSessionFiles(safeSlug);
    sess.isConnected = false;
    sess.isInitializing = false;
    sess.connectionStatus = 'DISCONNECTED';
    sess.qrCodeDataUrl = null;
    sess.connectedUserPhone = null;

    setTimeout(() => {
      this.init(safeSlug, true);
    }, 2000);

    return { success: true, message: `Tenant [${safeSlug}] WhatsApp logged out. Fresh QR generated.` };
  },

  /**
   * Requests an 8-digit WhatsApp Pairing Code for phone number based pairing
   */
  async requestPairingCode({ slug = 'spice-garden', mobile }) {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const formattedNum = this.formatPhoneNumber(mobile);

    if (!formattedNum || formattedNum.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number to generate pairing code');
    }

    let sess = getSessionState(safeSlug);

    if (sess.isConnected || isRegisteredSession(safeSlug)) {
      return {
        success: true,
        alreadyConnected: true,
        message: `WhatsApp for [${safeSlug}] is already connected as +${sess.connectedUserPhone || getSavedPhone(safeSlug)}`,
      };
    }

    // Clear stale incomplete credentials & re-init clean socket for pairing code
    this.clearSessionFiles(safeSlug);
    sess.isConnected = false;
    sess.isInitializing = false;
    sess.socket = null;

    await this.init(safeSlug, true);

    // Wait 2.5 seconds for WebSocket handshake to be ready
    await new Promise((res) => setTimeout(res, 2500));

    try {
      console.log(`[WhatsApp Tenant ${safeSlug}] Requesting official pairing code for +${formattedNum}...`);
      const code = await sess.socket.requestPairingCode(formattedNum);
      console.log(`[WhatsApp Tenant ${safeSlug} SUCCESS] Verified Pairing Code: ${code}`);

      return {
        success: true,
        pairingCode: code,
        phoneNumber: formattedNum,
        message: 'Pairing code generated! Open WhatsApp on phone -> Linked Devices -> Link with phone number instead.',
      };
    } catch (err) {
      console.error(`[WhatsApp Tenant ${safeSlug} Pairing Code Error]:`, err.message);
      throw new Error(err.message || 'Failed to request pairing code from WhatsApp servers');
    }
  },

  /**
   * Formats 10-digit or 12-digit Indian phone numbers
   */
  formatPhoneNumber(mobile) {
    if (!mobile) return '';
    const clean = String(mobile).replace(/\D/g, '');
    if (clean.length === 10) return `91${clean}`;
    if (clean.length === 12 && clean.startsWith('91')) return clean;
    return clean;
  },

  /**
   * Dispatches WhatsApp message directly via background socket for specific tenant
   */
  async sendMessage({ slug = 'spice-garden', mobile, messageText }) {
    const safeSlug = (slug || 'spice-garden').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const formattedNum = this.formatPhoneNumber(mobile);

    if (!formattedNum) {
      throw new Error('Valid 10-digit mobile number is required');
    }

    const recipientJid = `${formattedNum}@s.whatsapp.net`;
    const encodedText = encodeURIComponent(messageText);
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`;

    const sess = getSessionState(safeSlug);
    const registered = isRegisteredSession(safeSlug);

    if ((sess.isConnected || registered) && sess.socket) {
      try {
        console.log(`[WhatsApp Auto-Send - Tenant ${safeSlug}] Sending background message to +${formattedNum}...`);

        // Anti-ban 2.5 second safe delay
        await new Promise((res) => setTimeout(res, 2500));

        await sess.socket.sendMessage(recipientJid, { text: messageText });
        console.log(`[WhatsApp Auto-Send SUCCESS - ${safeSlug}] Delivered to +${formattedNum}!`);

        return {
          success: true,
          mode: 'AUTOMATIC_BACKGROUND',
          slug: safeSlug,
          recipient: formattedNum,
          message: 'Message delivered automatically in background.',
        };
      } catch (err) {
        console.error(`[WhatsApp Auto-Send Error - ${safeSlug}]:`, err.message);
        return {
          success: true,
          mode: 'FALLBACK_SMART_LINK',
          slug: safeSlug,
          recipient: formattedNum,
          fallbackUrl,
          message: 'Background send failed, fallback smart link prepared.',
        };
      }
    } else {
      console.log(`[WhatsApp Tenant ${safeSlug}] Not connected yet (${sess.connectionStatus}). Fallback link generated.`);
      return {
        success: true,
        mode: 'FALLBACK_SMART_LINK',
        slug: safeSlug,
        recipient: formattedNum,
        fallbackUrl,
        message: 'WhatsApp automated engine pending QR scan. 1-Click link fallback ready.',
      };
    }
  },
};
