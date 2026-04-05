import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { 
  contactRoutingService, 
  Contact, 
  ContactCategory, 
  RoutingRule 
} from '../services/contactRoutingService';

interface ContactManagerProps {
  isDark: boolean;
}

export function ContactManager({ isDark }: ContactManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [activeTab, setActiveTab] = useState<'contacts' | 'rules'>('contacts');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setContacts(contactRoutingService.getAllContacts());
    setRules(contactRoutingService.getRules());
  }, []);

  const getCategoryStyle = (category: ContactCategory) => {
    const style = contactRoutingService.getCategoryStyle(category);
    return style;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Contact-Based Routing
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'contacts'
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Rules
          </button>
        </div>
      </div>

      {activeTab === 'contacts' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className={`flex-1 p-2.5 rounded-lg text-sm outline-none ${
                isDark 
                  ? 'bg-gray-700 text-white placeholder-gray-500' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={() => setShowAddContact(true)}
              className="p-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts yet</p>
              </div>
            ) : (
              contacts.map(contact => {
                const style = getCategoryStyle(contact.category);
                return (
                  <div
                    key={contact.id}
                    className={`p-3 rounded-xl flex items-center justify-between ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {contact.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${style.bgColor} ${style.color}`}>
                      {contact.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-2">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${
                rule.enabled ? '' : 'opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {contactRoutingService.getCategoryStyle(rule.category).icon}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{rule.category}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {contactRoutingService.getActionDescription(rule.action)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    contactRoutingService.updateRule(rule.id, { enabled: !rule.enabled });
                    setRules(contactRoutingService.getRules());
                  }}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    rule.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    rule.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
