import { Vehicle } from "../types";

// Base inventory for when sheets are not connected or for testing
const MOCK_INVENTORY: Vehicle[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Corolla",
    year: 2023,
    price: 24500,
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800",
    description: "Excelente condición, un solo dueño. Garantía de fábrica.",
    mileage: "12,000 mi",
    isAvailable: true,
    exteriorColor: "Blanco",
    transmission: "Automático",
    category: "Sedan",
    mpg: "30 City / 38 Highway",
    specialOffer: "Garantía extendida incluida"
  },
  {
    id: "2",
    make: "Jeep",
    model: "Wrangler Rubicon",
    year: 2022,
    price: 48900,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "Equipado para la aventura. Techo removible.",
    mileage: "25,000 mi",
    isAvailable: true,
    exteriorColor: "Gris",
    transmission: "4x4 Automático",
    category: "SUV",
    mpg: "17 City / 23 Highway",
    specialOffer: "Accesorios off-road con 20% descuento"
  },
  {
    id: "3",
    make: "Honda",
    model: "Civic Type R",
    year: 2021,
    price: 42000,
    image: "https://images.unsplash.com/photo-1594070319944-7c0c6346382f?auto=format&fit=crop&q=80&w=800",
    description: "Versión deportiva. Impecable.",
    mileage: "18,000 mi",
    isAvailable: true,
    exteriorColor: "Rojo",
    transmission: "Manual",
    category: "Sedan",
    mpg: "22 City / 28 Highway",
    specialOffer: "Mantenimiento gratis por 1 año"
  },
  {
    id: "4",
    make: "Honda",
    model: "Odyssey",
    year: 2022,
    price: 36900,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800",
    description: "Espaciosa minivan con 3 filas de asientos. Perfecta para 7 pasajeros. Cámara de reversa y sistema premium.",
    mileage: "21,000 mi",
    isAvailable: true,
    exteriorColor: "Azul",
    transmission: "Automático",
    category: "Mini-Van",
    mpg: "19 City / 28 Highway",
    specialOffer: "Ideal para familias"
  },
  {
    id: "5",
    make: "Hyundai",
    model: "Palisade",
    year: 2023,
    price: 48500,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "SUV de lujo con 3 filas de asientos reales. Capacidad para 8 pasajeros, tecnología H-TRAC y garantía de fábrica.",
    mileage: "5,400 mi",
    isAvailable: true,
    exteriorColor: "Gris",
    transmission: "Automático",
    category: "3 Filas",
    mpg: "19 City / 26 Highway",
    specialOffer: "Tecnología H-TRAC incluida"
  },
  {
    id: "6",
    make: "Ford",
    model: "F-150 Lariat",
    year: 2022,
    price: 52000,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800",
    description: "Pick Up potente con tecnología avanzada y poco millaje.",
    mileage: "15,000 mi",
    isAvailable: true,
    exteriorColor: "Negro",
    transmission: "4x4",
    category: "Pick Up",
    mpg: "17 City / 23 Highway",
    specialOffer: "Protector de caja gratis"
  },
  {
    id: "7",
    make: "Genesis",
    model: "GV80",
    year: 2024,
    price: 75000,
    image: "https://images.unsplash.com/photo-1617469165786-8007eda3caa7?auto=format&fit=crop&q=80&w=800",
    description: "SUV de lujo con acabados premium y 3 filas de asientos.",
    mileage: "1,200 mi",
    isAvailable: true,
    exteriorColor: "Blanco",
    transmission: "AWD",
    category: "De Lujo",
    mpg: "18 City / 24 Highway",
    specialOffer: "Concierge service por 2 años"
  },
  {
    id: "8",
    make: "Toyota",
    model: "Yaris",
    year: 2022,
    price: 21000,
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800",
    description: "Sedan compacto y económico, ideal para el ahorro de gasolina.",
    mileage: "10,000 mi",
    isAvailable: true,
    exteriorColor: "Plata",
    transmission: "Automático",
    category: "Economico",
    mpg: "32 City / 41 Highway",
    specialOffer: "Bono de $500 para trade-in"
  },
  {
    id: "9",
    make: "Kia",
    model: "Carnival",
    year: 2024,
    price: 30995,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800",
    description: "Multipurpose vehicle con estilo de SUV. Espacio masivo y tecnología de punta.",
    mileage: "5,000 mi",
    isAvailable: true,
    exteriorColor: "Blanco",
    transmission: "Automático",
    category: "Mini-Van",
    mpg: "19 City / 26 Highway",
    specialOffer: "0% APR por 36 meses para clientes cualificados"
  }
];

export async function getInventory(): Promise<Vehicle[]> {
  try {
    const response = await fetch("/api/inventory");
    if (!response.ok) throw new Error("No se pudo cargar el inventario.");
    
    const csvText = await response.text();
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    
    if (rows.length < 2) return MOCK_INVENTORY;

    // Mapping headers to indexes
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    const getIdx = (name: string) => headers.findIndex(h => h.replace(/\s+/g, '').includes(name.toLowerCase()));

    const idx = {
      year: getIdx('año'),
      make: getIdx('marca'),
      model: getIdx('modelo'),
      trim: getIdx('sub-modelo'),
      price: getIdx('precio'),
      mileage: getIdx('millaje'),
      image: getIdx('fotoweblink'),
      category: getIdx('clase'),
      desc: getIdx('descripcion'),
      mpg: getIdx('mpg'),
      disp: getIdx('disponibles')
    };

    const inventory = rows.slice(1).map((row, index) => {
      // Split CSV keeping quotes in mind
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else current += char;
      }
      values.push(current.trim());

      const clean = (val: string) => (val || "").replace(/^"|"$/g, '').trim();
      
      const priceStr = clean(values[idx.price]) || "0";
      const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      const year = parseInt(clean(values[idx.year]) || "2024");
      const make = clean(values[idx.make]) || "PR Automotive";
      const model = clean(values[idx.model]);
      const trim = clean(values[idx.trim]);
      const image = clean(values[idx.image]);
      const category = clean(values[idx.category]);

      return {
        id: String(index),
        make,
        model: trim ? `${model} ${trim}` : model,
        year,
        price,
        image: image.startsWith('http') ? image : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
        description: clean(values[idx.desc]) || `${category} certificado con garantía.`,
        mileage: clean(values[idx.mileage]) || "Bajo millaje",
        category,
        mpg: clean(values[idx.mpg]) || "",
        specialOffer: "",
        isAvailable: clean(values[idx.disp]).toLowerCase() !== 'no'
      };
    });

    return inventory.length > 0 ? inventory : MOCK_INVENTORY;
  } catch (error) {
    console.error("Error loading inventory from API:", error);
    return MOCK_INVENTORY;
  }
}

