import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { Expense, ExpenseStatus, WalletTransaction } from '../types/crm';
import { RejectExpenseModal } from '../components/modals/RejectExpenseModal';
import { ViewExpenseModal } from '../components/modals/ViewExpenseModal';
import { WalletTransactionDetailsModal } from '../components/modals/WalletTransactionDetailsModal';

export interface BusinessExpensesPageProps {}

export const BusinessExpensesPage: React.FC<BusinessExpensesPageProps> = () => {
  const { 
    expenses, 
    updateExpenseStatus, 
    approveExpense, 
    rejectExpense, 
    openModal, 
    globalSearch, 
    settings, 
    updateSettings, 
    showToast, 
    currentUser,
    wallet,
    setSelectedExpenseForDisburse,
    generateVirtualAccount,
    reconcileWalletWithPaystack,
    isSyncingWallet
  } = useCRM();

  const [activeLedgerView, setActiveLedgerView] = useState<'expenses' | 'wallet_ledger'>('expenses');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tableSearch, setTableSearch] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState<number>(settings.operatingBudget || 1500000);
  const [copiedNuban, setCopiedNuban] = useState(false);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedExpenseForReject, setSelectedExpenseForReject] = useState<Expense | null>(null);

  // View Requisition Dossier modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<Expense | null>(null);

  // Wallet Transaction Audit Details modal state
  const [selectedWalletTx, setSelectedWalletTx] = useState<WalletTransaction | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isFinance = currentUser?.role === 'finance';
  const canApproveExpenses = isSuperAdmin || isFinance;
  const canManageBudget = isSuperAdmin || isFinance;
  const showBudgetCardToUser = canManageBudget || (settings.showBudgetToStaff !== false);

  const effectiveSearch = globalSearch || tableSearch;

  const categories = [
    'All',
    'Office & Ops',
    'Marketing & Ads',
    'Facilities',
    'Software & Tools',
    'Salaries & Stipends',
    'Hosting & Cloud',
    'Equipment',
  ];

  // Approved vs Pending Spends
  const approvedExpenses = useMemo(() => 
    expenses.filter(e => e.status === 'Approved' || e.status === 'Paid'), 
    [expenses]
  );
  const approvedSpend = useMemo(() => 
    approvedExpenses.reduce((acc, curr) => acc + curr.amount, 0), 
    [approvedExpenses]
  );

  const pendingExpenses = useMemo(() => 
    expenses.filter(e => e.status === 'Awaiting Approval' || e.status === 'Pending' || e.status === 'In Review'), 
    [expenses]
  );
  const pendingFunding = useMemo(() => 
    pendingExpenses.reduce((acc, curr) => acc + curr.amount, 0), 
    [pendingExpenses]
  );
  const pendingCount = pendingExpenses.length;

  const approvedBudget = settings.operatingBudget || 1500000;
  const budgetUtilization = approvedBudget > 0 ? Math.min(100, Math.round((approvedSpend / approvedBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, approvedBudget - approvedSpend);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchesStatus = 
        selectedStatus === 'All' ? true :
        selectedStatus === 'Awaiting Approval' ? (e.status === 'Awaiting Approval' || e.status === 'Pending' || e.status === 'In Review') :
        e.status === selectedStatus;

      const matchesSearch =
        e.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.expenseCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.vendor.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.department.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (e.requestedBy && e.requestedBy.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
        (e.rejectionReason && e.rejectionReason.toLowerCase().includes(effectiveSearch.toLowerCase()));

      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [expenses, selectedCategory, selectedStatus, effectiveSearch]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ operatingBudget: Number(newBudgetValue) });
    setIsEditingBudget(false);
    showToast('Budget Updated', `Monthly approved operational budget set to ${formatNaira(Number(newBudgetValue))}.`, 'success');
  };

  const toggleStaffBudgetVisibility = () => {
    const currentVal = settings.showBudgetToStaff !== false;
    updateSettings({ showBudgetToStaff: !currentVal });
    showToast(
      'Staff Budget Visibility Changed', 
      !currentVal ? 'Staff members can now view the approved budget & deductions.' : 'Budget visibility is now restricted to Super Admin only.',
      'info'
    );
  };

  const handleOpenRejectModal = (expense: Expense) => {
    setSelectedExpenseForReject(expense);
    setRejectModalOpen(true);
  };

  const handleOpenViewModal = (expense: Expense) => {
    setSelectedExpenseForView(expense);
    setViewModalOpen(true);
  };

  const currentViewingExpense = useMemo(() => {
    if (!selectedExpenseForView) return null;
    return expenses.find(e => e.id === selectedExpenseForView.id) || selectedExpenseForView;
  }, [expenses, selectedExpenseForView]);

  const handleConfirmReject = (id: string, reason: string) => {
    rejectExpense(id, reason);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return 'bg-[#DCFCE7] text-[#166534] border border-[#166534]/20';
      case 'Awaiting Approval':
      case 'Pending':
      case 'In Review':
        return 'bg-[#FEF9C3] text-[#854D0E] border border-[#854D0E]/20';
      case 'Rejected':
      case 'Flagged':
        return 'bg-[#FEE2E2] text-[#991B1B] border border-[#991B1B]/20';
      default:
        return 'bg-surface-container text-secondary';
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-display font-bold text-on-surface">Office Expenses (OpEx) &amp; Budgets</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-md text-xs font-bold">
              Requisition Workflow
            </span>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Request operational funds, track monthly budget deductions, and review pending approval requisitions.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={reconcileWalletWithPaystack}
            disabled={isSyncingWallet}
            className="h-10 px-3.5 bg-blue-600/90 hover:bg-blue-600 text-white font-label-md text-label-md font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Force real-time reconciliation with live Paystack account"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncingWallet ? 'animate-spin' : ''}`}>sync</span>
            <span>{isSyncingWallet ? 'Syncing...' : 'Sync with Paystack'}</span>
          </button>
          <button 
            onClick={() => openModal('top-up-wallet')}
            className="h-10 px-4 bg-[#166534] hover:bg-[#15803d] text-white font-label-md text-label-md font-bold rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>+ Fund Expense Wallet</span>
          </button>
          <button 
            onClick={() => openModal('export-report')}
            className="h-10 px-3.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg flex items-center gap-1.5 hover:bg-surface-container-low transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => openModal('log-expense')}
            className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_card</span>
            <span>+ Request OpEx Requisition</span>
          </button>
        </div>
      </div>

      {/* Operational Expense & Budget Wallet Hero Card */}
      <div className="bg-gradient-to-br from-[#00174a] via-[#00236f] to-[#04328c] text-white rounded-2xl p-6 shadow-md border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Wallet Liquid Balance */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operational Expense &amp; Budget Wallet
              </span>
              <span className="text-white/60 text-xs">• Paystack NIBSS</span>
            </div>

            <div>
              <span className="text-white/70 text-xs font-medium">Available Liquid Balance</span>
              <div className="font-display text-3xl sm:text-4xl font-bold font-data-tabular text-white tracking-tight flex items-baseline gap-2 mt-0.5">
                <span>{formatNaira(wallet?.balance || 0)}</span>
                <span className="text-xs text-emerald-300 font-sans font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                  Liquid Funds
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-0.5 text-xs text-white/80 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="text-white/50">Total Inflows Funded:</span> 
                <strong className="text-emerald-300 font-data-tabular">{formatNaira(wallet?.totalInflow ?? wallet?.balance ?? 0)}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-white/50">Total Outflows:</span> 
                <strong className="text-white font-data-tabular">{formatNaira(wallet?.totalOutflow || 0)}</strong>
              </span>
            </div>

            <p className="text-white/75 text-xs max-w-md">
              All approved office expenses, hardware procurements, and faculty mentor 37% revenue shares are disbursed directly from this wallet.
            </p>

            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => openModal('top-up-wallet')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_card</span>
                <span>Top Up Wallet</span>
              </button>

              <button
                type="button"
                onClick={reconcileWalletWithPaystack}
                disabled={isSyncingWallet}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isSyncingWallet ? 'animate-spin' : ''}`}>sync</span>
                <span>{isSyncingWallet ? 'Syncing...' : 'Sync Paystack'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLedgerView(activeLedgerView === 'wallet_ledger' ? 'expenses' : 'wallet_ledger')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>{activeLedgerView === 'wallet_ledger' ? 'View Requisitions Ledger' : 'View Wallet Audit Ledger'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dedicated Virtual Account (NUBAN) Card */}
          <div className="lg:col-span-6 bg-white/10 backdrop-blur-md rounded-xl p-4.5 border border-white/15 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                  Dedicated Inflow Virtual Account (DVA)
                </span>
                <div className="font-semibold text-sm text-white flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                  <span>{wallet?.virtualAccount?.bankName || 'Wema Bank (Paystack DVA)'}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                Auto-Credit 24/7
              </span>
            </div>

            {wallet?.virtualAccount ? (
              <>
                <div className="bg-black/25 rounded-lg p-3 flex items-center justify-between border border-white/10">
                  <div>
                    <span className="text-[10px] text-white/70 block">NUBAN Account Number</span>
                    <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-emerald-300 font-data-tabular">
                      {wallet.virtualAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!wallet.virtualAccount?.accountNumber) return;
                      navigator.clipboard.writeText(wallet.virtualAccount.accountNumber);
                      setCopiedNuban(true);
                      showToast('NUBAN Copied', `${wallet.virtualAccount.accountNumber} copied to clipboard.`, 'info');
                      setTimeout(() => setCopiedNuban(false), 2000);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      copiedNuban ? 'bg-emerald-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedNuban ? 'done' : 'content_copy'}
                    </span>
                    <span>{copiedNuban ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px] text-white/80 pt-0.5">
                  <span>Beneficiary: <strong className="text-white font-medium">{wallet.virtualAccount.accountName}</strong></span>
                  <span className="text-white/60">Any Nigerian Bank App via NIP</span>
                </div>
              </>
            ) : (
              <div className="py-3 text-center space-y-2">
                <p className="text-xs text-white/80">No dedicated virtual account created yet.</p>
                <button
                  type="button"
                  onClick={() => generateVirtualAccount()}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Generate Dedicated NUBAN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Card 1: Approved OpEx Spend (Deducted from Budget) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-wider text-[11px]">
              Approved OpEx Spend (MTD)
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-on-surface font-data-tabular">
              {formatNaira(approvedSpend)}
            </div>
            <div className="font-body-sm text-xs text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#166534]">check_circle</span>
              <span className="font-bold text-on-surface">{approvedExpenses.length}</span> approved requisitions deducted from budget
            </div>
          </div>
        </div>

        {/* Card 2: Pending Verification (OpEx Pipeline) */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Awaiting Approval' ? 'All' : 'Awaiting Approval')}
          className={`bg-surface-container-lowest border rounded-xl p-stack-md flex flex-col justify-between shadow-xs cursor-pointer transition-all hover:border-primary/50 ${
            selectedStatus === 'Awaiting Approval' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-outline-variant'
          }`}
          title="Click to filter table by pending approval requests"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider text-[11px]">
                Pending Verification
              </span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FEF9C3] text-[#854D0E] text-[10px] font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#854D0E] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-[#854D0E] font-data-tabular">
              {formatNaira(pendingFunding)}
            </div>
            <div className="font-body-sm text-xs text-secondary mt-1 flex items-center justify-between">
              <span>{pendingCount} requisitions awaiting review</span>
              <span className="text-primary text-[11px] font-bold hover:underline">
                {selectedStatus === 'Awaiting Approval' ? 'Show All' : 'Filter View →'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Approved Monthly Operating Budget */}
        {showBudgetCardToUser ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-0.5">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider text-[11px]">
                  Approved Monthly Budget
                </span>
                {canManageBudget && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => setIsEditingBudget(!isEditingBudget)}
                      className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      {isEditingBudget ? 'Cancel' : 'Edit Limit'}
                    </button>
                    <span className="text-secondary text-[10px]">•</span>
                    <button
                      onClick={toggleStaffBudgetVisibility}
                      className="text-secondary hover:text-on-surface text-[10px] font-medium cursor-pointer flex items-center gap-0.5"
                      title="Toggle whether Admissions & Finance staff can view the budget"
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {settings.showBudgetToStaff !== false ? 'visibility' : 'visibility_off'}
                      </span>
                      <span>{settings.showBudgetToStaff !== false ? 'Staff View: ON' : 'Staff View: OFF'}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
              </div>
            </div>

            <div>
              {isEditingBudget ? (
                <form onSubmit={handleSaveBudget} className="space-y-2 mb-2 animate-in fade-in">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-secondary">₦</span>
                    <input
                      type="number"
                      step="50000"
                      min="100000"
                      value={newBudgetValue}
                      onChange={e => setNewBudgetValue(Number(e.target.value))}
                      className="w-full h-8 pl-7 pr-2 rounded bg-surface border border-primary text-xs font-bold outline-none font-data-tabular"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-primary text-on-primary text-[11px] font-bold rounded shadow-xs cursor-pointer"
                    >
                      Save Budget
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(false)}
                      className="px-2 py-1 text-secondary text-[11px] rounded border border-outline-variant cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-display text-2xl font-bold text-on-surface font-data-tabular">
                      {formatNaira(approvedBudget)}
                    </span>
                    <span className="font-body-sm text-xs text-secondary font-data-tabular">
                      {budgetUtilization}% allocated
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        budgetUtilization >= 90 ? 'bg-error' : budgetUtilization >= 75 ? 'bg-[#ca8a04]' : 'bg-primary'
                      }`} 
                      style={{ width: `${budgetUtilization}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-secondary font-data-tabular">
                    <span>Deducted: <strong className="text-on-surface">{formatNaira(approvedSpend)}</strong></span>
                    <span>Remaining: <strong className="text-[#166534]">{formatNaira(remainingBudget)}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Locked budget card when staff visibility is turned off */
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider text-[11px]">
                Approved Monthly Budget
              </span>
              <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
            </div>
            <div className="py-2">
              <div className="text-sm font-bold text-secondary">
                Confidential Allocation
              </div>
              <p className="text-[11px] text-secondary mt-1">
                Monthly budget limits &amp; global utilization are managed centrally by the Super Admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Requisitions Ledger */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-xs">
        {/* Primary View Switcher: OpEx Requisitions vs Wallet Transactions */}
        <div className="px-stack-md pt-stack-md border-b border-outline-variant flex items-center gap-2 bg-surface-container-low">
          <button
            type="button"
            onClick={() => setActiveLedgerView('expenses')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeLedgerView === 'expenses'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">receipt_long</span>
            <span>OpEx Requisitions Ledger ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLedgerView('wallet_ledger')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeLedgerView === 'wallet_ledger'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
            <span>Wallet Transactions &amp; Audit Trail ({wallet?.transactions?.length || 0})</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-data-tabular">
              {formatNaira(wallet?.balance || 0)}
            </span>
          </button>
        </div>

        {activeLedgerView === 'expenses' ? (
          <>
            {/* Filter Navigation Bar */}
            <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-3">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mr-1">Status:</span>
                {[
                  { id: 'All', label: 'All Records' },
                  { id: 'Awaiting Approval', label: 'Awaiting Approval', count: pendingCount },
                  { id: 'Approved', label: 'Approved' },
                  { id: 'Rejected', label: 'Rejected' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedStatus === tab.id
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        selectedStatus === tab.id ? 'bg-white text-primary' : 'bg-[#FEF9C3] text-[#854D0E]'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}

                <div className="h-5 w-[1px] bg-outline-variant mx-1 hidden sm:block" />

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input 
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search requisitions, items, notes..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface border border-outline-variant text-body-sm focus:border-primary outline-none text-xs"
            />
          </div>
        </div>

        {/* Expenses Ledger Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">payments</span>
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-bold text-sm text-on-surface">No Requisitions Found</h3>
                <p className="text-xs text-secondary">
                  {selectedStatus === 'Awaiting Approval'
                    ? 'All OpEx requisitions have been processed. No pending approvals.'
                    : selectedStatus !== 'All'
                    ? `No expenses found with status "${selectedStatus}".`
                    : 'No operational office expenses recorded yet.'}
                </p>
              </div>
              <button
                onClick={() => openModal('log-expense')}
                className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Request Office Expense</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px] text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                  <th className="px-stack-md py-3 font-semibold">Requisition Code</th>
                  <th className="px-stack-md py-3 font-semibold">Item Purpose &amp; Feedback</th>
                  <th className="px-stack-md py-3 font-semibold">Category</th>
                  <th className="px-stack-md py-3 font-semibold">Requested By</th>
                  <th className="px-stack-md py-3 font-semibold">Vendor / Payee</th>
                  <th className="px-stack-md py-3 font-semibold">Amount (₦)</th>
                  <th className="px-stack-md py-3 font-semibold">Status</th>
                  <th className="px-stack-md py-3 text-right font-semibold">Governance Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredExpenses.map((expense, index) => {
                  const isAwaiting = expense.status === 'Awaiting Approval' || expense.status === 'Pending' || expense.status === 'In Review';
                  const isApproved = expense.status === 'Approved' || expense.status === 'Paid';
                  const isRejected = expense.status === 'Rejected';

                  return (
                    <tr 
                      key={expense.id}
                      className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}`}
                    >
                      {/* Requisition ID & Urgency */}
                      <td className="px-stack-md py-3 align-top">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(expense)}
                          className="font-data-tabular font-bold text-primary hover:underline block text-left cursor-pointer"
                          title="Click to view full requisition details and attachments"
                        >
                          #{expense.expenseCode}
                        </button>
                        <span className="text-[10px] text-secondary font-data-tabular block">
                          {expense.date}
                        </span>
                        {expense.urgency && expense.urgency !== 'Standard' && (
                          <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            expense.urgency === 'Emergency' ? 'bg-error text-white' : 'bg-[#FEF9C3] text-[#854D0E]'
                          }`}>
                            {expense.urgency}
                          </span>
                        )}
                      </td>

                      {/* Description, Dept & Rejection Reason */}
                      <td className="px-stack-md py-3 align-top max-w-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(expense)}
                          className="font-bold text-on-surface hover:text-primary transition-colors text-left leading-snug cursor-pointer block"
                          title="Click to view full requisition details and attachments"
                        >
                          {expense.title}
                        </button>
                        {expense.description && (
                          <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
                            {expense.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-block px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-semibold">
                            Dept: {expense.department}
                          </span>
                          {Boolean(expense.receiptUrl || expense.receiptName) && (
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(expense)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold border border-primary/20 cursor-pointer transition-colors"
                              title="Click to inspect attached receipt or quotation"
                            >
                              <span className="material-symbols-outlined text-[13px]">attachment</span>
                              <span>Attached Doc</span>
                            </button>
                          )}
                        </div>

                        {/* Side Note / Rejection Reason Badge */}
                        {isRejected && expense.rejectionReason && (
                          <div className="mt-2 p-2 rounded bg-[#FEE2E2]/60 border border-error/30 text-[11px] text-[#991B1B] space-y-0.5">
                            <div className="flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              <span>Rejection Note from Super Admin:</span>
                            </div>
                            <p className="italic">"{expense.rejectionReason}"</p>
                            {expense.reviewedBy && (
                              <p className="text-[9px] text-[#991B1B]/80 pt-0.5">
                                Reviewed by: {expense.reviewedBy} {expense.reviewedAt && `on ${expense.reviewedAt}`}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Approval note */}
                        {isApproved && expense.reviewedBy && (
                          <div className="mt-1 text-[10px] text-[#166534] font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Approved by {expense.reviewedBy} (Deducted from budget)</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-stack-md py-3 align-top text-secondary">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-semibold whitespace-nowrap">
                          {expense.category}
                        </span>
                      </td>

                      {/* Requested By */}
                      <td className="px-stack-md py-3 align-top">
                        <div className="font-medium text-on-surface">
                          {expense.requestedBy || 'Admissions / Finance'}
                        </div>
                        <span className="text-[10px] text-secondary">Staff Requisition</span>
                      </td>

                      {/* Vendor */}
                      <td className="px-stack-md py-3 align-top">
                        <div className="font-medium text-on-surface">{expense.vendor}</div>
                        <span className="text-[10px] text-secondary">{expense.paymentMethod}</span>
                      </td>

                      {/* Amount */}
                      <td className="px-stack-md py-3 align-top font-bold text-on-surface font-data-tabular text-sm whitespace-nowrap">
                        {formatNaira(expense.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-stack-md py-3 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(expense.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{expense.status}</span>
                        </span>
                      </td>

                      {/* Governance Decision (Approve / Reject) */}
                      <td className="px-stack-md py-3 align-top text-right whitespace-nowrap">
                        {canApproveExpenses ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(expense)}
                              className="h-8 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 border border-outline-variant transition-all cursor-pointer shadow-2xs"
                              title="Inspect full requisition details and attached document"
                            >
                              <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                              <span>View</span>
                            </button>

                            {/* Disburse from Wallet button for Approved expenses */}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExpenseForDisburse(expense);
                                  openModal('disburse-expense');
                                }}
                                className="h-8 px-2.5 rounded bg-[#166534] hover:bg-[#15803d] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                title="Disburse approved funds directly to recipient bank account from Expense Wallet via NIBSS"
                              >
                                <span className="material-symbols-outlined text-[15px]">send_money</span>
                                <span>Disburse</span>
                              </button>
                            )}

                            {isAwaiting ? (
                              <>
                                <button
                                  onClick={() => approveExpense(expense.id)}
                                  className="h-8 px-2.5 rounded bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#166534] text-xs font-bold flex items-center gap-1 border border-[#166534]/30 transition-all cursor-pointer shadow-2xs"
                                  title="Approve funds release and deduct from approved monthly budget"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(expense)}
                                  className="h-8 px-2.5 rounded bg-[#FEE2E2] hover:bg-[#fecaca] text-[#991B1B] text-xs font-bold flex items-center gap-1 border border-[#991B1B]/30 transition-all cursor-pointer shadow-2xs"
                                  title="Reject this requisition with a required feedback side note"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <select
                                value={expense.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as ExpenseStatus;
                                  if (newStatus === 'Rejected') {
                                    handleOpenRejectModal(expense);
                                  } else if (newStatus === 'Approved') {
                                    approveExpense(expense.id);
                                  } else {
                                    updateExpenseStatus(expense.id, newStatus);
                                  }
                                }}
                                className="text-xs font-semibold px-2 py-1 rounded-lg border border-outline-variant bg-surface outline-none cursor-pointer"
                              >
                                <option value="Approved">Approved</option>
                                <option value="Awaiting Approval">Awaiting Approval</option>
                                <option value="Rejected">Rejected</option>
                                <option value="In Review">In Review</option>
                                <option value="Paid">Paid</option>
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(expense)}
                              className="h-7 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 border border-outline-variant transition-all cursor-pointer shadow-2xs"
                              title="View requisition dossier and documents"
                            >
                              <span className="material-symbols-outlined text-[15px] text-primary">visibility</span>
                              <span>View</span>
                            </button>
                            {isAwaiting ? (
                              <span className="text-[11px] text-[#854D0E] font-semibold bg-[#FEF9C3] px-2 py-1 rounded">
                                Awaiting Admin Review
                              </span>
                            ) : isApproved ? (
                              <span className="text-[11px] text-[#166534] font-semibold bg-[#DCFCE7] px-2 py-1 rounded">
                                Funds Released
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#991B1B] font-semibold bg-[#FEE2E2] px-2 py-1 rounded">
                                Requisition Closed
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    ) : (
      /* Wallet Transactions & Audit Ledger Table */
      <div className="overflow-x-auto">
        {(!wallet?.transactions || wallet.transactions.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="font-bold text-sm text-on-surface">No Wallet Transactions Yet</h3>
              <p className="text-xs text-secondary">
                Inbound NUBAN bank deposits, card top-ups, OpEx disbursements, and mentor payouts will appear here in chronological order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openModal('top-up-wallet')}
              className="px-4 h-9 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_card</span>
              <span>Fund Expense Wallet</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface text-secondary uppercase font-label-md text-[11px] tracking-wider font-semibold">
                <th className="px-stack-md py-3">Date &amp; Time</th>
                <th className="px-stack-md py-3">Category &amp; Event</th>
                <th className="px-stack-md py-3">Reference / NIP</th>
                <th className="px-stack-md py-3">Beneficiary / Depositor</th>
                <th className="px-stack-md py-3 text-right">Inflow / Outflow</th>
                <th className="px-stack-md py-3 text-right">Balance After</th>
                <th className="px-stack-md py-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {wallet.transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-stack-md py-3 align-top whitespace-nowrap text-xs text-secondary font-mono">
                      {new Date(tx.timestamp).toLocaleString('en-NG', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="px-stack-md py-3 align-top">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {isCredit ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-on-surface">
                            {tx.category === 'dva_bank_deposit' ? 'Dedicated NUBAN Bank Deposit' :
                             tx.category === 'card_topup' ? 'In-App Online Top-Up (Paystack Pop)' :
                             tx.category === 'mentor_payout' ? 'Faculty 37% Revenue Share' :
                             tx.category === 'expense_payout' ? 'OpEx Requisition Disbursement' :
                             'Wallet Adjustment'}
                          </div>
                          <span className="text-[11px] text-secondary">{tx.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-stack-md py-3 align-top whitespace-nowrap">
                      <span className="font-mono text-xs text-secondary font-medium bg-surface-container px-2 py-0.5 rounded">
                        {tx.reference}
                      </span>
                    </td>
                    <td className="px-stack-md py-3 align-top text-xs">
                      {tx.recipientName ? (
                        <div>
                          <div className="flex items-center gap-1">
                            <strong className="text-on-surface block font-semibold">{tx.recipientName}</strong>
                            <span className="material-symbols-outlined text-[14px] text-emerald-600" title="Account Holder Verified via NIBSS">verified</span>
                          </div>
                          <span className="text-[11px] text-secondary">
                            {tx.recipientBank ? `${tx.recipientBank} (${tx.recipientAccountNumber || ''})` : 'Disbursed Payee'}
                          </span>
                        </div>
                      ) : isCredit ? (
                        <div>
                          <strong className="text-on-surface block font-semibold">
                            {tx.senderName || tx.initiatedBy || 'Inbound Bank Depositor'}
                          </strong>
                          <span className="text-[11px] text-secondary flex items-center gap-1">
                            <span>{tx.senderBank || 'Wema Dedicated NUBAN'}</span>
                            {tx.senderAccountNumber && (
                              <span className="font-mono text-[10px] bg-surface-container px-1 py-0.5 rounded">
                                {tx.senderAccountNumber.includes('X') || tx.senderAccountNumber.includes('•') 
                                  ? tx.senderAccountNumber 
                                  : `•••• ${tx.senderAccountNumber.slice(-4)}`}
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-secondary">{tx.initiatedBy || 'Executive Treasury'}</span>
                      )}
                    </td>
                    <td className={`px-stack-md py-3 align-top text-right whitespace-nowrap font-bold text-sm font-data-tabular ${
                      isCredit ? 'text-[#166534]' : 'text-red-700'
                    }`}>
                      {isCredit ? `+${formatNaira(tx.amount)}` : `-${formatNaira(tx.amount)}`}
                    </td>
                    <td className="px-stack-md py-3 align-top text-right whitespace-nowrap font-semibold text-xs font-data-tabular text-on-surface">
                      {formatNaira(tx.balanceAfter)}
                    </td>
                    <td className="px-stack-md py-3 align-top text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedWalletTx(tx)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        <span>Audit Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    )}
  </div>

      {/* View Expense Requisition Dossier Modal */}
      <ViewExpenseModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedExpenseForView(null);
        }}
        expense={currentViewingExpense}
        isSuperAdmin={isSuperAdmin}
        onApprove={(id) => {
          approveExpense(id);
        }}
        onReject={(exp) => {
          handleOpenRejectModal(exp);
        }}
      />

      {/* Reject Expense Side Note Modal */}
      <RejectExpenseModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedExpenseForReject(null);
        }}
        expense={selectedExpenseForReject}
        onConfirmReject={handleConfirmReject}
      />

      {/* Wallet Transaction Verification & Audit Slip Modal */}
      <WalletTransactionDetailsModal
        isOpen={Boolean(selectedWalletTx)}
        onClose={() => setSelectedWalletTx(null)}
        transaction={selectedWalletTx}
      />
    </div>
  );
};
