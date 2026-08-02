import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Car, ChevronRight, ChevronLeft, MapPin, ShieldCheck, Fuel, Phone, MessageSquare, Menu, X, Sparkles, RotateCcw, ExternalLink, Settings2, Gauge } from 'lucide-react';
import { ChatMessage, Vehicle } from './types';
import { createSalesmanChat } from './lib/ai';
import { createCalendarEvent, AppointmentDetails } from './lib/calendar';
import BookingForm from './components/BookingForm';
import { saveLead, saveChatSession } from './lib/leads';
import { getInventory, getCachedInventory, searchVehicles } from './lib/inventory';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TICKER_ITEMS = [
  "Excelencia automotriz garantizada",
  "Inspección Rigurosa de 115 Puntos",
  "Financiamiento flexible disponible",
  "Protección de crédito incluida",
  "Tanque lleno en cada entrega",
  "Entrega en toda la isla",
  "Recibimos tu trade-in con o sin deuda",
  "Certificación de 115 puntos"
];

export default function App() {
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    let id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('chat-session-id') : null;
    if (!id) {
      id = Math.random().toString(36).substring(2, 9);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('chat-session-id', id);
    }
    sessionIdRef.current = id;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inventory, setInventory] = useState<Vehicle[]>(() => {
    try {
      return getCachedInventory();
    } catch (e) {
      return [];
    }
  });
  const [isLoadingInventory, setIsLoadingInventory] = useState(() => {
    try {
      return getCachedInventory().length === 0;
    } catch (e) {
      return true;
    }
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGalleryVehicle, setSelectedGalleryVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'inventory'>(() => {
    // Dentro del widget embebido (iframe en gtautopr.com) arranca en chat.
    // Nota: el dominio público del widget será livechat.gtautopr.com
    // Si se visita la URL de Cloud Run directo, se mantiene el comportamiento original.
    try {
      return window.self !== window.top ? 'chat' : 'inventory';
    } catch (e) {
      // Acceso a window.top bloqueado por el navegador = definitivamente estamos en un iframe cross-origin
      return 'chat';
    }
  });
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Filter States
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(0);

  // Determine actual maximum price in inventory to set initial slider boundary
  const absoluteMaxPrice = useMemo(() => {
    if (inventory.length === 0) return 100000;
    return Math.max(...inventory.map(v => v.price));
  }, [inventory]);

  // Set the default selectedMaxPrice to absoluteMaxPrice once inventory is loaded
  useEffect(() => {
    if (inventory.length > 0 && selectedMaxPrice === 0) {
      setSelectedMaxPrice(Math.max(...inventory.map(v => v.price)));
    }
  }, [inventory, selectedMaxPrice]);

  // Extract unique options dynamically
  const uniqueMakes = useMemo(() => {
    const list = Array.from(new Set(inventory.map(v => v.make).filter(Boolean)));
    return list.sort();
  }, [inventory]);

  const uniqueCategories = useMemo(() => {
    const list = Array.from(new Set(inventory.map(v => v.category).filter(Boolean)));
    return list.sort();
  }, [inventory]);

  const uniqueYears = useMemo(() => {
    const list = Array.from(new Set(inventory.map(v => v.year).filter(Boolean)));
    return list.sort((a, b) => b - a);
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(v => {
      const matchMake = selectedMake === 'all' || v.make.toLowerCase() === selectedMake.toLowerCase();
      const matchCategory = selectedCategory === 'all' || v.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchYear = selectedYear === 'all' || v.year.toString() === selectedYear;
      const matchPrice = v.price <= (selectedMaxPrice || absoluteMaxPrice);
      return matchMake && matchCategory && matchYear && matchPrice;
    });
  }, [inventory, selectedMake, selectedCategory, selectedYear, selectedMaxPrice, absoluteMaxPrice]);

  const activeVehicleImages = useMemo(() => {
    if (selectedVehicle) {
      if (selectedVehicle.images && selectedVehicle.images.length > 0) {
        return selectedVehicle.images;
      }
      return [selectedVehicle.image];
    }
    return selectedImage ? [selectedImage] : [];
  }, [selectedVehicle, selectedImage]);

  useEffect(() => {
    if (selectedVehicle && selectedImage) {
      const idx = (selectedVehicle.images || []).indexOf(selectedImage);
      setActiveImageIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveImageIndex(0);
    }
  }, [selectedVehicle, selectedImage]);

  const [vehiclePitch, setVehiclePitch] = useState<string>('');
  const [isPitching, setIsPitching] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Rastrea si ya se envió el evento "nuevo_lead" en esta conversación,
  // para que el GAS no repita el email de "nuevo lead" en cada actualización.
  const leadEventTypeRef = useRef<'nuevo_lead' | 'actualizacion'>('nuevo_lead');
  // Timer de debounce: solo guardamos el lead 60s después de que el cliente
  // deja de escribir, para no mandar data a medias en cada mensaje.
  const leadSaveTimerRef = useRef<any>(null);

  // ---- Re-enganche por inactividad ----
  // "Mini cache" en memoria (se borra solo con refresh, tal como se pidió) --
  // pool de 3 preguntas frescas que Camilo genera en CADA respuesta real (sin
  // llamada extra a Claude), listas para usarse si el cliente se queda callado.
  const [nudgePool, setNudgePool] = useState<string[]>([]);
  const idleTimerRef = useRef<any>(null);
  const IDLE_NUDGE_MS = 25000;

  const handleGalleryClick = (vehicle: Vehicle) => {
    setSelectedGalleryVehicle(vehicle);
    setActiveImageIndex(0);
  };

  const handleImageClick = async (imageUrl: string, vehicleData?: Vehicle) => {
    let vehicle = vehicleData;
    
    const getTrulyCleanImageUrl = (url: string): string => {
      if (!url) return "";
      try {
        if (url.includes('apicdn.inventario360.com/img')) {
          const urlObj = new URL(url);
          const srcParam = urlObj.searchParams.get("src");
          if (srcParam) {
            return decodeURIComponent(srcParam).split(/[?#]/)[0];
          }
        }
      } catch (e) {
        // Fallback to simple string splits
      }
      return url.split(/[?#]/)[0];
    };

    if (!vehicle) {
      // 1. Exact match on primary image
      vehicle = inventory.find(v => v.image === imageUrl);
    }
    
    if (!vehicle) {
      // 2. Exact match in the images array
      vehicle = inventory.find(v => v.images && v.images.includes(imageUrl));
    }
    
    if (!vehicle && imageUrl.includes('http')) {
      // 3. Fuzzy match: Check if any vehicle id, image or images array matches
      const cleanUrl = getTrulyCleanImageUrl(imageUrl);
      vehicle = inventory.find(v => {
        if (v.id && cleanUrl.includes(v.id)) return true;
        
        const cleanVImage = getTrulyCleanImageUrl(v.image);
        if (cleanVImage && (cleanVImage.includes(cleanUrl) || cleanUrl.includes(cleanVImage))) return true;
        
        if (v.images) {
          return v.images.some(img => {
            const cleanImg = getTrulyCleanImageUrl(img);
            return cleanImg && (cleanImg.includes(cleanUrl) || cleanUrl.includes(cleanImg));
          });
        }
        return false;
      });
    }

    setSelectedVehicle(vehicle || null);
    setSelectedImage(imageUrl);
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
        // 1. Instantly get the cached inventory for immediate chatbot brain loading
        const cachedData = getCachedInventory();
        
        // Load saved state from sessionStorage
        let initialMessages = null;
        let initialHistory = [];
        const SESSION_KEY_MESSAGES = 'chat-messages-v3'; // Changed to force refresh
        const SESSION_KEY_HISTORY = 'gemini-history-v3'; // Changed to force refresh
        
        try {
          const savedMessages = sessionStorage.getItem(SESSION_KEY_MESSAGES);
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialMessages = parsed;
            }
          }

          const savedHistory = sessionStorage.getItem(SESSION_KEY_HISTORY);
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
              content: '¡Hola! Le habla Camilo, su asesor virtual de GT Auto Imports en Dorado. ¿Con quién tengo el gusto y qué tipo de vehículo está buscando hoy? 👋',
              timestamp: Date.now()
            }
          ]);
        }
        
        // Instantly initialize chat with cached/preloaded inventory and saved history
        chatRef.current = createSalesmanChat(cachedData, initialHistory);

        // 2. Fetch fresh live sheets inventory from API asynchronously in the background
        const data = await getInventory();
        setInventory(data);

        // 3. Keep chatbot brain updated with the fresh live sheet inventory
        if (chatRef.current) {
          chatRef.current.setInventory(data);
        }
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
        sessionStorage.setItem('chat-messages-v3', JSON.stringify(messages));
      }
      if (chatRef.current) {
        const history = chatRef.current.getHistory();
        if (history && history.length > 0) {
          sessionStorage.setItem('gemini-history-v3', JSON.stringify(history));
        }
      }
    } catch (e) {
      console.warn("Could not save chat state to sessionStorage:", e);
    }
  }, [messages]);

  const handleResetChat = () => {
    sessionStorage.removeItem('chat-messages-v3');
    sessionStorage.removeItem('gemini-history-v3');
    const newGreeting: ChatMessage = {
      id: 'reset-' + Math.random().toString(36).substring(2, 11),
      role: 'assistant',
      content: '¡Hola! Le habla Camilo, su asesor virtual de GT Auto Imports en Dorado. ¿Qué tipo de vehículo está buscando? ¿SUV, pickup, sedan, o algo económico? 👋',
      timestamp: Date.now()
    };
    setMessages([newGreeting]);
    if (chatRef.current) {
      chatRef.current.setInventory(inventory);
      // We manually clear the history in the chat instance
      // @ts-ignore - reaching into private state for session reset
      chatRef.current.history = [];
    }
  };

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollContainer = scrollAreaRef.current;
    
    // Un pequeño delay permite que React renderice los nuevos elementos (ej. markdown, listado de autos)
    const timeoutId = setTimeout(() => {
      if (isTyping) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
        return;
      }

      if (messages.length > 0) {
        const lastMsgId = messages[messages.length - 1].id;
        const lastMsgEl = document.getElementById(`message-${lastMsgId}`);
        
        if (lastMsgEl) {
          const containerHeight = scrollContainer.clientHeight;
          const msgHeight = lastMsgEl.clientHeight;
          
          // Si el mensaje es muy alto (ej. texto largo + listado de vehículos),
          // lo alineamos al principio (con un poco de espacio) para que no se oculte el texto por el scroll al fondo.
          if (msgHeight > containerHeight * 0.5) {
            const offsetTop = lastMsgEl.offsetTop;
            scrollContainer.scrollTo({ top: Math.max(0, offsetTop - 24), behavior: 'smooth' });
          } else {
            scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
          }
        } else {
          scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  // Dispara UN SOLO nudge del pool si el cliente sigue callado 25s. NO se
  // encadena solo -- si el cliente sigue sin responder después de este,
  // no le cae otro encima; solo se vuelve a armar cuando haya un mensaje
  // real nuevo (ver handleSend). Esto evita que se sienta como que el bot
  // "no da break" y le manda varios mensajes seguidos sin esperar respuesta.
  function armIdleTimer() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setNudgePool(prevPool => {
        if (prevPool.length === 0) return prevPool;
        const [nextNudge, ...rest] = prevPool;
        const nudgeMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'assistant',
          content: nextNudge,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, nudgeMsg]);
        if (chatRef.current) {
          chatRef.current.history.push({ role: 'model', parts: [{ text: nextNudge }] });
        }
        return rest;
      });
    }, IDLE_NUDGE_MS);
  }

  function clearIdleTimer() {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearIdleTimer();
  }, []);

  async function handleSend(manualMessage?: string) {
    const textToSubmit = manualMessage || inputText;
    if (!textToSubmit.trim() || isTyping || !chatRef.current) return;
    clearIdleTimer(); // el cliente sí respondió -- cancela cualquier nudge pendiente

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
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
              id: Math.random().toString(36).substring(2, 11),
              role: 'assistant',
              content: '¡Excelente! Aquí tienes el formulario para coordinar tu visita. Solo toma 30 segundos.',
              timestamp: Date.now(),
              isBookingForm: true
            }]);
            toolResults.push({ name: call.name, result: { shown: true } });
            shouldStopAfterTools = true;
          } else if (call.name === 'request_car') {
            const args = call.args as any;
            saveLead({ id: sessionIdRef.current, ...args, type: 'car_request', inputText: textToSubmit });
            userMsg.intent = 'Petición';
            toolResults.push({ name: call.name, result: { success: true, message: "Petición registrada correctamente." } });
          } else if (call.name === 'register_lead') {
            const args = call.args as any;
            saveLead({ id: sessionIdRef.current, ...args, type: 'proposal_request', inputText: textToSubmit, source: args.source || 'chat' });
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
        chatResponse = await chatRef.current.sendMessage("");
        response = chatResponse.response;
        functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
      }

      const responseTextRaw = typeof response.text === 'function' ? response.text() : (response.text || '');
      let responseText = responseTextRaw || '';
      let botIntent: string | undefined = undefined;
      let appointmentConfirmed = false;
      
      // Extract CITA_CONFIRMADA:
      let citaDataStr = "";
      const citaMatch = responseText.match(/CITA_CONFIRMADA:\s*(.+)$/m) || responseText.match(/CITA_CONFIRMADA:\s*(.+)/);
      if (citaMatch) {
        citaDataStr = citaMatch[1].trim();
        responseText = responseText.replace(/CITA_CONFIRMADA:.*$/m, '').replace(/CITA_CONFIRMADA:.*/s, '').trim();
      }
      
      // Extract HANDOFF_URGENTE (nunca debe mostrarse crudo al cliente):
      const handoffMatch = responseText.match(/HANDOFF_URGENTE:\s*(Si|Sí|true)/i);
      const handoffUrgente = !!handoffMatch;
      if (handoffMatch) {
        responseText = responseText.replace(/HANDOFF_URGENTE:.*$/m, '').trim();
      }

      // Extract NUDGES (pool de re-enganche por inactividad, nunca visible):
      let freshNudges: string[] = [];
      const nudgesMatch = responseText.match(/NUDGES:\s*(.+)$/m);
      if (nudgesMatch) {
        freshNudges = nudgesMatch[1].split('|').map(n => n.trim()).filter(Boolean);
        responseText = responseText.replace(/NUDGES:.*$/m, '').trim();
      }

      // Extract LEAD_DATA (handles LEAD_DATA: {...}, ```json {...} ``` or raw JSON containing lead keys):
      let leadDataObj: any = null;
      const leadMatch = responseText.match(/LEAD_DATA:\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
        || responseText.match(/LEAD_DATA:\s*(\{[\s\S]*?\})/i)
        || responseText.match(/```json\s*(\{[\s\S]*?"(?:nombre|telefono|vehiculoInteres|eventType)"[\s\S]*?\})\s*```/i)
        || responseText.match(/(\{[\s\S]*?"(?:nombre|telefono|vehiculoInteres|eventType)"[\s\S]*?\})/i);

      if (leadMatch) {
         try {
           leadDataObj = JSON.parse(leadMatch[1].trim());
         } catch(e) {
           console.error("Error parsing LEAD_DATA JSON in regex:", e);
         }
      }

      // Extract MOSTRAR_VEHICULO:
      let vehicleToShowInfo = "";
      const vehicleMatch = responseText.match(/MOSTRAR_VEHICULO:\s*(.+)$/m) || responseText.match(/MOSTRAR_VEHICULO:\s*(.+)/);
      if (vehicleMatch) {
         vehicleToShowInfo = vehicleMatch[1].trim();
         responseText = responseText.replace(/MOSTRAR_VEHICULO:.*$/m, '').replace(/MOSTRAR_VEHICULO:.*/s, '').trim();
      }

      // Final fail-safe cleanup: remove any remaining metadata tags, JSON blocks, internal thoughts before displaying to user
      responseText = responseText
        .replace(/^(?:El cliente|Notas|Análisis|Pensamiento|Razonamiento|FASE \d|Internal Note)[\s\S]*?\n\n/i, "")
        .replace(/^El cliente (?:todavía|aún) no [\s\S]*?\n+/i, "")
        .replace(/CITA_CONFIRMADA:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
        .replace(/HANDOFF_URGENTE:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
        .replace(/NUDGES:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
        .replace(/MOSTRAR_VEHICULO:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
        .replace(/LEAD_DATA:\s*```(?:json)?[\s\S]*?```/gi, "")
        .replace(/LEAD_DATA:\s*\{[\s\S]*?\}/gs, "")
        .replace(/LEAD_DATA:.*$/gm, "")
        .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, "")
        .replace(/\{[\s\S]*?"(?:nombre|telefono|vehiculoInteres|eventType)"[\s\S]*?\}/gi, "")
        .replace(/CITA_CONFIRMADA:.*$/gm, "")
        .replace(/HANDOFF_URGENTE:.*$/gm, "")
        .replace(/NUDGES:.*$/gm, "")
        .replace(/MOSTRAR_VEHICULO:.*$/gm, "")
        .trim();

      let apptData: any = null;
      let isAppointmentTurn = false;
      let appointmentDate = "";
      let appointmentNotes = "";
      let citaName = "";
      let citaPhone = "";
      let citaInterest = "";

      // 1. Process appointment if confirmed (either via CITA_CONFIRMADA tag or LEAD_DATA appointment indicator)
      const isConfirmedFromLead = leadDataObj && (
        leadDataObj.eventType === 'cita_confirmada' ||
        leadDataObj.agendo_cita === true ||
        leadDataObj.agendo_cita === 'Si' ||
        leadDataObj.agendo_cita === 'Sí' ||
        leadDataObj.agendo_cita === 'si'
      );

      if (citaDataStr || isConfirmedFromLead) {
        botIntent = 'Cita Confirmada';
        userMsg.intent = 'Cita Confirmada';
        appointmentConfirmed = true;
        isAppointmentTurn = true;
        try {
          if (citaDataStr) {
            const fields = citaDataStr.split('|');
            if (fields.length >= 6) {
              citaName = fields[0] || '';
              citaPhone = fields[1] || '';
              citaInterest = fields[3] || '';
              appointmentDate = fields[4] || '';
              appointmentNotes = fields[5] || '';
            } else {
              citaName = fields[0] || '';
              citaPhone = fields[1] || '';
              citaInterest = fields[3] || '';
              appointmentNotes = fields[4] || '';
              appointmentDate = fields[4] || ''; // Fallback
            }
          }

          if (!appointmentDate && leadDataObj?.fecha_cita) appointmentDate = leadDataObj.fecha_cita;
          if (!citaName && leadDataObj?.nombre) citaName = leadDataObj.nombre;
          if (!citaPhone && leadDataObj?.telefono) citaPhone = leadDataObj.telefono;
          if (!citaInterest && leadDataObj?.vehiculoInteres) citaInterest = leadDataObj.vehiculoInteres;
          if (!appointmentNotes && (leadDataObj?.resumen || leadDataObj?.notas)) {
            appointmentNotes = leadDataObj.resumen || leadDataObj.notas;
          }

          apptData = {
            date: appointmentDate
          };

          // Crear el evento de calendario explícitamente al confirmar cita
          createCalendarEvent({
            customerName: citaName || leadDataObj?.nombre || 'Cliente GT Auto Imports',
            date: appointmentDate,
            time: appointmentDate,
            interest: citaInterest || leadDataObj?.vehiculoInteres || 'Consulta / Test Drive',
            phone: citaPhone || leadDataObj?.telefono || ''
          }).catch(err => console.warn("[Calendar] Direct creation skipped/failed:", err));

          leadEventTypeRef.current = 'actualizacion';
        } catch (e) {
          console.error("Error parsing CITA_CONFIRMADA / appointment data:", e);
        }
      }

      // 2. Save lead data once (instantáneamente al capturar/actualizar datos o agendar cita)
      if (leadDataObj || isAppointmentTurn) {
        if (!botIntent) {
          botIntent = 'Lead Capturado';
          userMsg.intent = 'Lead Capturado';
        }
        const eventTypeAtCapture = isAppointmentTurn ? 'cita_confirmada' : (leadDataObj?.eventType || leadEventTypeRef.current || 'nuevo_lead');
        const historySnapshot = messages.map(m => ({ role: m.role, content: m.content }));

        if (leadSaveTimerRef.current) {
          clearTimeout(leadSaveTimerRef.current);
          leadSaveTimerRef.current = null;
        }

        const mergedLead = {
          id: sessionIdRef.current,
          ...(leadDataObj || {}),
          nombre: citaName || leadDataObj?.nombre || '',
          telefono: citaPhone || leadDataObj?.telefono || '',
          vehiculoInteres: citaInterest || leadDataObj?.vehiculoInteres || '',
          agendo_cita: isAppointmentTurn ? 'Si' : (leadDataObj?.agendo_cita || 'No'),
          estadoLead: isAppointmentTurn ? 'Cita Agendada' : (leadDataObj?.estadoLead || 'Seguimiento'),
          fecha_cita: appointmentDate || leadDataObj?.fecha_cita || '',
          notas: appointmentNotes || leadDataObj?.notas || '',
          type: isAppointmentTurn ? 'ai_appointment_confirmation' : 'ai_lead_capture',
          eventType: eventTypeAtCapture,
          fullText: responseText,
          conversationHistory: historySnapshot
        };

        saveLead(mergedLead);
        leadEventTypeRef.current = 'actualizacion';
      }

      // 3. Process show vehicle request
      if (vehicleToShowInfo) {
        const cleanInfo = vehicleToShowInfo.replace('[', '').replace(']', '').trim();
        const [year, make, ...modelParts] = cleanInfo.split(' ');
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
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: responseText || (vehiclesToShow.length > 0 ? '¡Excelente! Aquí tienes la unidad disponible:' : '¿Le gustaría que coordinemos una prueba de manejo para que lo vea en persona?'),
        timestamp: Date.now(),
        intent: botIntent,
        appointmentConfirmed: appointmentConfirmed,
        appointmentData: apptData ? { phone: apptData.phone, date: apptData.date, email: leadDataObj?.email } : undefined,
        vehicles: vehiclesToShow.length > 0 ? vehiclesToShow : undefined
      };

      setMessages(prev => [...prev, botMsg]);

      // Refresca el pool con las variaciones nuevas de este turno y arma
      // el timer de inactividad -- si el cliente se queda callado 10s,
      // dispara la primera sin llamar a Claude de nuevo.
      setNudgePool(freshNudges);
      if (freshNudges.length > 0) armIdleTimer();
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMessage = error?.message || "Lo siento, tuve un pequeño inconveniente.";
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 11),
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
    <div className="flex flex-col h-[100dvh] bg-black overflow-hidden selection:bg-sky-500 selection:text-white">
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
            
            {/* Botón de cerrar fijo arriba a la derecha para fácil acceso sin importar el scroll */}
            <button 
              onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }}
              className="fixed top-6 right-6 md:top-10 md:right-10 z-[120] text-zinc-300 hover:text-white bg-zinc-900/95 hover:bg-sky-500 border border-white/10 hover:border-sky-400 p-3.5 md:p-4 rounded-full transition-all duration-300 shadow-2xl flex items-center justify-center cursor-pointer active:scale-95"
              title="Cerrar detalles del auto"
            >
              <X size={24} />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl lg:max-h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#080808] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.9)]"
            >
              <div className="relative aspect-square lg:aspect-auto h-full lg:max-h-[90vh] min-h-[400px] group/img flex items-center justify-center bg-black/40">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    src={activeVehicleImages[activeImageIndex] || selectedImage || ""} 
                    alt="Enlarged view" 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-105" 
                  />
                </AnimatePresence>
                


                {/* Left Arrow Button */}
                {activeVehicleImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? activeVehicleImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 text-white bg-black/60 hover:bg-sky-500 transition-all p-4 rounded-full border border-white/10 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                    title="Anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Right Arrow Button */}
                {activeVehicleImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === activeVehicleImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white bg-black/60 hover:bg-sky-500 transition-all p-4 rounded-full border border-white/10 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                    title="Siguiente"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                {/* Page Indicator */}
                {activeVehicleImages.length > 1 && (
                  <div className="absolute top-8 right-8 z-20 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-black text-white uppercase tracking-widest font-mono">
                    {activeImageIndex + 1} / {activeVehicleImages.length}
                  </div>
                )}

                {/* Thumbnail Strip */}
                {activeVehicleImages.length > 1 && (
                  <div className="absolute bottom-28 left-6 right-6 z-20 flex gap-2 justify-center overflow-x-auto no-scrollbar py-1.5 max-w-full backdrop-blur-sm bg-black/20 rounded-2xl border border-white/5 p-2">
                    {activeVehicleImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(idx);
                        }}
                        className={cn(
                          "w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-300 hover:scale-105 active:scale-95",
                          idx === activeImageIndex ? "border-sky-500 scale-110 shadow-lg shadow-sky-500/30" : "border-white/20 hover:border-white/55 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Photo ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="absolute bottom-6 left-6 right-6 z-20">
                   <div className="flex items-center gap-4 bg-black/50 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
                        <Car size={26} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400 mb-0.5">Unidad Certificada</p>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">GT Auto Imports Premium</h3>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }}
                  className="absolute top-8 left-8 z-20 text-white bg-black/60 backdrop-blur-md p-4 rounded-full hover:bg-sky-500 transition-all border border-white/10"
                  title="Cerrar galería"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 md:p-10 flex flex-col justify-start bg-[#0a0a0a] relative overflow-y-auto overflow-x-hidden custom-scrollbar h-full lg:max-h-[90vh]">
                <div className="w-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
                  
                  <div>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="h-[2px] w-12 bg-sky-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-sky-400">Beneficios & Ventajas</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedImage(null); setSelectedVehicle(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-sky-500 hover:text-white hover:border-sky-400 transition-all active:scale-95"
                        title="Volver al Inventario"
                      >
                        <X size={12} />
                        Cerrar
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
                          <span className="text-sky-400 underline decoration-white/10 underline-offset-8">{selectedVehicle.make}</span> <br />
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
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Inventario Disponible</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <BenefitCard icon={<ShieldCheck className="text-sky-400" />} title="Transmisión" desc={selectedVehicle.transmission || "Automática certificada."} />
                        <BenefitCard icon={<Sparkles className="text-sky-400" />} title="Condición" desc={`${selectedVehicle.mileage} - Certificación 115 puntos.`} />
                        <BenefitCard icon={<Fuel className="text-sky-400" />} title="Eficiencia MPG" desc={selectedVehicle.mpg || "Consumo líder en su categoría."} />
                        <BenefitCard icon={<MapPin className="text-sky-400" />} title="Color" desc={`Ext: ${selectedVehicle.exteriorColor || 'N/A'} | Int: ${selectedVehicle.interiorColor || 'N/A'}`} />
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
                        <div className="bg-sky-500/5 p-8 rounded-[2rem] border border-sky-500/10">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-4 flex items-center gap-3">
                             Notas del Especialista
                          </h4>
                          <p className="text-slate-400 text-sm leading-relaxed italic">
                            "{selectedVehicle.description}"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <Sparkles className="mx-auto text-sky-400 mb-6 animate-pulse" size={60} />
                      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Analizando ventajas competitivas en tiempo real...</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-10 grid grid-cols-[1fr_auto_auto] xl:flex xl:flex-row gap-2 xl:gap-5 relative z-10">
                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        handleSend(`Me interesa el ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}, cuéntame más.`);
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}
                    className="col-span-1 xl:flex-1 bg-white text-sky-600 font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[11px] xl:text-[10px] uppercase tracking-[0.2em] xl:tracking-[0.3em] transition-all hover:bg-sky-50 shadow-2xl active:scale-95 flex items-center justify-center gap-2 xl:gap-3 group/btn"
                  >
                    <span className="relative flex h-2 w-2 xl:h-2.5 xl:w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                    </span>
                    LIVE CHAT
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 xl:group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                  <button 
                    onClick={() => window.open(`https://wa.me/17872788000?text=Hola! Me interesa el ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model}`, '_blank')}
                    className="col-span-1 w-12 sm:w-14 xl:w-auto xl:px-10 xl:py-7 bg-emerald-600 text-white rounded-[1.5rem] xl:rounded-3xl flex items-center justify-center hover:bg-emerald-500 transition-all shadow-xl xl:shadow-2xl xl:shadow-emerald-600/20 shrink-0 xl:font-black xl:text-[10px] xl:uppercase xl:tracking-[0.25em] gap-3"
                    title="WhatsApp"
                  >
                    <span className="hidden xl:inline">WhatsApp</span> <MessageSquare size={18} className="xl:hidden" /> <MessageSquare size={18} className="hidden xl:block" />
                  </button>
                  <button 
                    onClick={() => window.open('tel:17872788000', '_self')}
                    className="col-span-1 w-12 sm:w-14 xl:w-auto xl:px-10 xl:py-7 bg-sky-600 text-white rounded-[1.5rem] xl:rounded-3xl flex items-center justify-center hover:bg-sky-500 transition-all shadow-xl xl:shadow-2xl xl:shadow-sky-600/20 shrink-0 xl:font-black xl:text-[10px] xl:uppercase xl:tracking-[0.25em] gap-3"
                    title="Llamar"
                  >
                    <span className="hidden xl:inline">Llamar</span> <Phone size={18} className="xl:hidden" /> <Phone size={18} className="hidden xl:block" />
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        handleSend(`Me interesa el ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} y sus opciones de financiamiento.`);
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}
                    className="col-span-3 xl:flex-1 w-full bg-white text-emerald-600 font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[12px] xl:text-[13px] uppercase tracking-[0.2em] xl:tracking-[0.25em] hover:bg-emerald-50 transition-all shadow-xl xl:shadow-2xl xl:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 xl:gap-3 whitespace-nowrap"
                  >
                    Financiamiento Disponible <ShieldCheck size={20} className="text-emerald-500" />
                  </button>
                </div>

                {/* Botón flotante fixed arriba a la derecha maneja el cierre de manera consistente */}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure Gallery Modal */}
      <AnimatePresence>
        {selectedGalleryVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 md:p-12 backdrop-blur-2xl overflow-y-auto"
            onClick={() => setSelectedGalleryVehicle(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl lg:max-h-[90vh] bg-[#080808] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.9)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square md:aspect-video lg:h-[80vh] min-h-[400px] w-full group/img flex items-center justify-center bg-black/40">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    src={selectedGalleryVehicle.images && selectedGalleryVehicle.images.length > 0 ? selectedGalleryVehicle.images[activeImageIndex] : selectedGalleryVehicle.image} 
                    alt="Enlarged view" 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain transition-transform duration-1000 group-hover/img:scale-105" 
                  />
                </AnimatePresence>
                
                {/* Left Arrow Button */}
                {selectedGalleryVehicle.images && selectedGalleryVehicle.images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? selectedGalleryVehicle.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 text-white bg-black/60 hover:bg-sky-500 transition-all p-4 rounded-full border border-white/10 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                    title="Anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Right Arrow Button */}
                {selectedGalleryVehicle.images && selectedGalleryVehicle.images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === selectedGalleryVehicle.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white bg-black/60 hover:bg-sky-500 transition-all p-4 rounded-full border border-white/10 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                    title="Siguiente"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                {/* Page Indicator */}
                {selectedGalleryVehicle.images && selectedGalleryVehicle.images.length > 1 && (
                  <div className="absolute top-8 right-8 z-20 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-black text-white uppercase tracking-widest font-mono">
                    {activeImageIndex + 1} / {selectedGalleryVehicle.images.length}
                  </div>
                )}

                {/* Thumbnail Strip */}
                {selectedGalleryVehicle.images && selectedGalleryVehicle.images.length > 1 && (
                  <div className="absolute bottom-12 left-6 right-6 z-20 flex gap-2 justify-center overflow-x-auto no-scrollbar py-1.5 max-w-full backdrop-blur-sm bg-black/20 rounded-2xl border border-white/5 p-2">
                    {selectedGalleryVehicle.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(idx);
                        }}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 ${
                          idx === activeImageIndex ? "border-sky-500 scale-110 shadow-lg shadow-sky-500/30" : "border-white/20 hover:border-white/55 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Photo ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => setSelectedGalleryVehicle(null)}
                  className="absolute top-8 left-8 z-20 text-white bg-black/60 backdrop-blur-md p-4 rounded-full hover:bg-sky-500 transition-all border border-white/10"
                  title="Cerrar galería"
                >
                  <X size={24} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp - REMOVED PER REQUEST */}

      {/* Main Header */}
      <header className="py-4 flex-shrink-0 border-b border-zinc-900 bg-black/95 backdrop-blur-3xl px-4 z-50 sticky top-0">
        <div className="flex items-center justify-between w-full relative max-w-[1800px] mx-auto">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            {/* Real GT Auto Imports Logo Image */}
            <div className="shrink-0 flex items-center justify-center">
              <img 
                src="https://gtautopr.com/wp-content/uploads/2024/10/logo_2576e84d24261a5b737ba93c581c5493-e1729735728852.png" 
                alt="GT Auto Imports" 
                className="h-[70px] md:h-[90px] w-auto object-contain select-none transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="hidden sm:flex flex-col border-l border-white/10 pl-3 py-0.5 justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Abierto</span>
              </div>
            </div>
          </div>

          {/* Actions, Tab Switcher & Location */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Top row of action buttons */}
            <div className="flex items-center gap-2">

              {/* Prequalificación */}
              <button 
                onClick={() => window.open('https://gtautopr.com/pre-aprobacion/', '_blank')}
                className="hidden md:flex px-4 h-9 bg-white text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow-lg active:scale-90 transition-all hover:bg-zinc-100 border border-zinc-300 rounded-xl items-center justify-center whitespace-nowrap gap-2 shrink-0"
                title="PRE-CUALIFICA SIN INDAGACION DE CREDITO GARANTIZADO"
              >
                PRE-CUALIFICA <ShieldCheck size={14} className="text-emerald-600" />
              </button>
              <button 
                onClick={() => window.open('https://gtautopr.com/pre-aprobacion/', '_blank')}
                className="flex md:hidden w-9 h-9 bg-white text-zinc-950 rounded-xl items-center justify-center shadow-lg active:scale-90 transition-transform border border-zinc-300 shrink-0"
                title="PRE-CUALIFICA SIN INDAGACION DE CREDITO GARANTIZADO"
              >
                <ShieldCheck size={18} className="text-emerald-600" />
              </button>

              {/* WhatsApp */}
              <button 
                onClick={() => window.open('https://wa.me/17872788000', '_blank')}
                className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform shrink-0 hover:bg-emerald-500"
                title="WhatsApp"
              >
                <MessageSquare size={18} />
              </button>

              {/* Llamar */}
              <button 
                onClick={() => window.open('tel:17872788000', '_self')}
                className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform shrink-0 hover:bg-sky-500"
                title="Llamar"
              >
                <Phone size={18} />
              </button>
            </div>

            {/* Bottom Row: Elegant Google Maps Driving Button/Link */}
            <a 
              href="https://www.google.com/maps/place/GT+Auto+Imports/@18.4064073,-66.2875219,837m/data=!3m2!1e3!4b1!4m6!3m5!1s0x8c031561fde1e43b:0xb8e5f3c789fff17!8m2!3d18.4064022!4d-66.284947!16s%2Fg%2F11wbywkgmv?hl=es-419&entry=ttu&g_ep=EgoyMDI0MTAyMS4xIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-all py-1 px-3 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-lg shadow-md active:scale-95"
              title="📍 Cómo llegar - Ver direcciones en Google Maps"
            >
              <span>📍 PR-2 KM 26.1, Dorado, PR</span>
              <ChevronRight size={10} className="text-amber-500 animate-pulse" />
            </a>
          </div>
        </div>
      </header>

      {/* Global Ticker Bar - Slimmed Down */}
      <div className="bg-sky-500/10 border-b border-zinc-900 py-1.5 overflow-hidden shrink-0 z-40">
        <div className="flex whitespace-nowrap animate-[ticker_40s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-[10px] font-round font-black uppercase tracking-[0.2em] text-sky-400 px-10 flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Area: Split View */}
      <main className="flex-1 flex overflow-hidden relative pb-0 md:pb-0">
        <AnimatePresence mode="wait">
          {/* Left Column: AI Concierge */}
          <aside 
            key="chat-sidebar"
            className={cn(
              "w-full md:w-[450px] lg:w-[550px] xl:w-[650px] 2xl:w-[750px] border-r border-zinc-900 bg-black flex flex-col relative transition-all duration-500 ease-in-out",
              activeTab === 'inventory' ? "hidden md:flex" : "flex"
            )}
          >
            <header className="px-6 py-4 bg-zinc-950/40 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Canal Seguro Activo</span>
              </div>
              <button 
                onClick={handleResetChat}
                className="group flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                title="Reiniciar chat"
              >
                <RotateCcw size={10} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-sky-400">Reiniciar</span>
              </button>
            </header>

          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 space-y-10 scroll-smooth custom-scrollbar relative"
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
                  onFinanceClick={(v) => {
                    const messageText = `Me interesa el ${v.year} ${v.make} ${v.model} y sus opciones de financiamiento.`;
                    handleSend(messageText);
                    if (window.innerWidth < 768) setActiveTab('chat');
                  }}
                />
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            <div className="pb-24" />
          </div>

          {/* Input Bar */}
          <div className="p-4 pb-6 md:p-5 md:pb-5 bg-black/95 backdrop-blur-2xl border-t border-zinc-900 shrink-0">
            <div className="relative group flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Habla con tu asesor experto..."
                  className="w-full bg-zinc-950/40 border border-zinc-850 rounded-2xl py-4.5 pl-5 pr-14 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/40 focus:bg-zinc-900/40 transition-all shadow-2xl"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl hover:from-sky-300 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-slate-500 disabled:shadow-none text-white transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.6)] hover:shadow-[0_0_30px_rgba(14,165,233,0.8)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center p-0 group"
                >
                  <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              <button
                onClick={handleResetChat}
                title="Reiniciar chat"
                className="px-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-sky-500/10 hover:border-sky-500/30 transition-all flex-shrink-0 flex items-center justify-center"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            {/* Mobile Tab Switcher in Chat Footer */}
            <div className="flex md:hidden items-center justify-center mt-4 w-full px-4">
              <div className="flex gap-2 w-full max-w-[320px]">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    "bg-sky-500",
                    activeTab === 'chat' ? "text-white shadow-lg shadow-sky-500/40 ring-2 ring-sky-400 scale-105 z-10" : "text-sky-100 hover:text-white scale-95"
                  )}
                >
                  Pregúntame
                  {activeTab === 'inventory' && (
                    <span className="absolute top-2.5 right-8 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    "bg-white",
                    activeTab === 'inventory' ? "text-sky-600 shadow-lg shadow-white/20 ring-2 ring-white scale-105 z-10" : "text-slate-500 hover:text-sky-600 scale-95"
                  )}
                >
                  Inventario
                </button>
              </div>
            </div>

            {/* Footer Legal Links */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <a
                href="/terminos-y-condiciones.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white hover:text-slate-300 uppercase tracking-[0.3em] font-black transition-colors"
              >
                Términos
              </a>
              <div className="h-3 w-[1px] bg-white/20" />
              <a
                href="/privacy-policy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white hover:text-slate-300 uppercase tracking-[0.3em] font-black transition-colors"
              >
                Privacidad
              </a>
            </div>
          </div>
        </aside>

        {/* Right Column: Live Inventory Display */}
        <section 
          id="inventory-section"
          className={cn(
          "flex-1 bg-black relative flex-col overflow-hidden transition-all duration-500 ease-in-out",
          activeTab === 'chat' ? "hidden md:flex" : "flex"
        )}>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-[2px] w-12 bg-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-sky-400">Premium Selection</span>
                </div>
                <h3 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-white leading-none mb-6">
                  Unidades <br/> <span className="text-sky-400">Certificadas</span>
                </h3>
                <p className="text-lg text-zinc-100 font-medium leading-relaxed">
                  Calidad excepcional garantizada. Cada vehículo en nuestro inventario pasa por una inspección rigurosa de 115 puntos para asegurar tu tranquilidad total.
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                 <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      handleSend("¿Me pueden tasar mi trade-in?");
                      setActiveTab('chat');
                    }}
                    className="flex-1 md:flex-none px-8 py-5 bg-sky-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-sky-400 transition-all shadow-[0_15px_30px_rgba(14,165,233,0.3)] active:scale-95"
                  >
                    Tasar Trade-In
                  </button>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 text-emerald-400">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Protección de crédito disponible</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div id="inventory-filters" className="bg-zinc-950 border border-zinc-900 rounded-[1.5rem] p-4 mb-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                    Filtrar Inventario
                  </h4>
                  {(selectedMake !== 'all' || selectedCategory !== 'all' || selectedYear !== 'all' || (selectedMaxPrice !== 0 && selectedMaxPrice < absoluteMaxPrice)) && (
                    <button 
                      onClick={() => {
                        setSelectedMake('all');
                        setSelectedCategory('all');
                        setSelectedYear('all');
                        setSelectedMaxPrice(absoluteMaxPrice);
                      }}
                      className="text-xs font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <RotateCcw size={14} />
                      Limpiar Filtros
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Marca */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-200">Marca</label>
                    <select
                      value={selectedMake}
                      onChange={(e) => setSelectedMake(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-base font-bold text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    >
                      <option value="all" className="bg-[#0c0c0c] text-slate-200">Todas las marcas</option>
                      {uniqueMakes.map(make => (
                        <option key={make} value={make} className="bg-[#0c0c0c] text-slate-200">{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* Carrocería / Categoría */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-200">Carrocería</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-base font-bold text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    >
                      <option value="all" className="bg-[#0c0c0c] text-slate-200">Todos los tipos</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#0c0c0c] text-slate-200">{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Año */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-200">Año</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-base font-bold text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    >
                      <option value="all" className="bg-[#0c0c0c] text-slate-200">Todos los años</option>
                      {uniqueYears.map(year => (
                        <option key={year} value={year.toString()} className="bg-[#0c0c0c] text-slate-200">{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rango de Precio */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-wider text-zinc-200">Precio Máx</label>
                      <span className="text-sm font-mono font-black text-sky-400">
                        ${(selectedMaxPrice || absoluteMaxPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="0"
                        max={absoluteMaxPrice || 100000}
                        step="1000"
                        value={selectedMaxPrice || absoluteMaxPrice}
                        onChange={(e) => setSelectedMaxPrice(Number(e.target.value))}
                        className="w-full accent-sky-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter counts info */}
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                  <span>Mostrando {filteredInventory.length} de {inventory.length} unidades certificadas</span>
                </div>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                <Car size={48} className="mx-auto text-slate-600 mb-6 animate-pulse" />
                <h4 className="text-xl font-black uppercase tracking-wider text-white mb-2">Sin Resultados</h4>
                <p className="text-sm text-zinc-300 max-w-md mx-auto mb-6">
                  No encontramos vehículos que coincidan con sus filtros actuales. Intente restablecer los criterios para ver más opciones.
                </p>
                <button
                  onClick={() => {
                    setSelectedMake('all');
                    setSelectedCategory('all');
                    setSelectedYear('all');
                    setSelectedMaxPrice(absoluteMaxPrice);
                  }}
                  className="px-6 py-3 bg-sky-500 text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-sky-400 transition-all shadow-[0_10px_20px_rgba(14,165,233,0.3)]"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6 lg:gap-8">
                {filteredInventory.map(v => (
                  <VehicleCard 
                    key={v.id} 
                    vehicle={v} 
                    onImageClick={handleImageClick} 
                    onGalleryClick={handleGalleryClick}
                    onChatClick={(vehicle) => {
                      handleSend(`Me interesa el ${vehicle.year} ${vehicle.make} ${vehicle.model}, cuéntame más.`);
                      setActiveTab('chat');
                    }}
                    onFinanceClick={(vehicle, estimatedPayment) => {
                      handleSend(`Me interesa el ${vehicle.year} ${vehicle.make} ${vehicle.model} y sus opciones de financiamiento (estimado ${estimatedPayment}/mo).`);
                      setActiveTab('chat');
                    }}
                  />
                ))}
              </div>
            )}

            {/* Special Request Callout */}
            <div className="mt-24 group relative">
              <div className="absolute inset-0 bg-sky-500/5 blur-3xl rounded-[3rem] -z-10" />
              <div className="bg-zinc-950 border border-white/5 p-10 md:p-16 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Car size={300} strokeWidth={1} className="text-white" />
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-6 flex items-center gap-4">
                    <Sparkles className="text-sky-400" />
                    Búsqueda Personalizada
                  </h4>
                  <p className="text-xl text-zinc-100 leading-relaxed max-w-3xl mb-10 font-medium">
                    ¿Tienes un modelo específico en mente que no ves hoy? <br/>
                    Nuestro equipo de <strong>Sourcing Elite</strong> localiza cualquier unidad en Puerto Rico o Estados Unidos y la trae por ti con certificación completa.
                  </p>
                  <button 
                    onClick={() => handleSend("Necesito que me busquen un auto específico que no está en el listado.")}
                    className="group-hover:translate-x-2 transition-all duration-500 bg-sky-500/10 border border-sky-500/30 text-sky-400 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] inline-flex items-center gap-4 hover:bg-sky-500 hover:text-white"
                  >
                    Activar Búsqueda Especial <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>

          <footer className="h-auto py-4 md:py-0 md:h-16 bg-black border-t border-zinc-900 flex items-center px-6 md:px-10 justify-between shrink-0">
            <div className="hidden lg:flex gap-10">
              <span className="text-[9px] text-zinc-300 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" /> Live Updates
              </span>
              <span className="text-[9px] text-zinc-300 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" /> Bancos Locales & Federales
              </span>
              <span className="text-[9px] text-zinc-300 uppercase font-black tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" /> Protección Credito Incluida
              </span>
            </div>

            {/* Mobile Tab Switcher in Inventory Footer */}
            <div className="flex md:hidden flex-col items-center justify-center w-full gap-3 mt-1">
              <div className="flex gap-2 w-full max-w-[320px]">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    "bg-sky-500",
                    activeTab === 'chat' ? "text-white shadow-lg shadow-sky-500/40 ring-2 ring-sky-400 scale-105 z-10" : "text-sky-100 hover:text-white scale-95"
                  )}
                >
                  Pregúntame
                  {activeTab === 'inventory' && (
                    <span className="absolute top-2.5 right-8 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    "bg-white",
                    activeTab === 'inventory' ? "text-sky-600 shadow-lg shadow-white/20 ring-2 ring-white scale-105 z-10" : "text-slate-500 hover:text-sky-600 scale-95"
                  )}
                >
                  Inventario
                </button>
              </div>
              <div className="flex items-center gap-4">
                <a href="/terminos-y-condiciones.html" target="_blank" rel="noopener noreferrer" className="text-[9px] text-white hover:text-slate-300 uppercase tracking-[0.2em] font-black transition-colors">Términos</a>
                <div className="h-2 w-[1px] bg-white/20" />
                <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-[9px] text-white hover:text-slate-300 uppercase tracking-[0.2em] font-black transition-colors">Privacidad</a>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 ml-auto">
              <a href="/terminos-y-condiciones.html" target="_blank" rel="noopener noreferrer" className="text-[9px] text-white hover:text-slate-300 uppercase tracking-[0.3em] font-black transition-colors">Términos</a>
              <div className="h-3 w-[1px] bg-white/20" />
              <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-[9px] text-white hover:text-slate-300 uppercase tracking-[0.3em] font-black transition-colors">Privacidad</a>
            </div>
          </footer>
        </section>
      </AnimatePresence>
      </main>

      {/* NO SCRIPTS OR FOOTERS BLOCKING CHAT */}

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
          background: rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message, onVehicleClick, onImageClick, onFinanceClick }: { message: ChatMessage, onVehicleClick?: (v: Vehicle) => void, onImageClick?: (url: string, v?: Vehicle) => void, onFinanceClick?: (v: Vehicle) => void }) {
  const isBot = message.role === 'assistant';
  const hasVehicles = message.vehicles && message.vehicles.length > 0;
  
  let cleanContent = message.content;

  if (isBot && (
    message.content.includes("gtautopr.com/pre-aprobacion") || 
    message.content.includes("pre-aprobacion") || 
    message.content.includes("¿Quieres acelerar el proceso?")
  )) {
    // Strip the HTML code if present to avoid rendering raw HTML as code text
    cleanContent = message.content.replace(/<div[\s\S]*?<\/div>/gi, "").trim();
  }

  return (
    <motion.div
      id={`message-${message.id}`}
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
          : "bg-sky-500 border-sky-400 rounded-tr-none text-white shadow-[0_10px_20px_rgba(14,165,233,0.2)]"
      )}>
        {cleanContent && (
          <div className={cn(
            "markdown-body leading-relaxed font-round text-lg md:text-xl font-medium"
          )}>
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black px-4 py-2.5 my-2 rounded-xl text-sm md:text-base transition-all shadow-lg hover:shadow-emerald-500/30 no-underline cursor-pointer border border-emerald-400/30 active:scale-95"
                  >
                    <span>{children}</span>
                    <span className="text-xs">↗</span>
                  </a>
                ),
                img: ({ src, alt }) => (
                  <span 
                    className="block my-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer hover:border-sky-500/50 transition-all group relative max-w-sm"
                    onClick={() => {
                      const v = message.vehicles?.find(veh => veh.image === src || veh.model === alt);
                      onImageClick?.(src || '', v);
                    }}
                  >
                    <span className="relative block aspect-[16/9] bg-[#1a1a1a]">
                      <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-100" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 right-3">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-sky-500/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-white/10">Ver Galería</span>
                      </span>
                    </span>
                    <span className="p-3 bg-black/60 text-sm font-bold uppercase tracking-widest text-white flex justify-between items-center backdrop-blur-md border-t border-white/5">
                      <span>{alt || "GT Auto Imports"}</span>
                      <span className="text-sky-400 group-hover:translate-x-1 transition-transform text-xs font-black">WhatsApp →</span>
                    </span>
                  </span>
                )
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isBot && (
        message.content.includes("pre-aprobacion") || 
        message.content.includes("pre-aprobación") || 
        message.content.includes("gtautopr.com/pre-aprobacion")
      ) && (
        <div className="w-full mt-2 max-w-sm">
          <motion.button
            onClick={() => window.open('https://gtautopr.com/pre-aprobacion/', '_blank')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative group overflow-hidden rounded-2xl p-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] transition-all cursor-pointer text-left"
          >
            <div className="bg-[#0b0f14] hover:bg-[#111822] transition-colors rounded-[14px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none mb-1">Pre-Aprobación Express</span>
                  <span className="text-xs md:text-sm font-black text-white uppercase italic tracking-tighter leading-tight">Completar Solicitud</span>
                </div>
              </div>
              <div className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-lg group-hover:translate-x-0.5">
                <span>SOLICITAR</span>
                <span>→</span>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {isBot && message.isBookingForm && (
        <div className="w-full mt-2">
          <BookingForm onSuccess={(data) => {
            console.log("Booking confirmed", data);
          }} />
        </div>
      )}

      {isBot && message.appointmentConfirmed && (
        <div className="w-full mt-3 max-w-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-sky-950/40 to-black/80 border border-sky-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -z-10" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">✓</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 leading-none mb-1">Pase de Cita VIP</p>
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">GT AUTO IMPORTS</h4>
              </div>
            </div>
            
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Asesor:</span>
                <span className="text-white font-bold">Camilo (AI)</span>
              </div>
              {message.appointmentData?.date && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">Fecha y Hora:</span>
                  <span className="text-white font-bold">{message.appointmentData.date}</span>
                </div>
              )}
              {message.appointmentData?.phone && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">Teléfono:</span>
                  <span className="text-white font-bold">{message.appointmentData.phone}</span>
                </div>
              )}
              {message.appointmentData?.email && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">Email:</span>
                  <span className="text-white font-bold">{message.appointmentData.email}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Ubicación del Concesionario:</span>
                <span className="text-white font-bold text-right text-[10px]">PR-2 km 26.1, Dorado, PR</span>
              </div>
            </div>

            <div className="mt-4 bg-[#0a0a0a]/80 rounded-xl p-3 border border-white/5 text-center">
              <p className="text-[9px] font-black text-sky-300 uppercase tracking-widest">¡Su cita está registrada y confirmada!</p>
            </div>
          </motion.div>
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
                  className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-500/50 transition-all group shadow-xl"
                >
                  <div className="relative h-36 overflow-hidden bg-[#1a1a1a]">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick?.(v.image, v);
                      }}
                      className="cursor-zoom-in w-full h-full"
                    >
                      <img 
                        src={v.image} 
                        alt={v.model} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-100" 
                      />
                    </div>
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span className="bg-sky-500/90 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded-lg text-white uppercase shadow-lg border border-white/10">Certificado</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3 bg-black/40 border-t border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest leading-none">{v.year} {v.make}</p>
                      <h5 className="text-base font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-sky-400 transition-colors">{v.model}</h5>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-400 font-round font-bold uppercase tracking-widest leading-none mb-1.5">Precio Online</span>
                        <span className="text-lg font-mono font-black text-white tracking-tighter leading-none">${v.price.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500 transition-colors">
                        <ChevronRight size={18} className="text-sky-400 group-hover:text-white" />
                      </div>
                    </div>
                    {(v.mpg || v.mileage) && (
                      <div className="flex gap-4 pt-1.5 border-t border-white/5">
                        {v.mileage && <span className="text-xs text-zinc-100 font-round font-bold uppercase tracking-tight">{v.mileage}</span>}
                        {v.mpg && <span className="text-xs text-emerald-400 font-round font-bold uppercase tracking-tight">{v.mpg}</span>}
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFinanceClick?.(v);
                      }}
                      className="mt-1 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck size={12} /> Oferta Especial
                    </button>
                    {v.specialOffer && (
                      <div className="bg-sky-950/30 border border-sky-500/20 px-2 py-1 rounded text-xs text-sky-300 font-bold uppercase tracking-tighter w-fit mt-1">
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


    </motion.div>
  );
}

function VehicleCard({ vehicle, onImageClick, onChatClick, onFinanceClick, onGalleryClick }: { vehicle: Vehicle, onImageClick?: (url: string, v?: Vehicle) => void, onChatClick?: (v: Vehicle) => void, onFinanceClick?: (v: Vehicle, estimatedPayment: number) => void, onGalleryClick?: (v: Vehicle) => void }) {
  const estimatedPayment = Math.round((vehicle.price * 1.1) / 72); // Super simple estimate

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-zinc-950 border border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-sky-500/30 transition-all duration-700 shadow-3xl flex flex-col h-full"
    >
      <div className="h-48 md:h-64 bg-[#101010] overflow-hidden relative shrink-0 border-b border-white/5">
        <div 
          onClick={() => onImageClick?.(vehicle.image, vehicle)}
          className="cursor-zoom-in w-full h-full"
        >
          <img 
            src={vehicle.image} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-100"
          />
        </div>
        
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 pointer-events-none">
          <div className="bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.6)] text-[10px] md:text-xs font-black px-2 md:px-3 py-1 md:py-1.5 rounded-lg uppercase tracking-wider text-white">
            {vehicle.year}
          </div>
          <div className="bg-black/80 backdrop-blur-md text-[10px] md:text-xs font-black px-2 md:px-3 py-1 md:py-1.5 rounded-lg uppercase tracking-wider text-white border border-white/10">
            Certified
          </div>
        </div>

        {vehicle.images && vehicle.images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGalleryClick?.(vehicle);
            }}
            className="absolute bottom-4 right-4 z-10 bg-black/80 backdrop-blur-md text-white border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-sky-500 hover:border-sky-400 transition-colors shadow-xl"
            title="Ver más fotos"
          >
            Más fotos <span className="bg-white/20 px-1.5 py-0.5 rounded-md">{vehicle.images.length - 1}</span>
          </button>
        )}

        <div className="absolute bottom-4 left-6 md:bottom-6 md:left-8 pointer-events-none">
           <span className="text-white/10 font-black text-4xl md:text-6xl uppercase tracking-tighter block leading-none select-none">
            {vehicle.make}
           </span>
        </div>
      </div>
      <div className="p-3 md:p-6 space-y-2 md:space-y-4">
        <div 
          onClick={() => onImageClick?.(vehicle.image, vehicle)}
          className="flex flex-col gap-0.5 md:gap-1 cursor-pointer"
          title="Ver más detalles"
        >
          <h4 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-sky-400 transition-colors leading-none">
            {vehicle.make} {vehicle.model}
          </h4>
          <p className="text-[9px] md:text-[10px] text-zinc-300 font-bold uppercase tracking-[0.2em] leading-none mt-1">
            Unidad Certificada & Inspeccionada
          </p>
        </div>

        <div className="flex items-center justify-between py-1.5 md:py-3 border-y border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] uppercase font-black text-zinc-300 tracking-widest mb-1">Precio Online</span>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-3xl font-mono text-white font-black tracking-tighter">
                ${vehicle.price.toLocaleString()}
              </span>
              {vehicle.price > 0 && vehicle.price < 25000 && (
                <span className="bg-emerald-500 text-black text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase italic tracking-tighter transform -skew-x-12">Oferta</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] md:text-[10px] uppercase font-black text-sky-400 tracking-widest mb-1">Est. Mensual</span>
            <span className="text-lg md:text-2xl font-mono text-white font-black tracking-tighter">
              ${estimatedPayment}/mo*
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
            <Settings2 size={12} className="text-sky-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] md:text-[10px] uppercase font-round font-bold text-zinc-300 leading-none mb-0.5 md:mb-1">Motor</span>
              <span className="text-xs md:text-sm uppercase font-black text-zinc-100 tracking-wider font-mono truncate">{vehicle.engine || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
            <Gauge size={12} className="text-sky-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] md:text-[10px] uppercase font-round font-bold text-zinc-300 leading-none mb-0.5 md:mb-1">Trans</span>
              <span className="text-xs md:text-sm uppercase font-black text-zinc-100 tracking-wider font-mono truncate">{vehicle.transmission || 'Auto'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
            <Fuel size={12} className="text-sky-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] md:text-[10px] uppercase font-round font-bold text-zinc-300 leading-none mb-0.5 md:mb-1">MPG</span>
              <span className="text-xs md:text-sm uppercase font-black text-zinc-100 tracking-wider font-mono truncate">{vehicle.mpg || '24'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5">
            <ShieldCheck size={12} className="text-sky-400 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] md:text-[10px] uppercase font-round font-bold text-zinc-300 leading-none mb-0.5 md:mb-1">Millas</span>
              <span className="text-xs md:text-sm uppercase font-black text-zinc-100 tracking-wider font-mono truncate">{vehicle.mileage}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onFinanceClick) {
              onFinanceClick(vehicle, estimatedPayment);
            } else {
              window.open('https://gtautopr.com/pre-aprobacion/', '_blank');
            }
          }}
          className="relative w-full mt-2 md:mt-3 bg-white border-2 border-emerald-400/60 p-3 md:p-5 rounded-[1rem] md:rounded-2xl flex items-center justify-between hover:bg-emerald-50 hover:border-emerald-500 transition-all group/finance shadow-[0_0_15px_rgba(16,185,129,0.2)] md:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <div className="absolute inset-0 rounded-[1rem] md:rounded-2xl ring-2 md:ring-4 ring-emerald-400/30 animate-pulse pointer-events-none" />
          <div className="flex flex-col items-start text-left relative z-10 pr-2">
            <span className="text-sm md:text-lg font-black uppercase tracking-widest text-emerald-600 mb-0.5 md:mb-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">Oferta de Financiamiento</span>
            <span className="text-[10px] md:text-sm text-emerald-700 font-bold leading-tight">PRE-CUALIFICA SIN INDAGACION DE CREDITO y obtén más información sobre el proceso</span>
          </div>
          <ShieldCheck size={28} className="text-emerald-500 group-hover/finance:scale-110 transition-transform shrink-0 ml-1 md:ml-2 relative z-10" />
        </button>

        <div className="flex gap-2 pt-1 md:pt-2">
          <button 
            className="flex-1 bg-sky-500 text-white font-round font-black py-3 md:py-4 rounded-full md:rounded-[1.5rem] text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:bg-sky-400 shadow-2xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-1.5 md:gap-2 group/btn"
            onClick={() => onChatClick?.(vehicle)}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
            </span>
            LIVE CHAT
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => window.open(`https://wa.me/17872788000?text=Hola! Me interesa el ${vehicle.year} ${vehicle.make} ${vehicle.model} de ${vehicle.price}`, '_blank')}
            className="w-10 h-10 md:w-14 md:h-auto bg-emerald-600 text-white rounded-full md:rounded-[1.5rem] flex items-center justify-center hover:bg-emerald-500 transition-all shadow-xl shrink-0"
            title="WhatsApp"
          >
            <MessageSquare size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
          <button 
            onClick={() => window.open('tel:17872788000', '_self')}
            className="w-10 h-10 md:w-14 md:h-auto bg-sky-600 text-white rounded-full md:rounded-[1.5rem] flex items-center justify-center hover:bg-sky-500 transition-all shadow-xl shrink-0"
            title="Llamar"
          >
            <Phone size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SpecItem({ label, value }: { label: string, value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">{label}</span>
      <span className="text-sm font-bold text-white tracking-tight">{value}</span>
    </li>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h5 className="text-sm font-black uppercase tracking-widest text-white mb-1">{title}</h5>
        <p className="text-xs text-zinc-300 font-bold leading-tight">{desc}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="bg-sky-500/10 border border-sky-500/20 px-5 py-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center w-fit backdrop-blur-xl">
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
        />
      </div>
    </div>
  );
}
