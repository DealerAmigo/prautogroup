import React, { useEffect, useState } from 'react';
import { subscribeToLeads, auth, loginWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { User, Calendar, MessageSquare, Phone, Mail, Clock, Car, Filter, Lock } from 'lucide-react';
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

const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      setLeads([]);
      return;
    }

    const unsubscribe = subscribeToLeads((data) => {
      setLeads(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

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
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Acceso Restringido</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Este panel es solo para personal certificado de PR Automotive Group.
          </p>
        </div>
        <button
          onClick={() => loginWithGoogle().catch(console.error)}
          className="bg-pink-600 hover:bg-pink-500 text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-pink-600/20 active:scale-95"
        >
          Iniciar Sesión con Google
        </button>
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

        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {(['all', 'proposal_request', 'appointment', 'car_request'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                filter === t ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'proposal_request' ? 'Leads' : t === 'appointment' ? 'Citas' : 'Pedidos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={lead.id}
              className="bg-[#111] border border-slate-800/50 rounded-2xl p-5 hover:border-pink-500/30 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                {getIcon(lead.type)}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded">
                    {lead.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono italic">
                    <Clock className="w-3 h-3" />
                    {formatDate(lead.createdAt)}
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-pink-400 transition-colors capitalize">
                  {lead.name || lead.nombre || 'Interesado Anónimo'}
                </h3>

                <div className="space-y-2">
                  {(lead.phone || lead.telefono) && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-sm font-mono tracking-tight">{lead.phone || lead.telefono}</span>
                    </div>
                  )}

                  {(lead.email) && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-sm font-mono truncate">{lead.email}</span>
                    </div>
                  )}

                  {lead.vehicleInterest && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Car className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">{lead.vehicleInterest}</span>
                    </div>
                  )}
                </div>

                {(lead.notes || lead.presupuesto || lead.content) && (
                  <div className="mt-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      " {lead.notes || lead.content || `Presupuesto: ${lead.presupuesto || 'N/A'}. Vehículo: ${lead.vehiculo || 'N/A'}`} "
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
