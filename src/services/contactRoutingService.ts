export type ContactCategory = 'family' | 'friends' | 'work' | 'vip' | 'blocked' | 'unknown';

export interface RoutingRule {
  id: string;
  category: ContactCategory;
  action: 'always-answer' | 'auto-ai' | 'voicemail' | 'silent-reject' | 'forward';
  conditions: {
    timeOfDay?: 'day' | 'night' | 'work-hours' | 'anytime';
    daysOfWeek?: string[];
    urgencyKeywords?: string[];
  };
  forwardTo?: string;
  messageTemplate?: string;
  enabled: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  category: ContactCategory;
  notes?: string;
  avatar?: string;
  lastCall?: Date;
  callCount: number;
  importance: 'high' | 'medium' | 'low';
}

const DEFAULT_RULES: RoutingRule[] = [
  {
    id: 'rule-family',
    category: 'family',
    action: 'always-answer',
    conditions: { timeOfDay: 'anytime' },
    enabled: true
  },
  {
    id: 'rule-work-hours',
    category: 'work',
    action: 'auto-ai',
    conditions: { timeOfDay: 'day' },
    enabled: true
  },
  {
    id: 'rule-work-after-hours',
    category: 'work',
    action: 'voicemail',
    conditions: { timeOfDay: 'night' },
    enabled: true
  },
  {
    id: 'rule-blocked',
    category: 'blocked',
    action: 'silent-reject',
    conditions: {},
    enabled: true
  },
  {
    id: 'rule-vip',
    category: 'vip',
    action: 'always-answer',
    conditions: { timeOfDay: 'anytime' },
    enabled: true
  }
];

class ContactRoutingService {
  private contacts: Map<string, Contact> = new Map();
  private rules: RoutingRule[] = [...DEFAULT_RULES];

  // Add or update contact
  addContact(contact: Omit<Contact, 'id' | 'callCount'>): Contact {
    const id = `contact_${Date.now()}`;
    const newContact: Contact = {
      ...contact,
      id,
      callCount: 0
    };
    this.contacts.set(contact.phoneNumber, newContact);
    return newContact;
  }

  // Get contact by phone number
  getContact(phoneNumber: string): Contact | undefined {
    return this.contacts.get(phoneNumber);
  }
  
  // Check if phone number matches any contact
  identifyCaller(phoneNumber: string): Contact | undefined {
    // Try exact match first
    const exactMatch = this.contacts.get(phoneNumber);
    if (exactMatch) return exactMatch;

    // Try normalized match (remove spaces, dashes, etc)
    const normalized = phoneNumber.replace(/[^\d]/g, '');
    const contactsArray = Array.from(this.contacts.entries());
    for (const [key, contact] of contactsArray) {
      if (key.replace(/[^\d]/g, '') === normalized) {
        return contact;
      }
    }

    return undefined;
  }

  // Update contact
  updateContact(phoneNumber: string, updates: Partial<Contact>): Contact | null {
    const contact = this.contacts.get(phoneNumber);
    if (!contact) return null;

    const updated = { ...contact, ...updates };
    this.contacts.set(phoneNumber, updated);
    return updated;
  }

  // Delete contact
  deleteContact(phoneNumber: string): boolean {
    return this.contacts.delete(phoneNumber);
  }

  // Get all contacts
  getAllContacts(): Contact[] {
    return Array.from(this.contacts.values()).sort((a, b) => 
      (b.lastCall?.getTime() || 0) - (a.lastCall?.getTime() || 0)
    );
  }

  // Get contacts by category
  getContactsByCategory(category: ContactCategory): Contact[] {
    return this.getAllContacts().filter(c => c.category === category);
  }

  // Update last call
  recordCall(phoneNumber: string): void {
    const contact = this.contacts.get(phoneNumber);
    if (contact) {
      contact.lastCall = new Date();
      contact.callCount++;
      this.contacts.set(phoneNumber, contact);
    }
  }

  // Get routing rules
  getRules(): RoutingRule[] {
    return this.rules;
  }

