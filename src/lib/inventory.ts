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
    transmission: "Automático"
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
    transmission: "4x4 Automático"
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
    transmission: "Manual"
  }
];

/**
 * INSTRUCCIONES PARA EL USUARIO:
 * Para conectar tu Google Sheet:
 * 1. Ve a tu hoja de cálculo.
 * 2. Archivo > Compartir > Publicar en la web.
 * 3. Selecciona 'Valores separados por comas (.csv)'.
 * 4. Pega la URL aquí abajo en SHEET_CSV_URL.
 */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1eP8zbvY5Ifsno2g2AsJoc5YV4q-PxNxzQaM6SSNy-dk/export?format=csv"; 

export async function getInventory(): Promise<Vehicle[]> {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error("No se pudo acceder al Google Sheet. Verifica que esté compartido públicamente.");
    
    const csvText = await response.text();
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    
    if (rows.length < 2) return MOCK_INVENTORY;

    // Basic CSV Parser (assuming simple mapping for now)
    // Expects headers like: Make, Model, Year, Price, Image, Description, Mileage
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    const inventory = rows.slice(1).map((row, index) => {
      // Split by comma but handle cases where values might have commas (quoted)
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
      const getVal = (key: string) => {
        const i = headers.findIndex(h => h.trim().toLowerCase().includes(key.toLowerCase()));
        return i !== -1 ? values[i]?.trim().replace(/^"|"$/g, '') : null;
      };

      const make = getVal('marca') || "PR Group";
      const model = getVal('modelo') || "Premium Unit";
      const submodel = getVal('sub-modelo') || "";
      const priceStr = getVal('precio') || "0";
      const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      const year = parseInt(getVal('año') || "2024");
      const image = getVal('foto') || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800";
      const mileage = getVal('millaje') || "Entrega inmediata";
      const desc = getVal('descripcion') || getVal('clase') || "";

      return {
        id: String(index),
        make,
        model: submodel ? `${model} ${submodel}` : model,
        year,
        price,
        image,
        description: desc || "Unidad certificada con garantía.",
        mileage,
        isAvailable: true
      };
    });

    return inventory.length > 0 ? inventory : MOCK_INVENTORY;
  } catch (error) {
    console.error("Error loading inventory:", error);
    return MOCK_INVENTORY;
  }
}

export function searchVehicles(vehicles: Vehicle[], query: string): Vehicle[] {
  const q = query.toLowerCase();
  return vehicles.filter(v => 
    v.make.toLowerCase().includes(q) || 
    v.model.toLowerCase().includes(q) || 
    v.description.toLowerCase().includes(q)
  );
}
