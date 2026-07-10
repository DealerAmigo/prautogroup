const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetChat = `                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'chat' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Chat
                  {activeTab === 'inventory' && (
                    <span className="absolute top-2.5 right-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'inventory' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Inventario
                </button>`;

const replaceChat = `                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'chat' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Chat
                  {activeTab === 'inventory' && (
                    <span className="absolute top-2.5 right-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'inventory' ? "bg-white text-sky-600 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Inventario
                </button>`;

let modified = false;
if (code.includes(targetChat)) {
  code = code.replaceAll(targetChat, replaceChat);
  console.log("Replaced Tabs");
  modified = true;
} else {
  console.log("Not found Tabs");
}

if (modified) fs.writeFileSync('src/App.tsx', code);
