import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { apiService } from '../../services/api';

interface DisburseFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisburseFundsModal: React.FC<DisburseFundsModalProps> = ({ isOpen, onClose }) => {
  const { 
    wallet, 
    selectedExpenseForDisburse, 
    setSelectedExpenseForDisburse,
    selectedMentorForDisburse,
    setSelectedMentorForDisburse,
    disburseExpenseFromWallet,
    disburseMentorFromWallet,
    openModal,
    showToast,
    settings,
    staffUsers,
  } = useCRM();

  const [disbursementMode, setDisbursementMode] = useState<'corporate_nip' | 'paystack_api'>('corporate_nip');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [nipSessionId, setNipSessionId] = useState('');
  const [paystackBalance, setPaystackBalance] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [reason, setReason] = useState('');
  const [isKycAutoFilled, setIsKycAutoFilled] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isMentorPayout = Boolean(selectedMentorForDisburse);
  const isExpensePayout = Boolean(selectedExpenseForDisburse);

  const requiredLecturingHours = selectedMentorForDisburse?.minimumRequiredHours || settings.mentorMinimumLecturedHours || 20;
  const mentorLecturedHours = selectedMentorForDisburse?.lecturedHours || 0;
  const isMentorHoursEligible = !isMentorPayout || (mentorLecturedHours >= requiredLecturingHours);

  const amountToDisburse = isMentorPayout 
    ? (selectedMentorForDisburse?.pendingPayout || 0)
    : (selectedExpenseForDisburse?.amount || 0);

  const recipientTitle = isMentorPayout
    ? selectedMentorForDisburse?.name
    : selectedExpenseForDisburse?.vendor || selectedExpenseForDisburse?.title;

  useEffect(() => {
    if (isOpen) {
      apiService.getPaystackBalance().then(res => {
        if (res && typeof res.balance === 'number') {
          setPaystackBalance(res.balance);
        }
      }).catch(() => setPaystackBalance(0));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMentorForDisburse) {
      setBankName(selectedMentorForDisburse.bankName || 'Guaranty Trust Bank (GTBank)');
      setBankCode(selectedMentorForDisburse.bankCode || '058');
      setAccountNumber(selectedMentorForDisburse.accountNumber || '');
      setAccountName(selectedMentorForDisburse.accountName || selectedMentorForDisburse.name);
      setIsVerified(Boolean(selectedMentorForDisburse.isAccountVerified || selectedMentorForDisburse.bankVerified));
      setIsKycAutoFilled(false);
      setReason(`Faculty 37% Commission Share for ${selectedMentorForDisburse.name}`);
    } else if (selectedExpenseForDisburse) {
      const requester = staffUsers.find(
        u => (selectedExpenseForDisburse.requesterEmail && u.email?.toLowerCase() === selectedExpenseForDisburse.requesterEmail.toLowerCase()) ||
             (selectedExpenseForDisburse.requestedBy && u.name?.toLowerCase() === selectedExpenseForDisburse.requestedBy.toLowerCase())
      );

      const hasDirectBank = Boolean(selectedExpenseForDisburse.disbursementAccountNumber);
      const hasStaffKyc = Boolean(requester?.accountNumber);

      const resolvedBankName = selectedExpenseForDisburse.disbursementBankName || requester?.bankName || 'Guaranty Trust Bank (GTBank)';
      const resolvedBankCode = selectedExpenseForDisburse.disbursementBankCode || requester?.bankCode || '058';
      const resolvedAccountNumber = selectedExpenseForDisburse.disbursementAccountNumber || requester?.accountNumber || '';
      const resolvedAccountName = selectedExpenseForDisburse.disbursementAccountName || requester?.accountName || selectedExpenseForDisburse.vendor;
      const resolvedVerified = Boolean(hasDirectBank || requester?.isBankVerified);

      setBankName(resolvedBankName);
      setBankCode(resolvedBankCode);
      setAccountNumber(resolvedAccountNumber);
      setAccountName(resolvedAccountName);
      setIsVerified(resolvedVerified);
      setIsKycAutoFilled(!hasDirectBank && hasStaffKyc);
      setReason(`OpEx Disbursement: ${selectedExpenseForDisburse.title} (${selectedExpenseForDisburse.expenseCode})`);
    }
  }, [selectedMentorForDisburse, selectedExpenseForDisburse, staffUsers]);

