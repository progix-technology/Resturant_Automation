import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Send,
  MessageSquare,
  Sparkles,
  Phone,
  Clock,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { adminNotificationService } from '../services/adminNotificationService';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useAdminData } from '../context/AdminDataContext';

export const AdminNotificationsPage = () => {
  const { showToast } = useAdminData();
  const [templates, setTemplates] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [testMobile, setTestMobile] = useState('9876543210');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [tpls, logs] = await Promise.all([
        adminNotificationService.getTemplates(),
        adminNotificationService.getRecentNotifications(),
      ]);
      setTemplates(tpls);
      setRecentLogs(logs);
    };
    loadData();
  }, []);

  const handleSendTemplate = async (template) => {
    setIsSending(true);
    try {
      const variables = {
        customerName: 'Rahul Sharma',
        orderId: 'ORD-1042',
        tableNumber: '12',
        amount: '1,008',
        eta: '20',
      };

      const result = await adminNotificationService.sendWhatsAppTemplate(
        template.id,
        variables,
        testMobile
      );

      setRecentLogs((prev) => [result, ...prev]);
      showToast('WhatsApp notification queued & dispatched successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="WhatsApp Notifications & Automated Templates"
        subtitle="Manage transactional WhatsApp templates dispatched to customer mobile numbers during dining."
      />

      {/* Simulator Test Console */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive WhatsApp Dispatch Sandbox</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            Test and trigger any of the pre-configured WhatsApp templates below to preview how guest diners receive live updates.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
            <input
              type="tel"
              value={testMobile}
              onChange={(e) => setTestMobile(e.target.value)}
              placeholder="9876543210"
              className="w-full h-9 pl-9 pr-3 bg-emerald-900/80 border border-emerald-700/80 rounded-xl text-xs text-white placeholder:text-emerald-400 focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-emerald-300 font-semibold whitespace-nowrap">
            (Recipient Mobile)
          </span>
        </div>
      </div>

      {/* Templates Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Configured WhatsApp Templates ({templates.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-900">{tpl.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {tpl.category}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-mono leading-relaxed relative">
                  <p>{tpl.template}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tags:</span>
                  {tpl.variables.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendTemplate(tpl)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test to +91-{testMobile}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Dispatches Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Recently Dispatched WhatsApp Notifications
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Template</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Rendered Message</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No dispatches logged in this session yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {log.templateName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      +91 {log.recipient}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
