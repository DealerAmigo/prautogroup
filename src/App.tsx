import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Car, ChevronRight, MapPin, ShieldCheck, Fuel, Phone, MessageSquare, Menu, X, Sparkles, RotateCcw } from 'lucide-react';
import { ChatMessage, Vehicle } from './types';
import { createSalesmanChat } from './lib/ai';
import { getInventory, searchVehicles } from './lib/inventory';
import { createCalendarEvent, AppointmentDetails } from './lib/calendar';
import BookingForm from './components/BookingForm';
import LeadsDashboard from './components/LeadsDashboard';
import { saveLead, saveChatSession } from './lib/leads';
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
  const [activeTab, setActiveTab] = useState<'chat' | 'inventory'>('chat');
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehiclePitch, setVehiclePitch] = useState<string>('');
  const [isPitching, setIsPitching] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleImageClick = async (imageUrl: string, vehicleData?: Vehicle) => {
    let vehicle = vehicleData || inventory.find(v => v.image === imageUrl);
    
    if (!vehicle && imageUrl.includes('http')) {
      // Trying fuzzy match if exact image fails
      vehicle = inventory.find(v => imageUrl.includes(v.id) || v.image.includes(imageUrl.split('?')[0]));
    }

    setSelectedVehicle(vehicle || null);
    setSelectedImage(imageUrl);
    setVehiclePitch('');
    
    if (vehicle) {
      setIsPitching(true);
      // Track lead
      saveLead({
        type: 'image_click',
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        price: vehicle.price,
        imageUrl: vehicle.image,
        source: 'grid_click'
      });

      // Quick "Reactive" Sales Pitch from AI
      try {
        const prompt = `Vende este auto rápidamente resaltando 3 ventajas competitivas específicas en Puerto Rico para un ${vehicle.year} ${vehicle.make} ${vehicle.model} de $${vehicle.price.toLocaleString()}. Sé breve, persuasivo y usa emojis.`;
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: prompt,
            history: [],
            systemInstruction: "Eres un cerrador de ventas experto de PR Automotive Group. Tu meta es convencer al cliente de que este es el auto perfecto."
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          setVehiclePitch(data.text);
        }
      } catch (e) {
        console.error("Failed to get reactive pitch:", e);
      } finally {
        setIsPitching(false);
      }
    }
  };

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
              content: '¡Hola! Soy **DealerAmigo**, tu asesor experto en PR Automotive Group. \n\n¿Buscas una SUV de 3 filas, una Pick-Up potente o un sedán económico? Cuéntame qué necesitas y te muestro las mejores opciones con **100,000 millas de garantía**.',
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

  useEffect(() => {
    if (inventory.length > 0 && chatRef.current) {
      chatRef.current.setInventory(inventory);
    }
  }, [inventory]);

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
      let responseText = responseTextRaw || '';
      
      // Handle LEAD_DATA tag
      if (responseText.includes('LEAD_DATA:')) {
        const parts = responseText.split('LEAD_DATA:');
        responseText = parts[0].trim();
        try {
          const leadJson = parts[1].trim();
          const leadData = JSON.parse(leadJson);
          saveLead({
            ...leadData,
            type: 'ai_lead_capture',
            fullText: responseTextRaw
          });
          userMsg.intent = 'Lead Capturado';
        } catch (e) {
          console.error("Error parsing LEAD_DATA JSON:", e);
        }
      }

      // Handle MOSTRAR_VEHICULO tag
      if (responseText.includes('MOSTRAR_VEHICULO:')) {
        const parts = responseText.split('MOSTRAR_VEHICULO:');
        responseText = parts[0].trim();
        const vehicleInfo = parts[1].trim();
        
        // Try to find the vehicle in inventory
        const [year, make, ...modelParts] = vehicleInfo.replace('[', '').replace(']', '').split(' ');
        const model = modelParts.join(' ');
        
        const found = inventory.find(v => 
          v.year.toString() === year && 
          v.make.toLowerCase() === make?.toLowerCase() && 
          v.model.toLowerCase().includes(model?.toLowerCase())
        );
        
        if (found) {
          vehiclesToShow = [found];
        }
      }
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || (vehiclesToShow.length > 0 ? '¡Excelente! Aquí tienes la unidad disponible:' : 'Entendido. ¿En qué más puedo ayudarte?'),
        timestamp: Date.now(),
        vehicles: vehiclesToShow.length > 0 ? vehiclesToShow : undefined
      };

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
      
      import('./lib/leads').then(({ saveChatSession }) => {
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
    <div className="flex flex-col h-screen bg-[#080808] overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-12 backdrop-blur-2xl overflow-y-auto"
          >
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }} />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#080808] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.9)]"
            >
              <div className="relative aspect-square lg:aspect-auto h-full min-h-[400px] group/img">
                <img 
                  src={selectedImage} 
                  alt="Enlarged view" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-10 left-10 right-10">
                   <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30">
                        <Car size={32} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-1">Unidad Certificada</p>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">PR Automotive Premium</h3>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }}
                  className="absolute top-8 left-8 text-white bg-black/50 backdrop-blur-md p-4 rounded-full hover:bg-rose-600 transition-all border border-white/10 lg:hidden"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 md:p-16 flex flex-col justify-between bg-[#0a0a0a] relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="h-[2px] w-12 bg-rose-600" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500">Beneficios & Ventajas</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors">
                        <RotateCcw size={16} className="text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {selectedVehicle ? (
                    <div className="space-y-12">
                      <div>
                        <motion.h2 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9] mb-4"
                        >
                          {selectedVehicle.year} <br />
                          <span className="text-rose-600 underline decoration-white/10 underline-offset-8">{selectedVehicle.make}</span> <br />
                          {selectedVehicle.model}
                        </motion.h2>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Precio Especial PR</span>
                             <span className="text-4xl font-mono font-black text-white tracking-tight">${selectedVehicle.price.toLocaleString()}</span>
                          </div>
                          <div className="h-10 w-[1px] bg-white/10" />
                          <div className="bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Stock Disponible</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <BenefitCard icon={<ShieldCheck className="text-rose-500" />} title="Transmisión" desc={selectedVehicle.transmission || "Automática certificada."} />
                        <BenefitCard icon={<Sparkles className="text-rose-500" />} title="Condición" desc={`${selectedVehicle.mileage} - Certificación 115 puntos.`} />
                        <BenefitCard icon={<Fuel className="text-rose-500" />} title="Eficiencia MPG" desc={selectedVehicle.mpg || "Consumo líder en su categoría."} />
                        <BenefitCard icon={<MapPin className="text-rose-500" />} title="Color" desc={`Ext: ${selectedVehicle.exteriorColor || 'N/A'} | Int: ${selectedVehicle.interiorColor || 'N/A'}`} />
                      </div>

                      <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-3">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                           Especificaciones Técnicas
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                          <SpecItem label="Marca" value={selectedVehicle.make} />
                          <SpecItem label="Modelo" value={selectedVehicle.model} />
                          {selectedVehicle.trim && <SpecItem label="Trim/Submodelo" value={selectedVehicle.trim} />}
                          <SpecItem label="Año" value={selectedVehicle.year.toString()} />
                          <SpecItem label="Precio" value={`$${selectedVehicle.price.toLocaleString()}`} />
                          <SpecItem label="Millaje" value={selectedVehicle.mileage || "N/A"} />
                          <SpecItem label="Categoría" value={selectedVehicle.category || "N/A"} />
                          <SpecItem label="Motor" value={selectedVehicle.engine || "N/A"} />
                          <SpecItem label="Tracción" value={selectedVehicle.driveTrain || "N/A"} />
                          <SpecItem label="Transmisión" value={selectedVehicle.transmission || "N/A"} />
                        </ul>
                      </div>

                      {selectedVehicle.description && (
                        <div className="bg-rose-500/5 p-8 rounded-[2rem] border border-rose-500/10">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4 flex items-center gap-3">
                             Notas del Especialista
                          </h4>
                          <p className="text-slate-400 text-sm leading-relaxed italic">
                            "{selectedVehicle.description}"
                          </p>
                        </div>
                      )}

                      <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                          <Sparkles className="text-rose-500" size={50} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 flex items-center gap-3">
                           <div className="w-2 h-2 bg-rose-600 rounded-full" />
                           DealerAmigo AI Sales Pitch
                        </h4>
                        
                        {isPitching ? (
                          <div className="flex flex-col gap-4 py-4">
                            <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
                            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                            <div className="h-4 w-1/2 bg-white/5 rounded-full animate-pulse" />
                          </div>
                        ) : vehiclePitch ? (
                          <p className="text-slate-200 text-xl leading-relaxed italic font-medium tracking-tight">
                            {vehiclePitch}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-lg leading-relaxed italic">
                            "{selectedVehicle.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <Sparkles className="mx-auto text-rose-600 mb-6 animate-pulse" size={60} />
                      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Analizando ventajas competitivas en tiempo real...</p>
                    </div>
                  )}
                </div>

                <div className="mt-16 flex flex-col sm:flex-row gap-5 relative z-10">
                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        handleSend(`Me interesa el ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. ¿Cuáles son los próximos pasos para el financiamiento?`);
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                      }
                    }}
                    className="flex-1 bg-white text-black font-black py-7 rounded-3xl text-xs uppercase tracking-[0.3em] transition-all hover:bg-rose-600 hover:text-white shadow-2xl shadow-white/5 active:scale-95 group/btn"
                  >
                    Hablar con un Experto 
                    <ChevronRight size={16} className="inline ml-2 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                  <button 
                    onClick={() => window.open(`https://wa.me/19397152900?text=Hola! Me interesa el ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model}`, '_blank')}
                    className="px-10 py-7 bg-emerald-600 text-white font-black rounded-3xl text-xs uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    WhatsApp <MessageSquare size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }}
                  className="absolute top-12 right-12 text-slate-700 hover:text-white transition-colors"
                >
                  <X size={32} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp (Mobile Only) */}
      <div className="fixed bottom-32 right-6 z-[60] md:hidden">
        <button 
          onClick={() => window.open('https://wa.me/19397152900', '_blank')}
          className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 animate-bounce transition-transform active:scale-90"
        >
          <MessageSquare size={28} />
        </button>
      </div>

      <header className="py-4 flex-shrink-0 border-b border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-3xl px-6 z-50 sticky top-0">
        <div className="flex items-center justify-between w-full relative max-w-[1800px] mx-auto">
          {/* Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div 
                className="absolute inset-0 border-2 border-white rounded-xl bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              />
              <span className="relative font-round font-black text-sm tracking-tighter text-white z-10 transition-transform group-hover:scale-110">PR</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-round font-black uppercase text-white tracking-tighter">PR Automotive</h1>
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-black transform -skew-x-12 shadow-[0_0_10px_rgba(225,29,72,0.5)]">GROUP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Showroom Abierto • Carolina, PR</span>
              </div>
            </div>
          </div>

          {/* Desktop Info */}
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Ventas VIP</span>
              <a href="tel:+19397152900" className="text-xl font-mono font-black text-white hover:text-rose-500 transition-colors tracking-tighter">
                (939) 715-2900
              </a>
            </div>
            <div className="h-10 w-[1px] bg-white/10 mx-2" />
            <button 
              onClick={() => setIsAdminView(true)}
              className="p-2 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-600 hover:text-white"
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Tab Switcher (Visible on small/medium screens) */}
          <div className="flex md:hidden bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'chat' ? "bg-rose-600 text-white shadow-[0_5px_15px_rgba(225,29,72,0.4)]" : "text-slate-500"
              )}
            >
              Asistente
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'inventory' ? "bg-rose-600 text-white shadow-[0_5px_15px_rgba(225,29,72,0.4)]" : "text-slate-500"
              )}
            >
              Listado
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View */}
      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* Left Column: AI Concierge */}
          <aside 
            key="chat-sidebar"
            className={cn(
              "w-full md:w-[450px] lg:w-[540px] border-r border-white/10 bg-[#0c0c0c] flex flex-col relative transition-all duration-500 ease-in-out",
              activeTab === 'inventory' ? "hidden md:flex" : "flex"
            )}
          >
          {/* Status Bar */}
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Concierge Automotriz Activo</span>
            </div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">v2.4.0-ELITE</span>
          </div>

          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 space-y-10 scroll-smooth custom-scrollbar"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onVehicleClick={(v) => {
                    const messageText = `Me interesa el ${v.year} ${v.make} ${v.model}. Cuéntame más detalles sobre este auto.`;
                    handleSend(messageText);
                    if (window.innerWidth < 768) setActiveTab('chat');
                  }} 
                  onImageClick={handleImageClick}
                />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div className="pb-24" />
          </div>

          {/* Input Bar */}
          <div className="p-5 bg-[#080808]/80 backdrop-blur-2xl border-t border-white/5 shrink-0">
            <div className="relative group flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Habla con tu asesor experto..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-5 pr-14 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/40 focus:bg-white/[0.05] transition-all shadow-2xl"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-600 rounded-xl hover:bg-rose-500 disabled:bg-white/5 disabled:text-slate-700 text-white transition-all shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-90 flex items-center justify-center p-0"
                >
                  <Send size={18} />
                </button>
              </div>
              <button
                onClick={clearChat}
                title="Reiniciar chat"
                className="px-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-rose-600/10 hover:border-rose-600/30 transition-all flex-shrink-0 flex items-center justify-center"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black">
                DealerAmigo AI
              </p>
              <div className="h-3 w-[1px] bg-white/5" />
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black">
                Seguro & Encriptado
              </p>
            </div>
          </div>
        </aside>

        {/* Right Column: Live Inventory Display */}
        <section className={cn(
          "flex-1 bg-[#050505] relative flex-col overflow-hidden transition-all duration-500 ease-in-out",
          activeTab === 'chat' ? "hidden md:flex" : "flex"
        )}>
          {/* Ticker in section header */}
          <div className="bg-rose-600/10 border-b border-rose-600/10 py-3 overflow-hidden shrink-0">
            <div className="flex whitespace-nowrap animate-[ticker_60s_linear_infinite]">
              {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 px-12 flex items-center gap-4">
                  {item}
                  <span className="opacity-20 text-white font-normal">/</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-14 lg:p-20 custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-[2px] w-12 bg-rose-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500">Premium Selection</span>
                </div>
                <h3 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-white leading-none mb-6">
                  Unidades <br/> <span className="text-rose-600">Certificadas</span>
                </h3>
                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                  Calidad excepcional garantizada. Cada vehículo en nuestro inventario pasa por una inspección rigurosa de 115 puntos para asegurar tu tranquilidad total.
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                 <div className="flex gap-3">
                  <button 
                    onClick={() => handleSend("¿Qué SUVs tienen disponibles?")}
                    className="flex-1 md:flex-none px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Ver SUVs
                  </button>
                  <button 
                    onClick={() => handleSend("¿Me pueden tasar mi trade-in?")}
                    className="flex-1 md:flex-none px-8 py-5 bg-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-rose-500 transition-all shadow-[0_15px_30px_rgba(225,29,72,0.3)] active:scale-95"
                  >
                    Tasar Trade-In
                  </button>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 text-emerald-500">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Protección de crédito disponible</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-10 lg:gap-14">
              {inventory.map(v => (
                <VehicleCard key={v.id} vehicle={v} onImageClick={handleImageClick} />
              ))}
            </div>

            {/* Special Request Callout */}
            <div className="mt-24 group relative">
              <div className="absolute inset-0 bg-rose-600/5 blur-3xl rounded-[3rem] -z-10" />
              <div className="bg-[#0c0c0c] border border-white/5 p-10 md:p-16 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Car size={300} strokeWidth={1} className="text-white" />
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-6 flex items-center gap-4">
                    <Sparkles className="text-rose-500" />
                    Búsqueda Personalizada
                  </h4>
                  <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mb-10 font-medium">
                    ¿Tienes un modelo específico en mente que no ves hoy? <br/>
                    Nuestro equipo de <strong>Sourcing Elite</strong> localiza cualquier unidad en Puerto Rico o Estados Unidos y la trae por ti con garantía oficial.
                  </p>
                  <button 
                    onClick={() => handleSend("Necesito que me busquen un auto específico que no está en el listado.")}
                    className="group-hover:translate-x-2 transition-all duration-500 bg-rose-600/10 border border-rose-600/30 text-rose-500 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] inline-flex items-center gap-4 hover:bg-rose-600 hover:text-white"
                  >
                    Activar Búsqueda Especial <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="h-16 bg-black/80 backdrop-blur-xl border-t border-white/[0.05] flex items-center px-10 justify-between shrink-0">
            <div className="hidden lg:flex gap-10">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 bg-rose-600 rounded-full" /> Live Updates
              </span>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 bg-rose-600 rounded-full" /> Bancos Locales & Federales
              </span>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 bg-rose-600 rounded-full" /> Protección Credito Incluida
              </span>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">PR Automotive Group &copy; 2026 • Marginal Los Ángeles</p>
            </div>
          </footer>
        </section>
      </AnimatePresence>
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(225, 29, 72, 0.5);
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message, onVehicleClick, onImageClick }: { message: ChatMessage, onVehicleClick?: (v: Vehicle) => void, onImageClick?: (url: string, v?: Vehicle) => void }) {
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
          "markdown-body leading-relaxed font-round text-lg md:text-xl font-medium"
        )}>
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => (
                <span 
                  className="block my-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer hover:border-rose-500/50 transition-all group relative max-w-sm"
                  onClick={() => {
                    const v = message.vehicles?.find(veh => veh.image === src || veh.model === alt);
                    onImageClick?.(src || '', v);
                    // Track interest on image click
                    import('./lib/leads').then(({ saveLead }) => {
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
                        onImageClick?.(v.image, v);
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
                      <div className="absolute bottom-3 left-4 pointer-events-none">
                        <p className="text-sm font-black text-rose-500 uppercase tracking-tighter leading-none mb-2">{v.year} {v.make}</p>
                        <h5 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{v.model}</h5>
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

function VehicleCard({ vehicle, onImageClick }: { vehicle: Vehicle, onImageClick?: (url: string, v?: Vehicle) => void }) {
  const estimatedPayment = Math.round((vehicle.price * 1.1) / 72); // Super simple estimate

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0c0c0c] border border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-rose-600/30 transition-all duration-700 shadow-3xl flex flex-col h-full"
    >
      <div className="h-72 bg-[#1a1a1a] overflow-hidden relative shrink-0">
        <div 
          onClick={() => onImageClick?.(vehicle.image, vehicle)}
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
           <span className="text-white/10 font-black text-6xl uppercase tracking-tighter block leading-none select-none">
            {vehicle.make}
           </span>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex flex-col gap-1">
          <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-rose-500 transition-colors leading-none">
            {vehicle.model}
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none mt-2">
            Unidad Certificada / Garantía 100K Millas
          </p>
        </div>

        <div className="flex items-center justify-between py-4 border-y border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Precio Online</span>
            <span className="text-3xl font-mono text-white font-black tracking-tighter">
              ${vehicle.price.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-black text-rose-500 tracking-widest mb-1">Est. Mensual</span>
            <span className="text-2xl font-mono text-white font-black tracking-tighter">
              ${estimatedPayment}/mo*
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <Fuel size={14} className="text-rose-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-round font-bold text-slate-500 leading-none mb-1">Millaje</span>
              <span className="text-sm uppercase font-black text-slate-400 tracking-wider font-mono">{vehicle.mileage}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <ShieldCheck size={14} className="text-rose-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-round font-bold text-slate-500 leading-none mb-1">Garantía</span>
              <span className="text-sm uppercase font-black text-slate-400 tracking-wider font-mono">100K Mi</span>
            </div>
          </div>
        </div>

        {vehicle.specialOffer && (
          <div className="bg-rose-600/10 border border-rose-600/30 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-black text-rose-500 tracking-widest block mb-1">Oferta Especial</span>
            <p className="text-sm font-bold text-white tracking-tight">{vehicle.specialOffer}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button 
            className="flex-1 bg-rose-600 text-white font-round font-black py-5 rounded-[1.5rem] text-sm uppercase tracking-[0.2em] transition-all hover:bg-rose-500 shadow-[0_10px_30px_rgba(225,29,72,0.3)] active:scale-95 flex items-center justify-center gap-3 group/btn"
            onClick={() => window.open(`https://wa.me/19397152900?text=Hola! Me interesa el ${vehicle.year} ${vehicle.make} ${vehicle.model} de ${vehicle.price}`, '_blank')}
          >
            WhatsApp
            <MessageSquare size={16} className="group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => onImageClick?.(vehicle.image)}
            className="w-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center text-white hover:bg-rose-600 transition-all"
          >
            <Sparkles size={20} className="text-rose-500 group-hover:text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SpecItem({ label, value }: { label: string, value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-200 tracking-tight">{value}</span>
    </li>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-rose-600/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h5 className="text-sm font-black uppercase tracking-widest text-white mb-1">{title}</h5>
        <p className="text-xs text-slate-500 font-bold leading-tight">{desc}</p>
      </div>
    </div>
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