export interface SearchFilters {
  query?: string;
  category?: string;
  maxPrice?: number;
}

export function searchVehicles(vehicles: Vehicle[], filters: string | SearchFilters): Vehicle[] {
  let q = '';
  let categoryFilter = '';
  let maxPriceFilter = 0;

  if (typeof filters === 'string') {
    q = filters.toLowerCase().trim();
  } else {
    q = (filters.query || '').toLowerCase().trim();
    categoryFilter = (filters.category || '').toLowerCase().trim();
    maxPriceFilter = filters.maxPrice || 0;
  }
  
  // If no filters at all, return default browsing view
  if (!q && !categoryFilter && !maxPriceFilter) {
    return [...vehicles].sort((a, b) => b.year - a.year).slice(0, 10);
  }
  
  // Direct category synonyms for semantic mapping
  const isPickupQuery = q === 'pickup' || q === 'pick up' || q === 'pick-up' || q === 'guagua' || categoryFilter === 'pick up';
  const isEconomicQuery = q.includes('economico') || q.includes('barato') || q.includes('presupuesto bajo') || q.includes('bajo');
  const isLuxuryQuery = q.includes('lujo') || q.includes('luxury') || q.includes('caro') || q.includes('premium') || q.includes('gama alta') || categoryFilter === 'luxury' || categoryFilter === 'de lujo';
  const isFamilyQuery = q.includes('3 filas') || q.includes('7 pasajeros') || q.includes('familia') || q.includes('fiel') || q.includes('3 rows') || categoryFilter === '3 filas';
  const isMinivanQuery = q.includes('minivan') || q.includes('mini-van') || categoryFilter === 'mini-van';
  
  return vehicles.filter(v => {
    const vCat = (v.category?.toLowerCase() || "");
    const vMake = v.make.toLowerCase();
    const vModel = v.model.toLowerCase();
    const vDesc = v.description.toLowerCase();

    // Search Logic Optimization for specified classes
    if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'any') {
      const matchCat = vCat.includes(categoryFilter) || (categoryFilter === '3 filas' && (vCat === '3 filas' || vDesc.includes('3 filas'))) || (categoryFilter === 'mini-van' && vCat.includes('van'));
      if (matchCat) return true;
      
      // Semantic fallbacks for category filter
      if (isPickupQuery && (vCat.includes('pick up') || vCat.includes('pickup'))) return true;
      if (isEconomicQuery && (v.price < 35000 || vCat.includes('economico'))) return true;
      if (isLuxuryQuery && (v.price > 50000 || vCat.includes('lujo') || vCat.includes('luxury') || vCat.includes('de lujo'))) return true;
      if (isFamilyQuery && (vCat.includes('3 filas') || vDesc.includes('3 filas'))) return true;
      if (isMinivanQuery && (vCat.includes('van') || vCat.includes('minivan'))) return true;
      
      if (!q) return false;
    }

    // 2. Max Price Filter
    if (maxPriceFilter > 0) {
      if (v.price > maxPriceFilter) return false;
    }

    // 3. Keyword / Query Match
    if (q) {
      const hayMatchEnTexto = vMake.includes(q) || vModel.includes(q) || vDesc.includes(q);
      const hayMatchEnCategoria = vCat.includes(q);
      
      // Special Pickup match
      const matchEspecialPickup = isPickupQuery && (vCat.includes('pick up') || vCat.includes('pickup'));

      // Semantic match: Economico
      const matchEconomico = isEconomicQuery && (v.price < 35000 || vCat.includes('compact') || vCat.includes('mini-van') || vCat.includes('economico'));

      // Semantic match: Lujo
      const matchLujo = isLuxuryQuery && (v.price > 50000 || vCat.includes('lujo') || vCat.includes('luxury') || vCat.includes('prestige') || vCat.includes('de lujo'));

      // Semantic match: Family (3 rows)
      const matchFamilia = isFamilyQuery && (
        vDesc.includes('3 filas') || 
        vDesc.includes('pasajeros') || 
        vDesc.includes('7') ||
        vDesc.includes('asientos') ||
        vCat.includes('van') || 
        vCat.includes('minivan') ||
        vCat.includes('3 filas') ||
        (vCat.includes('suv') && (v.model.toLowerCase().includes('gv80') || v.model.toLowerCase().includes('santa fe') || v.model.toLowerCase().includes('highlander') || v.model.toLowerCase().includes('pilot')))
      );

      if (!(hayMatchEnTexto || hayMatchEnCategoria || matchEspecialPickup || matchEconomico || matchLujo || matchFamilia)) {
        return false;
      }
    }

    return true;
  });
}
