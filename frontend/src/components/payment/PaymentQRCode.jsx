import React, { useState, useEffect } from 'react';
import {
  Zap,
  CreditCard,
  QrCode,
  Wallet,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Smartphone,
  Landmark,
  Store,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { useSession } from '../../hooks/useSession';

export const PaymentQRCode = ({
  order,
  onPaymentSuccess,
  onNotDone,
  isLoading = false,
}) => {
  const { restaurant } = useSession();
  const [activeTab, setActiveTab] = useState('razorpay'); // 'razorpay' | 'qr' | 'counter'
  const [razorpayConfig, setRazorpayConfig] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [isSavingCounterPreference, setIsSavingCounterPreference] = useState(false);

  const orderId = order?.orderId || order?.id || 'ORD-0000';
  const amount = Number(order?.total || 0);
  const cleanSlug = (order?.restaurantSlug || restaurant?.slug || 'spice-garden')
    .toLowerCase()
    .trim()
    .replace(/^the-/, '')
    .replace(/_/g, '-');

  // Fetch live payment credentials
  useEffect(() => {
    let mounted = true;
    paymentService
      .getPaymentConfig(cleanSlug)
      .then((cfg) => {
        if (mounted && cfg.success) {
          setRazorpayConfig(cfg);
        }
      })
      .catch((e) => console.warn('Payment config error:', e));

    return () => {
      mounted = false;
    };
  }, [cleanSlug]);

  // Pre-load Razorpay checkout script
  useEffect(() => {
    paymentService.loadRazorpayScript();
  }, []);

  const isRazorpayActive = razorpayConfig?.isRazorpayEnabled && razorpayConfig?.keyId;
  const upiId = razorpayConfig?.upiId || restaurant?.upiId || 'spicegarden@okhdfcbank';
  const restName = razorpayConfig?.restaurantName || restaurant?.name || 'Restaurant';

  // UPI intent URI
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Bill_${orderId}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiUri)}`;

  // Razorpay Checkout Execution
  const handleRazorpayPayment = async () => {
    try {
      setIsPaying(true);
      setPaymentError(null);

      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 1. Create order on backend
      const rzOrderRes = await paymentService.createRazorpayOrder({
        orderId,
        amount,
        restaurantSlug: cleanSlug,
        customerName: order?.customerName || 'Valued Guest',
        customerMobile: order?.mobile || '',
      });

      if (!rzOrderRes || !rzOrderRes.success) {
        throw new Error(rzOrderRes?.message || 'Failed to initialize payment gateway');
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: rzOrderRes.keyId,
        amount: rzOrderRes.amount,
        currency: rzOrderRes.currency || 'INR',
        name: rzOrderRes.restaurantName || restName,
        description: `Order #${orderId} • Table ${order?.tableNumber}`,
        order_id: rzOrderRes.razorpayOrderId,
        prefill: {
          name: order?.customerName || '',
          contact: order?.mobile || '',
        },
        notes: {
          orderId,
          tableNumber: String(order?.tableNumber || ''),
          restaurantSlug: cleanSlug,
        },
        theme: {
          color: '#047857', // Emerald theme
        },
        handler: async function (response) {
          try {
            setIsPaying(true);
            const verifyRes = await paymentService.verifyPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              restaurantSlug: cleanSlug,
            });

            if (verifyRes && verifyRes.success) {
              if (onPaymentSuccess) {
                onPaymentSuccess(verifyRes.data);
              }
            } else {
              setPaymentError(verifyRes?.message || 'Signature verification failed');
            }
          } catch (vErr) {
            console.error('Verification error:', vErr);
            setPaymentError(vErr.message || 'Payment confirmation error');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay initialization failed:', err);
      setPaymentError(err.message || 'Payment could not be started');
      setIsPaying(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSelectPayAtCounter = async () => {
    setIsSavingCounterPreference(true);
    try {
      await orderService.updatePaymentPreference(orderId, 'CASH_AT_COUNTER');
      if (onNotDone) onNotDone();
    } catch (err) {
      console.warn('Counter preference error:', err);
      if (onNotDone) onNotDone();
    } finally {
      setIsSavingCounterPreference(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 1. BILL SUMMARY CARD */}
      <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Amount Payable
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(amount)}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Incl. Taxes)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Table {order?.tableNumber || '01'}
            </span>
            <p className="text-[11px] font-mono text-slate-400 mt-1">
              #{orderId}
            </p>
          </div>
        </div>

        {/* Collapsible Order Items Details */}
        <div>
          <button
            type="button"
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>{order?.items?.length || 0} Items Ordered</span>
            </span>
            {showItemDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showItemDetails && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-700 animate-fade-in">
              {(order?.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="truncate max-w-[220px]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                  </span>
                </div>
              ))}
              {order?.taxes > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>GST & Service Taxes</span>
                  <span>{formatCurrency(order.taxes)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error alert if payment failed */}
      {paymentError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="font-medium">{paymentError}</p>
        </div>
      )}

      {/* 2. PAYMENT METHODS SEGMENTED SELECTOR */}
      <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('razorpay')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'razorpay'
              ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Online Pay</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-slate-600" />
          <span>Scan UPI QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('counter')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'counter'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-slate-600" />
          <span>Pay at Counter</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {/* TAB A: 1-TAP RAZORPAY ONLINE CHECKOUT */}
      {activeTab === 'razorpay' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ⚡ Recommended & Instant
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
              Pay via Razorpay UPI / Cards
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Zero transaction fees. Instant confirmation sent to kitchen and table.
            </p>
          </div>

          {/* Big Action Button */}
          <button
            type="button"
            disabled={isPaying}
            onClick={handleRazorpayPayment}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Opening Payment Gateway...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>Pay {formatCurrency(amount)} Securely</span>
              </>
            )}
          </button>

          {/* Supported UPI & Card Icons */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Accepted Payment Apps & Cards
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-600 shadow-2xs">
                Google Pay
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-purple-600 shadow-2xs">
                PhonePe
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-cyan-600 shadow-2xs">
                Paytm
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                Credit / Debit Card
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-amber-700 shadow-2xs">
                NetBanking
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: DYNAMIC UPI QR SCANNER */}
      {activeTab === 'qr' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 animate-fade-in">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Scan & Pay with Any UPI App
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Open Google Pay, PhonePe, or Paytm on your phone to scan
            </p>
          </div>

          <div className="w-48 h-48 rounded-2xl p-2.5 bg-white border-2 border-slate-200 shadow-inner flex items-center justify-center">
            <img
              src={qrCodeUrl}
              alt={`UPI QR for ${formatCurrency(amount)}`}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="px-3 py-1 rounded-full bg-slate-900 text-amber-400 font-mono text-xs font-bold shadow-2xs">
            Exact Bill: {formatCurrency(amount)}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-mono font-bold text-slate-700">
              UPI: <span className="text-emerald-700">{upiId}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="text-xs font-bold text-brand-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedUpi ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB C: PAY AT COUNTER / CASH */}
      {activeTab === 'counter' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fade-in text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Pay Cash / Card at Counter
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You can settle your bill of <strong className="text-slate-900">{formatCurrency(amount)}</strong> at the restaurant reception desk after dining.
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>Table {order?.tableNumber || '01'} • Order #{orderId}</span>
            </p>
            <p className="text-[11px] text-amber-800">
              Our billing manager will print your tax invoice when you arrive at the counter.
            </p>
          </div>

          <button
            type="button"
            disabled={isSavingCounterPreference}
            onClick={handleSelectPayAtCounter}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>
              {isSavingCounterPreference
                ? 'Confirming...'
                : 'Confirm & View Order Tracker'}
            </span>
          </button>
        </div>
      )}

      {/* 4. SECURITY & TRUST FOOTER */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 py-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% Encrypted & Authenticated Dining Checkout</span>
      </div>
    </div>
  );
};
