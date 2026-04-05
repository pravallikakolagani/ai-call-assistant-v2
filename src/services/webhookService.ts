export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  lastTriggered?: Date;
  lastStatus?: 'success' | 'error';
}

export type WebhookEvent = 
  | 'call.incoming'
  | 'call.answered'
  | 'call.missed'
  | 'call.completed'
  | 'ai.response'
  | 'voicemail.received'
  | 'spam.detected'
  | 'urgent.call';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  signature: string;
}

class WebhookService {
  private endpoints: WebhookEndpoint[] = [];

  // Add webhook endpoint
  addEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'secret'>): WebhookEndpoint {
    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id: `webhook_${Date.now()}`,
      secret: this.generateSecret()
    };
    this.endpoints.push(newEndpoint);
    return newEndpoint;
  }

  // Update endpoint
  updateEndpoint(id: string, updates: Partial<WebhookEndpoint>): WebhookEndpoint | null {
    const index = this.endpoints.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.endpoints[index] = { ...this.endpoints[index], ...updates };
    return this.endpoints[index];
  }

  // Delete endpoint
  deleteEndpoint(id: string): boolean {
    const index = this.endpoints.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.endpoints.splice(index, 1);
    return true;
  }

  // Get all endpoints
  getEndpoints(): WebhookEndpoint[] {
    return [...this.endpoints];
  }

  // Trigger webhook
  async triggerWebhook(event: WebhookEvent, data: any): Promise<void> {
    const relevantEndpoints = this.endpoints.filter(e => 
      e.enabled && e.events.includes(event)
    );

    for (const endpoint of relevantEndpoints) {
      try {
        const payload: WebhookPayload = {
          event,
          timestamp: new Date().toISOString(),
          data,
          signature: this.generateSignature(endpoint.secret, data)
        };

        // In real implementation, this would be an actual HTTP POST
        console.log(`[Webhook] Sending ${event} to ${endpoint.url}`);
        console.log('Payload:', payload);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 100));

        endpoint.lastTriggered = new Date();
        endpoint.lastStatus = 'success';
      } catch (error) {
        console.error(`[Webhook] Failed to send to ${endpoint.url}:`, error);
        endpoint.lastTriggered = new Date();
        endpoint.lastStatus = 'error';
      }
    }
  }

  // Get available events
  getAvailableEvents(): { value: WebhookEvent; label: string; description: string }[] {
    return [
      { value: 'call.incoming', label: 'Incoming Call', description: 'When a call comes in' },
      { value: 'call.answered', label: 'Call Answered', description: 'When you answer a call' },
      { value: 'call.missed', label: 'Call Missed', description: 'When a call is missed' },
      { value: 'call.completed', label: 'Call Completed', description: 'When a call ends' },
      { value: 'ai.response', label: 'AI Response', description: 'When AI handles a call' },
      { value: 'voicemail.received', label: 'Voicemail Received', description: 'When someone leaves voicemail' },
      { value: 'spam.detected', label: 'Spam Detected', description: 'When spam is identified' },
      { value: 'urgent.call', label: 'Urgent Call', description: 'When urgent call detected' }
    ];
  }

  // Test endpoint
  async testEndpoint(endpoint: WebhookEndpoint): Promise<boolean> {
    try {
      const testPayload: WebhookPayload = {
        event: 'call.incoming',
        timestamp: new Date().toISOString(),
        data: { test: true, message: 'This is a test webhook' },
        signature: this.generateSignature(endpoint.secret, { test: true })
      };

      console.log(`[Webhook Test] Sending to ${endpoint.url}`);
      console.log('Test payload:', testPayload);

      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('[Webhook Test] Success!');
        return true;
      } else {
        throw new Error('Simulated failure');
      }
    } catch (error) {
      console.error('[Webhook Test] Failed:', error);
      return false;
    }
  }

  // Generate webhook secret
  private generateSecret(): string {
    return 'whsec_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Generate signature
  private generateSignature(secret: string, payload: any): string {
    // In real implementation, use HMAC-SHA256
    const data = JSON.stringify(payload);
    return 'sig_' + btoa(data + secret).substring(0, 32);
  }

  // Regenerate secret
  regenerateSecret(id: string): string | null {
    const endpoint = this.endpoints.find(e => e.id === id);
    if (!endpoint) return null;
    
    endpoint.secret = this.generateSecret();
    return endpoint.secret;
  }
}

export const webhookService = new WebhookService();
