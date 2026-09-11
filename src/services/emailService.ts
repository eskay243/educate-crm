import { EmailTemplateType } from '../types/crm';

export interface EmailTemplatePayload {
  to: string;
  recipientName: string;
  subject: string;
  type: EmailTemplateType;
  data: Record<string, any>;
}

export interface EmailDispatchLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  type: EmailTemplatePayload['type'];
  timestamp: string;
  status: 'Delivered' | 'Queued' | 'Failed' | 'Delivered (Sandbox)' | 'Delivered (Live SMTP)';
  previewHtml?: string;
  previewUrl?: string;
}

export class EmailService {
  private logs: EmailDispatchLog[] = [];

  generateHtml(payload: EmailTemplatePayload): string {
    const primaryColor = '#00236f';
    const accentColor = '#1e3a8a';
    const dateFormatted = new Date().toLocaleDateString('en-NG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const header = `
      <div style="background-color: ${primaryColor}; padding: 26px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 20px; margin-bottom: 8px;">
          <span style="color: #ffffff; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
            CODELAB EDUCARE LTD
          </span>
        </div>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
          Admissions &amp; Academic Enterprise Portal
        </h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-family: sans-serif;">
          Victoria Island Financial District &amp; Yaba Innovation Campus, Lagos
        </p>
      </div>
    `;

    const footer = `
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-family: sans-serif; font-size: 11px; color: #64748b;">
        <p style="margin: 0 0 4px 0;"><strong>CODELAB EDUCARE LTD</strong></p>
        <p style="margin: 0 0 4px 0;">Plot 14, Victoria Island Financial District, Lagos, Nigeria • RC-1849201 • TIN-29481029-0001</p>
        <p style="margin: 0;">For inquiries, contact the Admissions Directorate at <a href="mailto:admin@codelab.institute" style="color: ${primaryColor};">admin@codelab.institute</a>.</p>
      </div>
    `;

    let bodyContent = '';

    switch (payload.type) {
      case 'mentor_welcome':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bfdbfe; text-transform: uppercase; letter-spacing: 0.5px;">
                ✓ Faculty Mentor Onboarding &amp; Agreement
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Welcome to the Academic Faculty, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                ${payload.data.customWelcomeNote || 'We are thrilled to welcome you to CODELAB EDUCARE LTD as a distinguished faculty mentor.'}
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; font-size: 13px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                Mentor Profile &amp; Compensation Agreement
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Faculty Mentor ID:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${payload.data.mentorCode || 'MN-PROD'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Specialized Department:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.department || 'Technology & Engineering'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Assigned Courses:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${Array.isArray(payload.data.courses) ? payload.data.courses.join(', ') : (payload.data.courses || 'Full-Stack Software Engineering')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Compensation Agreement:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 700;">
                    ${payload.data.commissionRate || 37}% per Student Enrollment
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Disbursement Schedule:</td>
                  <td style="padding: 6px 0; color: #1e293b;">Monthly via Direct NIBSS Electronic Settlement</td>
                </tr>
              </table>
            </div>

            <h3 style="color: ${primaryColor}; font-size: 15px; margin: 24px 0 10px 0;">Faculty Responsibilities &amp; Next Steps:</h3>
            <ol style="padding-left: 20px; margin: 0 0 24px 0; font-size: 13px; color: #334155;">
              <li style="margin-bottom: 8px;"><strong>Portal Authentication:</strong> Sign in to your Faculty Operations portal using your registered email (<code>${payload.to}</code>) to view assigned mentees and live cohorts.</li>
              <li style="margin-bottom: 8px;"><strong>1-on-1 Mentorship Sessions:</strong> Log and verify coaching hours directly in the portal to credit your monthly honorarium disbursements.</li>
              <li style="margin-bottom: 8px;"><strong>Banking &amp; Settlement:</strong> Ensure your registered Nigerian bank settlement details are verified for automated payouts.</li>
            </ol>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.setupUrl || 'http://72.61.106.87/login?role=mentor&email=' + encodeURIComponent(payload.to)}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,35,111,0.2);">
                Access Faculty Portal →
              </a>
            </div>
          </div>
        `;
        break;

      case 'student_welcome':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                ✓ Official Admission Confirmed
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Congratulations &amp; Welcome, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                We are excited to welcome you to <strong>CODELAB EDUCARE LTD</strong>. Your student profile is officially enrolled and active.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; font-size: 13px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                Academic &amp; Enrollment Summary
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Student Matric ID:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${payload.data.studentCode || 'STU-PROD'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.program || 'Technology Track'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Cohort / Schedule:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.cohort || 'Executive Cohort'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Assigned Faculty Mentor:</td>
                  <td style="padding: 6px 0; color: #1e293b;"><strong>${payload.data.mentorName || 'Academic Mentor Pool'}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Tuition Billing Status:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 600;">
                    ${payload.data.paymentStatus || 'Verified / Active'}
                  </td>
                </tr>
              </table>
            </div>

            <h3 style="color: ${primaryColor}; font-size: 15px; margin: 24px 0 10px 0;">Onboarding Next Steps:</h3>
            <ol style="padding-left: 20px; margin: 0 0 24px 0; font-size: 13px; color: #334155;">
              <li style="margin-bottom: 8px;"><strong>Student Portal Access:</strong> Log in using your registered email address (<code>${payload.to}</code>) to review course syllabus and project assignments.</li>
              <li style="margin-bottom: 8px;"><strong>Faculty Orientation:</strong> Your mentor will contact you for your initial 1-on-1 cohort kickoff and environment configuration.</li>
              <li style="margin-bottom: 8px;"><strong>Learning Lab Access:</strong> If enrolled for hybrid on-site access, bring your Student ID (<strong>${payload.data.studentCode || 'STU-PROD'}</strong>) to the campus security desk.</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${payload.data.portalUrl || 'http://72.61.106.87/login?role=student&email=' + encodeURIComponent(payload.to)}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,35,111,0.2);">
                Launch Student Portal →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              If you have any questions or need assistance setting up your environment, reply directly to this email or reach the Admissions Office at <a href="mailto:admin@codelab.institute" style="color: ${primaryColor};">admin@codelab.institute</a>.
            </p>
          </div>
        `;
        break;

      case 'staff_welcome':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Welcome to the Faculty &amp; Staff Team, ${payload.recipientName}!</h2>
            <p>${payload.data.customWelcomeNote || 'Your institutional staff account has been provisioned on the CODELAB EDUCARE LTD CRM Portal.'}</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid ${accentColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Institutional Role:</strong> ${payload.data.roleTitle || 'Staff Member'}</p>
              <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Department:</strong> ${payload.data.department || 'Academic Affairs'}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Official Email:</strong> ${payload.to}</p>
            </div>

            <p>To access the CRM portal and configure your security credentials, please click the button below to set your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${payload.data.setupUrl || 'http://72.61.106.87/reset-password?role=' + encodeURIComponent(payload.data.role || '') + '&email=' + encodeURIComponent(payload.to)}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,35,111,0.2);">
                Set Your Password &amp; Activate Account →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              <em>Note: This activation link is secure and valid for 48 hours. If you did not expect this invitation, please contact your System Administrator immediately.</em>
            </p>
          </div>
        `;
        break;

      case 'password_reset':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
            <p>Hello ${payload.recipientName},</p>
            <p>${payload.data.securityNotice || `We received a request to reset the password for your CODELAB EDUCARE LTD account (${payload.to}).`}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${payload.data.resetUrl || 'http://72.61.106.87/reset-password?role=' + encodeURIComponent(payload.data.role || '') + '&email=' + encodeURIComponent(payload.to)}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Reset Account Password →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              This link will expire in <strong>${payload.data.resetExpiryHours || '24 hours'}</strong>. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        `;
        break;

      case 'payment_reminder':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: #991b1b; margin-top: 0; font-size: 18px;">Payment Reminder: Outstanding Tuition Balance</h2>
            <p>Dear ${payload.recipientName},</p>
            <p>${payload.data.paymentNotice || `This is a formal notification from the Finance Office regarding your tuition installment for the ${payload.data.program || 'Technology Program'}.`}</p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Student Identification:</span>
                <strong style="font-family: monospace; color: #1e293b;">${payload.data.studentCode || 'STU-XXXX'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Academic Program:</span>
                <strong style="color: #1e293b;">${payload.data.program || 'Technology Program'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Outstanding Balance:</span>
                <strong style="color: #991b1b; font-size: 16px;">₦${Number(payload.data.balance || 0).toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-size: 13px;">Installment Due Date:</span>
                <strong style="color: #1e293b;">${payload.data.dueDate || dateFormatted}</strong>
              </div>
            </div>

            <h3 style="color: ${primaryColor}; font-size: 14px; margin-bottom: 8px;">Official Settlement Bank Details (NIBSS / NUBAN):</h3>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 13px;">
              <p style="margin: 0 0 6px 0;"><strong>Bank Name:</strong> ${payload.data.bankName || 'Access Bank Nigeria PLC'}</p>
              <p style="margin: 0 0 6px 0;"><strong>Account Number (NUBAN):</strong> <span style="font-family: monospace; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${payload.data.accountNumber || '0812948192'}</span></p>
              <p style="margin: 0;"><strong>Account Name:</strong> ${payload.data.accountName || 'CODELAB EDUCARE LTD'}</p>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              Please include your Student ID (<strong>${payload.data.studentCode || 'STU-XXXX'}</strong>) in the payment transfer remarks.
            </p>
          </div>
        `;
        break;

      case 'invoice_receipt':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">
              <div>
                <h2 style="color: ${primaryColor}; margin: 0; font-size: 18px;">Official Tuition Invoice</h2>
                <span style="font-size: 12px; color: #64748b; font-family: monospace;">Invoice #${payload.data.invoiceNumber || 'INV-2026-001'}</span>
              </div>
              <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                ${payload.data.status || 'Paid'}
              </span>
            </div>

            <p>Billed to: <strong>${payload.recipientName}</strong> (${payload.to})</p>
            <p>Academic Program: <strong>${payload.data.program || 'Technology Track'}</strong></p>
            ${payload.data.invoiceNote ? `<p style="font-size: 13px; color: #475569;"><em>${payload.data.invoiceNote}</em></p>` : ''}

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                  <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Description</th>
                  <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${payload.data.program || 'Technology Program'} Tuition</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">₦${Number(payload.data.amount || 850000).toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td style="padding: 10px;">Total Amount:</td>
                  <td style="padding: 10px; text-align: right; color: ${primaryColor}; font-size: 15px; font-family: monospace;">₦${Number(payload.data.amount || 850000).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #f8fafc; padding: 12px; border-radius: 4px; font-size: 11px; color: #64748b;">
              <p style="margin: 0;">Payment Reference: <strong>${payload.data.paymentRef || 'NIBSS-TRX-8291048'}</strong> • NIBSS Settlement Bank: Access Bank Nigeria PLC</p>
            </div>
          </div>
        `;
        break;

      case 'session_confirmation':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">1-on-1 Mentorship Coaching Session Confirmed</h2>
            <p>Hello ${payload.recipientName},</p>
            <p>Your 1-on-1 technical coaching session has been scheduled and recorded in the academic portal.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Faculty Mentor:</strong> ${payload.data.mentorName || 'Dr. Arthur Pendelton'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Student / Mentee:</strong> ${payload.data.studentName || 'Student'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Topic:</strong> ${payload.data.topic || 'System Architecture Review'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${payload.data.durationHours || 2} Hours</p>
              <p style="margin: 0 0 8px 0;"><strong>Location / Link:</strong> ${payload.data.sessionLocation || 'Google Meet / Lagos Hub Lab 3'}</p>
              <p style="margin: 0;"><strong>Session Compensation (₦):</strong> <span style="color: #166534; font-weight: bold;">₦${Number(payload.data.compensationAmount || 50000).toLocaleString()}</span></p>
            </div>
          </div>
        `;
        break;

      case 'expense_approval_request':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #fde68a; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚠️ OpEx Approval Requisition Required
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Operating Expense Requisition Awaiting Review
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                A new operational expenditure request has been submitted and requires administrative review &amp; authorization.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; font-size: 13px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                Requisition Details
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition Code:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${payload.data.expenseCode || 'EXP-PENDING'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Title / Description:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.title || 'OpEx Request'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Requisition Amount:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; font-size: 16px;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Category &amp; Department:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.category || 'Operations'} (${payload.data.department || 'Operations'})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Requested By:</td>
                  <td style="padding: 6px 0; color: #1e293b;"><strong>${payload.data.requestedBy || 'Staff Member'}</strong> ${payload.data.requesterEmail ? `(${payload.data.requesterEmail})` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Vendor / Beneficiary:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.vendor || 'Corporate Vendor'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Urgency:</td>
                  <td style="padding: 6px 0;">
                    <span style="background-color: ${payload.data.urgency === 'Emergency' ? '#fee2e2' : payload.data.urgency === 'Urgent' ? '#ffedd5' : '#f1f5f9'}; color: ${payload.data.urgency === 'Emergency' ? '#b91c1c' : payload.data.urgency === 'Urgent' ? '#c2410c' : '#475569'}; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px;">
                      ${payload.data.urgency || 'Standard'}
                    </span>
                  </td>
                </tr>
                ${payload.data.receiptName ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Attached Proforma/Receipt:</td>
                  <td style="padding: 6px 0; color: #2563eb;">📎 ${payload.data.receiptName}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${payload.data.description ? `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e; border-radius: 4px;">
              <strong>Requester Justification / Notes:</strong><br/>
              ${payload.data.description}
            </div>
            ` : ''}

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.actionUrl || 'http://72.61.106.87/expenses'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,35,111,0.2);">
                Review &amp; Authorize Requisition →
              </a>
            </div>
          </div>
        `;
        break;

      case 'expense_approved':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                ✓ OpEx Expenditure Approved
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Your Requisition Has Been Approved!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                The Super Administration / Finance Controller has reviewed and approved your funding request.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition Code:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: ${primaryColor};">${payload.data.expenseCode || 'EXP-AUTH'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Title:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.title || 'Requisition'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Authorized Amount:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 16px;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Authorized By:</td>
                  <td style="padding: 6px 0; color: #1e293b;"><strong>${payload.data.reviewedBy || 'Executive Approver'}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Approval Date:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.reviewedAt || dateFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Disbursement Status:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 600;">Passed to Bursary for Fund Release</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.actionUrl || 'http://72.61.106.87/expenses'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                View In OpEx Ledger →
              </a>
            </div>
          </div>
        `;
        break;

      case 'expense_rejected':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #fef2f2; color: #dc2626; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #fecaca; text-transform: uppercase; letter-spacing: 0.5px;">
                ✕ Requisition Declined
              </span>
              <h2 style="color: #991b1b; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                OpEx Request Could Not Be Authorized
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Your operating expenditure requisition was reviewed and declined by the Approver.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Expense Requisition:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${payload.data.expenseCode || 'EXP-DECL'} - ${payload.data.title || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Amount:</td>
                  <td style="padding: 6px 0; font-weight: bold;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Reviewed By:</td>
                  <td style="padding: 6px 0;">${payload.data.reviewedBy || 'Executive Approver'}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 13px; text-transform: uppercase;">Reason for Decline / Reviewer Remarks:</h4>
              <p style="margin: 0; font-size: 13px; color: #7f1d1d;">
                ${payload.data.rejectionReason || 'Expense documentation incomplete or out of quarterly departmental budget scope. Please consult Finance.'}
              </p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.actionUrl || 'http://72.61.106.87/expenses'}" 
                 style="background-color: #475569; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Review in Portal &amp; Resubmit →
              </a>
            </div>
          </div>
        `;
        break;

      case 'mentor_commission_earned':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                🎉 37% Commission Share Credited
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                New Enrollment Commission Accrued, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                A student tuition payment has been verified. Your 37% revenue share commission has been credited to your faculty payout ledger.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Enrolled Student / Mentee:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.studentName || 'Mentee'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.program || 'Technology Track'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Student Tuition Paid:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: #475569;">₦${Number(payload.data.tuitionPaid || 0).toLocaleString()}</td>
                </tr>
                <tr style="background-color: #ecfdf5;">
                  <td style="padding: 8px; color: #065f46; font-weight: bold;">Your 37% Commission Share:</td>
                  <td style="padding: 8px; font-family: monospace; font-weight: 800; color: #047857; font-size: 16px;">+₦${Number(payload.data.commissionAmount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Pending Payout:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: ${primaryColor};">₦${Number(payload.data.newPendingPayout || 0).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              Commission will be disbursed directly to your verified Nigerian settlement account during the scheduled monthly NIBSS electronic transfer cycle.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.portalUrl || 'http://72.61.106.87/mentors'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                View Commission Ledger →
              </a>
            </div>
          </div>
        `;
        break;

      case 'mentor_payout_disbursed':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                💸 Payout Settlement Advice
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Faculty Honorarium Disbursed, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                The Finance Office has completed an electronic payout settlement to your verified Nigerian bank account.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; font-size: 13px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                Electronic Settlement Breakdown
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Disbursement Amount:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 18px;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Destination Bank:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.bankName || 'Nigerian Commercial Bank'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">NUBAN Account:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${payload.data.accountNumber || '••••••••••'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Payment Reference:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: #475569;">${payload.data.transferRef || 'PAY-NIBSS-TRF'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Settlement Date:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.date || dateFormatted}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.portalUrl || 'http://72.61.106.87/mentors'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                View Settlement History →
              </a>
            </div>
          </div>
        `;
        break;

      case 'lab_assignment_submitted':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ede9fe; color: #6d28d9; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #ddd6fe; text-transform: uppercase; letter-spacing: 0.5px;">
                📝 Lab Assignment Deliverable
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                New Assignment Awaiting Your Review, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Your mentee has submitted a technical assignment and requested faculty evaluation &amp; code review.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Student / Mentee:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: ${primaryColor};">${payload.data.studentName || 'Student'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Course / Module:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.courseTitle || 'Engineering Track'} — ${payload.data.moduleTitle || 'Module'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Task / Deliverable:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.taskTitle || 'Lab Project'}</td>
                </tr>
                ${payload.data.githubUrl ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">GitHub Repository:</td>
                  <td style="padding: 6px 0;"><a href="${payload.data.githubUrl}" style="color: #2563eb; font-weight: 600; text-decoration: underline;" target="_blank">${payload.data.githubUrl}</a></td>
                </tr>
                ` : ''}
                ${payload.data.liveUrl ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Live Demo Deployment:</td>
                  <td style="padding: 6px 0;"><a href="${payload.data.liveUrl}" style="color: #059669; font-weight: 600; text-decoration: underline;" target="_blank">${payload.data.liveUrl}</a></td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${payload.data.notes ? `
            <div style="background-color: #f1f5f9; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #334155;">
              <strong>Student Notes:</strong><br/>
              <em>"${payload.data.notes}"</em>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.reviewUrl || 'http://72.61.106.87/courses'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Evaluate &amp; Grade Submission →
              </a>
            </div>
          </div>
        `;
        break;

      case 'lab_assignment_graded':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                🎯 Academic Evaluation Complete
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Your Assignment Has Been Graded!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Your faculty mentor has reviewed your lab submission and provided performance feedback.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Task / Deliverable:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${payload.data.taskTitle || 'Lab Assignment'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Evaluation Status:</td>
                  <td style="padding: 6px 0;">
                    <strong style="color: ${payload.data.status === 'Needs Revision' ? '#dc2626' : '#166534'};">${payload.data.status || 'Passed'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Grade Score:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 18px; font-weight: 800; color: ${primaryColor};">${payload.data.grade || 100}%</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Evaluated By:</td>
                  <td style="padding: 6px 0; color: #1e293b;"><strong>${payload.data.reviewedBy || 'Faculty Mentor'}</strong></td>
                </tr>
              </table>
            </div>

            ${payload.data.mentorFeedback ? `
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 13px; text-transform: uppercase;">Faculty Mentor Feedback Remarks:</h4>
              <p style="margin: 0; font-size: 13px; color: #14532d;">
                ${payload.data.mentorFeedback}
              </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.portalUrl || 'http://72.61.106.87/student/courses'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Launch LMS &amp; Continue Syllabus →
              </a>
            </div>
          </div>
        `;
        break;

      case 'new_mentee_assigned':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bfdbfe; text-transform: uppercase; letter-spacing: 0.5px;">
                👥 New Mentee Assignment
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                New Student Assigned to Your Track, ${payload.recipientName}!
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Admissions has enrolled a new candidate into your academic mentorship pool.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Student Name:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${payload.data.studentName || 'Mentee'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Matric ID:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: ${primaryColor}; font-weight: bold;">${payload.data.studentCode || 'STU-PROD'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.program || 'Technology Program'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Cohort:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.cohort || 'Executive Cohort'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Student Email:</td>
                  <td style="padding: 6px 0; color: #2563eb;">${payload.data.studentEmail || 'student@example.com'}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.portalUrl || 'http://72.61.106.87/mentors'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Open Faculty Mentees Roster →
              </a>
            </div>
          </div>
        `;
        break;

      case 'proof_of_payment_alert':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #fde68a; text-transform: uppercase; letter-spacing: 0.5px;">
                📋 Offline Bank Transfer Verification
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Tuition Transfer Proof of Payment Received
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                A student has submitted a manual NIBSS bank transfer proof slip requiring Bursary verification.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Student:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${payload.data.studentName || 'Student'} (${payload.data.studentCode || ''})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Claimed Amount:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 16px;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Bank Reference / Remarks:</td>
                  <td style="padding: 6px 0; font-family: monospace;">${payload.data.bankRef || 'NIBSS-REF'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Proof Slip File:</td>
                  <td style="padding: 6px 0; color: #2563eb;">📎 ${payload.data.fileName || 'transfer_receipt.jpg'}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.actionUrl || 'http://72.61.106.87/invoices'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Verify Payment in Bursary →
              </a>
            </div>
          </div>
        `;
        break;

      case 'tuition_payment_alert':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                💰 Financial Audit Alert
              </span>
              <h2 style="color: ${primaryColor}; margin: 12px 0 6px 0; font-size: 20px; font-weight: 800;">
                Inbound Tuition Settlement Verified
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                A student tuition payment has been successfully cleared and recorded in the institutional ledger.
              </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Student:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${payload.data.studentName || 'Student'} (${payload.data.studentCode || ''})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Academic Track:</td>
                  <td style="padding: 6px 0; color: #1e293b;">${payload.data.program || 'Technology Program'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Settled Amount:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 800; font-size: 16px;">₦${Number(payload.data.amount || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Payment Gateway:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: ${primaryColor};">${payload.data.gateway || 'Paystack Direct Settlement'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Transaction Reference:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: #475569;">${payload.data.reference || 'TRX-REF'}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.data.actionUrl || 'http://72.61.106.87/invoices'}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                View Institutional Billing Ledger →
              </a>
            </div>
          </div>
        `;
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${payload.subject}</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
            ${header}
            ${bodyContent}
            ${footer}
          </div>
        </body>
      </html>
    `;
  }

  async sendEmail(payload: EmailTemplatePayload): Promise<EmailDispatchLog> {
    const html = this.generateHtml(payload);
    
    const logEntry: EmailDispatchLog = {
      id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: payload.to,
      recipientName: payload.recipientName,
      subject: payload.subject,
      type: payload.type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Delivered',
      previewHtml: html,
    };

    this.logs.unshift(logEntry);

    // Also send to backend API for live SMTP delivery
    try {
      await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          html,
          recipientName: payload.recipientName,
          type: payload.type,
          logEntry,
        }),
      });
    } catch (e) {
      console.warn('Backend email test endpoint offline, using local dispatch simulator.');
    }

    return logEntry;
  }

  getLogs(): EmailDispatchLog[] {
    return this.logs;
  }
}

export const emailService = new EmailService();