  // Add custom rule
  addRule(rule: Omit<RoutingRule, 'id'>): RoutingRule {
    const newRule: RoutingRule = {
      ...rule,
      id: `rule_${Date.now()}`
    };
    this.rules.push(newRule);
    return newRule;
  }

  // Update rule
  updateRule(id: string, updates: Partial<RoutingRule>): RoutingRule | null {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;

    this.rules[index] = { ...this.rules[index], ...updates };
    return this.rules[index];
  }

  // Delete rule
  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  // Determine action for incoming call
  determineAction(
    phoneNumber: string, 
    callerName: string, 
    reason?: string,
    timestamp: Date = new Date()
  ): { action: RoutingRule['action']; rule: RoutingRule; contact?: Contact } {
    // First check if contact exists
    const contact = this.identifyCaller(phoneNumber);
    
    if (contact) {
      // Find matching rule for this contact category
      const matchingRule = this.findMatchingRule(contact.category, timestamp, reason);
      if (matchingRule) {
        return { action: matchingRule.action, rule: matchingRule, contact };
      }
    }

    // Default: auto-ai for unknown callers
    return {
      action: 'auto-ai',
      rule: this.rules[1], // work hours rule as default
      contact
    };
  }

  private findMatchingRule(
    category: ContactCategory, 
    timestamp: Date,
    reason?: string
  ): RoutingRule | undefined {
    const hour = timestamp.getHours();
    const day = timestamp.toLocaleDateString('en-US', { weekday: 'long' });

    return this.rules.find(rule => {
      if (!rule.enabled) return false;
      if (rule.category !== category) return false;

      // Check time condition
      if (rule.conditions.timeOfDay) {
        const isDay = hour >= 6 && hour < 22;
        const isWorkHours = hour >= 9 && hour < 17;
        
        switch (rule.conditions.timeOfDay) {
          case 'day':
            if (!isDay) return false;
            break;
          case 'night':
            if (isDay) return false;
            break;
          case 'work-hours':
            if (!isWorkHours) return false;
            break;
        }
      }

      // Check days of week
      if (rule.conditions.daysOfWeek && !rule.conditions.daysOfWeek.includes(day)) {
        return false;
      }

      // Check urgency keywords in reason
      if (rule.conditions.urgencyKeywords && reason) {
        const hasUrgency = rule.conditions.urgencyKeywords.some(kw => 
          reason.toLowerCase().includes(kw.toLowerCase())
        );
        if (!hasUrgency) return false;
      }

      return true;
    });
  }

  // Get category icon/color
  getCategoryStyle(category: ContactCategory): { icon: string; color: string; bgColor: string } {
    const styles: Record<ContactCategory, { icon: string; color: string; bgColor: string }> = {
      family: { icon: '👨‍👩‍👧‍👦', color: '#EF4444', bgColor: 'bg-red-500/20' },
      friends: { icon: '🤝', color: '#F59E0B', bgColor: 'bg-yellow-500/20' },
      work: { icon: '💼', color: '#3B82F6', bgColor: 'bg-blue-500/20' },
      vip: { icon: '⭐', color: '#8B5CF6', bgColor: 'bg-purple-500/20' },
      blocked: { icon: '🚫', color: '#6B7280', bgColor: 'bg-gray-500/20' },
      unknown: { icon: '❓', color: '#9CA3AF', bgColor: 'bg-gray-400/20' }
    };

    return styles[category] || styles.unknown;
  }

  // Get action description
  getActionDescription(action: RoutingRule['action']): string {
    const descriptions: Record<RoutingRule['action'], string> = {
      'always-answer': 'Always answer immediately',
      'auto-ai': 'Let AI handle and screen',
      'voicemail': 'Send to voicemail',
      'silent-reject': 'Reject silently (no notification)',
      'forward': 'Forward to another number'
    };
    return descriptions[action];
  }
}

export const contactRoutingService = new ContactRoutingService();
export { DEFAULT_RULES };
