interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'missed' | 'callback' | 'busy' | 'custom';
}

const DEFAULT_TEMPLATES: SMSTemplate[] = [
  {
    id: 'missed_default',
    name: 'Missed Call - Default',
    content: 'Hi, I missed your call. I\'ll call you back as soon as possible. - {{name}}',
    category: 'missed'
  },
  {
    id: 'callback_scheduled',
    name: 'Callback Scheduled',
    content: 'Hi {{caller}}, I\'ve scheduled a callback for {{time}}. Talk to you then! - {{name}}',
    category: 'callback'
  },
  {
    id: 'busy_work',
    name: 'Busy at Work',
    content: 'Hi, I\'m currently in meetings. I\'ll reach out after {{time}}. - {{name}}',
    category: 'busy'
  },
  {
    id: 'in_meeting',
    name: 'In a Meeting',
    content: 'I\'m in a meeting right now. Can I call you back in about an hour? - {{name}}',
    category: 'busy'
  },
  {
    id: 'driving',
    name: 'Driving',
    content: 'I\'m driving right now. I\'ll call you back when I reach my destination. - {{name}}',
    category: 'busy'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    content: '',
    category: 'custom'
  }
];

class SMSService {
  private templates: SMSTemplate[] = [...DEFAULT_TEMPLATES];
  private enabled = false;
  private provider: 'twilio' | 'nexmo' | 'messagebird' | null = null;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getProvider(): string | null {
    return this.provider;
  }

  setProvider(provider: 'twilio' | 'nexmo' | 'messagebird' | null): void {
    this.provider = provider;
  }

  getTemplates(): SMSTemplate[] {
    return this.templates;
  }

  addTemplate(template: Omit<SMSTemplate, 'id'>): SMSTemplate {
    const newTemplate: SMSTemplate = {
      ...template,
      id: `custom_${Date.now()}`
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<SMSTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates };
      return true;
    }
    return false;
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index !== -1 && this.templates[index].category === 'custom') {
      this.templates.splice(index, 1);
      return true;
    }
    return false;
  }

  // Format template with variables
  formatTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return '';

    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
  }

  // Send SMS (mock implementation)
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.enabled || !this.provider) {
      throw new Error('SMS service not configured');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`[SMS ${this.provider}] To: ${phoneNumber}`);
    console.log(`Message: ${message}`);

    // Mock success
    return true;
  }

  // Auto-send SMS for missed call
  async autoSendMissedCallSMS(
    phoneNumber: string,
    callerName: string,
    userName: string,
    templateId: string = 'missed_default'
  ): Promise<boolean> {
    const message = this.formatTemplate(templateId, {
      caller: callerName,
      name: userName,
      time: new Date().toLocaleTimeString()
    });

    return this.sendSMS(phoneNumber, message);
  }

  // Get character count and SMS segments
  getSMSInfo(text: string): { characters: number; segments: number } {
    const characters = text.length;
    // Standard SMS: 160 chars, Concatenated: 153 chars per segment
    const segments = characters <= 160 ? 1 : Math.ceil(characters / 153);
    return { characters, segments };
  }
}

export const smsService = new SMSService();
export type { SMSTemplate };
export { DEFAULT_TEMPLATES };
