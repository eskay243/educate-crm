import React, { useState, useMemo } from 'react';
import { useCRM, formatNaira } from '../context/CRMContext';
import { ExpenseStatus } from '../types/crm';

export interface BusinessExpensesPageProps {}

export const BusinessExpensesPage: React.FC<BusinessExpensesPageProps> = () => {
  const { expenses, updateExpenseStatus, openModal, globalSearch, settings, updateSettings, showToast, currentUser } = useCRM();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tableSearch, setTableSearch] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState<number>(settings.operatingBudget || 1500000);

  const isSuperAdminOrFinance = currentUser?.role === 'super_admin' || currentUser?.role === 'finance';

  const effectiveSearch = globalSearch || tableSearch;

  const categories = [
    'All',
    'Software & Tools',
    'Marketing & Ads',
    'Office & Ops',
    'Salaries & Stipends',
    'Hosting & Cloud',
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchesSearch =
        e.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.expenseCode.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.vendor.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        e.department.toLowerCase().includes(effectiveSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, effectiveSearch]);

  const totalSpend = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const pendingFunding = useMemo(() => 
    expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0), 
    [expenses]
  );
  const pendingCount = useMemo(() => expenses.filter(e => e.status === 'Pending').length, [expenses]);

  const approvedBudget = settings.operatingBudget || 1500000;
  const budgetUtilization = approvedBudget > 0 ? Math.min(100, Math.round((totalSpend / approvedBudget) * 100)) : 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ operatingBudget: Number(newBudgetValue) });
    setIsEditingBudget(false);
    showToast('Budget Updated', `Monthly approved operational budget set to ${formatNaira(Number(newBudgetValue))}.`, 'success');
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#DCFCE7] text-[#166534]';
      case 'Pending':
        return 'bg-[#FEF9C3] text-[#854D0E]';
      case 'In Review':
        return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'Rejected':
      case 'Flagged':
        return 'bg-[#FEE2E2] text-[#991B1B]';
      default:
        return 'bg-surface-container text-secondary';
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-display text-display font-bold text-on-surface mb-1">Business Expenses &amp; Budgets</h2>
          <p className="font-body-md text-body-md text-secondary">
            Track and manage Nigerian tech hub operational expenditures, department overhead, and budget limits.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => openModal('export-report')}
            className="h-10 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded flex items-center gap-2 hover:bg-surface-container-low transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => openModal('log-expense')}
            className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Bento Grid - 100% Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Total Expenses MTD */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-secondary">Total Expenses (MTD)</span>
            <span className="material-symbols-outlined text-outline">payments</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {formatNaira(totalSpend)}
            </div>
            <div className="font-body-sm text-body-sm text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">receipt_long</span>
              <span className="font-medium text-on-surface">{expenses.length}</span> recorded expense vouchers
            </div>
          </div>
        </div>

        {/* Pending Funding */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-secondary">Pending Verification</span>
            <span className="material-symbols-outlined text-outline">hourglass_empty</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {formatNaira(pendingFunding)}
            </div>
            <div className="font-body-sm text-body-sm text-secondary mt-1">
              <span className="text-secondary font-medium">
                {pendingCount} pending requests
              </span>
            </div>
          </div>
        </div>

        {/* Approved Budget Meter with Inline Edit */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-secondary">Approved Monthly Budget</span>
              {isSuperAdminOrFinance && (
                <button
                  onClick={() => setIsEditingBudget(!isEditingBudget)}
                  className="text-primary hover:text-primary-container text-[11px] font-bold underline cursor-pointer"
                >
                  {isEditingBudget ? 'Cancel' : 'Edit Limit'}
                </button>
              )}
            </div>
            <span className="material-symbols-outlined text-outline">account_balance</span>
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
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {formatNaira(approvedBudget)}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary font-data-tabular">
                    {budgetUtilization}% allocated
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${budgetUtilization >= 90 ? 'bg-error' : 'bg-primary'}`} 
                    style={{ width: `${budgetUtilization}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-secondary font-data-tabular">
                  <span>Spent: {formatNaira(totalSpend)}</span>
                  <span>Remaining: {formatNaira(Math.max(0, approvedBudget - totalSpend))}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs & Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-xs">
        {/* Category Filter Tabs */}
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright flex-wrap gap-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input 
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface border border-outline-variant text-body-sm focus:border-primary outline-none text-xs"
            />
          </div>
        </div>

        {/* Expenses Ledger Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-bold text-sm text-on-surface">No Expenses Recorded</h3>
                <p className="text-xs text-secondary">
                  {selectedCategory === 'All'
                    ? 'No operational business expenses or vendor receipts recorded yet.'
                    : `No expenses found in category "${selectedCategory}".`}
                </p>
              </div>
              <button
                onClick={() => openModal('log-expense')}
                className="px-4 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Log First Expense</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-secondary font-label-md">
                  <th className="px-stack-md py-3 font-semibold">Expense ID</th>
                  <th className="px-stack-md py-3 font-semibold">Description</th>
                  <th className="px-stack-md py-3 font-semibold">Category</th>
                  <th className="px-stack-md py-3 font-semibold">Date</th>
                  <th className="px-stack-md py-3 font-semibold">Vendor / Recipient</th>
                  <th className="px-stack-md py-3 font-semibold">Amount (₦)</th>
                  <th className="px-stack-md py-3 font-semibold">Status</th>
                  <th className="px-stack-md py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="font-data-tabular text-on-surface divide-y divide-outline-variant/60">
                {filteredExpenses.map((expense, index) => (
                  <tr 
                    key={expense.id}
                    className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}`}
                  >
                    <td className="px-stack-md py-3 font-data-tabular font-bold text-primary">
                      #{expense.expenseCode || `EXP-${index + 1000}`}
                    </td>
                    <td className="px-stack-md py-3 font-medium text-on-surface">
                      {expense.title}
                    </td>
                    <td className="px-stack-md py-3 text-secondary">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-semibold">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-stack-md py-3 text-secondary">{expense.date}</td>
                    <td className="px-stack-md py-3 font-medium">{expense.vendor}</td>
                    <td className="px-stack-md py-3 font-bold text-on-surface font-data-tabular">
                      {formatNaira(expense.amount)}
                    </td>
                    <td className="px-stack-md py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-stack-md py-3 text-right">
                      {isSuperAdminOrFinance ? (
                        <select
                          value={expense.status}
                          onChange={(e) => updateExpenseStatus(expense.id, e.target.value as ExpenseStatus)}
                          className="text-xs font-semibold px-2 py-1 rounded border border-outline-variant bg-surface outline-none cursor-pointer"
                        >
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="In Review">In Review</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className="text-secondary text-xs">{expense.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
