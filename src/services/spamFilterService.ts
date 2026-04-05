export interface SpamPattern {
  id: string;
  pattern: string;
  type: 'number' | 'name' | 'keyword' | 'regex';
  action: 'block' | 'flag' | 'challenge';
  confidence: number;
  enabled: boolean;
}

export interface SpamReport {
  id: string;
  phoneNumber: string;
  callerName: string;
  reason: string;
  reportedAt: Date;
  reporterCount: number;
  verified: boolean;
}

export interface SpamSettings {
  autoBlock: boolean;
  aiDetection: boolean;
  communityBlocklist: boolean;
  suspiciousThreshold: number;
  blockUnknownInternational: boolean;
  challengeRobocalls: boolean;
}

class SpamFilterService {
  private patterns: SpamPattern[] = [
    { id: 'spam1', pattern: 'telemarket', type: 'keyword', action: 'block', confidence: 0.9, enabled: true },
    { id: 'spam2', pattern: 'insurance', type: 'keyword', action: 'flag', confidence: 0.7, enabled: true },
    { id: 'spam3', pattern: 'loan', type: 'keyword', action: 'flag', confidence: 0.6, enabled: true },
    { id: 'spam4', pattern: '^(800|888|877|866|855|844|833)', type: 'regex', action: 'challenge', confidence: 0.5, enabled: true }
  ];

  private reports: SpamReport[] = [];

  private settings: SpamSettings = {
    autoBlock: true,
    aiDetection: true,
    communityBlocklist: true,
    suspiciousThreshold: 0.7,
    blockUnknownInternational: false,
    challengeRobocalls: true
  };

  // Check if caller is spam
  checkCaller(phoneNumber: string, callerName: string, reason?: string): {
    isSpam: boolean;
    score: number;
    action: SpamPattern['action'];
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];
    let maxAction: SpamPattern['action'] = 'flag';

    // Check patterns
    for (const pattern of this.patterns.filter(p => p.enabled)) {
      const match = this.checkPattern(pattern, phoneNumber, callerName, reason);
      if (match) {
        score += pattern.confidence;
        reasons.push(`Matched: ${pattern.pattern}`);
        if (this.actionPriority(pattern.action) > this.actionPriority(maxAction)) {
          maxAction = pattern.action;
        }
      }
    }

    // Check community reports
    if (this.settings.communityBlocklist) {
      const report = this.reports.find(r => r.phoneNumber === phoneNumber);
      if (report && report.reporterCount >= 3) {
        score += 0.5;
        reasons.push('Reported by community');
      }
    }

    // Check international numbers
    if (this.settings.blockUnknownInternational && phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1')) {
      score += 0.3;
      reasons.push('International number');
    }

    // AI detection (mock)
    if (this.settings.aiDetection) {
      const aiScore = this.aiDetectionScore(phoneNumber, callerName, reason);
      score += aiScore;
      if (aiScore > 0.3) {
        reasons.push('AI pattern detection');
      }
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    const isSpam = score >= this.settings.suspiciousThreshold;

    // Override action based on settings
    let finalAction = maxAction;
    if (isSpam && this.settings.autoBlock && score > 0.8) {
      finalAction = 'block';
    }

    return { isSpam, score, action: finalAction, reasons };
  }

  // AI detection (mock implementation)
  private aiDetectionScore(phoneNumber: string, callerName: string, reason?: string): number {
    let score = 0;
    
    // Common spam indicators
    const spamIndicators = [
      'unknown', 'private', 'blocked', 'spam', 'telemarketer',
      'sales', 'promotion', 'free', 'won', 'prize', 'urgent'
    ];

    const text = `${callerName} ${reason || ''}`.toLowerCase();
    
    spamIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 0.15;
      }
    });

    // Robocall patterns (repeated numbers)
    const digits = phoneNumber.replace(/\D/g, '');
    if (/([0-9])\1{4,}/.test(digits)) {
      score += 0.2;
    }

    return Math.min(score, 0.5);
  }

  private checkPattern(pattern: SpamPattern, phoneNumber: string, callerName: string, reason?: string): boolean {
    const text = `${phoneNumber} ${callerName} ${reason || ''}`.toLowerCase();
    
    switch (pattern.type) {
      case 'keyword':
        return text.includes(pattern.pattern.toLowerCase());
      case 'regex':
        return new RegExp(pattern.pattern, 'i').test(phoneNumber);
      case 'name':
        return callerName.toLowerCase().includes(pattern.pattern.toLowerCase());
      case 'number':
        return phoneNumber.includes(pattern.pattern);
      default:
        return false;
    }
  }

  private actionPriority(action: SpamPattern['action']): number {
    const priorities = { flag: 1, challenge: 2, block: 3 };
    return priorities[action];
  }

  // Report spam
  reportSpam(phoneNumber: string, callerName: string, reason: string): void {
    const existing = this.reports.find(r => r.phoneNumber === phoneNumber);
    
    if (existing) {
      existing.reporterCount++;
    } else {
      this.reports.push({
        id: `report_${Date.now()}`,
        phoneNumber,
        callerName,
        reason,
        reportedAt: new Date(),
        reporterCount: 1,
        verified: false
      });
    }
  }

  // Add custom pattern
  addPattern(pattern: Omit<SpamPattern, 'id'>): SpamPattern {
    const newPattern: SpamPattern = {
      ...pattern,
      id: `spam_${Date.now()}`
    };
    this.patterns.push(newPattern);
    return newPattern;
  }

  // Remove pattern
  removePattern(id: string): boolean {
    const index = this.patterns.findIndex(p => p.id === id);
    if (index > -1) {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get patterns
  getPatterns(): SpamPattern[] {
    return [...this.patterns];
  }

  // Update pattern
  updatePattern(id: string, updates: Partial<SpamPattern>): SpamPattern | null {
    const index = this.patterns.findIndex(p => p.id === id);
    if (index > -1) {
      this.patterns[index] = { ...this.patterns[index], ...updates };
      return this.patterns[index];
    }
    return null;
  }

  // Get settings
  getSettings(): SpamSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(updates: Partial<SpamSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  // Get spam stats
  getStats(): {
    totalPatterns: number;
    activePatterns: number;
    communityReports: number;
    blockedToday: number;
  } {
    return {
      totalPatterns: this.patterns.length,
      activePatterns: this.patterns.filter(p => p.enabled).length,
      communityReports: this.reports.length,
      blockedToday: Math.floor(Math.random() * 10) // Mock stat
    };
  }

  // Verify report (admin function)
  verifyReport(reportId: string, verified: boolean): void {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.verified = verified;
    }
  }
}

export const spamFilterService = new SpamFilterService();
