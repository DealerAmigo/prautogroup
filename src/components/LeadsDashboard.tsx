import React, { useEffect, useState } from 'react';
import { subscribeToLeads, auth, loginWithGoogle, onAuthStateChanged } from '../lib/leads';
import { motion, AnimatePresence } from 'motion/react';
import { User, Calendar, MessageSquare, Phone, Mail, Clock, Car, Filter, Lock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Lead {
  id: string;
  type: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleInterest?: string;
  notes?: string;
  source?: string;
  createdAt: any;
  // Others depending on type
  [key: string]: any;
}

const ADMIN_EMAIL = 'willquisnos@gmail.com';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1eP8zbvY5Ifsno2g2AsJoc5YV4q-PxNxzQaM6SSNy-dk/edit';

const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Acceso directo a leads para simplicidad administrativa
    setIsAuthLoading(false);
    const unsubscribe = subscribeToLeads((data) => {
      setLeads(data);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#080808]">
        <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#080808] text-white p-8 space-y-6">
        <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-pink-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
             <div className="w-1 h-6 bg-pink-600"></div>
             Acceso Restringido
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Este panel es solo para personal certificado de PR Automotive Group.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => loginWithGoogle ? loginWithGoogle().catch(console.error) : alert("Auth not configured")}
            className="bg-pink-600 hover:bg-pink-500 text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-pink-600/20 active:scale-95"
          >
            Iniciar Sesión con Google
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-600 tracking-widest bg-[#080808] px-2">Ó</div>
          </div>

          <button
            onClick={() => window.open(SHEET_URL, '_blank')}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            Ver Google Sheet Directo
            <Sparkles size={14} className="text-pink-500" />
          </button>
        </div>
        {currentUser && (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
            Conectado como: {currentUser.email}
          </p>
        )}
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.type === filter;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "d 'de' MMMM, HH:mm", { locale: es });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'proposal_request': return <MessageSquare className="w-4 h-4 text-pink-500" />;
      case 'car_request': return <Car className="w-4 h-4 text-blue-500" />;
      case 'appointment': return <Calendar className="w-4 h-4 text-emerald-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white p-4 md:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-pink-600"></div>
            Panel de Leads
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitorea las capturas de DealerAmigo en tiempo real</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button 
            onClick={() => window.open(SHEET_URL, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all"
          >
            Google Sheet <Sparkles size={12} />
          </button>
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            {(['all', 'proposal_request', 'appointment', 'car_request', 'image_click'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === t ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'proposal_request' ? 'Leads' : t === 'appointment' ? 'Citas' : t === 'car_request' ? 'Pedidos' : 'Interés'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
        {leads.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
            <Clock className="text-slate-700 mb-4 animate-pulse" size={40} />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Esperando capturas de DealerAmigo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={lead.id || idx}
                  className="bg-[#0c0c0c] border border-white/[0.05] rounded-[2rem] p-6 hover:border-rose-500/30 transition-all group relative overflow-hidden flex flex-col shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${
                      lead.type === 'appointment' ? 'bg-emerald-500/10 text-emerald-500' :
                      lead.type === 'proposal_request' ? 'bg-rose-500/10 text-rose-500' :
                      lead.type === 'image_click' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {getIcon(lead.type)}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded mb-1">
                        {lead.dateStr || 'Reciente'}
                      </span>
                      <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">#{idx + 1}</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <h3 className="text-xl font-black tracking-tight text-white group-hover:text-rose-500 transition-colors uppercase italic truncate">
                      {lead.name || lead.nombre || 'Anónimo'}
                    </h3>

                    <div className="space-y-2">
                       {lead.vehicle && (
                        <div className="flex items-center gap-2">
                          <Car size={14} className="text-rose-600" />
                          <span className="text-xs font-black uppercase text-slate-300 truncate">{lead.vehicle}</span>
                        </div>
                      )}
                      
                      {(lead.phone || lead.telefono) && (
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                          <Phone size={12} />
                          {lead.phone || lead.telefono}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {(lead.monthlyBudget || lead.presupuesto) && (
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <p className="text-[8px] font-black uppercase text-slate-600 mb-0.5">Mensual</p>
                            <p className="text-[10px] font-bold text-emerald-500 truncate">{lead.monthlyBudget || lead.presupuesto}</p>
                          </div>
                        )}
                        {(lead.town || lead.pueblo) && (
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <p className="text-[8px] font-black uppercase text-slate-600 mb-0.5">Pueblo</p>
                            <p className="text-[10px] font-bold text-white truncate">{lead.town || lead.pueblo}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(lead.notes || lead.content) && (
                      <div className="mt-4 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                        <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-3">
                          "{lead.notes || lead.content}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all border border-white/5 italic">
                      Detalles
                    </button>
                    <button 
                      onClick={() => window.open(`tel:${lead.phone || lead.telefono}`)}
                      className="flex-1 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-rose-500/20 shadow-lg shadow-rose-600/0 hover:shadow-rose-600/20"
                    >
                      Llamar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {filteredLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 opacity-20">
          <Filter className="w-12 h-12 mb-4" />
          <p className="text-lg font-bold uppercase tracking-widest">Sin registros encontrados</p>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboard;
