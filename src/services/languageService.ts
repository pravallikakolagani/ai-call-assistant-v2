export type SupportedLanguage = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  flag: string;
  voice: string;
  greeting: string;
  responses: {
    unavailable: string;
    screening: string;
    takeMessage: string;
    urgent: string;
    callback: string;
  };
}

const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    voice: 'en-US-Neural2-F',
    greeting: "Hello, you've reached the AI assistant.",
    responses: {
      unavailable: "I'm currently unavailable. Please leave a message.",
      screening: "I'll screen this call for importance.",
      takeMessage: "Can I take a message?",
      urgent: "This appears urgent. Connecting you now.",
      callback: "I'll schedule a callback."
    }
  },
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    voice: 'es-ES-Neural2-B',
    greeting: "Hola, has llegado al asistente de IA.",
    responses: {
      unavailable: "No estoy disponible en este momento. Por favor, deja un mensaje.",
      screening: "Voy a filtrar esta llamada por importancia.",
      takeMessage: "¿Puedo tomar un mensaje?",
      urgent: "Esto parece urgente. Conectándote ahora.",
      callback: "Programaré una devolución de llamada."
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    voice: 'fr-FR-Neural2-A',
    greeting: "Bonjour, vous avez joint l'assistant IA.",
    responses: {
      unavailable: "Je ne suis pas disponible. Veuillez laisser un message.",
      screening: "Je vais filtrer cet appel.",
      takeMessage: "Puis-je prendre un message?",
      urgent: "Cela semble urgent. Je vous connecte.",
      callback: "Je vais planifier un rappel."
    }
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    voice: 'de-DE-Neural2-B',
    greeting: "Hallo, Sie haben den KI-Assistenten erreicht.",
    responses: {
      unavailable: "Ich bin nicht verfügbar. Bitte hinterlassen Sie eine Nachricht.",
      screening: "Ich werde diesen Anruf screenen.",
      takeMessage: "Kann ich eine Nachricht aufnehmen?",
      urgent: "Das scheint dringend zu sein. Ich verbinde Sie.",
      callback: "Ich werde einen Rückruf planen."
    }
  },
  it: {
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹',
    voice: 'it-IT-Neural2-A',
    greeting: "Ciao, hai raggiunto l'assistente AI.",
    responses: {
      unavailable: "Non sono disponibile. Lascia un messaggio.",
      screening: "Controllerò l'importanza di questa chiamata.",
      takeMessage: "Posso prendere un messaggio?",
      urgent: "Sembra urgente. Ti sto connettendo.",
      callback: "Programmerò una richiamata."
    }
  },
  pt: {
    code: 'pt',
    name: 'Português',
    flag: '🇧🇷',
    voice: 'pt-BR-Neural2-B',
    greeting: "Olá, você chegou ao assistente de IA.",
    responses: {
      unavailable: "Não estou disponível. Deixe uma mensagem.",
      screening: "Vou filtrar esta chamada.",
      takeMessage: "Posso anotar recado?",
      urgent: "Parece urgente. Conectando você.",
      callback: "Vou agendar um retorno."
    }
  },
  ru: {
    code: 'ru',
    name: 'Русский',
    flag: '🇷🇺',
    voice: 'ru-RU-Neural2-B',
    greeting: "Здравствуйте, вы связались с ИИ-ассистентом.",
    responses: {
      unavailable: "Я недоступен. Оставьте сообщение.",
      screening: "Я проверю этот звонок.",
      takeMessage: "Могу я принять сообщение?",
      urgent: "Это кажется срочным. Соединяю вас.",
      callback: "Я запланирую обратный звонок."
    }
  },
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    voice: 'zh-CN-Neural2-A',
    greeting: "您好，您已接通AI助手。",
    responses: {
      unavailable: "我目前不方便接听。请留言。",
      screening: "我将为您筛选这个电话。",
      takeMessage: "需要我帮您留言吗？",
      urgent: "这看起来是紧急电话。现在为您转接。",
      callback: "我将安排回电。"
    }
  },
  ja: {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    voice: 'ja-JP-Neural2-B',
    greeting: "こんにちは、AIアシスタントです。",
    responses: {
      unavailable: "ただいま取り込み中です。メッセージをお願いします。",
      screening: "この電話をスクリーニングします。",
      takeMessage: "伝言を承りましょうか?",
      urgent: "緊急のようです。つなぎます。",
      callback: "折り返し電話を予定します。"
    }
  },
  ko: {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    voice: 'ko-KR-Neural2-B',
    greeting: "안녕하세요, AI 비서입니다.",
    responses: {
      unavailable: "통화가 어렵습니다. 메시지를 남겨주세요.",
      screening: "이 통화를 검토하겠습니다.",
      takeMessage: "메시지를 받아드릴까요?",
      urgent: "긴급한 것 같습니다. 연결하겠습니다.",
      callback: "콜백을 예약하겠습니다."
    }
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦',
    voice: 'ar-XA-Neural2-B',
    greeting: "مرحباً، لقد اتصلت بالمساعد الذكي.",
    responses: {
      unavailable: "أنا غير متوفر. يرجى ترك رسالة.",
      screening: "سأقوم بفحص هذه المكالمة.",
      takeMessage: "هل يمكنني تلقي رسالة؟",
      urgent: "يبدو هذا عاجلاً. سأوصلك الآن.",
      callback: "سأجدول معاودة الاتصال."
    }
  },
  hi: {
    code: 'hi',
    name: 'हिन्दी',
    flag: '🇮🇳',
    voice: 'hi-IN-Neural2-B',
    greeting: "नमस्ते, आप एआई सहायक से जुड़े हैं।",
    responses: {
      unavailable: "मैं उपलब्ध नहीं हूं। कृपया संदेश छोड़ें।",
      screening: "मैं इस कॉल को स्क्रीन करूंगा।",
      takeMessage: "क्या मैं संदेश ले सकता हूं?",
      urgent: "यह तत्काल प्रतीत होता है। आपको जोड़ रहा हूं।",
      callback: "मैं कॉलबैक निर्धारित करूंगा।"
    }
  }
};

