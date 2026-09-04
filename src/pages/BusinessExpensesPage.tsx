import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { Expense, ExpenseStatus } from '../types/crm';
import { RejectExpenseModal } from '../components/modals/RejectExpenseModal';

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
    currentUser 
  } = useCRM();

  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tableSearch, setTableSearch] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState<number>(settings.operatingBudget || 1500000);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedExpenseForReject, setSelectedExpenseForReject] = useState<Expense | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const showBudgetCardToUser = isSuperAdmin || (settings.showBudgetToStaff !== false);

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
        <div className="flex gap-3">
          <button 
            onClick={() => openModal('export-report')}
            className="h-10 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => openModal('log-expense')}
            className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_card</span>
            <span>+ Request Office Expense (OpEx)</span>
          </button>
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
                {isSuperAdmin && (
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
                        <span className="font-data-tabular font-bold text-primary block">
                          #{expense.expenseCode}
                        </span>
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
                        <p className="font-bold text-on-surface leading-snug">
                          {expense.title}
                        </p>
                        {expense.description && (
                          <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
                            {expense.description}
                          </p>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-semibold">
                          Dept: {expense.department}
                        </span>

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
                        {isSuperAdmin ? (
                          isAwaiting ? (
                            <div className="flex items-center justify-end gap-1.5">
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
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
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
                              </select>
                            </div>
                          )
                        ) : (
                          <div className="text-right">
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
      </div>

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
    </div>
  );
};
