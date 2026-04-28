import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Car, ChevronRight, MapPin, ShieldCheck, Fuel, Phone, MessageSquare, Menu, X, Sparkles, RotateCcw } from 'lucide-react';
import { ChatMessage, Vehicle } from './types';
import { createSalesmanChat } from './lib/gemini';
import { getInventory, searchVehicles } from './lib/inventory';
import { createCalendarEvent, AppointmentDetails } from './lib/calendar';
import BookingForm from './components/BookingForm';
import LeadsDashboard from './components/LeadsDashboard';
import { saveLead, saveChatSession } from './lib/firebase';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TICKER_ITEMS = [
  "Excelencia automotriz garantizada",
  "Garantía hasta 100,000 millas",
  "Financiamiento flexible disponible",
  "Protección de crédito incluida",
  "Tanque lleno en cada entrega",
  "Entrega en toda la isla",
  "Recibimos tu trade-in con o sin deuda",
  "Certificación de 115 puntos"
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const loadInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const data = await getInventory();
      setInventory(data);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getInventory();
        setInventory(data);
        
        // Load saved state from sessionStorage
        let initialMessages = null;
        let initialHistory = [];
        
        try {
          const savedMessages = sessionStorage.getItem('chat-messages');
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialMessages = parsed;
            }
          }

          const savedHistory = sessionStorage.getItem('gemini-history');
          if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            if (Array.isArray(parsed)) {
              initialHistory = parsed;
            }
          }
        } catch (e) {
          console.error("Corruption in session storage detected:", e);
        }

        if (initialMessages) {
          setMessages(initialMessages);
        } else {
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: '¡Hola! Soy **DealerAmigo**. ¿Buscas algún modelo en específico o quieres ver nuestro inventario hoy?\n\n*Tip: Puedes hacer clic en los vehículos que te muestre para ver más detalles.*',
              timestamp: Date.now()
            }
          ]);
        }
        
        // Initialize chat with inventory and saved history
        chatRef.current = createSalesmanChat(data, initialHistory);
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoadingInventory(false);
      }
    };
    
    init();
  }, []);

  // Persistence effect
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('chat-messages', JSON.stringify(messages));
      }
      if (chatRef.current) {
        const history = chatRef.current.getHistory();
        if (history && history.length > 0) {
          sessionStorage.setItem('gemini-history', JSON.stringify(history));
        }
      }
    } catch (e) {
      console.warn("Could not save chat state to sessionStorage:", e);
    }
  }, [messages]);

  const clearChat = () => {
    sessionStorage.removeItem('chat-messages');
    sessionStorage.removeItem('gemini-history');
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '¡Listo! He reiniciado nuestra conversación. ¿En qué vehículo te puedo ayudar ahora?',
        timestamp: Date.now()
      }
    ]);
    if (chatRef.current) {
      chatRef.current.setHistory([]);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend(manualMessage?: string) {
    const textToSubmit = manualMessage || inputText;
    if (!textToSubmit.trim() || isTyping || !chatRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSubmit,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!manualMessage) setInputText('');
    setIsTyping(true);
    let vehiclesToShow: Vehicle[] = [];

    try {
      let chatResponse = await chatRef.current.sendMessage(textToSubmit);
      let response = chatResponse.response;
      let functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
      
      // Multi-turn tool handling
      let maxTurns = 3;
      while (functionCalls && Array.isArray(functionCalls) && functionCalls.length > 0 && maxTurns > 0) {
        maxTurns--;
        const toolResults: any[] = [];
        let shouldStopAfterTools = false;

        for (const call of functionCalls) {
          if (call.name === 'search_inventory') {
            const args = call.args as any;
            const results = searchVehicles(inventory, {
              query: args.query || '',
              category: args.category || '',
              maxPrice: args.maxPrice || 0
            });
            vehiclesToShow = [...vehiclesToShow, ...results];
            toolResults.push({ name: call.name, result: { 
              count: results.length,
              results: results.slice(0, 5).map(v => `${v.year} ${v.make} ${v.model} ($${v.price})`)
            }});
          } else if (call.name === 'show_booking_form') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: '¡Excelente! Aquí tienes el formulario para coordinar tu visita. Solo toma 30 segundos.',
              timestamp: Date.now(),
              isBookingForm: true
            }]);
            toolResults.push({ name: call.name, result: { shown: true } });
            shouldStopAfterTools = true;
          } else if (call.name === 'request_car') {
            const args = call.args as any;
            saveLead({ ...args, type: 'car_request', inputText: textToSubmit });
            userMsg.intent = 'Petición';
            toolResults.push({ name: call.name, result: { success: true, message: "Petición registrada correctamente." } });
          } else if (call.name === 'register_lead') {
            const args = call.args as any;
            saveLead({ ...args, type: 'proposal_request', inputText: textToSubmit, source: args.source || 'chat' });
            userMsg.intent = 'Interesado';
            toolResults.push({ name: call.name, result: { success: true, message: "Lead guardado exitosamente." } });
          } else if (call.name === 'schedule_appointment') {
            const args = call.args as AppointmentDetails;
            try {
              await createCalendarEvent(args);
              userMsg.intent = 'Cita';
              toolResults.push({ name: call.name, result: { success: true, message: "Cita agendada exitosamente." } });
            } catch (err: any) {
              toolResults.push({ name: call.name, result: { success: false, error: err.message } });
            }
          }
        }

        // Add results to history
        toolResults.forEach(tr => chatRef.current.addFunctionResponse(tr.name, tr.result));

        if (shouldStopAfterTools) break;

        // Get AI reaction to tool execution
        // We send a special message "Tool result processed" but our sendMessage normally takes a string
        // We'll modify sendMessage to handle empty message if we want, or just send a dummy string that the server doesn't use for content if function results are present.
        // Actually, we'll just call sendMessage with an empty string or something like "CONTINUE"
        chatResponse = await chatRef.current.sendMessage("");
        response = chatResponse.response;
        functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
      }

      const responseTextRaw = typeof response.text === 'function' ? response.text() : (response.text || '');
      const responseText = responseTextRaw || '';
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (responseText.split('CITA_CONFIRMADA:')[0] || responseText).trim() || (vehiclesToShow.length > 0 ? '¡Excelente! Aquí tienes las unidades disponibles:' : 'Entendido. ¿En qué más puedo ayudarte?'),
        timestamp: Date.now(),
        vehicles: vehiclesToShow.length > 0 ? vehiclesToShow : undefined
      };

      // Detect CITA_CONFIRMADA
      if (responseText && responseText.includes('CITA_CONFIRMADA:')) {
        const parts = responseText.split('CITA_CONFIRMADA:');
        if (parts.length > 1) {
          const appointmentData = parts[1].trim();
          const [nombre, telefono, presupuesto, vehiculo, credito, dealer] = appointmentData.split('|');
          saveLead({
            type: 'appointment',
            nombre,
            telefono,
            presupuesto,
            vehiculo,
            credito,
            dealer,
            fullText: responseText
          });
        }
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMessage = error?.message || "Lo siento, tuve un pequeño inconveniente.";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}. ¿Podrías repetirme eso?`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  // Effect to sync chat to Firebase if logged in (or just unique device ID)
  useEffect(() => {
    if (messages.length > 1) {
      const sessionId = sessionStorage.getItem('chat-session-id') || Date.now().toString();
      if (!sessionStorage.getItem('chat-session-id')) {
        sessionStorage.setItem('chat-session-id', sessionId);
      }
      
      import('./lib/firebase').then(({ saveChatSession }) => {
        if (saveChatSession) {
          saveChatSession(sessionId, messages);
        }
      });
    }
  }, [messages]);

  const handleSaveNote = async (note: string) => {
    const sessionId = sessionStorage.getItem('chat-session-id');
    if (sessionId) {
      await saveLead({
        type: 'note',
        content: note,
        sessionId,
        timestamp: Date.now()
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#080808] overflow-hidden">
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
            >
              <img 
                src={selectedImage} 
                alt="Enlarged view" 
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white flex items-center gap-2 hover:text-rose-500 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10"
              >
                <X size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Cerrar</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <header className="py-2.5 flex-shrink-0 border-b border-white/[0.08] bg-black/50 backdrop-blur-2xl px-6 z-50 sticky top-0">
        <div className="flex items-center justify-center w-full relative">
          {/* Centered Logo Cluster */}
          <div className="flex flex-col items-center">
            {/* Logo Shield (Refined Replica) */}
            <div className="relative w-9 h-10 flex items-center justify-center mb-1">
              <div 
                className="absolute inset-0 border-2 border-white rounded-t-xl rounded-b-[1.75rem] bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
              <span className="relative font-round font-black text-sm tracking-tighter text-white z-10 drop-shadow-md">PR</span>
            </div>
            
            {/* Main Branding */}
            <div className="flex flex-col items-center gap-0">
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-round font-black uppercase text-white tracking-tighter">PR</h1>
                <h1 className="text-sm font-round font-black uppercase text-rose-600 tracking-tighter">Automotive</h1>
                <h1 className="text-sm font-round font-black uppercase text-white tracking-tighter">Group</h1>
              </div>
              
              {/* Slanted Ribbon */}
              <div className="relative mt-0.5">
                <div className="bg-rose-600 px-2.5 py-0 transform -skew-x-12 flex items-center justify-center">
                  <span className="text-[5px] font-round font-black uppercase text-white tracking-[0.2em] skew-x-12 whitespace-nowrap">
                    Retail & Wholesale
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Small Phone Button (Absolute Right) */}
          <div className="absolute right-0 flex items-center gap-2">
            <a 
              href="tel:+19397152900" 
              className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center shadow-[0_4px_10px_rgba(225,29,72,0.3)] active:scale-95 transition-transform"
            >
              <Phone size={12} className="text-white" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: AI Concierge */}
        <aside className="w-full md:w-[450px] lg:w-[500px] border-r border-white/10 bg-[#0c0c0c] flex flex-col relative">
          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onVehicleClick={(v) => {
                    const messageText = `Me interesa el ${v.year} ${v.make} ${v.model}. Cuéntame más detalles sobre este auto.`;
                    handleSend(messageText);
                  }} 
                  onImageClick={setSelectedImage}
                />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div className="pb-24" />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-black/40 border-t border-white/5 shrink-0 backdrop-blur-md">
            <div className="relative group flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Pregúntame por el inventario..."
                  className="w-full bg-[#151515] border border-white/10 rounded-xl py-4 pl-4 pr-12 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all shadow-xl"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 top-2 p-2 bg-rose-600 rounded-lg hover:bg-rose-500 disabled:bg-stone-800 text-white transition-all shadow-lg active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
              <button
                onClick={clearChat}
                title="Nueva conversación"
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <RotateCcw size={22} />
              </button>
            </div>
            <p className="text-xs text-center text-slate-600 mt-3 uppercase tracking-[0.2em] font-bold">
              Powered by DealerAmigo
            </p>
          </div>
        </aside>

        {/* Right Column: Live Inventory Display */}
        <section className="hidden md:flex flex-1 bg-[#050505] relative flex-col overflow-hidden">
          {/* Ticker in section header */}
          <div className="bg-rose-700/10 border-b border-rose-600/10 py-2 overflow-hidden shrink-0">
            <div className="flex whitespace-nowrap animate-[ticker_40s_linear_infinite]">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500 px-8 flex items-center gap-4">
                  {item}
                  <span className="opacity-30 text-slate-600">●</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                  Inventario Destacado
                </h3>
                <p className="text-sm text-slate-500 font-medium">Modelos premium disponibles para entrega inmediata</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-colors">
                  Filtrar
                </button>
                <button className="px-6 py-2.5 bg-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 active:scale-95">
                  Pedir un Auto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {inventory.map(v => (
                <VehicleCard key={v.id} vehicle={v} onImageClick={setSelectedImage} />
              ))}
            </div>

            {/* Special Request Callout */}
            <div className="mt-16 group">
              <div className="bg-gradient-to-r from-rose-950/40 via-rose-900/10 to-transparent border-l-4 border-rose-600 p-8 rounded-r-3xl backdrop-blur-sm shadow-2xl transition-all hover:translate-x-1">
                <h4 className="text-xl font-bold mb-2 uppercase tracking-tight text-white flex items-center gap-3">
                  <Sparkles className="text-rose-500" />
                  ¿No encuentras lo que buscas?
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Cuéntanos qué auto necesitas. Tenemos acceso a subastas exclusivas y red de dealers premium en toda la isla y EE.UU. <strong>Lo traemos por ti con los mejores beneficios.</strong>
                </p>
                <button className="mt-6 text-rose-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  Hablar con un experto <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <footer className="h-12 bg-black border-t border-white/10 flex items-center px-8 justify-between shrink-0">
            <div className="flex gap-6">
              <span className="text-xs text-slate-600 uppercase font-bold tracking-[0.2em]">Live Inventory</span>
              <span className="text-xs text-slate-600 uppercase font-bold tracking-[0.2em]">Financiamiento 100%</span>
              <span className="text-xs text-slate-600 uppercase font-bold tracking-[0.2em]">Trade-In Ready</span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-800 font-round font-bold uppercase">PR Automotive Group &copy; 2024</p>
            </div>
          </footer>
        </section>
      </main>

      {isAdminView && (
        <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col">
          <div className="bg-[#111] p-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-pink-500 w-5 h-5" />
              <span className="font-bold uppercase tracking-tighter text-lg">Panel de Gestión</span>
            </div>
            <button 
              onClick={() => setIsAdminView(false)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase transition-all"
            >
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LeadsDashboard />
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message, onVehicleClick, onImageClick }: { message: ChatMessage, onVehicleClick?: (v: Vehicle) => void, onImageClick?: (url: string) => void }) {
  const isBot = message.role === 'assistant';
  const hasVehicles = message.vehicles && message.vehicles.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-2 w-full",
        isBot ? "items-start" : "items-end"
      )}
    >
      <div className={cn(
        "max-w-[85%] px-6 py-5 rounded-3xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl border transition-all duration-300",
        isBot 
          ? "bg-white/[0.03] border-white/[0.08] rounded-tl-none text-slate-100" 
          : "bg-rose-600 border-rose-500 rounded-tr-none text-white shadow-[0_10px_20px_rgba(225,29,72,0.2)]"
      )}>
        <div className={cn(
          "markdown-body leading-relaxed font-round text-base md:text-lg font-medium"
        )}>
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => (
                <span 
                  className="block my-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer hover:border-rose-500/50 transition-all group relative max-w-sm"
                  onClick={() => {
                    onImageClick?.(src || '');
                    // Track interest on image click
                    import('./lib/firebase').then(({ saveLead }) => {
                      if (saveLead) {
                        saveLead({
                          type: 'image_interaction',
                          imageUrl: src,
                          vehicle: alt,
                          timestamp: Date.now()
                        });
                      }
                    });
                  }}
                >
                  <span className="relative block aspect-[16/9]">
                    <img 
                      src={src} 
                      alt={alt} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-4">
                      <span className="text-xs font-black text-white uppercase tracking-widest bg-rose-600 px-2 py-1 rounded shadow-[0_2px_8px_rgba(225,29,72,0.4)]">Ver Galería</span>
                    </span>
                  </span>
                  <span className="p-3 bg-black/40 text-sm font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center backdrop-blur-sm">
                    <span>{alt || "PR Automotive Group"}</span>
                    <span className="text-rose-500 group-hover:translate-x-1 transition-transform text-sm">WhatsApp →</span>
                  </span>
                </span>
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {isBot && message.isBookingForm && (
        <div className="w-full mt-2">
          <BookingForm onSuccess={(data) => {
            console.log("Booking confirmed", data);
          }} />
        </div>
      )}

      {hasVehicles && (
        <div className="w-full overflow-hidden mt-1">
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x no-scrollbar">
            {message.vehicles!.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-shrink-0 w-[240px] snap-start"
              >
                <div 
                  onClick={() => onVehicleClick?.(v)}
                  className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-rose-500/50 transition-all group shadow-xl"
                >
                  <div className="relative h-36 overflow-hidden">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick?.(v.image);
                      }}
                      className="cursor-zoom-in"
                    >
                      <img 
                        src={v.image} 
                        alt={v.model} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="bg-rose-600 text-[10px] font-black px-2 py-1 rounded text-white uppercase shadow-lg">Certificado</span>
                      </div>
                      <div className="absolute bottom-3 left-3 pointer-events-none">
                        <p className="text-xs font-black text-rose-500 uppercase tracking-tighter leading-none mb-1">{v.year} {v.make}</p>
                        <h5 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{v.model}</h5>
                      </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2 bg-black/20">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-round font-bold uppercase tracking-widest leading-none mb-2">Precio Online</span>
                        <span className="text-lg font-mono font-black text-white tracking-tighter leading-none">${v.price.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-rose-600/10 rounded-lg group-hover:bg-rose-600 transition-colors">
                        <ChevronRight size={18} className="text-rose-500 group-hover:text-white" />
                      </div>
                    </div>
                    {(v.mpg || v.mileage) && (
                      <div className="flex gap-4 pt-1 border-t border-white/5">
                        {v.mileage && <span className="text-xs text-slate-400 font-round font-bold uppercase tracking-tight">{v.mileage}</span>}
                        {v.mpg && <span className="text-xs text-emerald-400 font-round font-bold uppercase tracking-tight">{v.mpg}</span>}
                      </div>
                    )}
                    {v.specialOffer && (
                      <div className="bg-rose-950/30 border border-rose-500/20 px-2 py-1 rounded text-xs text-rose-300 font-bold uppercase tracking-tighter w-fit">
                        {v.specialOffer}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <span className={cn(
        "text-xs uppercase font-round font-black tracking-widest text-slate-600 px-2 mt-1",
        !message.intent ? "hidden" : ""
      )}>
        {message.intent}
      </span>
    </motion.div>
  );
}

function VehicleCard({ vehicle, onImageClick }: { vehicle: Vehicle, onImageClick?: (url: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0c0c0c] border border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-rose-600/30 transition-all duration-700 shadow-3xl"
    >
      <div className="h-64 bg-[#1a1a1a] overflow-hidden relative">
        <div 
          onClick={() => onImageClick?.(vehicle.image)}
          className="cursor-zoom-in"
        >
          <img 
            src={vehicle.image} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-black/20 to-transparent pointer-events-none" />
        
        <div className="absolute top-6 left-6 flex gap-2 pointer-events-none">
          <div className="bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)] text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider text-white">
            {vehicle.year}
          </div>
          <div className="bg-black/80 backdrop-blur-md text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider text-white border border-white/10">
            Certified
          </div>
        </div>

        <div className="absolute bottom-6 left-8 pointer-events-none">
           <span className="text-white/10 font-black text-6xl uppercase tracking-tighter block leading-none">
            {vehicle.make}
           </span>
        </div>
      </div>
      <div className="p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-rose-500 transition-colors leading-none">
            {vehicle.model}
          </h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">
            Unidad Certificada / Garantía 100K
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-3xl font-mono text-white font-black tracking-tighter">
            ${vehicle.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Disponible
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <Fuel size={14} className="text-rose-600" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-round font-bold text-slate-500 leading-none mb-1">Millaje</span>
              <span className="text-sm uppercase font-black text-slate-400 tracking-wider font-mono">{vehicle.mileage}</span>
            </div>
          </div>
          {vehicle.mpg ? (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Sparkles size={14} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs uppercase font-round font-bold text-slate-500 leading-none mb-1">Eficiencia</span>
                <span className="text-sm uppercase font-black text-emerald-400 tracking-wider font-mono">{vehicle.mpg}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <ShieldCheck size={14} className="text-rose-600" />
              <span className="text-xs uppercase font-round font-black text-slate-400 tracking-wider">Garantizado</span>
            </div>
          )}
        </div>

        {vehicle.specialOffer && (
          <div className="bg-rose-600/10 border border-rose-600/30 p-4 rounded-2xl animate-pulse">
            <span className="text-xs uppercase font-black text-rose-500 tracking-widest block mb-1">Oferta Especial</span>
            <p className="text-sm font-bold text-white tracking-tight">{vehicle.specialOffer}</p>
          </div>
        )}

        <button className="w-full bg-rose-600 text-white font-round font-black py-5 rounded-[1.5rem] text-sm uppercase tracking-[0.2em] transition-all hover:bg-rose-500 shadow-[0_10px_30px_rgba(225,29,72,0.3)] active:scale-95 flex items-center justify-center gap-3 group/btn">
          Cotización VIP
          <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="bg-rose-600/10 border border-rose-600/20 px-5 py-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center w-fit backdrop-blur-xl">
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          className="w-1.5 h-1.5 bg-rose-500 rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          className="w-1.5 h-1.5 bg-rose-500 rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          className="w-1.5 h-1.5 bg-rose-500 rounded-full" 
        />
      </div>
    </div>
  );
}
