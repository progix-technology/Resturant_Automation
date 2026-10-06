import React, { useState, useEffect } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { 
  Building2, 
  ShoppingBag, 
  CreditCard, 
  Bell, 
  Sliders, 
  Save, 
  Clock, 
  MapPin, 
  Mail, 
  Phone, 
  Percent, 
  Smartphone,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Star,
  Sparkles,
  ExternalLink,
  Loader2,
  Trash2,
  UtensilsCrossed,
  Layers,
  QrCode,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';

import { useAdminAuth } from '../context/AdminAuthContext';
import { notificationService } from '../../services/notificationService';

const SecurityAuthModal = ({ isOpen, onClose, onAuthorized, actionTitle, adminEmail, targetMobile, currentSlug }) => {
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setErrorMessage('');
    setIsSendingOtp(true);
    try {
      const res = await notificationService.sendSecurityOtp(targetMobile, currentSlug);
      if (res.success) {
        setOtpSent(true);
      } else {
        setErrorMessage(res.message || 'Failed to send OTP to WhatsApp');
      }
    } catch (err) {
      setErrorMessage(err.message || 'OTP send failed');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPassword = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage('');
    setIsVerifyingPassword(true);
    try {
      const res = await notificationService.verifyAdminPassword(adminEmail, password);
      if (res.success) {
        setPasswordVerified(true);
        handleSendOtp();
      } else {
        setErrorMessage(res.message || 'Incorrect Admin Password!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Password check failed');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage('');
    setIsVerifyingOtp(true);
    try {
      const res = await notificationService.verifySecurityOtp(otp, currentSlug);
      if (res.success) {
        onAuthorized();
      } else {
        setErrorMessage(res.message || 'Incorrect 6-Digit OTP!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Verification Required</h3>
              <p className="text-[11px] text-slate-500">{actionTitle || 'Authorize sensitive changes'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Admin Password */}
        {!passwordVerified ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Step 1: Enter Admin Login Password ({adminEmail})
              </label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVerifyPassword(e);
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Verify Password & Send WhatsApp OTP</span>
            </button>
          </div>
        ) : (
          /* Step 2: WhatsApp Security OTP */
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password Verified!
              </span>
              <span className="text-[10px] text-emerald-700">OTP Sent to +91-{targetMobile}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Step 2: Enter 6-Digit WhatsApp Security OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="e.g. 482910"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVerifyOtp(e);
                  }
                }}
                className="w-full text-center text-lg font-mono font-black border border-slate-300 rounded-lg py-2 tracking-widest text-slate-900 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                Check WhatsApp on <b>+91 {targetMobile}</b> for the 6-digit verification code.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSendOtp(); }}
                disabled={isSendingOtp}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
              >
                {isSendingOtp ? 'Sending...' : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Authorize & Confirm Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



const WhatsAppQrCard = ({ showToast, currentPhone, onUpdatePhone, currentSlug = 'spice-garden', adminEmail = 'resturant1@gmail.com' }) => {
  const [statusData, setStatusData] = useState({
    connected: false,
    status: 'CONNECTING',
    qrCodeDataUrl: null,
    connectedUserPhone: null,
  });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Phone number & Pairing code state
  const [inputPhone, setInputPhone] = useState(currentPhone || '');
  const [pairingCode, setPairingCode] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  // Security Auth Modal State
  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    actionTitle: '',
    onAuthorized: null,
  });

  useEffect(() => {
    if (currentPhone) {
      setInputPhone(currentPhone);
    }
  }, [currentPhone]);

  const fetchStatus = async () => {
    try {
      const res = await notificationService.getWhatsAppStatus(currentSlug);
      setStatusData(res);
    } catch {
      setStatusData({ connected: false, status: 'DISCONNECTED', qrCodeDataUrl: null, connectedUserPhone: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 4 seconds to detect when user scans QR code or pairs
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [currentSlug]);

  const handleLogout = async () => {
    setDisconnecting(true);
    setPairingCode('');
    try {
      await notificationService.logoutWhatsApp(currentSlug);
      showToast('WhatsApp disconnected successfully. Fresh QR generated.', 'info');
      await fetchStatus();
    } catch (e) {
      showToast('Logout failed: ' + e.message, 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRequestPairingCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputPhone || inputPhone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10-digit WhatsApp phone number', 'error');
      return;
    }

    setIsRequestingCode(true);
    setPairingCode('');
    try {
      if (onUpdatePhone) {
        onUpdatePhone(inputPhone);
      }
      const res = await notificationService.requestPairingCode(inputPhone, currentSlug);
      if (res.success && res.pairingCode) {
        setPairingCode(res.pairingCode);
        showToast('8-Digit Pairing Code generated! Type it in WhatsApp.', 'success');
      } else {
        throw new Error(res.message || 'Could not generate pairing code');
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate pairing code', 'error');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const triggerPairingCodeWithSecurity = (e) => {
    e.preventDefault();
    if (!inputPhone || inputPhone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10-digit WhatsApp phone number', 'error');
      return;
    }
    setSecurityModal({
      isOpen: true,
      actionTitle: 'Authorize WhatsApp Pairing Code Request',
      onAuthorized: () => {
        setSecurityModal((prev) => ({ ...prev, isOpen: false }));
        handleRequestPairingCode(e);
      },
    });
  };

  const triggerLogoutWithSecurity = () => {
    setSecurityModal({
      isOpen: true,
      actionTitle: 'Authorize WhatsApp Account Disconnect',
      onAuthorized: () => {
        setSecurityModal((prev) => ({ ...prev, isOpen: false }));
        handleLogout();
      },
    });
  };


  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            statusData.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Automatic Background WhatsApp Sender</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                statusData.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {statusData.connected ? 'Connected' : 'Setup Required'}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {statusData.connected
                ? `Connected to WhatsApp account (+${statusData.connectedUserPhone || 'Active'})`
                : 'Enter restaurant WhatsApp number below to pair via 8-digit code or QR Scan'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors self-start sm:self-auto"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* Editable Restaurant WhatsApp Phone Number Input Bar */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-amber-600" />
            Official Restaurant WhatsApp Number
          </label>
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
            <input
              type="text"
              placeholder="e.g. 98765 43210"
              value={inputPhone}
              onChange={(e) => {
                setInputPhone(e.target.value);
                if (onUpdatePhone) onUpdatePhone(e.target.value);
              }}
              className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg pl-11 pr-3 py-1.5 bg-white focus:ring-1 focus:ring-amber-500 text-slate-900"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            This phone number will be registered on your admin dashboard as the restaurant WhatsApp dispatcher.
          </p>
        </div>

        {!statusData.connected && (
          <button
            type="button"
            onClick={triggerPairingCodeWithSecurity}
            disabled={isRequestingCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
          >
            {isRequestingCode ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Get 8-Digit Pairing Code</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Auth Modal for WhatsApp Card */}
      <SecurityAuthModal
        isOpen={securityModal.isOpen}
        onClose={() => setSecurityModal((prev) => ({ ...prev, isOpen: false }))}
        onAuthorized={() => securityModal.onAuthorized && securityModal.onAuthorized()}
        actionTitle={securityModal.actionTitle}
        adminEmail={adminEmail}
        targetMobile={inputPhone || currentPhone || '9876543210'}
        currentSlug={currentSlug}
      />

      {/* Pairing Code Display Modal/Banner */}
      {pairingCode && !statusData.connected && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl border-2 border-amber-400 space-y-3 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>8-Digit WhatsApp Pairing Code Generated!</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-mono text-2xl font-black tracking-widest shadow-lg border border-white/20">
              {pairingCode}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(pairingCode);
                showToast('Pairing code copied to clipboard!', 'success');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs max-w-lg mx-auto space-y-1 text-left">
            <p className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>DHYAN DEIN (Important): Mobile par SMS nahi aayega!</span>
            </p>
            <p className="text-[11px] text-slate-300">
              Code upar screen par dikh raha hai (<b>{pairingCode}</b>). Apne mobile me <b>WhatsApp → Linked Devices → Link with phone number instead</b> par jayein aur ye code wahan type karein!
            </p>
          </div>
        </div>
      )}

      {statusData.connected ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">
                🟢 Auto-Send Engine Active (+{statusData.connectedUserPhone || inputPhone || 'Connected'})
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                All order confirmations, kitchen ETAs, and bills will send silently in the background with zero clicks!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerLogoutWithSecurity}
            disabled={disconnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{disconnecting ? 'Disconnecting...' : 'Disconnect WhatsApp'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            {statusData.qrCodeDataUrl ? (
              <>
                <img
                  src={statusData.qrCodeDataUrl}
                  alt="WhatsApp Web Pair QR Code"
                  className="w-48 h-48 object-contain rounded-lg border border-slate-100 shadow-inner"
                />
                <p className="text-[11px] font-bold text-slate-700 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Or scan this QR Code using Linked Devices
                </p>
              </>
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-semibold">Generating QR Code...</span>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>2 Easy Ways to Connect Restaurant Phone:</span>
            </h5>
            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <span><b>Method A (Pairing Code):</b> Click <b>"Get 8-Digit Pairing Code"</b> button above & type code into phone!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <span><b>Method B (QR Scan):</b> WhatsApp → Linked Devices → <b>Link a Device</b> → Scan QR Code on left.</span>
              </li>
            </ol>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                100% Free & Anti-Ban Protected
              </p>
              <p className="text-amber-800">
                Safe 2.5-second anti-spam delays are built in. Customers who order at tables expect bills & status updates, so your number will remain 100% safe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminSettingsPage = () => {
  const { currentAdmin } = useAdminAuth();
  const { settings, updateSettings, showToast } = useAdminData();
  const currentSlug = currentAdmin?.restaurantSlug || settings?.restaurantSlug || 'spice-garden';
  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, ORDERS, PAYMENTS, NOTIFICATIONS, PREFERENCES

  // Form states initialized with settings or sensible defaults
  const [formData, setFormData] = useState({
    // Visual Branding & Identity
    name: settings.restaurantName || settings.name || 'Spice Garden',
    tagline: settings.tagline || 'Authentic flavors, freshly prepared.',
    cuisine: settings.cuisine || 'North Indian • Chinese • Tandoor',
    rating: settings.rating || 4.8,
    reviewCount: settings.reviewCount || 320,
    logo: settings.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    banner: settings.banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    
    // Operating Hours & Kitchen Status
    openTime: settings.openTime || '11:30 AM',
    closeTime: settings.closeTime || '11:00 PM',
    isKitchenOpen: settings.isKitchenOpen !== false,
    
    // Contact & Location
    email: settings.email || 'contact@spicegarden.com',
    phone: settings.phone || '+91 98765 43210',
    address: settings.address || '14, Palm Grove Road, Indiranagar, Bengaluru',
    gstin: settings.gstin || '29ABCDE1234F1Z5',
    
    // Order Settings
    acceptOrders: settings.isAcceptingOrders !== false,
    autoAcceptOrders: false,
    defaultPrepTime: settings.defaultPreparationTimeMinutes || 25,
    allowCancellation: true,

    // Payment & UPI Settings
    currency: settings.currency || 'INR',
    taxPercentage: settings.taxPercentage || 5,
    upiId: settings.upiId || 'spicegarden@okhdfcbank',

    // Bank Account & Settlement Details
    bankName: settings.bankName || 'HDFC Bank',
    accountHolderName: settings.accountHolderName || 'Spice Garden Hospitality',
    accountNumber: settings.accountNumber || '50200084920184',
    ifscCode: settings.ifscCode || 'HDFC0000128',
    accountType: settings.accountType || 'Current Account',
    branchName: settings.branchName || 'Indiranagar Branch, Bengaluru',

    // Notifications
    whatsappEnabled: settings.whatsappEnabled !== false,
    whatsappPhone: settings.whatsappPhone || settings.phone || '9876543210',
    orderAcceptAlert: true,
    preparingAlert: true,
    readyAlert: true,
    servedAlert: true,
    paymentAlert: true,

    // Admin Preferences
    timezone: 'Asia/Kolkata (IST)',
    language: 'English (India)',
    theme: 'Clean Neutral (Default)'
  });

  // Sync state if settings update from context / backend
  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        name: settings.restaurantName || settings.name || prev.name,
        tagline: settings.tagline !== undefined ? settings.tagline : prev.tagline,
        cuisine: settings.cuisine || prev.cuisine,
        rating: settings.rating !== undefined ? settings.rating : prev.rating,
        reviewCount: settings.reviewCount !== undefined ? settings.reviewCount : prev.reviewCount,
        logo: settings.logo || prev.logo,
        banner: settings.banner || prev.banner,
        openTime: settings.openTime || prev.openTime,
        closeTime: settings.closeTime || prev.closeTime,
        isKitchenOpen: settings.isKitchenOpen !== undefined ? settings.isKitchenOpen : prev.isKitchenOpen,
        email: settings.email || prev.email,
        phone: settings.phone || prev.phone,
        whatsappPhone: settings.whatsappPhone || settings.phone || prev.whatsappPhone,
        address: settings.address || prev.address,
        gstin: settings.gstin || prev.gstin,
        upiId: settings.upiId || prev.upiId,
        taxPercentage: settings.taxPercentage !== undefined ? settings.taxPercentage : prev.taxPercentage,
        bankName: settings.bankName || prev.bankName,
        accountHolderName: settings.accountHolderName || prev.accountHolderName,
        accountNumber: settings.accountNumber || prev.accountNumber,
        ifscCode: settings.ifscCode || prev.ifscCode,
      }));
    }
  }, [settings]);

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Direct Logo upload to Cloudinary
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadError('');

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/upload/restaurant-image?type=logo`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Logo upload failed');
      }

      setFormData(prev => ({
        ...prev,
        logo: data.url,
      }));
      showToast('Logo uploaded to Cloudinary successfully!', 'success');
    } catch (err) {
      setLogoUploadError(err.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Direct Cover Banner upload to Cloudinary
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingBanner(true);
    setBannerUploadError('');

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/upload/restaurant-image?type=banner`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Banner upload failed');
      }

      setFormData(prev => ({
        ...prev,
        banner: data.url,
      }));
      showToast('Cover banner uploaded to Cloudinary successfully!', 'success');
    } catch (err) {
      setBannerUploadError(err.message || 'Failed to upload banner.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    actionTitle: '',
    onAuthorized: null,
  });

  const executeSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        name: formData.name,
        restaurantName: formData.name,
        tagline: formData.tagline,
        cuisine: formData.cuisine,
        rating: Number(formData.rating),
        reviewCount: Number(formData.reviewCount),
        logo: formData.logo,
        banner: formData.banner,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        isKitchenOpen: formData.isKitchenOpen,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gstin: formData.gstin,
        isAcceptingOrders: formData.acceptOrders,
        defaultPreparationTimeMinutes: Number(formData.defaultPrepTime),
        currency: formData.currency,
        taxPercentage: Number(formData.taxPercentage),
        upiId: formData.upiId,
        bankName: formData.bankName,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        accountType: formData.accountType,
        branchName: formData.branchName,
        whatsappEnabled: formData.whatsappEnabled,
        whatsappPhone: formData.whatsappPhone,
      });
      showToast('All restaurant settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (activeTab === 'PAYMENTS' || activeTab === 'NOTIFICATIONS') {
      setSecurityModal({
        isOpen: true,
        actionTitle: `Authorize ${activeTab === 'PAYMENTS' ? 'UPI VPA & Bank Settlement' : 'WhatsApp Settings'} Changes`,
        onAuthorized: () => {
          setSecurityModal((prev) => ({ ...prev, isOpen: false }));
          executeSave();
        },
      });
    } else {
      executeSave();
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AdminPageHeader
          title="Restaurant Settings"
          description="Manage digital QR menu branding, kitchen timings, live status, taxes, and notification policies."
        />
        <a
          href={`/menu/${currentSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Preview Welcome Page</span>
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Settings Navigation Tabs */}
        <div className="w-full lg:w-64 bg-white rounded-xl border border-slate-200 p-2 shadow-sm shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'PROFILE', label: 'Brand & Digital Menu', icon: Building2 },
              { id: 'ORDERS', label: 'Order & Kitchen Rules', icon: ShoppingBag },
              { id: 'PAYMENTS', label: 'Payments & Taxes', icon: CreditCard },
              { id: 'NOTIFICATIONS', label: 'WhatsApp Alerts', icon: Bell },
              { id: 'PREFERENCES', label: 'System Preferences', icon: Sliders }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Tab Contents */}
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Tab: Restaurant Profile & Digital Menu Branding */}
            {activeTab === 'PROFILE' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Brand Identity & Digital Menu Appearance</h3>
                    <p className="text-xs text-slate-500">Live customization for the diner welcome screen, receipts, and brand banner</p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Cloudinary CDN Powered
                  </span>
                </div>

                {/* Section 1: Visual Media (Logo & Cover Banner) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  {/* Restaurant Logo Uploader */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Restaurant Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Logo Preview */}
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-900 shrink-0 group">
                        {formData.logo ? (
                          <img
                            src={formData.logo}
                            alt="Logo Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        {formData.logo && (
                          <button
                            type="button"
                            onClick={() => handleChange('logo', '')}
                            title="Remove logo"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 hover:border-slate-400 shadow-xs transition-colors">
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-amber-600" />
                              <span>Upload New Logo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                          />
                        </label>
                        <p className="text-[10px] text-slate-400">Square PNG or JPG recommended (e.g. 500x500px)</p>
                        {logoUploadError && (
                          <p className="text-[11px] text-rose-600 font-medium">{logoUploadError}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="url"
                        placeholder="Or paste Logo Image URL"
                        value={formData.logo}
                        onChange={(e) => handleChange('logo', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Restaurant Cover Banner Uploader */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Welcome Hero Cover Banner
                    </label>

                    {/* Banner Live Card Preview */}
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
                      {formData.banner ? (
                        <img
                          src={formData.banner}
                          alt="Banner Preview"
                          className="w-full h-full object-cover brightness-90"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Overlay badge preview */}
                      <div className="absolute bottom-2 left-3 right-3 text-white text-[10px] flex items-center justify-between">
                        <span className="flex items-center gap-1 font-semibold text-slate-200">
                          <Clock className="w-3 h-3 text-amber-300" />
                          {formData.openTime} – {formData.closeTime}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 ${
                          formData.isKitchenOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          {formData.isKitchenOpen ? 'OPEN NOW' : 'CLOSED NOW'}
                        </span>
                      </div>

                      {/* Hover action to remove */}
                      {formData.banner && (
                        <button
                          type="button"
                          onClick={() => handleChange('banner', '')}
                          title="Remove banner"
                          className="absolute top-2 right-2 p-1 rounded-md bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-rose-300 hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Banner Upload Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 hover:border-slate-400 shadow-xs transition-colors">
                        {isUploadingBanner ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            <span>Uploading to Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                            <span>Upload Hero Banner</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">16:9 Landscape (e.g. 1200x675px)</span>
                    </div>

                    <div>
                      <input
                        type="url"
                        placeholder="Or paste Banner Image URL"
                        value={formData.banner}
                        onChange={(e) => handleChange('banner', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                      />
                    </div>
                    {bannerUploadError && (
                      <p className="text-[11px] text-rose-600 font-medium">{bannerUploadError}</p>
                    )}
                  </div>
                </div>

                {/* Section 2: Core Restaurant Info & Tagline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      placeholder="e.g. Spice Garden"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tagline / Slogan *
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="e.g. Authentic flavors, freshly prepared."
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 italic text-slate-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cuisine Specialties / Tags (Displayed on welcome badge)
                    </label>
                    <input
                      type="text"
                      value={formData.cuisine}
                      onChange={(e) => handleChange('cuisine', e.target.value)}
                      placeholder="e.g. North Indian • Chinese • Tandoor"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Section 3: Diner Ratings & Reviews */}
                <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Customer Ratings & Social Proof
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Average Star Rating (1.0 – 5.0)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => handleChange('rating', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Review Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reviewCount}
                        onChange={(e) => handleChange('reviewCount', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-2">
                    Appears as: <span className="font-bold">★ {formData.rating} ({formData.reviewCount}+ reviews)</span> on the diner welcome screen.
                  </p>
                </div>

                {/* Section 4: Operational Hours & Live Kitchen Status */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Restaurant Operating Hours & Live Status
                      </h4>
                      <p className="text-xs text-slate-500">Opening & closing timings and real-time "OPEN NOW / CLOSED NOW" badge for diners</p>
                    </div>

                    {/* Live Restaurant Status Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                        formData.isKitchenOpen 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${formData.isKitchenOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`}></span>
                        {formData.isKitchenOpen ? 'OPEN NOW' : 'CLOSED NOW'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isKitchenOpen}
                          onChange={(e) => handleChange('isKitchenOpen', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Opening Time
                      </label>
                      <input
                        type="text"
                        value={formData.openTime}
                        onChange={(e) => handleChange('openTime', e.target.value)}
                        placeholder="e.g. 11:30 AM"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Closing Time
                      </label>
                      <input
                        type="text"
                        value={formData.closeTime}
                        onChange={(e) => handleChange('closeTime', e.target.value)}
                        placeholder="e.g. 11:00 PM"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Physical Address & Official Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Physical Restaurant Address (Shown at bottom of welcome card)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="e.g. 14, Palm Grove Road, Indiranagar, Bengaluru"
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Support Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => handleChange('gstin', e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Order Settings */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Order Acceptance & Kitchen Timing</h3>
                  <p className="text-xs text-slate-500">Configure how customer orders are processed and scheduled</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Accept Online QR Orders</p>
                      <p className="text-[11px] text-slate-500">When disabled, customers will see kitchen offline notification</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptOrders}
                        onChange={(e) => handleChange('acceptOrders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Auto-Accept Orders</p>
                      <p className="text-[11px] text-slate-500">Bypass manual acceptance and send incoming orders straight to kitchen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoAcceptOrders}
                        onChange={(e) => handleChange('autoAcceptOrders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Default Kitchen Preparation Time (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.defaultPrepTime}
                      onChange={(e) => handleChange('defaultPrepTime', e.target.value)}
                      className="w-48 text-xs border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">This ETA is communicated to diners via WhatsApp updates</p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Allow Customer Order Cancellations</p>
                      <p className="text-[11px] text-slate-500">Allow diners to cancel pending orders before kitchen acceptance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowCancellation}
                        onChange={(e) => handleChange('allowCancellation', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Payment Settings */}
            {activeTab === 'PAYMENTS' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">UPI Payment & Automatic Dynamic QR Code Setup</h3>
                  <p className="text-xs text-slate-500">
                    Enter your official UPI VPA (e.g. merchant@upi). Every order (e.g. ₹599) will automatically generate a dynamic QR code pre-filled with that exact bill amount.
                  </p>
                </div>

                {/* Safe Multi-Tenant Isolation Notice */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold">100% Safe & Isolated Tenant Data</p>
                    <p className="text-[11px] text-emerald-800">
                      Your UPI VPA and Bank Settlement details are encrypted and saved separately inside your restaurant's configuration folder (<b>{currentSlug}</b>). No other admin can access or modify your payment settings.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Primary Restaurant UPI VPA (ID) *
                    </label>
                    <div className="relative">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={formData.upiId}
                        onChange={(e) => handleChange('upiId', e.target.value)}
                        placeholder="e.g. restaurant@okhdfcbank or 9876543210@upi"
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      All diner payments will be credited directly to this UPI ID with 0% commission.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={formData.currency}
                      readOnly
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">GST / Tax Percentage (%)</label>
                    <div className="relative">
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min="0"
                        max="28"
                        value={formData.taxPercentage}
                        onChange={(e) => handleChange('taxPercentage', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Dynamic Exact-Amount QR Code Generator & Tester Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-600" />
                        Live Automatic Dynamic QR Code Tester
                      </h4>
                      <p className="text-xs text-slate-500">
                        Test how a customer's phone scanner auto-types exact amounts (e.g. ₹599) for your UPI ID.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      NPCI Standard Auto-Amount Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className="w-44 h-44 rounded-lg overflow-hidden border border-slate-200 bg-white p-2 shadow-inner">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            `upi://pay?pa=${formData.upiId || 'merchant@upi'}&pn=${encodeURIComponent(formData.name || 'Restaurant')}&am=599&cu=INR&tn=Bill_ORD-2975`
                          )}`}
                          alt="Test Dynamic UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-2 font-mono">
                        UPI: {formData.upiId || 'merchant@upi'}
                      </p>
                      <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono text-[11px] font-bold">
                        Test Amount: ₹599 (Auto-Typed on Scan)
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Kaise Kaam Karta Hai? (How Auto-Amount Works):
                      </p>
                      <ul className="space-y-2 text-slate-600 list-disc pl-4 text-[11px]">
                        <li><b>Automatic Amount Pre-Fill:</b> Jab 599 ya 588 ka order hoga, system apne aap <code>am=599</code> parameter append kar ke dynamic QR Code create karega.</li>
                        <li><b>Zero Typing for Customer:</b> Customer Google Pay, PhonePe, ya Paytm se QR scan karega to uske phone par <b>₹599 apne aap typed aayega</b>. Customer ko amount type nahi karna padega.</li>
                        <li><b>Direct Bank Transfer:</b> Payment seedhe aapke upar add kiye gaye UPI VPA (<b>{formData.upiId}</b>) par transfer hoga.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Bank Account & Payout Settlement Section */}
                <div className="pt-5 border-t border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-amber-600" />
                        <span>Bank Account & Settlement Details</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Designated restaurant account for direct settlement of UPI, Card, and digital diner payments
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 self-start sm:self-auto">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Settlement Account</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bank Name *
                      </label>
                      <div className="relative">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => handleChange('bankName', e.target.value)}
                          placeholder="e.g. HDFC Bank, ICICI Bank"
                          className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Account Holder Name *
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formData.accountHolderName}
                          onChange={(e) => handleChange('accountHolderName', e.target.value)}
                          placeholder="e.g. Spice Garden Hospitality LLP"
                          className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bank Account Number *
                      </label>
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => handleChange('accountNumber', e.target.value)}
                          placeholder="Bank Account Number"
                          className="w-full text-xs font-mono border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0000128"
                        className="w-full text-xs font-mono uppercase border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Account Type
                      </label>
                      <select
                        value={formData.accountType}
                        onChange={(e) => handleChange('accountType', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Current Account">Current Account (Business)</option>
                        <option value="Savings Account">Savings Account</option>
                        <option value="Overdraft / CC">Overdraft / Cash Credit (CC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Branch Name & City
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formData.branchName}
                          onChange={(e) => handleChange('branchName', e.target.value)}
                          placeholder="e.g. Indiranagar Branch, Bengaluru"
                          className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: WhatsApp Notifications */}
            {activeTab === 'NOTIFICATIONS' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp Notification Automations & Live QR Connector</h3>
                  <p className="text-xs text-slate-500">Auto-dispatch order updates, kitchen ETAs, and bills to diners without manual clicking</p>
                </div>

                {/* WhatsApp Auto-Sender Live QR Status Card */}
                <WhatsAppQrCard 
                  showToast={showToast} 
                  currentSlug={currentSlug}
                  currentPhone={formData.whatsappPhone || formData.phone}
                  onUpdatePhone={(val) => handleChange('whatsappPhone', val)}
                />

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">Enable WhatsApp Messaging Engine</p>
                      <p className="text-[11px] text-emerald-700">Send automated template alerts to customer mobile numbers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.whatsappEnabled}
                        onChange={(e) => handleChange('whatsappEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'orderAcceptAlert', label: 'Order Acceptance SMS / WhatsApp' },
                      { key: 'preparingAlert', label: 'Kitchen Preparing / ETA Alert' },
                      { key: 'readyAlert', label: 'Order Ready Notification' },
                      { key: 'paymentAlert', label: 'Bill / Payment Request Alert' },
                      { key: 'servedAlert', label: 'Dishes Served & Feedback Request' }
                    ].map(n => (
                      <div key={n.key} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <input
                          type="checkbox"
                          id={n.key}
                          checked={formData[n.key]}
                          onChange={(e) => handleChange(n.key, e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor={n.key} className="text-xs font-medium text-slate-700 cursor-pointer">
                          {n.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Preferences */}
            {activeTab === 'PREFERENCES' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Admin Panel Preferences</h3>
                  <p className="text-xs text-slate-500">Personalize dashboard timezone and localization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    >
                      <option>Asia/Kolkata (IST)</option>
                      <option>Asia/Dubai (GST)</option>
                      <option>UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">System Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleChange('language', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    >
                      <option>English (India)</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Auth Modal for Admin Settings Page */}
      <SecurityAuthModal
        isOpen={securityModal.isOpen}
        onClose={() => setSecurityModal((prev) => ({ ...prev, isOpen: false }))}
        onAuthorized={() => securityModal.onAuthorized && securityModal.onAuthorized()}
        actionTitle={securityModal.actionTitle}
        adminEmail={currentAdmin?.email || 'resturant1@gmail.com'}
        targetMobile={formData.whatsappPhone || formData.phone || '9876543210'}
        currentSlug={currentSlug}
      />
    </div>
  );
};

