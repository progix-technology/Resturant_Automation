import React, { useState, useEffect } from 'react';
import {
  Send,
  Phone,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RotateCcw,
  Clock,
  CheckCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useAdminData } from '../context/AdminDataContext';
import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

const RECENT_NOTIFS_KEY = 'restaurant_admin_manual_whatsapp_logs';

export const AdminNotificationsPage = () => {
  const { showToast, whatsappStatus, settings } = useAdminData();

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('order_ready');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recentLogs, setRecentLogs] = useState(() => {
    return storage.get(RECENT_NOTIFS_KEY, []);
  });

  const restaurantName = settings?.restaurantName || settings?.name || 'Spice Garden';
  const restaurantSlug = settings?.slug || 'spice-garden';

  // Preset Template Definitions
  const PRESET_TEMPLATES = {
    order_ready: {
      label: '🔔 Order Ready for Table / Pickup',
      category: 'Kitchen Status',
      generate: () =>
        `🍽️ *ORDER READY FOR SERVICE!* 🔔\n\nDear Guest,\nYour delicious freshly cooked meal at *${restaurantName}* is ready and hot! 👨‍🍳\n\nIt is being served to your table immediately. Enjoy your meal!\n\n_Need extra water, tissues, or condiments? Just ask our staff._`,
    },
    table_reserved: {
      label: '🍽️ Table Ready / Seating Confirmed',
      category: 'Reservation',
      generate: () =>
        `✨ *YOUR TABLE IS READY!* 🪑\n\nDear Guest,\nYour dining table at *${restaurantName}* has been sanitized and is ready for you.\n\nPlease show this message at the reception desk to be seated comfortably.\n\n📍 *${restaurantName}*\nWe look forward to serving you! 🙏`,
    },
    bill_payment: {
      label: '💳 Bill & UPI Payment Request',
      category: 'Billing',
      generate: () =>
        `🧾 *DINING BILL & PAYMENT INVOICE* 💳\n\nDear Guest,\nThank you for dining with us at *${restaurantName}*!\n\nYou can pay your bill instantly via UPI / Razorpay or at the counter.\n\n*UPI ID:* ${settings?.upiId || 'spicegarden@okhdfcbank'}\n\nHave a pleasant rest of your day! ✨`,
    },
    feedback_review: {
      label: '⭐ Google Review & Rating Request',
      category: 'Feedback',
      generate: () =>
        `🌟 *HOW WAS YOUR EXPERIENCE?* ⭐⭐⭐⭐⭐\n\nDear Valued Guest,\nThank you for dining at *${restaurantName}* today!\n\nIf you enjoyed your meal and our service, could you take 30 seconds to rate us 5 stars on Google? It means the world to our kitchen team!\n\n👉 *Review Link:* https://search.google.com/local/writereview\n\nThank you! 🙏`,
    },
    special_offer: {
      label: '🎁 Special Weekend Offer (20% Off)',
      category: 'Promotions',
      generate: () =>
        `🎉 *SPECIAL WEEKEND TREAT AT ${restaurantName.toUpperCase()}!* 🥳\n\nEnjoy an exclusive *20% FLAT DISCOUNT* on your next family dinner with us this week!\n\n🔥 Use Coupon Code: *FEAST20* at table checkout.\n\nReserve your table or order now:\n👉 ${window.location.origin}/menu/${restaurantSlug}\n\n_Valid till Sunday midnight. Terms apply._`,
    },
    greeting_welcome: {
      label: '👋 Welcome & Digital Menu Link',
      category: 'Welcome',
      generate: () =>
        `👋 *WELCOME TO ${restaurantName.toUpperCase()}!* 🍽️\n\nDear Guest,\nScan & browse our interactive contactless digital food menu on your phone:\n\n👉 *View Live Menu:* ${window.location.origin}/menu/${restaurantSlug}\n\nOrder your favorite starters and mains directly from your table! 👨‍🍳`,
    },
    custom: {
      label: '✍️ Custom Message (Blank Textarea)',
      category: 'Manual',
      generate: () => '',
    },
  };

  // Populate text on template select or initial mount
  useEffect(() => {
    const tpl = PRESET_TEMPLATES[selectedTemplateKey];
    if (tpl) {
      const generated = tpl.generate();
      if (generated) {
        setMessageText(generated);
      } else if (selectedTemplateKey === 'custom' && !messageText) {
        setMessageText('');
      }
    }
  }, [selectedTemplateKey, restaurantName, restaurantSlug]);

  const handleTemplateChange = (e) => {
    const key = e.target.value;
    setSelectedTemplateKey(key);
    const tpl = PRESET_TEMPLATES[key];
    if (tpl && key !== 'custom') {
      setMessageText(tpl.generate());
    }
  };

  const cleanRecipientNumber = (num) => {
    let digits = String(num || '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      digits = digits.slice(2);
    }
    return digits;
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const recipient = cleanRecipientNumber(mobileNumber);

    if (!recipient || recipient.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    if (!messageText.trim()) {
      showToast('Please enter a message to send', 'error');
      return;
    }

    setIsSending(true);
    try {
      // 1. Dispatch through Backend API
      const res = await apiRequest('/notifications/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          mobile: `91${recipient}`,
          customMessage: messageText.trim(),
          restaurantSlug,
          restaurantName,
        }),
      });

      const newLog = {
        id: `msg-${Date.now()}`,
        recipient,
        message: messageText.trim(),
        templateLabel: PRESET_TEMPLATES[selectedTemplateKey]?.label?.split(' ')[1] || 'Custom',
        status: res?.delivered !== false ? 'SENT' : 'PREPARED',
        sentAt: new Date().toISOString(),
      };

      const updatedLogs = [newLog, ...recentLogs].slice(0, 50);
      setRecentLogs(updatedLogs);
      storage.set(RECENT_NOTIFS_KEY, updatedLogs);

      showToast(`WhatsApp message dispatched to +91 ${recipient}!`, 'success');
    } catch (err) {
      console.warn('Backend send warning, opening WhatsApp direct fallback:', err);
      // Fallback: Open direct WhatsApp link
      const directUrl = `https://wa.me/91${recipient}?text=${encodeURIComponent(messageText.trim())}`;
      window.open(directUrl, '_blank');

      const newLog = {
        id: `msg-${Date.now()}`,
        recipient,
        message: messageText.trim(),
        templateLabel: 'Direct WhatsApp',
        status: 'SENT',
        sentAt: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...recentLogs].slice(0, 50);
      setRecentLogs(updatedLogs);
      storage.set(RECENT_NOTIFS_KEY, updatedLogs);

      showToast(`Opened WhatsApp chat for +91 ${recipient}`, 'success');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenDirectChat = () => {
    const recipient = cleanRecipientNumber(mobileNumber);
    if (!recipient || recipient.length < 10) {
      showToast('Please enter a 10-digit mobile number first', 'error');
      return;
    }
    const directUrl = `https://wa.me/91${recipient}?text=${encodeURIComponent(messageText.trim())}`;
    window.open(directUrl, '_blank');
  };

  const handleFillMobile = (num) => {
    setMobileNumber(cleanRecipientNumber(num));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <AdminPageHeader
        title="Manual WhatsApp Notifications"
        subtitle="Select a pre-configured message template or write a custom note to send directly to customer WhatsApp numbers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
            {/* Header with WhatsApp status badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Send WhatsApp Message
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dispatches real-time text via connected WhatsApp / Meta Gateway
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  whatsappStatus?.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    whatsappStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{whatsappStatus?.isConnected ? 'WhatsApp Active' : 'Smart Link Ready'}</span>
              </span>
            </div>

            {/* Recipient Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Customer Mobile Number</span>
                <span className="text-[10px] text-slate-400 font-medium">10 Digits (India +91)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 tracking-wider transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Quick Test:</span>
                {['9876543210', '9811223344', '9123456780'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleFillMobile(sample)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[10px] font-mono transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Select Message Template</span>
                <span className="text-[10px] text-slate-400 font-medium">Choose preset or custom</span>
              </label>
              <div className="relative">
                <select
                  value={selectedTemplateKey}
                  onChange={handleTemplateChange}
                  className="w-full h-11 px-3 pr-9 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 appearance-none transition-all cursor-pointer shadow-2xs"
                >
                  {Object.entries(PRESET_TEMPLATES).map(([key, tpl]) => (
                    <option key={key} value={key}>
                      {tpl.label} ({tpl.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Editable Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Message Content (Editable)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {messageText.length} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your WhatsApp message here..."
                className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800 font-mono leading-relaxed transition-all resize-y placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Tip: Use *bold* for emphasis and _italics_ for subtitles.</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                disabled={isSending || !mobileNumber || !messageText.trim()}
                onClick={handleSendMessage}
                className="w-full sm:flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending Message...' : `Send WhatsApp to +91 ${mobileNumber || '...'}`}</span>
              </button>

              <button
                type="button"
                disabled={!mobileNumber || !messageText.trim()}
                onClick={handleOpenDirectChat}
                className="w-full sm:w-auto h-11 px-4 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Open WhatsApp Web or mobile app directly with this text pre-filled"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in WhatsApp Web</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Bubble Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customer Mobile Preview</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">WhatsApp Bubble</span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="mt-4 rounded-xl bg-[#0b141a] p-4 border border-slate-800 shadow-inner min-h-[320px] flex flex-col justify-between">
              {/* WhatsApp chat top bar */}
              <div className="bg-[#202c33] rounded-lg px-3 py-2 flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  {restaurantName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{restaurantName}</p>
                  <p className="text-[9px] text-emerald-400">Official Business Account</p>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="bg-[#005c4b] text-emerald-50 text-xs p-3.5 rounded-2xl rounded-tr-xs shadow-md space-y-2 font-sans leading-relaxed max-w-[92%] ml-auto break-words whitespace-pre-wrap">
                <p>{messageText || 'Your message preview will appear here...'}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 pt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[9px] text-slate-500 bg-[#111b21] px-2.5 py-1 rounded-full">
                  🔒 End-to-end encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sent Messages History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Dispatched Manual Messages History
            </h3>
            <p className="text-xs text-slate-400">
              Messages dispatched from this console during current and past sessions
            </p>
          </div>
          {recentLogs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRecentLogs([]);
                storage.remove(RECENT_NOTIFS_KEY);
                showToast('Message history cleared', 'info');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Clear Log History
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Recipient Mobile</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Dispatched Message</th>
                <th className="py-2.5 px-3 text-right">Time</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No manual WhatsApp messages sent yet. Enter a mobile number above to dispatch an alert.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Sent</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      +91 {log.recipient}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {log.templateLabel || 'Manual'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNumber(log.recipient);
                          setMessageText(log.message);
                          showToast('Loaded into message box', 'info');
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reuse</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
