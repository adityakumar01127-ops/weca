"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PayoutRequest } from "@/lib/types";
import { WC_TO_INR_RATE, WC_TO_USD_RATE } from "@/lib/credits";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Building2,
  Send,
  UserCheck,
  Eye,
  Lock,
  ArrowLeft
} from "lucide-react";

export default function AdminPayoutsPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "completed" | "rejected">("pending");
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [actionModal, setActionModal] = useState<"approve" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPayouts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/payouts");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load admin payouts");
      }
      setPayouts(data.payouts || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionModal) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/payouts/${selectedRequest.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal,
          notes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${actionModal} payout request`);
      }

      setSuccessMsg(`Request #${selectedRequest.id.slice(0, 8)} successfully ${actionModal === "approve" ? "approved and processed" : "rejected (credits refunded)"}!`);
      setActionModal(null);
      setSelectedRequest(null);
      setActionNotes("");
      await fetchPayouts();

      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered requests
  const filteredPayouts = payouts.filter((p) => {
    if (filter === "pending") return p.status === "pending";
    if (filter === "flagged") return p.flagged_suspicious && p.status === "pending";
    if (filter === "completed") return p.status === "approved" || p.status === "paid";
    if (filter === "rejected") return p.status === "rejected";
    return true;
  });

  // Metrics
  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const flaggedCount = payouts.filter((p) => p.flagged_suspicious && p.status === "pending").length;
  const paidCount = payouts.filter((p) => p.status === "paid" || p.status === "approved").length;
  const totalVolumeWC = payouts.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wallet</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 text-violet border border-violet/20 text-xs font-mono mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Weca Phase 4 Admin View</span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                Payout Review Desk
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
                Human-in-the-loop authorization desk. Inspect abuse guards and approve or reject cash-out requests.
              </p>
            </div>

            <button
              onClick={fetchPayouts}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Pending Review</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-amber-400">{pendingCount}</span>
              <span className="text-[10px] text-zinc-500">requests</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Abuse Flagged</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-red-400">{flaggedCount}</span>
              <span className="text-[10px] text-red-400/80">requires check</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Approved & Paid</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-emerald-400">{paidCount}</span>
              <span className="text-[10px] text-zinc-500">settled</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Total Cash-Out Volume</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-white">{totalVolumeWC.toLocaleString()}</span>
              <span className="text-[10px] text-cyan font-bold">WC</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto text-xs font-mono">
          {(
            [
              { id: "pending", label: `Pending Review (${pendingCount})` },
              { id: "flagged", label: `Abuse Flagged (${flaggedCount})` },
              { id: "completed", label: `Completed (${paidCount})` },
              { id: "rejected", label: "Rejected" },
              { id: "all", label: `All Requests (${payouts.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === t.id
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
              <span>Loading payout requests queue...</span>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              No payout requests match the selected &quot;{filter}&quot; filter.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80 font-mono text-xs">
              {filteredPayouts.map((p) => {
                const userHandle = p.user?.username || `user_${p.user_id.slice(0, 6)}`;
                const hasAbuseFlags = p.flagged_suspicious || (p.suspicion_reasons && p.suspicion_reasons.length > 0);

                return (
                  <div key={p.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                    {/* Left: User & Amount info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">@{userHandle}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px]">
                          Req #{p.id.slice(0, 8)}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {new Date(p.requested_at).toLocaleDateString()} {new Date(p.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-cyan">{p.amount} WC</span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-sm font-bold text-emerald-400">₹{(p.amount * WC_TO_INR_RATE).toFixed(0)} INR</span>
                        <span className="text-zinc-500 text-[10px]">(${(p.amount * WC_TO_USD_RATE).toFixed(2)} USD)</span>
                      </div>

                      <div className="text-zinc-400 text-[11px] flex items-center gap-2">
                        <span className="text-zinc-500">Destination:</span>
                        <strong className="text-zinc-200 uppercase">{p.payout_details.method}</strong>
                        <span>({p.payout_details.name})</span>
                        <span className="text-zinc-500">|</span>
                        <span>{p.payout_details.method === "upi" ? p.payout_details.upi_id : `Acc: ${p.payout_details.account_number} • IFSC: ${p.payout_details.ifsc}`}</span>
                      </div>

                      {/* Abuse Guard Status Banner */}
                      {hasAbuseFlags ? (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] space-y-1 max-w-xl">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Abuse Guard Flagged (Risk Score: {p.risk_score}/100)</span>
                          </div>
                          <ul className="list-disc list-inside text-[10px] space-y-0.5 text-red-300/90 pl-1">
                            {p.suspicion_reasons.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Abuse Guards Passed (Risk: {p.risk_score}/100)</span>
                        </div>
                      )}

                      {p.admin_notes && (
                        <div className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                          Admin Note: {p.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions / Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      {p.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(p);
                              setActionNotes("");
                              setActionModal("approve");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Pay</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(p);
                              setActionNotes("");
                              setActionModal("reject");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject & Refund</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`px-3 py-1.5 rounded-full font-bold text-xs border ${
                            p.status === "paid" || p.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}
                        >
                          {p.status === "paid"
                            ? "Paid via RazorpayX"
                            : p.status === "approved"
                            ? "Approved"
                            : "Rejected (Refunded)"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ACTION CONFIRMATION MODAL */}
      {actionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-base text-white">
                {actionModal === "approve" ? "Approve Payout Request" : "Reject Payout Request"}
              </h3>
              <button
                onClick={() => {
                  setActionModal(null);
                  setSelectedRequest(null);
                }}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">Recipient:</span>
                <span className="text-white font-bold">{selectedRequest.payout_details.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount:</span>
                <span className="text-cyan font-bold">{selectedRequest.amount} WC (₹{(selectedRequest.amount * WC_TO_INR_RATE).toFixed(0)} INR)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Channel:</span>
                <span className="text-zinc-300 uppercase">{selectedRequest.payout_details.method}</span>
              </div>
              {selectedRequest.flagged_suspicious && (
                <div className="pt-2 text-red-400 text-[10px] border-t border-zinc-800">
                  ⚠️ Note: Request was flagged by anti-sybil abuse guards. Proceed with caution.
                </div>
              )}
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="text-zinc-400 block mb-1">
                  {actionModal === "approve" ? "Admin Audit Note (Optional)" : "Rejection Reason (Refund Notice to User)"}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionModal === "approve"
                      ? "e.g. Identity verified, legitimate observational posts."
                      : "e.g. Ineligible: account failed anti-sybil cluster verification."
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600"
                  required={actionModal === "reject"}
                />
              </div>

              {actionModal === "reject" && (
                <p className="text-[11px] text-amber-400/90 leading-relaxed">
                  Rejecting will automatically refund {selectedRequest.amount} WC back to the user&apos;s balance and log a refund audit row in credit_transactions.
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionModal(null);
                    setSelectedRequest(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-1/2 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    actionModal === "approve"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : actionModal === "approve" ? (
                    "Authorize & Pay"
                  ) : (
                    "Reject & Refund"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
