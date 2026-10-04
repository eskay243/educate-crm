import React from 'react';

export type CrispStatusType = 
  | 'active' | 'approved' | 'paid' | 'completed' | 'enrolled' | 'online'
  | 'pending' | 'in_review' | 'awaiting_approval' | 'interested' | 'contacted'
  | 'on_hold' | 'warning' | 'caution'
  | 'in_progress' | 'special' | 'new' | 'vip'
  | 'rejected' | 'blocked' | 'critical' | 'overdue' | 'inactive' | 'closed'
  | 'not_started' | 'draft' | string;

interface CrispStatusBadgeProps {
  status: CrispStatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const CrispStatusBadge: React.FC<CrispStatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className = '',
}) => {
  const normalized = (status || '').toLowerCase().replace(/[\s-_]+/g, '_');
  const displayText = label || status;

  // Segment colors from Crisp Shared Foundation (Sampled directly from reference):
  // Sea Green: #41B57A (Bg: #E1F3E9, Text: #1C6B42)
  // Lemon Curry: #C3A108 (Bg: #FCFBED, Text: #755E03)
  // Ochre: #E07414 (Bg: #FEF4EC, Text: #8C4004)
  // Majorette Purple: #8F53F2 (Bg: #F1EDFE, Text: #5C25B8)
  // Critical: #E02020 (Bg: #FEE2E2, Text: #991B1B)
  // Slate: #64748B (Bg: #F4F7F8, Text: #414754)

  let dotColor = '#64748B';
  let textColor = '#414754';
  let bgColor = '#F4F7F8';

  if (['active', 'approved', 'paid', 'completed', 'enrolled', 'online', 'success'].includes(normalized)) {
    dotColor = '#41B57A';
    textColor = '#1C6B42';
    bgColor = '#E1F3E9';
  } else if (['on_hold', 'warning', 'caution', 'unpaid'].includes(normalized)) {
    dotColor = '#C3A108';
    textColor = '#755E03';
    bgColor = '#FCFBED';
  } else if (['pending', 'in_review', 'awaiting_approval', 'interested', 'contacted', 'lead'].includes(normalized)) {
    dotColor = '#E07414';
    textColor = '#8C4004';
    bgColor = '#FEF4EC';
  } else if (['in_progress', 'special', 'new', 'vip', 'mentor', 'staff'].includes(normalized)) {
    dotColor = '#8F53F2';
    textColor = '#5C25B8';
    bgColor = '#F1EDFE';
  } else if (['rejected', 'blocked', 'critical', 'overdue', 'inactive', 'failed', 'closed', 'lost'].includes(normalized)) {
    dotColor = '#E02020';
    textColor = '#991B1B';
    bgColor = '#FEE2E2';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide uppercase ${paddingClass} ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full shrink-0" 
        style={{ backgroundColor: dotColor }}
      />
      <span className="truncate">{displayText}</span>
    </span>
  );
};
