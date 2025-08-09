import sgMail from '@sendgrid/mail';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  text: string;
  html?: string;
}

export interface EmailContext {
  matter_id: number;
  deadline_id?: number;
  hearing_id?: number;
  type: 'deadline' | 'hearing' | 'reminder';
}

export class EmailService {
  private fromAddress: EmailAddress;

  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
    
    // Default from address - can be configured
    this.fromAddress = {
      email: 'notifications@jusivo.app',
      name: 'Jusivo'
    };
  }

  /**
   * Send a notification email to relevant parties
   */
  async sendNotification(
    to: EmailAddress[],
    content: EmailContent,
    context: EmailContext
  ): Promise<{ success: boolean; messageIds: string[]; error?: string }> {
    try {
      // Generate custom Reply-To address for tracking
      const replyToAddress = this.generateReplyToAddress(context);
      
      // Create threaded email with custom headers
      const msg = {
        to: to.map(addr => ({ email: addr.email, name: addr.name })),
        from: this.fromAddress,
        replyTo: replyToAddress,
        subject: content.subject,
        text: content.text,
        html: content.html || this.generateDefaultHTML(content),
        headers: {
          'X-Jusivo-Matter-ID': context.matter_id.toString(),
          'X-Jusivo-Type': context.type,
          'X-Jusivo-Deadline-ID': context.deadline_id?.toString() || '',
          'X-Jusivo-Hearing-ID': context.hearing_id?.toString() || '',
          'Message-ID': this.generateMessageId(context),
          ...(context.deadline_id ? { 'References': this.generateThreadId(context) } : {}),
          ...(context.deadline_id ? { 'In-Reply-To': this.generateThreadId(context) } : {}),
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
        customArgs: {
          matter_id: context.matter_id.toString(),
          type: context.type,
          deadline_id: context.deadline_id?.toString() || '',
          hearing_id: context.hearing_id?.toString() || '',
        }
      };

      await sgMail.sendMultiple(msg);
      
      return {
        success: true,
        messageIds: [],
      };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        messageIds: [],
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send deadline reminder emails
   */
  async sendDeadlineReminder(
    matter: any,
    deadline: any,
    relevantParties: any[]
  ): Promise<{ success: boolean; messageIds: string[]; error?: string }> {
    const recipients = relevantParties
      .filter((party: any) => party.notify_deadlines && party.email)
      .map((party: any) => ({ email: party.email, name: party.name }));

    if (recipients.length === 0) {
      return { success: true, messageIds: [] };
    }

    const dueDate = new Date(deadline.due_at);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const subject = `Deadline Reminder: ${deadline.title} - ${matter.title}`;
    const text = `
Dear Legal Team,

This is a reminder about an upcoming deadline for ${matter.title}:

Deadline: ${deadline.title}
Due Date: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}
Days Until Due: ${daysUntil}
Matter: ${matter.title} (#${matter.matter_number})
Client: ${matter.client_first_name} ${matter.client_last_name}

Please ensure all necessary actions are completed before the deadline.

You can view more details and update the status at: https://jusivo.mocha.app/matters/${matter.id}

Best regards,
Jusivo Notification System

---
Reply to this email to add notes or updates to this deadline.
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Deadline Reminder</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear Legal Team,</p>
          
          <p style="color: #374151; margin-bottom: 20px;">This is a reminder about an upcoming deadline:</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">${deadline.title}</h3>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
              <p><strong>Days Until Due:</strong> <span style="color: ${daysUntil <= 1 ? '#dc2626' : daysUntil <= 3 ? '#f59e0b' : '#059669'}; font-weight: bold;">${daysUntil}</span></p>
              <p><strong>Matter:</strong> ${matter.title} (#${matter.matter_number})</p>
              <p><strong>Client:</strong> ${matter.client_first_name} ${matter.client_last_name}</p>
            </div>
          </div>
          
          <p style="color: #374151; margin: 20px 0;">Please ensure all necessary actions are completed before the deadline.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jusivo.mocha.app/matters/${matter.id}" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Matter Details
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              <strong>Note:</strong> Reply to this email to add notes or updates to this deadline.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendNotification(recipients, { subject, text, html }, {
      matter_id: matter.id,
      deadline_id: deadline.id,
      type: 'deadline'
    });
  }

  /**
   * Send hearing notification emails
   */
  async sendHearingNotification(
    matter: any,
    hearing: any,
    relevantParties: any[]
  ): Promise<{ success: boolean; messageIds: string[]; error?: string }> {
    const recipients = relevantParties
      .filter((party: any) => party.notify_hearings && party.email)
      .map((party: any) => ({ email: party.email, name: party.name }));

    if (recipients.length === 0) {
      return { success: true, messageIds: [] };
    }

    const hearingDate = new Date(hearing.start_at);
    
    const subject = `Hearing Scheduled: ${hearing.hearing_type || 'Court Hearing'} - ${matter.title}`;
    const text = `
Dear Legal Team,

A hearing has been scheduled for ${matter.title}:

Hearing Type: ${hearing.hearing_type || 'Court Hearing'}
Date & Time: ${hearingDate.toLocaleDateString()} at ${hearingDate.toLocaleTimeString()}
${hearing.courtroom ? `Courtroom: ${hearing.courtroom}` : ''}
${hearing.judge_or_alj ? `Judge/ALJ: ${hearing.judge_or_alj}` : ''}
${hearing.court_name ? `Court: ${hearing.court_name}` : ''}

Matter: ${matter.title} (#${matter.matter_number})
Client: ${matter.client_first_name} ${matter.client_last_name}

Please mark your calendar and prepare accordingly.

You can view more details at: https://jusivo.mocha.app/matters/${matter.id}

Best regards,
Jusivo Notification System

---
Reply to this email to add notes or updates to this hearing.
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Hearing Scheduled</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear Legal Team,</p>
          
          <p style="color: #374151; margin-bottom: 20px;">A hearing has been scheduled:</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">${hearing.hearing_type || 'Court Hearing'}</h3>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p><strong>Date & Time:</strong> ${hearingDate.toLocaleDateString()} at ${hearingDate.toLocaleTimeString()}</p>
              ${hearing.courtroom ? `<p><strong>Courtroom:</strong> ${hearing.courtroom}</p>` : ''}
              ${hearing.judge_or_alj ? `<p><strong>Judge/ALJ:</strong> ${hearing.judge_or_alj}</p>` : ''}
              ${hearing.court_name ? `<p><strong>Court:</strong> ${hearing.court_name}</p>` : ''}
              <p><strong>Matter:</strong> ${matter.title} (#${matter.matter_number})</p>
              <p><strong>Client:</strong> ${matter.client_first_name} ${matter.client_last_name}</p>
            </div>
          </div>
          
          <p style="color: #374151; margin: 20px 0;">Please mark your calendar and prepare accordingly.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jusivo.mocha.app/matters/${matter.id}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Matter Details
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              <strong>Note:</strong> Reply to this email to add notes or updates to this hearing.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendNotification(recipients, { subject, text, html }, {
      matter_id: matter.id,
      hearing_id: hearing.id,
      type: 'hearing'
    });
  }

  /**
   * Process incoming email replies and extract context
   */
  parseIncomingEmail(email: any): {
    matter_id?: number;
    deadline_id?: number;
    hearing_id?: number;
    type?: string;
    from: EmailAddress;
    subject: string;
    body: string;
    messageId: string;
    references?: string[];
  } {
    const headers = email.headers || {};
    
    return {
      matter_id: headers['X-Jusivo-Matter-ID'] ? parseInt(headers['X-Jusivo-Matter-ID']) : undefined,
      deadline_id: headers['X-Jusivo-Deadline-ID'] ? parseInt(headers['X-Jusivo-Deadline-ID']) : undefined,
      hearing_id: headers['X-Jusivo-Hearing-ID'] ? parseInt(headers['X-Jusivo-Hearing-ID']) : undefined,
      type: headers['X-Jusivo-Type'],
      from: {
        email: email.from?.email || email.from,
        name: email.from?.name
      },
      subject: email.subject,
      body: this.extractReplyContent(email.text || email.html),
      messageId: headers['Message-ID'] || email.messageId,
      references: headers['References'] ? headers['References'].split(' ') : []
    };
  }

  /**
   * Generate custom Reply-To address for tracking
   */
  private generateReplyToAddress(context: EmailContext): string {
    const prefix = `replies+matter-${context.matter_id}`;
    const suffix = context.deadline_id ? `-deadline-${context.deadline_id}` : 
                   context.hearing_id ? `-hearing-${context.hearing_id}` : '';
    
    return `${prefix}${suffix}@jusivo.app`;
  }

  /**
   * Generate unique Message-ID for email threading
   */
  private generateMessageId(context: EmailContext): string {
    const timestamp = Date.now();
    const resource = context.deadline_id ? `deadline-${context.deadline_id}` : 
                     context.hearing_id ? `hearing-${context.hearing_id}` : 
                     `matter-${context.matter_id}`;
    
    return `<${resource}-${timestamp}@jusivo.app>`;
  }

  /**
   * Generate thread ID for email conversations
   */
  private generateThreadId(context: EmailContext): string {
    const resource = context.deadline_id ? `deadline-${context.deadline_id}` : 
                     context.hearing_id ? `hearing-${context.hearing_id}` : 
                     `matter-${context.matter_id}`;
    
    return `<thread-${resource}@jusivo.app>`;
  }

  /**
   * Generate default HTML template
   */
  private generateDefaultHTML(content: EmailContent): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">${content.subject}</h2>
        <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${content.text}</div>
      </div>
    `;
  }

  /**
   * Extract reply content from email, removing quoted text
   */
  private extractReplyContent(emailBody: string): string {
    // Remove common reply indicators
    const replyIndicators = [
      /^On .* wrote:$/gm,
      /^From:.*$/gm,
      /^Sent:.*$/gm,
      /^To:.*$/gm,
      /^Subject:.*$/gm,
      /^>.*$/gm, // Quoted lines
      /^Dear Legal Team,.*$/gm,
      /^Best regards,[\s\S]*$/gm,
      /^---[\s\S]*$/gm, // Everything after signature separator
    ];

    let cleanBody = emailBody;
    
    replyIndicators.forEach(pattern => {
      cleanBody = cleanBody.replace(pattern, '');
    });

    return cleanBody.trim();
  }
}
