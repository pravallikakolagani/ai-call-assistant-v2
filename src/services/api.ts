const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(truecallerId: string, password: string, name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ truecallerId, password, name })
    });
  }

  async login(truecallerId: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ truecallerId, password })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateSettings(settings: any) {
    return this.request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Call endpoints
  async getCalls() {
    return this.request('/calls');
  }

  async createCall(callData: any) {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  }

  async updateCall(id: string, callData: any) {
    return this.request(`/calls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(callData)
    });
  }

  async deleteCall(id: string) {
    return this.request(`/calls/${id}`, {
      method: 'DELETE'
    });
  }

  async getCallStats() {
    return this.request('/calls/stats/overview');
  }
}

export const apiService = new ApiService();
