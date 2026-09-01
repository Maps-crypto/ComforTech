import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../data/mockData';
import { sendChatMessage, fetchTriageAssessment } from '../services/api';
import { ChatMessage, LanguageCode, UserProfile } from '../types';
import { getTranslation } from '../utils/translations';
import {
  Send,
  Sparkles,
  AlertTriangle,
  Shield,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  User,
  HeartHandshake
} from 'lucide-react';

interface ChatCompanionProps {
  userProfile: UserProfile;
  selectedLanguage: LanguageCode;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
  onOpenCoping: () => void;
  onOpenPeer: () => void;
  onOpenCounselor: () => void;
}

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  userProfile,
  selectedLanguage,
  onActivityLogged,
  onOpenCoping,
  onOpenPeer,
  onOpenCounselor,
}) => {
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];
  const t = getTranslation(selectedLanguage);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_1',
        role: 'assistant',
        content: t.chat.initialGreeting || `${currentLang.greeting}! I am comforTech, your AI Student Wellness Companion. How are you feeling in your mind and body today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // When selected language changes, update initial greeting if conversation hasn't started yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [
          {
            id: 'msg_1',
            role: 'assistant',
            content: t.chat.initialGreeting || `${currentLang.greeting}! I am comforTech, your AI Student Wellness Companion. How are you feeling in your mind and body today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [selectedLanguage]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [voiceModeActive, setVoiceModeActive] = useState(false);

  const [triageResult, setTriageResult] = useState<{
    risk: 'low' | 'medium' | 'high';
    note: string;
  } | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Speech Recognition (Voice-to-Text STT)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported on this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLang.code === 'af' ? 'af-ZA' : currentLang.code === 'zu' ? 'zu-ZA' : 'en-ZA';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to initialize:', err);
      setIsListening(false);
    }
  };

  // Text-to-Speech Synthesis
  const handleSpeak = (text: string, messageId: string) => {
    if (!window.speechSynthesis) return;

    if (activeAudioMessageId === messageId) {
      window.speechSynthesis.cancel();
      setActiveAudioMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find((v) =>
      v.lang.toLowerCase().includes('en-za') ||
      v.name.toLowerCase().includes('south africa') ||
      v.lang.toLowerCase().includes(currentLang.code)
    );

    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setActiveAudioMessageId(messageId);
    };

    utterance.onend = () => {
      setActiveAudioMessageId(null);
    };

    utterance.onerror = () => {
      setActiveAudioMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        language: currentLang.name,
        languageCode: currentLang.code,
        userProfile,
      });

      const responseText = response.reply;
      const aiMsgId = 'msg_' + (Date.now() + 1);
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...updatedHistory, aiMsg]);

      if (voiceModeActive) {
        setTimeout(() => {
          handleSpeak(responseText, aiMsgId);
        }, 300);
      }

      onActivityLogged('AI Companion Conversation', `Chatted in ${currentLang.name}`, 60);
    } catch (e) {
      console.error(e);
      setMessages([
        ...updatedHistory,
        {
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content: "I'm right here with you. Take a slow breath. Could you share what's on your mind?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunTriage = async () => {
    setIsTriaging(true);
    const transcript = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    try {
      const result = await fetchTriageAssessment({ transcript });
      setTriageResult(result);
      onActivityLogged(
        'Safety Triage Assessment',
        `Classified as ${result.risk.toUpperCase()} priority`,
        result.risk === 'high' ? 20 : result.risk === 'medium' ? 50 : 80
      );
    } catch (e) {
      setTriageResult({
        risk: 'low',
        note: 'Thank you for checking in with us. Self-help tools and the peer community are here whenever you need.',
      });
    } finally {
      setIsTriaging(false);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis?.cancel();
    setActiveAudioMessageId(null);
    setMessages([
      {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: `${currentLang.greeting}! New session started. How can I support you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTriageResult(null);
  };

  const quickPrompts = t.chat.chips && t.chat.chips.length > 0 ? t.chat.chips : [
    'Exam and test panic',
    'NSFAS food allowance delay',
    'Feeling lonely & isolated in res',
    'Cannot sleep from anxiety',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {t.chat.title || 'Multilingual AI Student Companion'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                {currentLang.nativeName}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{userProfile.isAnonymous ? t.nav.guestUser : `Signed In (${userProfile.displayName})`}</span>
              <span>·</span>
              <span className="text-emerald-700 font-mono text-[10px]">Culturally Grounded</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice-to-Voice auto speak toggle */}
          <button
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              voiceModeActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-slate-200 bg-slate-50'
            }`}
            title="Toggle Auto Read Aloud (Voice-to-Voice Mode)"
          >
            {voiceModeActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{voiceModeActive ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
            title="Restart Conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Multimodal Pill Banner */}
      <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Multimodal: <strong>Text Chat</strong>, <strong>Voice Mic (STT)</strong>, <strong>Voice Readout (TTS)</strong></span>
        </div>
        <span className="font-mono text-emerald-800 font-bold text-[10px]">11 SA Languages Supported</span>
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[480px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                    : 'bg-slate-50 text-slate-800 rounded-bl-none border border-slate-200/80'
                }`}
              >
                <div>{msg.content}</div>

                {/* Text-to-Speech audio button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className="mt-2 pt-1 border-t border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1 font-mono">
                      {activeAudioMessageId === msg.id ? (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-600 animate-bounce" />
                          <span className="text-emerald-700 font-bold">Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-slate-600" />
                          <span>Listen (TTS)</span>
                        </>
                      )}
                    </span>
                    {activeAudioMessageId === msg.id && (
                      <span className="text-emerald-700 text-[9px] underline">Stop</span>
                    )}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.role === 'user' ? 'You' : 'Companion'} · {msg.timestamp}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl rounded-bl-none border border-slate-200/80 w-36">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse delay-100" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse delay-200" />
              <span className="text-[11px] font-mono ml-1">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
            Quick Topics:
          </span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          {/* Voice Input STT button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={isListening ? (t.chat.listening || 'Listening... Tap to stop') : 'Tap to speak (Voice STT)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? (t.chat.listening || 'Listening to your voice...')
                : (t.chat.placeholder || `Type in ${currentLang.name} (or English)...`)
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2.5 bg-slate-50 text-slate-900 rounded-xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-emerald-400" />
          </button>
        </form>
      </div>

      {/* Triage & Assessment Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Safety & Emotional State Triage
          </div>
          <p className="text-[11px] text-slate-500">
            Generate an instant mental health risk assessment based on this session.
          </p>
        </div>

        <button
          onClick={handleRunTriage}
          disabled={isTriaging || messages.length < 2}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
        >
          {isTriaging ? 'Evaluating...' : 'Run Triage Check'}
        </button>
      </div>

      {/* Triage Results Display */}
      {triageResult && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
            triageResult.risk === 'high'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : triageResult.risk === 'medium'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="uppercase font-mono tracking-wider">
              Triage Classification: {triageResult.risk} Priority
            </span>
            <button
              onClick={() => setTriageResult(null)}
              className="text-[10px] underline hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
          <p className="leading-relaxed">{triageResult.note}</p>
          {triageResult.risk === 'high' && (
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onOpenCounselor}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
              >
                Reach Counselor Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
