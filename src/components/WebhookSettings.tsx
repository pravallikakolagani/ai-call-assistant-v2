import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Webhook, Plus, Trash2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { webhookService, WebhookEndpoint } from '../services/webhookService';

interface WebhookSettingsProps {
  isDark: boolean;
}

export function WebhookSettings({ isDark }: WebhookSettingsProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(webhookService.getEndpoints());
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['call.incoming']);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const availableEvents = webhookService.getAvailableEvents();

  const handleAdd = () => {
    webhookService.addEndpoint({
      name: newName,
      url: newUrl,
      events: selectedEvents as any,
      enabled: true
    });
    setEndpoints(webhookService.getEndpoints());
    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewUrl('');
    setSelectedEvents(['call.incoming']);
  };

  const handleDelete = (id: string) => {
    webhookService.deleteEndpoint(id);
    setEndpoints(webhookService.getEndpoints());
  };

  const handleToggle = (id: string) => {
    const ep = endpoints.find(e => e.id === id);
    if (ep) {
      webhookService.updateEndpoint(id, { enabled: !ep.enabled });
      setEndpoints(webhookService.getEndpoints());
    }
  };

  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestStatus({ ...testStatus, [endpoint.id]: 'testing' });
    const success = await webhookService.testEndpoint(endpoint);
    setTestStatus({ ...testStatus, [endpoint.id]: success ? 'success' : 'error' });
    setTimeout(() => {
      setTestStatus(prev => ({ ...prev, [endpoint.id]: 'idle' }));
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Webhook Integrations
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {endpoints.length === 0 && (
        <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Webhook className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No webhooks configured</p>
          <p className="text-xs mt-1">Add webhooks to integrate with external services</p>
        </div>
      )}

      {endpoints.map(endpoint => (
        <div key={endpoint.id} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">{endpoint.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleTest(endpoint)}
                disabled={testStatus[endpoint.id] === 'testing'}
                className={`p-1.5 rounded-lg ${
                  testStatus[endpoint.id] === 'success' ? 'bg-green-500/20 text-green-500' :
                  testStatus[endpoint.id] === 'error' ? 'bg-red-500/20 text-red-500' :
                  'hover:bg-gray-500/20'
                }`}
              >
                {testStatus[endpoint.id] === 'testing' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                ) : testStatus[endpoint.id] === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : testStatus[endpoint.id] === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleToggle(endpoint.id)}
                className={`w-8 h-5 rounded-full transition-colors ${
                  endpoint.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  endpoint.enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
              <button
                onClick={() => handleDelete(endpoint.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
            {endpoint.url}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {endpoint.events.map(event => (
              <span key={event} className={`px-2 py-0.5 rounded text-xs ${
                isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
              }`}>
                {event}
              </span>
            ))}
          </div>
          {endpoint.lastTriggered && (
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Last triggered: {new Date(endpoint.lastTriggered).toLocaleString()}
            </p>
          )}
        </div>
      ))}

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <h4 className="font-medium mb-3">Add Webhook</h4>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Webhook name"
            className={`w-full p-2.5 rounded-lg text-sm mb-3 outline-none ${
              isDark ? 'bg-gray-600 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://your-app.com/webhook"
            className={`w-full p-2.5 rounded-lg text-sm mb-3 outline-none ${
              isDark ? 'bg-gray-600 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <div className="mb-3">
            <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Events</p>
            <div className="flex flex-wrap gap-1">
              {availableEvents.map(event => (
                <button
                  key={event.value}
                  onClick={() => {
                    setSelectedEvents(prev => 
                      prev.includes(event.value)
                        ? prev.filter(e => e !== event.value)
                        : [...prev, event.value]
                    );
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedEvents.includes(event.value)
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                  }`}
                >
                  {event.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdd(false); resetForm(); }}
              className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName || !newUrl || selectedEvents.length === 0}
              className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Add Webhook
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
