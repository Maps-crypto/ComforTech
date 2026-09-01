import React, { useState } from 'react';
import { Smartphone, Phone, ArrowLeft, Check, Sparkles, MessageSquare, Globe } from 'lucide-react';
import { LanguageCode } from '../types';

interface UssdSimulatorProps {
  selectedLanguage?: LanguageCode;
  onSelectLanguage?: (code: LanguageCode) => void;
  onBackToApp: () => void;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
}

export const UssdSimulator: React.FC<UssdSimulatorProps> = ({
  selectedLanguage = 'en',
  onSelectLanguage,
  onBackToApp,
  onActivityLogged,
}) => {
  const [dialCode, setDialCode] = useState('*134*902#');
  const [sessionActive, setSessionActive] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<'main' | 'checkin' | 'counselor' | 'tips' | 'language' | 'end'>('main');
  const [screenText, setScreenText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const getMainMenuText = (lang: string = selectedLanguage) => {
    switch (lang) {
      case 'zu':
        return "CON comforTech Usizo Lwabafundi\n1. Hlola Isimo Somoya\n2. Khuluma Nomeluleki\n3. Ukuphefumula Kokuzolisa\n4. Shintsha Ulimi (Language)\n00. Phuma";
      case 'st':
        return "CON comforTech Tshehetso ya Baithuti\n1. Lekola Maikutlo\n2. Bua le Moeletsi\n3. Ho Hula Moea\n4. Fetola Puo (Language)\n00. Tswa";
      case 'xh':
        return "CON comforTech Inkxaso yaBafundi\n1. Khangela Imo yoMoya\n2. Thetha nomCebisi\n3. Ukuphefumla okuDambisayo\n4. Guqula uLwimi (Language)\n00. Phuma";
      case 'af':
        return "CON comforTech Studente-ondersteuning\n1. Gemoedstoets\n2. Praat met 'n Berader\n3. Asemhalingsoefening\n4. Verander Taal (Language)\n00. Verlaat";
      case 'tn':
        return "CON comforTech Kemonokeng ya Baithuti\n1. Lekola Maikutlo\n2. Bua le Mogakolodi\n3. Go Hema go Iketla\n4. Fetola Puo (Language)\n00. Tswa";
      default:
        return "CON comforTech Student Support\n1. Mood Check-In\n2. Talk to Someone\n3. Self-Help Breathing\n4. Change Language\n00. Exit";
    }
  };

  const startUssd = (lang = selectedLanguage) => {
    setSessionActive(true);
    setCurrentMenu('main');
    setScreenText(getMainMenuText(lang));
    setUserInput('');
    onActivityLogged('USSD Session Started', 'Dialed *134*902# offline code', 50);
  };

  const handleSendInput = (code?: string) => {
    const val = (code || userInput).trim();
    if (!val) return;

    if (currentMenu === 'main') {
      if (val === '1') {
        setCurrentMenu('checkin');
        setScreenText(
          "CON How are you feeling today?\n1. Doing well / Calm\n2. Stressed / Anxious\n3. Overwhelmed / Exhausted\n4. In Critical Crisis"
        );
      } else if (val === '2') {
        setCurrentMenu('counselor');
        setScreenText(
          "CON Connect with Human Care:\n1. Request Free Counselor Callback\n2. SADAG 24/7 Helpline Info\n3. Higher Health SMS Support\n0. Back"
        );
      } else if (val === '3') {
        setCurrentMenu('tips');
        setScreenText(
          "CON 2-Minute Box Breathing:\n1. Start Step-by-Step Guide\n2. 5-4-3-2-1 Grounding Technique\n0. Back"
        );
      } else if (val === '4') {
        setCurrentMenu('language');
        setScreenText(
          "CON Khetha ulimi / Khetha puo / Select Language:\n1. English\n2. isiZulu\n3. Sesotho\n4. isiXhosa\n5. Afrikaans\n6. Setswana\n7. Sepedi\n8. Xitsonga\n9. Siswati\n10. Tshivenda\n11. isiNdebele"
        );
      } else if (val === '00') {
        endSession("END Thank you for checking in with comforTech. Look after yourself.");
      } else {
        setScreenText("CON Invalid option.\n1. Mood Check-In\n2. Talk to Someone\n3. Breathing\n00. Exit");
      }
    } else if (currentMenu === 'checkin') {
      if (val === '1') {
        endSession("END Great to hear! Remember to stay hydrated and take study breaks. Keep shining.");
      } else if (val === '2' || val === '3') {
        sendSimulatedSms("comforTech: We heard your check-in. Try taking 4 deep breaths. Dial *134*902# anytime.");
        endSession("END Thanks for sharing. We have sent a calming tip to your phone via SMS. Dial *134*902# anytime.");
      } else if (val === '4') {
        sendSimulatedSms("URGENT: A SADAG crisis liaison is alerted. You can call 0800 567 567 (Free, 24/7) immediately.");
        endSession("END You are not alone. Free 24/7 SADAG Crisis Line: 0800 567 567. We are dispatching an emergency SMS now.");
      }
    } else if (currentMenu === 'counselor') {
      if (val === '1') {
        sendSimulatedSms("comforTech: Your callback request is received. A student counselor will call within 2 hours.");
        endSession("END Callback confirmed! A counselor will call your phone shortly. Stay safe.");
      } else if (val === '2') {
        endSession("END SADAG 24/7 Toll-Free: 0800 567 567\nEmergency: 112 (No airtime needed)");
      } else if (val === '3') {
        sendSimulatedSms("Higher Health Student Helpline: SMS 43335 for free 24/7 student mental health support.");
        endSession("END Higher Health SMS code 43335 dispatched to your messages. Take care.");
      } else {
        startUssd();
      }
    } else if (currentMenu === 'tips') {
      if (val === '1') {
        endSession("END Box Breathing: Inhale 4s -> Hold 4s -> Exhale 4s -> Hold 4s. Repeat 4 times.");
      } else if (val === '2') {
        endSession("END Grounding: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.");
      } else {
        startUssd();
      }
    } else if (currentMenu === 'language') {
      const langMap: Record<string, LanguageCode> = {
        '1': 'en',
        '2': 'zu',
        '3': 'st',
        '4': 'xh',
        '5': 'af',
        '6': 'tn',
        '7': 'nso',
        '8': 'ts',
        '9': 'ss',
        '10': 've',
        '11': 'nr',
      };
      const chosen = langMap[val] || 'en';
      if (onSelectLanguage) {
        onSelectLanguage(chosen);
      }
      endSession(`END Ulimi lushintshiwe / Taal verander / Language preference updated for *134*902#.`);
    }

    setUserInput('');
  };

  const endSession = (msg: string) => {
    setCurrentMenu('end');
    setScreenText(msg);
  };

  const sendSimulatedSms = (text: string) => {
    setSmsNotification(text);
    setTimeout(() => {
      setSmsNotification(null);
    }, 6000);
  };

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Web App</span>
        </button>

        <div className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Offline USSD Gateway (*134*902#)</span>
        </div>
      </div>

      {/* Simulated Phone Frame */}
      <div className="bg-slate-900 p-6 sm:p-8 rounded-[40px] shadow-xl border-4 border-slate-800 max-w-sm mx-auto space-y-5 text-white">
        {/* Phone Top Notch / Speaker */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* SMS Notification Banner (if any) */}
        {smsNotification && (
          <div className="bg-amber-950/90 text-amber-200 p-3.5 rounded-xl shadow-lg border border-amber-500/50 animate-in slide-in-from-top text-xs space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Incoming SMS: comforTech</span>
            </div>
            <p className="text-[11px] leading-tight text-amber-100">{smsNotification}</p>
          </div>
        )}

        {/* Green OLED USSD Screen */}
        <div className="bg-[#07130a] border-2 border-emerald-900/60 rounded-2xl p-4 min-h-[190px] font-mono text-emerald-400 text-xs leading-relaxed flex flex-col justify-between shadow-inner">
          {sessionActive ? (
            <>
              <div className="whitespace-pre-wrap">{screenText}</div>
              {currentMenu !== 'end' && (
                <div className="mt-3 pt-2 border-t border-emerald-950 flex items-center gap-1">
                  <span className="text-white font-bold">&gt;</span>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendInput()}
                    placeholder="Enter choice..."
                    className="bg-transparent text-white w-full focus:outline-none text-xs"
                    autoFocus
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-2 text-emerald-400/80">
              <Phone className="w-8 h-8 mx-auto text-emerald-400" />
              <div className="text-sm font-bold text-emerald-400">comforTech Offline USSD</div>
              <div className="text-[11px] text-emerald-500">Dial *134*902# (Zero Data / Airtime Required)</div>
            </div>
          )}
        </div>

        {/* Action Buttons for USSD Screen */}
        {sessionActive && currentMenu !== 'end' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => endSession("END Session cancelled.")}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSendInput()}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Send
            </button>
          </div>
        ) : !sessionActive ? (
          <button
            onClick={startUssd}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Dial *134*902# Now</span>
          </button>
        ) : (
          <button
            onClick={startUssd}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Start New Session
          </button>
        )}

        {/* Physical Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {keypadButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => {
                if (sessionActive && currentMenu !== 'end') {
                  setUserInput((prev) => prev + btn);
                }
              }}
              className="p-3 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-100 font-mono font-bold text-sm rounded-xl transition-all text-center border border-slate-700 cursor-pointer shadow-xs"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
