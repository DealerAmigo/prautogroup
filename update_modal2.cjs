const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      </AnimatePresence>

      {/* Floating WhatsApp - REMOVED PER REQUEST */}`;

const galleryModal = `      </AnimatePresence>

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
                        className={\`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 \${
                          idx === activeImageIndex ? "border-sky-500 scale-110 shadow-lg shadow-sky-500/30" : "border-white/20 hover:border-white/55 opacity-60 hover:opacity-100"
                        }\`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" alt={\`Photo \${idx + 1}\`} />
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

      {/* Floating WhatsApp - REMOVED PER REQUEST */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, galleryModal);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found!");
}
