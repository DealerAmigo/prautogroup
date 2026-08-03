import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Phone, Mail, MessageSquare, ChevronRight, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BookingFormProps {
  onSuccess: (data: any) => void;
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    contactMethod: 'phone',
    notes: '',
    name: '',
    phone: '',
    monthlyBudget: '',
    town: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [timeError, setTimeError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeError('');

    // Validate time is between 09:00 and 17:00
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      const minMinutes = 9 * 60; // 9:00 AM
      const maxMinutes = 17 * 60; // 5:00 PM
      if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
        setTimeError('El horario de cita debe ser entre las 9:00 AM y las 5:00 PM.');
        return;
      }
    }

    setIsSubmitting(true);
    
    // Simulate API call or call onSuccess directly
    // In real app, we'd save to Firebase here
    try {
      const { saveLead } = await import('../lib/leads');
      await saveLead({
        type: 'appointment_booking_form',
        ...formData,
        timestamp: Date.now()
      });

      // Try integration with Google Calendar if possible
      try {
//        const { createCalendarEvent } = await import('../lib/calendar');
//        await createCalendarEvent({
//          customerName: formData.name,
//          date: formData.date,
//          time: formData.time,
//          interest: formData.notes || 'Consulta General'
//        });
      } catch (calErr) {
        console.warn("Calendar integration skipped or failed:", calErr);
        // We don't fail the whole form if calendar fails
      }
      
      setIsSuccess(true);
      onSuccess(formData);
    } catch (error) {
      console.error("Error saving booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-white" size={24} />
        </div>
        <h4 className="text-white font-black uppercase tracking-tight mb-2">¡Cita Solicitada!</h4>
        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Un experto te contactará pronto.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-rose-600 px-6 py-4">
        <h4 className="text-white font-black italic uppercase tracking-tighter text-xl">Coordinar Cita</h4>
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em]">GT Auto Imports Experience</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-rose-500" /> Fecha
            </label>
            <input 
              required
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Clock size={12} className="text-rose-500" /> Hora</span>
              <span className="text-rose-400 font-bold">9:00 AM - 5:00 PM</span>
            </label>
            <input 
              required
              type="time" 
              min="09:00"
              max="17:00"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all font-mono"
            />
          </div>
        </div>

        {timeError && (
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
            {timeError}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Método de Contacto Preferido</label>
          <div className="flex gap-2">
            {[
              { id: 'phone', icon: Phone, label: 'Tel' },
              { id: 'whatsapp', icon: MessageSquare, label: 'WA' },
              { id: 'email', icon: Mail, label: 'Email' }
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setFormData({...formData, contactMethod: method.id})}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all",
                  formData.contactMethod === method.id 
                    ? "bg-rose-600 border-rose-500 text-white" 
                    : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                )}
              >
                <method.icon size={14} />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-1.5">
             <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Información de Contacto</label>
             <div className="grid grid-cols-2 gap-2">
                <input 
                  required
                  placeholder="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <input 
                  required
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all font-mono"
                />
             </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                <input 
                  placeholder="Presupuesto Mensual ($)"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({...formData, monthlyBudget: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <input 
                  placeholder="Pueblo"
                  value={formData.town}
                  onChange={(e) => setFormData({...formData, town: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all"
                />
             </div>
           </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Notas Adicionales</label>
            <textarea 
              placeholder="¿Algún detalle que debamos saber?"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-all resize-none"
            />
          </div>
        </div>

        <button 
          disabled={isSubmitting}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-stone-800 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar Solicitud'}
          <ChevronRight size={16} />
        </button>
      </form>
    </div>
  );
}
