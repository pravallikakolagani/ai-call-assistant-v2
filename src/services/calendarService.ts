interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  attendees?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface CalendarProvider {
  name: 'google' | 'outlook' | 'apple';
  connected: boolean;
  email?: string;
}

class CalendarService {
  private providers: CalendarProvider[] = [
    { name: 'google', connected: false },
    { name: 'outlook', connected: false },
    { name: 'apple', connected: false }
  ];

  // Check if user has connected any calendar
  hasConnectedCalendar(): boolean {
    return this.providers.some(p => p.connected);
  }

  // Get connected providers
  getConnectedProviders(): CalendarProvider[] {
    return this.providers.filter(p => p.connected);
  }

  // Connect calendar (mock OAuth flow)
  async connectCalendar(provider: 'google' | 'outlook' | 'apple'): Promise<boolean> {
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const providerObj = this.providers.find(p => p.name === provider);
    if (providerObj) {
      providerObj.connected = true;
      providerObj.email = `user@${provider}.com`;
    }
    
    return true;
  }

  // Disconnect calendar
  disconnectCalendar(provider: 'google' | 'outlook' | 'apple'): void {
    const providerObj = this.providers.find(p => p.name === provider);
    if (providerObj) {
      providerObj.connected = false;
      providerObj.email = undefined;
    }
  }

  // Schedule a callback
  async scheduleCallback(
    callerName: string,
    callerNumber: string,
    proposedTime: Date,
    duration: number = 30
  ): Promise<CalendarEvent | null> {
    if (!this.hasConnectedCalendar()) {
      throw new Error('No calendar connected');
    }

    // Simulate API call to create event
    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime = new Date(proposedTime.getTime() + duration * 60000);
    
    const event: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: `Call back: ${callerName}`,
      startTime: proposedTime,
      endTime,
      description: `Scheduled callback to ${callerName} at ${callerNumber}\n\nCall context: Missed call from AI Call Assistant`,
      attendees: [],
      status: 'confirmed'
    };

    return event;
  }

  // Find available slots in the next 24 hours
  async findAvailableSlots(duration: number = 30): Promise<Date[]> {
    if (!this.hasConnectedCalendar()) {
      return [];
    }

    // Mock available slots
    const now = new Date();
    const slots: Date[] = [];
    
    // Generate slots for next 24 hours (every 2 hours)
    for (let i = 2; i <= 24; i += 2) {
      const slot = new Date(now.getTime() + i * 60 * 60 * 1000);
      // Round to nearest hour
      slot.setMinutes(0, 0, 0);
      slots.push(slot);
    }

    return slots;
  }

  // Get calendar icon
  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      google: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      outlook: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
      apple: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Apple_Calendar_icon.png'
    };
    return icons[provider] || '';
  }
}

export const calendarService = new CalendarService();
export type { CalendarEvent, CalendarProvider };