class LanguageService {
  private currentLanguage: SupportedLanguage = 'en';
  private autoDetect: boolean = true;

  setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    this.autoDetect = false;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getLanguageConfig(lang?: SupportedLanguage): LanguageConfig {
    return LANGUAGE_CONFIGS[lang || this.currentLanguage];
  }

  getAllLanguages(): LanguageConfig[] {
    return Object.values(LANGUAGE_CONFIGS);
  }

  enableAutoDetect(): void {
    this.autoDetect = true;
  }

  isAutoDetectEnabled(): boolean {
    return this.autoDetect;
  }

  // Detect language from caller info (mock implementation)
  async detectLanguage(callerNumber: string): Promise<SupportedLanguage> {
    if (!this.autoDetect) {
      return this.currentLanguage;
    }

    // Mock country code detection
    const countryCode = callerNumber.startsWith('+') ? callerNumber.slice(1, 3) : '1';
    
    const countryToLang: Record<string, SupportedLanguage> = {
      '1': 'en',    // US/Canada
      '44': 'en',   // UK
      '34': 'es',   // Spain
      '52': 'es',   // Mexico
      '33': 'fr',   // France
      '49': 'de',   // Germany
      '39': 'it',   // Italy
      '55': 'pt',   // Brazil
      '7': 'ru',    // Russia
      '86': 'zh',   // China
      '81': 'ja',   // Japan
      '82': 'ko',   // Korea
      '966': 'ar',  // Saudi Arabia
      '91': 'hi',   // India
      '971': 'ar',  // UAE
    };

    return countryToLang[countryCode] || 'en';
  }

  // Get AI response in current language
  getResponse(key: keyof LanguageConfig['responses'], lang?: SupportedLanguage): string {
    const config = this.getLanguageConfig(lang);
    return config.responses[key];
  }

  // Get greeting
  getGreeting(lang?: SupportedLanguage): string {
    return this.getLanguageConfig(lang).greeting;
  }

  // Translate text (mock - would use actual translation API)
  async translate(text: string, targetLang: SupportedLanguage): Promise<string> {
    // Mock translation - in real implementation, use Google Translate API or similar
    await new Promise(resolve => setTimeout(resolve, 500));
    return `[${targetLang.toUpperCase()}] ${text}`;
  }
}

export const languageService = new LanguageService();
export { LANGUAGE_CONFIGS };
