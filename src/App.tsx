import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Car, ChevronRight, MapPin, ShieldCheck, Fuel, Phone, MessageSquare, Menu, X, Sparkles } from 'lucide-react';
import { ChatMessage, Vehicle } from './types';
import { createSalesmanChat } from './lib/gemini';
import { getInventory, searchVehicles } from './lib/inventory';
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
      const data = await getInventory();
      setInventory(data);
      setIsLoadingInventory(false);
      
      // Initialize chat with inventory
      chatRef.current = createSalesmanChat(data);
    };
    
    init();
    
    // Welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy **DealerAmigo**. ¿Buscas algún modelo en específico o quieres ver nuestro inventario hoy?\n\n*Tip: Puedes hacer clic en los vehículos que te muestre para ver más detalles.*',
        timestamp: Date.now()
      }
    ]);
  }, []);

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

    try {
      const result = await chatRef.current.sendMessage(textToSubmit);
      const response = await result.response;
      const text = typeof response.text === 'function' ? response.text() : response.text;
      
      // Handle tool calls if any
      const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
      let vehiclesToShow: Vehicle[] = [];
      
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'search_inventory') {
            const query = (call.args as any).query || '';
            const results = searchVehicles(inventory, query);
            vehiclesToShow = results;
          } else if (call.name === 'request_car') {
            const args = call.args as any;
            import('./lib/firebase').then(({ saveLead }) => {
              saveLead({
                ...args,
                type: 'car_request',
                inputText
              });
            });
          }
        }
      }

      const responseText = text || '';
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (responseText.split('CITA_CONFIRMADA:')[0] || responseText).trim() || 'Entendido. ¿En qué más puedo ayudarte?',
        timestamp: Date.now(),
        vehicles: vehiclesToShow.length > 0 ? vehiclesToShow : undefined
      };

      // Detect CITA_CONFIRMADA
      if (responseText.includes('CITA_CONFIRMADA:')) {
        const appointmentData = responseText.split('CITA_CONFIRMADA:')[1].trim();
        const [nombre, telefono, presupuesto, vehiculo, credito, dealer] = appointmentData.split('|');
        import('./lib/firebase').then(({ saveLead }) => {
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
        });
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

  return (
    <div className="flex flex-col h-screen bg-[#080808] overflow-hidden">
      {/* Top Branding Bar */}
      <header className="h-20 flex-shrink-0 border-b border-white/[0.08] bg-black/50 backdrop-blur-2xl flex items-center justify-between px-8 z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            <span className="font-black text-xl tracking-tighter text-white">PR</span>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-tight">
              PR Automotive Group
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em]">
                Elite Inventory & AI Concierge
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden lg:block text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Marginal Los Angeles, Carolina</p>
            <p className="text-[9px] text-emerald-400 font-black uppercase">Dealer Autorizado</p>
          </div>
          <button className="bg-white/5 hover:bg-white/10 p-3 rounded-full border border-white/10 transition-all">
            <Phone size={18} className="text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area: Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: AI Concierge */}
        <aside className="w-full md:w-[380px] lg:w-[420px] border-r border-white/10 bg-[#0c0c0c] flex flex-col relative">
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
                />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div className="pb-24" />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-black/40 border-t border-white/5 shrink-0 backdrop-blur-md">
            <div className="relative group">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Pregúntame por el inventario..."
                className="w-full bg-[#151515] border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all shadow-xl"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className="absolute right-2 top-1.5 p-2 bg-rose-600 rounded-lg hover:bg-rose-500 disabled:bg-stone-800 text-white transition-all shadow-lg active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-600 mt-3 uppercase tracking-[0.2em] font-bold">
              Powered by PR Automotive Engine
            </p>
          </div>
        </aside>

        {/* Right Column: Live Inventory Display */}
        <section className="hidden md:flex flex-1 bg-[#050505] relative flex-col overflow-hidden">
          {/* Ticker in section header */}
          <div className="bg-rose-700/10 border-b border-rose-600/10 py-2 overflow-hidden shrink-0">
            <div className="flex whitespace-nowrap animate-[ticker_40s_linear_infinite]">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-500 px-8 flex items-center gap-4">
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
                <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-colors">
                  Filtrar
                </button>
                <button className="px-6 py-2.5 bg-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 active:scale-95">
                  Pedir un Auto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {inventory.map(v => (
                <VehicleCard key={v.id} vehicle={v} />
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

          <footer className="h-10 bg-black border-t border-white/10 flex items-center px-8 justify-between shrink-0">
            <div className="flex gap-6">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">Live Inventory</span>
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">Financiamiento 100%</span>
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">Trade-In Ready</span>
            </div>
            <p className="text-[9px] text-slate-800 font-bold uppercase">PR Automotive Group &copy; 2024</p>
          </footer>
        </section>
      </main>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message, onVehicleClick }: { message: ChatMessage, onVehicleClick?: (v: Vehicle) => void }) {
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
        "max-w-[85%] px-5 py-4 rounded-3xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl border transition-all duration-300",
        isBot 
          ? "bg-white/[0.03] border-white/[0.08] rounded-tl-none text-slate-100" 
          : "bg-rose-600 border-rose-500 rounded-tr-none text-white shadow-[0_10px_20px_rgba(225,29,72,0.2)]"
      )}>
        <div className="markdown-body text-sm leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>

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
                    <img 
                      src={v.image} 
                      alt={v.model} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2">
                       <span className="bg-rose-600 text-[8px] font-black px-2 py-1 rounded text-white uppercase shadow-lg">Certificado</span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter leading-none mb-1">{v.year} {v.make}</p>
                      <h5 className="text-base font-black text-white uppercase italic tracking-tighter leading-none">{v.model}</h5>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center bg-black/20">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Precio Online</span>
                      <span className="text-base font-mono font-black text-white tracking-tighter leading-none">${v.price.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-rose-600/10 rounded-lg group-hover:bg-rose-600 transition-colors">
                      <ChevronRight size={16} className="text-rose-500 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <span className={cn(
        "text-[9px] uppercase font-black tracking-widest text-slate-600 px-2",
        isBot ? "text-rose-500/40" : ""
      )}>
        {isBot ? "DealerAmigo · PR Group" : "Interesado"}
      </span>
    </motion.div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0c0c0c] border border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-rose-600/30 transition-all duration-700 shadow-3xl"
    >
      <div className="h-64 bg-[#1a1a1a] overflow-hidden relative">
        <img 
          src={vehicle.image} 
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 flex gap-2">
          <div className="bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)] text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider text-white">
            {vehicle.year}
          </div>
          <div className="bg-black/80 backdrop-blur-md text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider text-white border border-white/10">
            Certified
          </div>
        </div>

        <div className="absolute bottom-6 left-8">
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
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
            Unidad Certificada / Garantía 100K
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-3xl font-mono text-white font-black tracking-tighter">
            ${vehicle.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Disponible
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <Fuel size={14} className="text-rose-600" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">{vehicle.mileage}</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <ShieldCheck size={14} className="text-rose-600" />
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Garantizado</span>
          </div>
        </div>

        <button className="w-full bg-rose-600 text-white font-black py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-rose-500 shadow-[0_10px_30px_rgba(225,29,72,0.3)] active:scale-95 flex items-center justify-center gap-3 group/btn">
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
