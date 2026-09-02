export interface EmailTemplatePayload {
  to: string;
  recipientName: string;
  subject: string;
  type: 'staff_welcome' | 'password_reset' | 'payment_reminder' | 'invoice_receipt' | 'session_confirmation';
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
      <div style="background-color: ${primaryColor}; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
          NEXUS INSTITUTE OF TECHNOLOGY
        </h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-family: sans-serif;">
          Edu-Business Operations &amp; Academic Management Portal
        </p>
      </div>
    `;

    const footer = `
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-family: sans-serif; font-size: 11px; color: #64748b;">
        <p style="margin: 0 0 4px 0;"><strong>Nexus Institute of Technology &amp; Management</strong></p>
        <p style="margin: 0 0 4px 0;">Plot 12, Victoria Island Innovation Hub, Lagos, Nigeria • RC-1849201 • TIN-29481029-0001</p>
        <p style="margin: 0;">This is an automated operational notification. For inquiries, contact <a href="mailto:support@nexus-institute.ng" style="color: ${primaryColor};">support@nexus-institute.ng</a>.</p>
      </div>
    `;

    let bodyContent = '';

    switch (payload.type) {
      case 'staff_welcome':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">Welcome to the Faculty &amp; Staff Team, ${payload.recipientName}!</h2>
            <p>Your institutional staff account has been provisioned on the <strong>Nexus CRM Portal</strong>.</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid ${accentColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Institutional Role:</strong> ${payload.data.roleTitle || 'Staff Member'}</p>
              <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Department:</strong> ${payload.data.department || 'Academic Affairs'}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Official Email:</strong> ${payload.to}</p>
            </div>

            <p>To access the CRM portal and configure your security credentials, please click the button below to set your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${payload.data.setupUrl || 'http://72.61.106.87/reset-password?email=' + encodeURIComponent(payload.to)}" 
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
            <p>We received a request to reset the password for your Nexus CRM account (<strong>${payload.to}</strong>).</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${payload.data.resetUrl || 'http://72.61.106.87/reset-password?email=' + encodeURIComponent(payload.to)}" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block;">
                Reset Account Password →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `;
        break;

      case 'payment_reminder':
        bodyContent = `
          <div style="padding: 32px 24px; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: #991b1b; margin-top: 0; font-size: 18px;">Payment Reminder: Outstanding Tuition Balance</h2>
            <p>Dear ${payload.recipientName},</p>
            <p>This is a formal notification from the Finance Office regarding your tuition installment for the <strong>${payload.data.program || 'Technology Program'}</strong>.</p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 13px;">Student Identification:</span>
                <strong style="font-family: monospace; color: #1e293b;">${payload.data.studentCode || 'STU-XXXX'}</strong>
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
              <p style="margin: 0;"><strong>Account Name:</strong> ${payload.data.accountName || 'Nexus Institute of Technology Ltd'}</p>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              Please include your Student ID (<strong>${payload.data.studentCode || 'STU-XXXX'}</strong>) in the payment reference. Once completed, upload your payment receipt to your student portal.
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

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                  <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Description</th>
                  <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${payload.data.program || 'Technology Program'} Full Tuition</td>
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
              <p style="margin: 0;"><strong>Session Compensation (₦):</strong> <span style="color: #166534; font-weight: bold;">₦${Number(payload.data.compensationAmount || 50000).toLocaleString()}</span></p>
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

    // Also send to backend API logger
    try {
      await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
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