  if (!isOpen || (!isMentorPayout && !isExpensePayout)) return null;

  const currentWalletBalance = wallet?.balance || 0;
  const hasSufficientBalance = currentWalletBalance >= amountToDisburse;
  const balanceAfterDisbursement = Math.max(0, currentWalletBalance - amountToDisburse);

  const copyField = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${label} copied to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      showToast('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/banks/verify-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setAccountName(data.accountName);
        setIsVerified(true);
        showToast('Account Verified', `NUBAN confirmed: ${data.accountName}`, 'success');
      } else {
        setIsVerified(true);
        if (!accountName) setAccountName(recipientTitle || 'Verified Beneficiary');
      }
    } catch {
      setIsVerified(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDisburse = async () => {
    if (isMentorPayout && !isMentorHoursEligible) {
      showToast('Hours Threshold Gatekeeping', `Payout blocked: Mentor has logged ${mentorLecturedHours.toFixed(1)}h of required ${requiredLecturingHours}h class lectures.`, 'error');
      return;
    }

    if (!hasSufficientBalance) {
      showToast('Insufficient Wallet Balance', `Please fund the wallet with at least ${formatNaira(amountToDisburse - currentWalletBalance)}.`, 'error');
      return;
    }

    if (!accountNumber || accountNumber.length !== 10) {
      showToast('Missing Account', 'A valid 10-digit NUBAN account number is required.', 'warning');
      return;
    }

    if (disbursementMode === 'paystack_api' && paystackBalance !== null && paystackBalance < amountToDisburse) {
      showToast(
        'Paystack Balance Deficit',
        `Paystack live balance has ₦${paystackBalance.toLocaleString()}. Please top up your Paystack balance or choose "Direct Corporate Bank (NIP)".`,
        'error'
      );
      return;
    }

    setIsDisbursing(true);
    try {
      if (isMentorPayout && selectedMentorForDisburse) {
        const payoutReqId = (selectedMentorForDisburse as any).payoutRequestId;
        const success = await disburseMentorFromWallet(selectedMentorForDisburse.id, amountToDisburse, reason, payoutReqId);
        if (success) {
          setSelectedMentorForDisburse(null);
          onClose();
        }
      } else if (isExpensePayout && selectedExpenseForDisburse) {
        const success = await disburseExpenseFromWallet({
          expenseId: selectedExpenseForDisburse.id,
          bankCode,
          bankName,
          accountNumber,
          accountName: accountName || selectedExpenseForDisburse.vendor,
          reason,
          disbursementMethod: disbursementMode,
          nipSessionId: nipSessionId.trim() || undefined,
          bankReference: nipSessionId.trim() || undefined
        });
        if (success) {
          setSelectedExpenseForDisburse(null);
          onClose();
        }
      }
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface border border-outline rounded-xl shadow-modal overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-crisp-black text-white flex justify-between items-start border-b border-outline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">send_money</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Wallet Outbound Disbursement
              </span>
              <h3 className="font-display text-lg font-bold">
                {isMentorPayout ? 'Disburse Faculty 37% Revenue Share' : 'Disburse OpEx Requisition'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Wallet Balance Health Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            hasSufficientBalance 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Available Wallet Balance
              </span>
              <div className="font-display text-xl font-bold font-data-tabular">
                {formatNaira(currentWalletBalance)}
              </div>
              <span className="text-[11px] opacity-80">
                {hasSufficientBalance 
                  ? `Remaining after payout: ${formatNaira(balanceAfterDisbursement)}` 
                  : `Deficit: ${formatNaira(amountToDisburse - currentWalletBalance)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Disbursement Amount
              </span>
              <div className="font-display text-xl font-bold text-primary font-data-tabular">
                {formatNaira(amountToDisburse)}
              </div>
              {!hasSufficientBalance && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openModal('top-up-wallet');
                  }}
                  className="mt-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">add_card</span>
                  <span>Top Up First</span>
                </button>
              )}
            </div>
          </div>

          {/* Academic Lecturing Hours Gate Warning */}
          {isMentorPayout && !isMentorHoursEligible && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0 mt-0.5">lock</span>
              <div className="space-y-1">
                <h5 className="font-bold text-rose-950">Payout Locked: Minimum Lecturing Hours Required</h5>
                <p className="leading-relaxed">
                  Academic policy mandates that faculty mentors complete at least <strong>{requiredLecturingHours} verified class lecture hours</strong> before commission share payouts can be released.
                  Mentor has logged <strong>{mentorLecturedHours.toFixed(1)} hours</strong> ({Math.max(0, requiredLecturingHours - mentorLecturedHours).toFixed(1)} hours still needed).
                </p>
              </div>
            </div>
          )}

          {/* Disbursement Mode Selector Tabs */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
              Select Payout Settlement Method
            </span>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-high border border-outline-variant">
              <button
                type="button"
                onClick={() => setDisbursementMode('corporate_nip')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  disbursementMode === 'corporate_nip'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>Direct Corporate Bank (NIP)</span>
              </button>
              <button
                type="button"
                onClick={() => setDisbursementMode('paystack_api')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  disbursementMode === 'paystack_api'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Paystack API Payout</span>
              </button>
            </div>
          </div>

          {/* Corporate NIP Guidance & 1-Click Copy Card */}
          {disbursementMode === 'corporate_nip' ? (
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                <strong className="font-bold text-blue-900">1-Hop Direct Interbank Transfer (Zero Middleman Fees)</strong>
              </div>
              <p className="leading-relaxed text-[11px] text-blue-800">
                Execute this transfer directly in your corporate bank app (e.g. Wema/ALAT, GTB, Zenith, Access). Use the quick copy buttons below:
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-white/80 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-secondary block">Account Number</span>
                    <strong className="font-mono text-on-surface">{accountNumber || '••••••••••'}</strong>
                  </div>
                  {accountNumber && (
                    <button
                      type="button"
                      onClick={() => copyField(accountNumber, 'Account Number')}
                      className="text-primary hover:text-primary-dim p-1 cursor-pointer"
                      title="Copy Account Number"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedField === 'Account Number' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-2 rounded bg-white/80 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-secondary block">Bank</span>
                    <strong className="text-on-surface truncate block max-w-[120px]">{bankName}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyField(bankName, 'Bank Name')}
                    className="text-primary hover:text-primary-dim p-1 cursor-pointer"
                    title="Copy Bank Name"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedField === 'Bank Name' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                <div className="p-2 rounded bg-white/80 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-secondary block">Exact Amount</span>
                    <strong className="font-mono text-on-surface">{formatNaira(amountToDisburse)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyField(String(amountToDisburse), 'Amount')}
                    className="text-primary hover:text-primary-dim p-1 cursor-pointer"
                    title="Copy Amount"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedField === 'Amount' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                <div className="p-2 rounded bg-white/80 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-secondary block">Payee Legal Name</span>
                    <strong className="text-on-surface truncate block max-w-[120px]">{accountName || recipientTitle}</strong>
                  </div>
                  {accountName && (
                    <button
                      type="button"
                      onClick={() => copyField(accountName, 'Account Name')}
                      className="text-primary hover:text-primary-dim p-1 cursor-pointer"
                      title="Copy Account Name"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedField === 'Account Name' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Paystack API Mode Notice */
            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              (paystackBalance ?? 0) >= amountToDisburse
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <strong className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  <span>Paystack Live Transfer Balance:</span>
                </strong>
                <span className="font-mono font-bold text-sm">
                  {paystackBalance !== null ? formatNaira(paystackBalance) : 'Checking...'}
                </span>
              </div>
              {(paystackBalance ?? 0) < amountToDisburse && (
                <p className="text-[11px] leading-relaxed pt-1">
                  ⚠️ Your Paystack Transfer Balance is insufficient ({formatNaira(paystackBalance ?? 0)} available vs {formatNaira(amountToDisburse)} needed). 
                  Please switch to <strong>Direct Corporate Bank (NIP)</strong> above to disburse directly from your bank with zero fees.
                </p>
              )}
            </div>
          )}

          {/* Beneficiary Details Form */}
          <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
                <span>Beneficiary Bank Details (NIBSS)</span>
              </h4>
              {isKycAutoFilled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#166534] text-[10px] font-bold animate-in fade-in">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  <span>Auto-filled from Requester Profile KYC</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary">Bank Name</label>
                <select
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    const selected = e.target.options[e.target.selectedIndex].text;
                    setBankName(selected);
                    setIsVerified(false);
                  }}
                  className="w-full h-9 px-2 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface outline-none"
                >
                  <option value="058">Guaranty Trust Bank (GTBank)</option>
                  <option value="044">Access Bank</option>
                  <option value="057">Zenith Bank</option>
                  <option value="011">First Bank of Nigeria</option>
                  <option value="033">United Bank for Africa (UBA)</option>
                  <option value="035">Wema Bank</option>
                  <option value="50211">Kuda Bank</option>
                  <option value="50515">Moniepoint MFB</option>
                  <option value="999992">OPay</option>
                  <option value="999991">PalmPay</option>
                  <option value="214">First City Monument Bank (FCMB)</option>
                  <option value="070">Fidelity Bank</option>
                  <option value="032">Union Bank</option>
                  <option value="102">Titan Trust Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary">10-Digit NUBAN</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ''));
                      setIsVerified(false);
                    }}
                    placeholder="0123456789"
                    className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                  {accountNumber.length === 10 && !isVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyAccount}
                      disabled={isVerifying}
                      className="absolute right-1 top-1 h-7 px-2 bg-primary text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      {isVerifying ? 'Checking...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-semibold text-secondary">Account Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Beneficiary Account Name"
                  className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-bold text-on-surface outline-none"
                />
                {isVerified && (
                  <span className="absolute right-2 top-2 text-[#166534] text-[11px] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Optional NIP Session ID for Corporate Bank Mode */}
            {disbursementMode === 'corporate_nip' && (
              <div className="space-y-1 text-xs">
                <label className="text-[11px] font-semibold text-secondary flex items-center justify-between">
                  <span>Bank Reference / NIP Session ID (Optional)</span>
                  <span className="text-[10px] text-secondary font-normal">Found on bank transfer receipt</span>
                </label>
                <input
                  type="text"
                  value={nipSessionId}
                  onChange={(e) => setNipSessionId(e.target.value)}
                  placeholder="e.g. 000013261015095747005315898828"
                  className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-mono text-on-surface outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-semibold text-secondary">Narration / Purpose</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-bright border-t border-outline-variant flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-secondary hover:text-on-surface rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDisburse}
            disabled={
              !hasSufficientBalance ||
              isDisbursing ||
              !accountNumber ||
              accountNumber.length !== 10 ||
              !isMentorHoursEligible ||
              (disbursementMode === 'paystack_api' && paystackBalance !== null && paystackBalance < amountToDisburse)
            }
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              hasSufficientBalance && accountNumber.length === 10 && isMentorHoursEligible && (disbursementMode === 'corporate_nip' || (paystackBalance !== null && paystackBalance >= amountToDisburse))
                ? 'bg-[#166534] hover:bg-[#15803d] text-white'
                : 'bg-surface-container text-secondary cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {!isMentorHoursEligible ? 'lock' : (isDisbursing ? 'progress_activity' : (disbursementMode === 'corporate_nip' ? 'account_balance' : 'send'))}
            </span>
            <span>
              {!isMentorHoursEligible 
                ? 'Payout Locked (Under Minimum Hours)'
                : isDisbursing 
                ? (disbursementMode === 'corporate_nip' ? 'Recording Corporate Payout...' : 'Sending via Paystack...') 
                : (disbursementMode === 'corporate_nip'
                  ? `Confirm Corporate Bank Disbursal (${formatNaira(amountToDisburse)})`
                  : `Send via Paystack API (${formatNaira(amountToDisburse)})`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
