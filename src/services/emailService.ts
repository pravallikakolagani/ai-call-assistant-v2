export interface EmailNotification {
  id: string;
  type: 'missed-call' | 'daily-summary' | 'weekly-report' | 'urgent' | 'voicemail';
  recipient: string;
  subject: string;
  body: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface EmailSettings {
  enabled: boolean;
  emailAddress: string;
  notifyMissedCalls: boolean;
  notifyDailySummary: boolean;
  notifyWeeklyReport: boolean;
  notifyUrgent: boolean;
  notifyVoicemail: boolean;
  summaryTime: string; // HH:mm format
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

class EmailService {
  private settings: EmailSettings = {
    enabled: false,
    emailAddress: '',
    notifyMissedCalls: true,
    notifyDailySummary: true,
    notifyWeeklyReport: false,
    notifyUrgent: true,
    notifyVoicemail: true,
    summaryTime: '09:00'
  };

  private notifications: EmailNotification[] = [];

  // Configure email settings
  configure(settings: Partial<EmailSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // Get settings
  getSettings(): EmailSettings {
    return { ...this.settings };
  }

  // Send missed call notification
  async sendMissedCallNotification(
    callerName: string,
    callerNumber: string,
    timestamp: Date,
    voicemailUrl?: string
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifyMissedCalls) {
      return false;
    }

    const subject = `Missed Call: ${callerName}`;
    const body = `
      <h2>Missed Call Notification</h2>
      <p><strong>Caller:</strong> ${callerName}</p>
      <p><strong>Number:</strong> ${callerNumber}</p>
      <p><strong>Time:</strong> ${timestamp.toLocaleString()}</p>
      ${voicemailUrl ? `<p><a href="${voicemailUrl}">Listen to Voicemail</a></p>` : ''}
      <hr>
      <p style="font-size: 12px; color: #666;">
        Sent by AI Call Assistant
      </p>
    `;

    return this.sendEmail('missed-call', subject, body);
  }

  // Send daily summary
  async sendDailySummary(
    date: Date,
    stats: {
      total: number;
      answered: number;
      missed: number;
      autoAnswered: number;
      messagesSent: number;
    },
    missedCalls: Array<{ caller: string; number: string; time: Date }>
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifyDailySummary) {
      return false;
    }

    const subject = `Daily Call Summary - ${date.toLocaleDateString()}`;
    const missedCallsHtml = missedCalls.length > 0
      ? missedCalls.map(c => `<li>${c.caller} (${c.number}) at ${c.time.toLocaleTimeString()}</li>`).join('')
      : '<li>No missed calls today!</li>';

    const body = `
      <h2>Daily Call Summary</h2>
      <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
      
      <h3>Statistics</h3>
      <ul>
        <li>Total Calls: ${stats.total}</li>
        <li>Answered: ${stats.answered}</li>
        <li>Missed: ${stats.missed}</li>
        <li>Auto-Answered by AI: ${stats.autoAnswered}</li>
        <li>AI Messages Sent: ${stats.messagesSent}</li>
      </ul>
      
      <h3>Missed Calls</h3>
      <ul>${missedCallsHtml}</ul>
      
      <hr>
      <p style="font-size: 12px; color: #666;">
        Sent by AI Call Assistant at ${new Date().toLocaleString()}
      </p>
    `;

    return this.sendEmail('daily-summary', subject, body);
  }

  // Send weekly report
  async sendWeeklyReport(
    weekStart: Date,
    weekEnd: Date,
    stats: {
      total: number;
      answered: number;
      missed: number;
      highPriority: number;
      averageResponseTime: number;
    },
    topCallers: Array<{ name: string; count: number }>
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifyWeeklyReport) {
      return false;
    }

    const subject = `Weekly Call Report - ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`;
    const topCallersHtml = topCallers
      .map((c, i) => `<li>${i + 1}. ${c.name} - ${c.count} calls</li>`)
      .join('');

    const body = `
      <h2>Weekly Call Report</h2>
      <p><strong>Period:</strong> ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</p>
      
      <h3>Overview</h3>
      <ul>
        <li>Total Calls: ${stats.total}</li>
        <li>Answered: ${stats.answered}</li>
        <li>Missed: ${stats.missed}</li>
        <li>High Priority: ${stats.highPriority}</li>
        <li>Avg Response Time: ${stats.averageResponseTime}s</li>
      </ul>
      
      <h3>Top Callers</h3>
      <ol>${topCallersHtml}</ol>
      
      <hr>
      <p style="font-size: 12px; color: #666;">
        Sent by AI Call Assistant
      </p>
    `;

    return this.sendEmail('weekly-report', subject, body);
  }

  // Send urgent call notification
  async sendUrgentNotification(
    callerName: string,
    callerNumber: string,
    reason: string,
    timestamp: Date
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifyUrgent) {
      return false;
    }

    const subject = `🚨 URGENT Call: ${callerName}`;
    const body = `
      <h2 style="color: #ef4444;">Urgent Call Alert</h2>
      <p><strong>Caller:</strong> ${callerName}</p>
      <p><strong>Number:</strong> ${callerNumber}</p>
      <p><strong>Time:</strong> ${timestamp.toLocaleString()}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p style="background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;">
        This call was marked as urgent and requires your immediate attention.
      </p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        Sent by AI Call Assistant
      </p>
    `;

    return this.sendEmail('urgent', subject, body);
  }

  // Send voicemail notification
  async sendVoicemailNotification(
    callerName: string,
    duration: number,
    voicemailUrl: string,
    transcription?: string
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifyVoicemail) {
      return false;
    }

    const subject = `New Voicemail from ${callerName}`;
    const body = `
      <h2>New Voicemail</h2>
      <p><strong>From:</strong> ${callerName}</p>
      <p><strong>Duration:</strong> ${duration} seconds</p>
      <p><a href="${voicemailUrl}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Listen to Voicemail</a></p>
      ${transcription ? `
        <h3>Transcription</h3>
        <blockquote style="background: #f3f4f6; padding: 10px; border-left: 4px solid #9ca3af;">
          ${transcription}
        </blockquote>
      ` : ''}
      <hr>
      <p style="font-size: 12px; color: #666;">
        Sent by AI Call Assistant
      </p>
    `;

    return this.sendEmail('voicemail', subject, body);
  }

  // Core send email function (mock implementation)
  private async sendEmail(
    type: EmailNotification['type'],
    subject: string,
    body: string
  ): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.emailAddress) {
      return false;
    }

    // Create notification record
    const notification: EmailNotification = {
      id: `email_${Date.now()}`,
      type,
      recipient: this.settings.emailAddress,
      subject,
      body,
      sentAt: new Date(),
      status: 'pending'
    };

    this.notifications.push(notification);

    // Simulate sending
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would use SMTP or email API
      console.log(`[Email] Sending to ${this.settings.emailAddress}`);
      console.log(`Subject: ${subject}`);
      
      notification.status = 'sent';
      return true;
    } catch (error) {
      console.error('[Email] Failed to send:', error);
      notification.status = 'failed';
      return false;
    }
  }

  // Get notification history
  getNotifications(): EmailNotification[] {
    return [...this.notifications].sort((a, b) => 
      b.sentAt.getTime() - a.sentAt.getTime()
    );
  }

  // Test email configuration
  async testConfiguration(): Promise<boolean> {
    return this.sendEmail(
      'missed-call',
      'AI Call Assistant - Test Email',
      '<h2>Test Email</h2><p>This is a test email from your AI Call Assistant.</p>'
    );
  }

  // Schedule daily summary (would be called by a cron job or timer)
  shouldSendDailySummary(): boolean {
    if (!this.settings.enabled || !this.settings.notifyDailySummary) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return currentTime === this.settings.summaryTime;
  }
}

export const emailService = new EmailService();
