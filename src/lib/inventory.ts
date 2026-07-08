import { Vehicle } from "../types";

const MOCK_INVENTORY: Vehicle[] = [
// Base inventory for when sheets are not connected or for testing
  {
    id: "1",
    make: "BMW",
    model: "230i Coupe",
    trim: "230i",
    year: 2018,
    price: 17995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68dd20.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    images: [
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68dd20.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68f6bb.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68f9b1.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68fc53.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d691402.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d692128.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
      "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3583d68ed77.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1"
    ],
    description: "Es un BMW Serie 2, versión 230i de entrada y ECONOMICO1. Trae el motor turbo de 4 cilindros que es ágil y eficiente, pero no es un M240i (que trae el 6 cilindros). Por el kilometraje (75k) y el año (2018), es una unidad usada que probablemente tuvo uso como daily driver. Si buscas un convertible divertido, relativamente económico de mantener (comparado con el M240i) y práctico para el día a día, es una buena opción.",
    mileage: "75,262 mi",
    isAvailable: true,
    exteriorColor: "Negro",
    transmission: "8 Velocidades Automatico",
    category: "Coupe",
    engine: "2.0 litros 4 cilindros Turbo / 248 hp",
    mpg: "24/35"
  },
  {
    id: "2",
    make: "Audi",
    model: "Q3 S-Line Premium",
    trim: "S-Line Premium",
    year: 2018,
    price: 19995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2ac2d4eab12.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Este es un Audi Q3 Premium de 2018 usado, con 58,500 millas. Tiene un motor de 4 cilindros y 200 HP, transmisión automática Tiptronic de 6 velocidades y traccion delantera. Su rendimiento de combustible es de 20 MPG en ciudad y 28 MPG en carretera.",
    mileage: "58,561 mi",
    isAvailable: true,
    exteriorColor: "Gris",
    transmission: "6 Velocidades Automatico tiptronic",
    category: "SUV Premium",
    engine: "2.0 4 cyl 200hp",
    mpg: "20/28"
  },
  {
    id: "3",
    make: "Audi",
    model: "S5 S-Line Prestige",
    trim: "S-Line Prestige",
    year: 2010,
    price: 11995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "Este es un Audi S5 Prestige del 2010, usado, con 58,450 millas. Los interiores son gris y los aros son 2 tonos.",
    mileage: "58,450 mi",
    isAvailable: true,
    exteriorColor: "Azul",
    transmission: "6 Velocidades Automatico tiptronic",
    category: "Coupe",
    engine: "V8",
    mpg: "16/22"
  },
  {
    id: "4",
    make: "BMW",
    model: "X7 xDrive 40i",
    trim: "xDrive 40i",
    year: 2022,
    price: 52995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2ac1ecb52d6.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Este es un SUV usado del año 2022 con 38,881 millas. Tiene un motor de 6 cilindros en línea turboalimentado de 3.0L DOHC y una transmisión automática deportiva de 8 velocidades. Su rendimiento de combustible es de 19 MPG en ciudad y 24 MPG en carretera. Cuenta con tracción total a tiempo parcial y completo, y un motor híbrido eléctrico.",
    mileage: "38,881 mi",
    isAvailable: true,
    exteriorColor: "Negro",
    transmission: "8 Velocidades Automatico",
    category: "3 Filas Premium",
    engine: "6I / 335 hp",
    mpg: "19/24"
  },
  {
    id: "5",
    make: "BMW",
    model: "X3 S-Drive 30i",
    trim: "S-Drive 30i",
    year: 2023,
    price: 42995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_69f4cc96eb235.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Entre sus características de rendimiento, cuenta con un motor BMW TwinPower Turbo de 2.0L y 4 cilindros en línea, relación de eje de 3.385 y una característica de encendido y apagado automático del motor. La transmisión incluye un modo seleccionable por el conductor y enfriador de aceite, y tiene tracción trasera. Super Bien Cuidada esta unidad.",
    mileage: "39,641 mi",
    isAvailable: true,
    exteriorColor: "Blanca",
    transmission: "8 Velocidades Automatico",
    category: "SUV Premium",
    engine: "2.0 lt 4 cilindros turbo/248 hp",
    mpg: "23/29"
  },
  {
    id: "6",
    make: "BMW",
    model: "X5 xDrive 40i",
    trim: "xDrive 40i",
    year: 2020,
    price: 33995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a397a817a791.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV usado del año 2020 con 51,369 millas. Equipa un motor 3.0L DOHC I-6 24V TwinPower Turbo de 6 cilindros en línea con transmisión deportiva automática, tracción integral (AWD) de tiempo parcial y completo, y función de arranque/parada automático. Ofrece un rendimiento de combustible de 20 mpg en ciudad y 26 en carretera.",
    mileage: "51,369 mi",
    isAvailable: true,
    exteriorColor: "Blanca",
    transmission: "8 Velocidades Automatico",
    category: "SUV Premium",
    engine: "3.0 litros 6 cilindros turbo / 336hp",
    mpg: "20/26"
  },
  {
    id: "7",
    make: "BMW",
    model: "2 235i",
    trim: "235i",
    year: 2019,
    price: 17995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2abde7a30e8.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV del año 2019 con 61,900 millas. Equipa un motor 2.0L TwinPower Turbo de 4 cilindros en línea con transmisión deportiva automática de 8 velocidades, tracción trasera y función de arranque/parada automático. Ofrece un rendimiento de combustible de 24 mpg en ciudad y 35 en carretera.",
    mileage: "61,990 mi",
    isAvailable: true,
    exteriorColor: "Negro",
    transmission: "8 Velocidades Automatico",
    category: "Coupe",
    engine: "2.0 Litros 4 cilindros Turbo /248 hp",
    mpg: "24/32"
  },
  {
    id: "8",
    make: "Dodge",
    model: "Durango SRT 392",
    trim: "SRT 392",
    year: 2019,
    price: 35995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a397afd7eaad.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV del año 2019 con 43,500 millas. Equipa un motor 6.4L V8 SRT HEMI MDS de 8 cilindros con transmisión automática de 8 velocidades (8HP70), tracción integral permanente con caja de transferencia electrónica y control secuencial con paletas de cambio en el volante. Ofrece un rendimiento de combustible de 13 mpg en ciudad y 19 en carretera.",
    mileage: "43,509 mi",
    isAvailable: true,
    exteriorColor: "blanca",
    transmission: "8 Velocidades Automatico AWD",
    category: "3 Filas Premium",
    engine: "V8 6.4 litros /475 hp",
    mpg: "13/19"
  },
  {
    id: "9",
    make: "Ford",
    model: "Ranger FX4",
    trim: "FX4",
    year: 2021,
    price: 34995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a36c64c27613.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Pickup usada del año 2021 con 32,609 millas. Equipa un motor 2.3L EcoBoost de 4 cilindros con tecnología de arranque/parada automático y transmisión automática electrónica SelectShift de 10 velocidades, con relación de eje de 3.73 y tracción 4x4 con paquete FX4. Ofrece un rendimiento de combustible de 19 mpg tanto en ciudad como en carretera.",
    mileage: "32,609 mi",
    isAvailable: true,
    exteriorColor: "amarilla",
    transmission: "10 Velocidades Automatico",
    category: "Pick Up",
    engine: "2.3L EcoBoost 4 cilindros / 270 hp",
    mpg: "19/19"
  },
  {
    id: "10",
    make: "Toyota",
    model: "Corolla LE",
    trim: "LE",
    year: 2022,
    price: 17995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_68c1c9190518d.png&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Sedán usado del año 2022 con 19,895 millas. Equipa un motor 1.8L I-4 DOHC 16 válvulas con tecnología Valvematic de 4 cilindros y transmisión variable continua (CVTi-S), con tracción delantera y relación de eje de 4.76. Ofrece un rendimiento de combustible de 30 mpg en ciudad y 38 en carretera.",
    mileage: "19,989 mi",
    isAvailable: true,
    exteriorColor: "gris",
    transmission: "cvt-s",
    category: "Economico",
    engine: "4 cilindros 1.8 litros / 139 hp",
    mpg: "30/38"
  },
  {
    id: "11",
    make: "Infiniti",
    model: "QX55 Essential",
    trim: "Essential",
    year: 2023,
    price: 34995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a358519dca21.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV usado del año 2023 con 14,500 millas. Equipa un motor 2.0L VC-Turbo I4 DOHC de 4 cilindros con transmisión variable continua (CVT) con paletas de cambio, tracción integral permanente y relación de eje de 5.846. Ofrece un rendimiento de combustible de 22 mpg en ciudad y 28 en carretera.",
    mileage: "14,500 mi",
    isAvailable: true,
    exteriorColor: "azul marino",
    transmission: "CVT AWD",
    category: "SUV Premium",
    engine: "2.0 litros VC-Turbo 4 cilindros /268 hp",
    mpg: "22/28"
  },
  {
    id: "12",
    make: "Ford",
    model: "Explorer XLT",
    trim: "XLT",
    year: 2018,
    price: 17995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a3584e119cae.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV de 7 pasajeros, usado del año 2018 con 61,568 millas. Equipa un motor 3.5L Ti-VCT V6 con combustible flexible (FFV) y transmisión automática SelectShift de 6 velocidades, con tracción delantera y relación de eje no limitada de 3.39. Ofrece un rendimiento de combustible de 17 mpg en ciudad y 24 en carretera.",
    mileage: "61,458 mi",
    isAvailable: true,
    exteriorColor: "Sand",
    transmission: "6 Velocidades Automatico",
    category: "Economico",
    engine: "V6 3.5 litros",
    mpg: "17/24"
  },
  {
    id: "13",
    make: "Jeep",
    model: "Wrangler Sport",
    trim: "Sport",
    year: 2014,
    price: 19995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2dc3a3a607b.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "2014 Jeep Wrangler Unlimited Sport con 77,779 millas. Equipa un motor 3.6L V6 de 6 cilindros con transmisión Automatica de 6 velocidades y tracción 4WD. Incluye aros aftermarket Dick Cepek, asientos en piel, se encuentra súper limpio y bien cuidado.",
    mileage: "77,787 mi",
    isAvailable: true,
    exteriorColor: "Azul",
    transmission: "6 Velocidades Automatico 4wd",
    category: "Economico",
    engine: "3.6 litros v6",
    mpg: "16/20"
  },
  {
    id: "14",
    make: "Jeep",
    model: "Gladiator Sport",
    trim: "Sport",
    year: 2021,
    price: 33995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a397a31627b5.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Pickup usada del año 2021 con 59,709 millas. Equipa un motor V6 de 6 cilindros con transmisión automática de 8 velocidades (850RE) que incluye Tip Start, placa protectora de transmisión y control Selec-Speed. Ofrece un rendimiento de combustible de 17 mpg en ciudad y 22 en carretera. Monta gomas 35x12.50 R20LT con aros aftermarket Tuff Wheels e incluye cubierta trasera tipo tunnel cover.",
    mileage: "59,789 mi",
    isAvailable: true,
    exteriorColor: "negra",
    transmission: "8 Velocidades Automatico",
    category: "Pick Up",
    engine: "v6 / 285 hp",
    mpg: "17/22"
  },
  {
    id: "15",
    make: "Mini",
    model: "Cooper S",
    trim: "S",
    year: 2019,
    price: 20995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2ac222a7b89.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Mini Suv Deportiva con techo panoramico super bien cuidada. Edicion Especial. 2 tonos. Excelente desempeño y maniobrabilidad clásica de Go-Kart.",
    mileage: "37,890 mi",
    isAvailable: true,
    exteriorColor: "anaranjada, blanca, y negro",
    transmission: "6 manual",
    category: "Deportivo",
    engine: "3 cilindros turbo 1.5 litros / 134 hp",
    mpg: "28/38"
  },
  {
    id: "16",
    make: "Mercedes-Benz",
    model: "GLE-53 Coupe AMG",
    trim: "AMG",
    year: 2023,
    price: 89995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a36c89e1ec12.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "SUV PREMIUM con bien pocas millas, sin detalles, sin accidentes, con paquete AMG y oferta especial con trade in. Suspensión neumática, rines deportivos y todo el lujo AMG.",
    mileage: "15,091 mi",
    isAvailable: true,
    exteriorColor: "blanca",
    transmission: "9 Velocidades Automatico",
    category: "De Lujo",
    engine: "6 cilindros en linea 3 litros /429 hp awd",
    mpg: "17/21"
  },
  {
    id: "17",
    make: "Mercedes-Benz",
    model: "E 65 S AMG",
    trim: "S AMG",
    year: 2014,
    price: 28995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2ac0e984427.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Muchos lo categorizan como el mejor sedan deportivo de la historia de Mercedes-Benz. Edicion Especial 'AMG S' es 4-matic, con 'limited slip differential', 'carbon fiber wing' y 'engine cover'. Red Brake Calipers, Power Increase (+27 hp, +59 lb-ft). Vehiculo coleccionable.",
    mileage: "67,093 mi",
    isAvailable: true,
    exteriorColor: "blanco",
    transmission: "7 Velocidades Automatico",
    category: "Sedan Premium",
    engine: "5.5 lt. V8 /550 hp",
    mpg: "16/23"
  },
  {
    id: "18",
    make: "Chevrolet",
    model: "Colorado LT Z71 4x4",
    trim: "LT Z71 4x4",
    year: 2019,
    price: 22995,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800",
    description: "Unidad super nueva y muy bien cuidada. Tiene estribos, tunnel cover, alfombras en goma y gomas off-road.",
    mileage: "52,216 mi",
    isAvailable: true,
    exteriorColor: "blanca",
    transmission: "8 Velocidades Automatico",
    category: "Pick Up",
    engine: "V6 3.6 litros / 308 hp",
    mpg: "18/25"
  },
  {
    id: "19",
    make: "Toyota",
    model: "Tacoma TRD Sport",
    trim: "TRD Sport",
    year: 2024,
    price: 42995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2dc368c05c8.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Unidad Super bien Cuidada, incluye tunnel cover, y estribos. Motor i-Force Turbo de alta eficiencia y torque.",
    mileage: "16,942 mi",
    isAvailable: true,
    exteriorColor: "gris",
    transmission: "8 Velocidades Automatico",
    category: "Pick Up",
    engine: "2.4 litros 4 cilindros turbocharged i-Force",
    mpg: "20/24"
  },
  {
    id: "20",
    make: "Jeep",
    model: "Grand Cherokee 80th Anniversary",
    trim: "80th Anniversary Edition",
    year: 2021,
    price: 22995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a397bff83069.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "En Optimas Condiciones y Bien Cuidada con pocas millas. Tienes que verla. Interiores de lujo, aros de edición especial.",
    mileage: "34,885 mi",
    isAvailable: true,
    exteriorColor: "negro",
    transmission: "8 Velocidades Automatico",
    category: "Economico",
    engine: "3.6 V6 rwd /293 hp",
    mpg: "19/26"
  },
  {
    id: "21",
    make: "Ram",
    model: "ProMaster 2500",
    trim: "2500",
    year: 2021,
    price: 24995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a36c4f6dee83.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Oferta Especial para negocios con registro de comerciantes. muy bien cuidada y en excelentes condiciones. Ideal para carga, mudanzas o conversión.",
    mileage: "70,631 mi",
    isAvailable: true,
    exteriorColor: "blanca",
    transmission: "6 Velocidades Automatico",
    category: "Pick Up",
    engine: "V6 3.6 litros / 280 hp",
    mpg: "14/18"
  },
  {
    id: "22",
    make: "BMW",
    model: "330e Hybrid",
    trim: "plug-in hybrid",
    year: 2021,
    price: 27995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2dc318569f9.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "El BMW 330e es un Vehiculo de lujo enfocado en la economia. Conveniente sistema Plug-in Hybrid para mayor rendimiento de gasolina. Disponible para pruebas de manejo hoy con oferta especial si tienes trade in.",
    mileage: "59,501 mi",
    isAvailable: true,
    exteriorColor: "blanco",
    transmission: "8 Velocidades Automatico",
    category: "Sedan Premium",
    engine: "2.0 litros 4 cilindros / 288 hp",
    mpg: "23/28"
  },
  {
    id: "23",
    make: "Mitsubishi",
    model: "Mirage G4 ES",
    trim: "ES",
    year: 2019,
    price: 7995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_69d666712c150.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "vehiculo economico y muy bien cuidado si buscas un pago bajito y ahorrar gasolina es una exelente opcion. Súper fiable y duradero.",
    mileage: "49,775 mi",
    isAvailable: true,
    exteriorColor: "gris",
    transmission: "cvt",
    category: "Economico",
    engine: "3 cilindros",
    mpg: "33/40"
  },
  {
    id: "24",
    make: "Audi",
    model: "Q8 S-Line Quattro",
    trim: "Premium Plus",
    year: 2021,
    price: 36995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2abf6143c38.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Este Audi Q8 Premium Plus 2021 usado en Puerto Rico tiene un motor mild-hybrid V6 TFSI de 3.0L con 335 HP, transmisión Tiptronic de 8 velocidades y tracción total permanente Quattro. Su equipamiento destaca por incluir el Convenience Package (cámara 360°, carga inalámbrica, volante calefactable), suspensión adaptativa, rines de 21 pulgadas, techo panorámico corredizo.",
    mileage: "78,036 mi",
    isAvailable: true,
    exteriorColor: "gris",
    transmission: "8 Velocidades Automatico tiptronic",
    category: "SUV Premium",
    engine: "3.0L TFSI V6 with 48-volt Mild Hybrid Electric Vehicle (MHEV) tech / 335 hp",
    mpg: "18/23"
  },
  {
    id: "25",
    make: "Mercedes-Benz",
    model: "GLS 4-Matic",
    trim: "4-Matic",
    year: 2020,
    price: 36995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_6a2b18d86b555.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "Este Mercedes-Benz GLS 450 2020 usado en Puerto Rico está equipado con un motor mild-hybrid V6 Biturbo de 3.0L, transmisión automática 9G-TRONIC de 9 velocidades y tracción total 4MATIC. Su configuración destaca por ofrecer 3 filas de asientos para 7 pasajeros con ajuste eléctrico completo, suspensión neumática adaptativa autorregulable con control de altura.",
    mileage: "55,340 mi",
    isAvailable: true,
    exteriorColor: "blanco perlado",
    transmission: "9 Velocidades Automatico 4Matic",
    category: "3 Filas Premium",
    engine: "V6 Biturbo 3.0L mild-hybrid / 362 HP",
    mpg: "19/23"
  },
  {
    id: "26",
    make: "Mercedes-Benz",
    model: "GLB 250",
    trim: "250",
    year: 2021,
    price: 22995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "El Mercedes-Benz GLB 250 2021 está equipado con un motor I4 Turbo de 2.0L que genera 221 HP, acoplado a una transmisión automática de doble embrague DCT de 8 velocidades y tracción delantera (FWD). Este modelo registra una eficiencia de combustible muy alta para su categoría, ofreciendo un consumo oficial de 23 MPG en ciudad y 31 MPG en carretera.",
    mileage: "85,332 mi",
    isAvailable: true,
    exteriorColor: "Negra",
    transmission: "8 velocidades dual clutch/ shift paddle FWD",
    category: "SUV Premium",
    engine: "2.0 litros 4 cilindros / 221 hp",
    mpg: "23/31"
  },
  {
    id: "27",
    make: "Ford",
    model: "Escape SE",
    trim: "SE",
    year: 2013,
    price: 5995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "El Ford Escape SE 2013 usado tiene 111,435 millas y equipa un motor EcoBoost I4 de 1.6L con 178 HP, transmisión automática SelectShift de 6 velocidades, tracción delantera (FWD) y un consumo de 23 MPG en ciudad / 33 MPG en carretera.",
    mileage: "111,435 mi",
    isAvailable: true,
    exteriorColor: "verde playa",
    transmission: "6 Velocidades Automatico",
    category: "Economico",
    engine: "4 cilindros 1.6 / 178 hp",
    mpg: "23/33"
  },
  {
    id: "28",
    make: "BMW",
    model: "X3 xDrive30i",
    trim: "XDrive30i",
    year: 2019,
    price: 21995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "El BMW X3 xDrive30i 2019 (SUV compacto de lujo) está equipado con un motor TwinPower Turbo I4 de 2.0L que genera 248 HP, acoplado a una transmisión automática deportiva de 8 velocidades con tracción total (AWD) y un consumo de 22 MPG en ciudad / 29 MPG en carretera.",
    mileage: "77,084 mi",
    isAvailable: true,
    exteriorColor: "blanca",
    transmission: "8 Velocidades Automatico",
    category: "SUV Premium",
    engine: "4 cilindros 2.0 litros /248 hp",
    mpg: "22/29"
  },
  {
    id: "29",
    make: "Audi",
    model: "A4 S-Line",
    trim: "S-Line Quattro",
    year: 2018,
    price: 15995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_691f84b71dd94.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "El Audi A4 Premium 2018 (sedán compacto de lujo) cuesta $15,995 con 87,296 millas y tiene un motor Turbo I4 de 2.0L que genera 252 HP (versión estándar americana para tracción delantera / FWD en dicho año), transmisión automática S tronic de doble embrague de 7 velocidades y un consumo de 27 MPG en ciudad / 37 MPG en carretera.",
    mileage: "87,296 mi",
    isAvailable: true,
    exteriorColor: "verde",
    transmission: "7 Velocidades Automatico S tronic",
    category: "Sedan Premium",
    engine: "2.0 litros 4 cilindros / 252 hp",
    mpg: "27/37"
  },
  {
    id: "30",
    make: "BMW",
    model: "X1 X Drive",
    trim: "X Drive",
    year: 2016,
    price: 15995,
    image: "https://apicdn.inventario360.com/img?src=https%3A%2F%2Fapicdn.inventario360.com%2Fvehicles%2F8eqpWDAM%2Fmedia_693838bf50d5d.jpeg&w=1024&h=768&fit=cover&q=100&onerror=redirect&wm=https%3A%2F%2Fapicdn.inventario360.com%2Faccounts%2Fwatermark_284d3a6ff5111d9336fcbb20feefe6a7.png&wmProp=20&pos=bottom-right&v=1",
    description: "El BMW X1 xDrive28i 2016 (SUV subcompacto de lujo) cuesta $15,995 con 74,671 millas y equipa un motor TwinPower Turbo I4 de 2.0L con 228 HP, transmisión automática STEPTRONIC de 8 velocidades, tracción total (AWD) y un consumo de 22 MPG en ciudad / 32 MPG en carretera.",
    mileage: "74,671 mi",
    isAvailable: true,
    exteriorColor: "negra",
    transmission: "8 Velocidades Automatico AWD",
    category: "SUV Premium",
    engine: "TwinPower Turbo I4 de 2.0L / 228 HP",
    mpg: "22/32"
  },
  {
    id: "31",
    make: "Lexus",
    model: "UX250H",
    trim: "UX250H",
    year: 2023,
    price: 33995,
    image: "https://images.unsplash.com/photo-1617469165786-8007eda3caa7?auto=format&fit=crop&q=80&w=800",
    description: "Lexus UX 250h 2023 (SUV subcompacto híbrido de lujo) cuesta $33,995 con 17,688 millas y equipa un sistema híbrido con motor de 2.0L que genera 181 HP en total, transmisión automática continuamente variable de tipo híbrido (CVT) con tracción total permanente (AWD) y un consumo de 41 MPG en ciudad / 38 MPG en carretera.",
    mileage: "17,688 mi",
    isAvailable: true,
    exteriorColor: "Blanca Perla",
    transmission: "CVT",
    category: "SUV Premium",
    engine: "hybrido 2.0 / 181 hp",
    mpg: "41/38"
  },
  {
    id: "32",
    make: "Jeep",
    model: "Grand Cherokee Altitude",
    trim: "Altitude",
    year: 2017,
    price: 14995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "El Jeep Grand Cherokee 2017 (segmento SUV mediano) está equipado con un motor Pentastar V6 de 3.6L que genera 295 HP, acoplado a una transmisión automática de 8 velocidades y registra un consumo oficial de 19 MPG en ciudad / 26 MPG en carretera.",
    mileage: "81,236 mi",
    isAvailable: true,
    exteriorColor: "gris",
    transmission: "8 Velocidades Automatico",
    category: "Economico",
    engine: "3.6L V6  / 295 hp",
    mpg: "19/26"
  },
  {
    id: "33",
    make: "Toyota",
    model: "FJ Cruiser",
    trim: "FJ Cruiser",
    year: 2010,
    price: 7995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "El Toyota FJ Cruiser 2010 (SUV todoterreno de color verde monte) tiene un precio especial de $7,995 con 234,431 millas; está equipado con un motor V6 DOHC de 4.0L con 259 HP, transmisión automática de 5 velocidades, tracción trasera (RWD) y un consumo de 17 MPG en ciudad / 22 MPG en carretera. El vehículo presenta detalles estéticos y mecánicos graves, vendiéndose estrictamente bajo la condición \"As-Is\" (sin garantía) y con la bomba de freno mala, por lo que requiere ser remolcado obligatoriamente.",
    mileage: "234,431 mi",
    isAvailable: true,
    exteriorColor: "Verde Monte y Negro",
    transmission: "5 Velocidades Automatico",
    category: "Economico",
    engine: "V6 4.0L / 259 hp",
    mpg: "17/22"
  },
  {
    id: "34",
    make: "Toyota",
    model: "Tacoma SR5",
    trim: "SR5",
    year: 2017,
    price: 27995,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800",
    description: "El Toyota Tacoma SR Access Cab 2017 (segmento pickup mediana) cuesta $27,995 con 80,650 millas y equipa un motor Atkinson-Cycle V6 de 3.5L que genera 278 HP, transmisión automática de 6 velocidades de control electrónico, tracción trasera (RWD) y un consumo oficial de 19 MPG en ciudad / 24 MPG en carretera.",
    mileage: "80,650 mi",
    isAvailable: true,
    exteriorColor: "charcoal gray",
    transmission: "6 Velocidades Automatico",
    category: "Pick Up",
    engine: "3.5L V6 /278 hp",
    mpg: "19/24"
  },
  {
    id: "35",
    make: "Toyota",
    model: "Tacoma TRD Sport 2wd",
    trim: "TRD Sport 2wd",
    year: 2021,
    price: 30995,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800",
    description: "El Toyota Tacoma Limited Double Cab 2021 (segmento pickup mediana) tiene un precio marcado para Llamar con 70,021 millas y equipa un motor Atkinson-Cycle V6 de 3.5L que genera 278 HP, transmisión automática de 6 velocidades de control electrónico, tracción trasera (RWD) y un consumo oficial de 19 MPG en ciudad / 24 MPG en carretera.",
    mileage: "70,021 mi",
    isAvailable: true,
    exteriorColor: "gtis cemento",
    transmission: "6 Velocidades Automatico",
    category: "Pick Up",
    engine: "v6 3.5L / 278hp",
    mpg: "19/24"
  },
  {
    id: "36",
    make: "Ram",
    model: "ProMaster Cargo Van",
    trim: "Cargo Van",
    year: 2021,
    price: 24995,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "¡Llegó la herramienta de trabajo perfecta para tu negocio! Esta Ram ProMaster Cargo Van 2021 usada tiene un precio de solo $24,995 con 70,631 millas, equipada con el confiable motor Pentastar V6 de 3.6L que genera 276 HP (fuerza pura y durabilidad comprobada) y una transmisión automática de 6 velocidades con tracción delantera (FWD).",
    mileage: "70,631 mi",
    isAvailable: true,
    exteriorColor: "blanco",
    transmission: "6 Velocidades Automatico",
    category: "Pick Up",
    engine: "V6 3.6L / 276 hp",
    mpg: "16/22"
  }
];

export function stripSalesPitch(desc: string): string {
  if (!desc) return "";
  let d = desc;

  // 1. Remove enthusiastic phrases & introductory marketing fluff (case-insensitive)
  d = d.replace(/¡llegó la herramienta de trabajo perfecta para tu negocio!/gi, "");
  d = d.replace(/¡llegó la herramienta de trabajo perfecta!/gi, "");
  d = d.replace(/¡llegó la herramienta perfecta para tu negocio!/gi, "");
  d = d.replace(/llegó la herramienta de trabajo perfecta/gi, "");
  d = d.replace(/¡llegó [^!]+!/gi, "");
  d = d.replace(/¡llegó[^!]+!/gi, "");
  d = d.replace(/excelente oportunidad\.?/gi, "");
  d = d.replace(/oportunidad única\.?/gi, "");
  d = d.replace(/unidad súper nueva y muy bien cuidada\.?/gi, "");
  d = d.replace(/unidad super nueva y muy bien cuidada\.?/gi, "");
  d = d.replace(/super bien cuidada\.?/gi, "");
  d = d.replace(/súper bien cuidada\.?/gi, "");
  d = d.replace(/en optimas condiciones/gi, "");
  d = d.replace(/en óptimas condiciones/gi, "");
  d = d.replace(/bien cuidada/gi, "");
  d = d.replace(/bien cuidado/gi, "");
  d = d.replace(/tienes que verla\.?/gi, "");
  d = d.replace(/tienes que verlo\.?/gi, "");
  d = d.replace(/no dejes pasar esta oportunidad\.?/gi, "");
  d = d.replace(/fuerza pura y durabilidad comprobada/gi, "");
  d = d.replace(/el mejor sedan deportivo de la historia[^.]*\.?/gi, "Sedán deportivo");
  d = d.replace(/increíble/gi, "");
  d = d.replace(/espectacular/gi, "");
  d = d.replace(/impecable/gi, "");
  d = d.replace(/¡[^!]+!\s*/g, ""); // strip any other general exclamation blocks

  // 2. Clean up leading/trailing punctuation and spaces
  d = d.trim()
       .replace(/^[\s,;.:!¡?¿]+/, "") // strip leading punctuation
       .replace(/[\s,;.:!¡?¿]+$/, ".") // standardize ending punctuation to a single period
       .replace(/\s+/g, " ");

  // 3. Ensure capitalized start
  if (d.length > 0) {
    d = d.charAt(0).toUpperCase() + d.slice(1);
  }

  return d;
}

function formatImageUrl(url: any): string {
  if (!url) return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800";

  let rawStr = String(url).trim();
  if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
    rawStr = rawStr.slice(1, -1).trim();
  }
  
  // Split by comma followed by one or more spaces, or other typical separators to handle mixed single/double spaces
  let primaryUrl = rawStr.split(/,\s+|[,;|\n\r]+/)[0].trim();
  
  // Clean quotes/double quotes and whitespace
  primaryUrl = primaryUrl.replace(/^['"\s\[\]]+|['"\s\[\]]+$/g, '');

  if (!primaryUrl.startsWith('http')) {
    const httpIdx = primaryUrl.indexOf('http');
    if (httpIdx !== -1) {
      primaryUrl = primaryUrl.substring(httpIdx);
    } else {
      return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800";
    }
  }

  // Google Drive Link Transformation
  if (primaryUrl.includes('drive.google.com')) {
    const fileId = primaryUrl.match(/[-\w]{25,}/);
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId[0]}`;
    }
  }

  // Dropbox Link Transformation
  if (primaryUrl.includes('dropbox.com')) {
    return primaryUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
  }

  return primaryUrl;
}

export function formatAllImageUrls(url: any): string[] {
  if (!url) return [];
  
  let rawStr = "";
  if (Array.isArray(url)) {
    rawStr = url.map(String).join(",  ");
  } else if (typeof url === 'string') {
    rawStr = url;
  } else {
    rawStr = String(url);
  }

  rawStr = rawStr.trim();
  if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
    rawStr = rawStr.slice(1, -1).trim();
  }

  // Split by comma followed by one or more spaces, or other typical separators to handle mixed single/double spaces
  const parts = rawStr.split(/,\s+|[,;|\n\r]+/).map(p => p.trim()).filter(Boolean);
  
  const formatted = parts.map(part => {
    let cleanPart = part.replace(/^['"\s\[\]]+|['"\s\[\]]+$/g, '');

    if (!cleanPart.startsWith('http')) {
      const httpIdx = cleanPart.indexOf('http');
      if (httpIdx !== -1) {
        cleanPart = cleanPart.substring(httpIdx);
      } else {
        return null;
      }
    }

    // Google Drive Link Transformation
    if (cleanPart.includes('drive.google.com')) {
      const fileId = cleanPart.match(/[-\w]{25,}/);
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId[0]}`;
      }
    }

    // Dropbox Link Transformation
    if (cleanPart.includes('dropbox.com')) {
      return cleanPart.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
    }

    return cleanPart;
  }).filter((u): u is string => u !== null);

  return formatted;
}

export async function getInventory(forceRefresh?: boolean): Promise<Vehicle[]> {
  const maxAttempts = 2;
  let delay = 800;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/inventory${forceRefresh ? "?bypass=true" : ""}`);
      if (!response.ok) throw new Error(`Server returned status: ${response.status}`);
      
      const data = await response.json();
      const rawList = data.inventario || data.data;
      console.log("Inventario recuperado:", data.status, Array.isArray(rawList) ? `Items: ${rawList.length}` : "Items: 0");
      
      if (data.status === 'ok' && Array.isArray(rawList)) {
        const parsed = rawList.map((item: any, index: number) => {
          // Helper to get value from any key matching case-insensitively, ignoring spaces, underscores, hyphens, and accents
          const getVal = (possibleNames: string[]): any => {
            // First look for exact match
            for (const name of possibleNames) {
              if (item[name] !== undefined) return item[name];
            }
            
            // Normalize names to strip spaces, underscores, hyphens, accents
            const normalize = (str: string) => 
              str.toLowerCase()
                 .normalize("NFD")
                 .replace(/[\u0300-\u036f]/g, "") // remove accents (e.g. ó -> o, ñ -> n)
                 .replace(/[^a-z0-9]/g, "");     // remove all non-alphanumeric chars
            
            const normalizedPossibles = possibleNames.map(normalize);
            
            for (const rawKey of Object.keys(item)) {
              const normKey = normalize(rawKey);
              if (normalizedPossibles.includes(normKey)) {
                return item[rawKey];
              }
            }
            return undefined;
          };

          // Map exactly as they come from Apps Script/Sheets
          const yearStr = String(getVal(["ao", "year", "ano", "ao_del_vehiculo"]) || "2024");
          const year = parseInt(yearStr) || 2024;
          const make = String(getVal(["marca", "make"]) || "GT Auto Imports");
          const model = String(getVal(["modelo", "model"]) || "");
          // Slugified from "Sub-modelo / Trim Level" -> "submodelotrim_level" or "sub_modelo_trim_level"
          const trim = String(getVal(["submodelotrim_level", "sub_modelo_trim_level", "trim", "clase_o_trim"]) || "");
          const priceStr = String(getVal(["precio", "precio_venta", "price"]) || "0").replace(/[^0-9]/g, '');
          const price = parseInt(priceStr) || 0;
          
          const imageRaw = getVal(["fotoweblink", "foto_web_link", "foto", "image"]) || "";
          const image = formatImageUrl(imageRaw);
          
          // Pull from any known image or gallery fields, ensuring empty array/string falls back to imageRaw (fotoweblink)
          let multipleImagesRaw = getVal(["fotos", "images", "imagenes", "galeria", "fotostodas", "fotos_web_link"]);
          if (!multipleImagesRaw || 
              (Array.isArray(multipleImagesRaw) && multipleImagesRaw.length === 0) || 
              (typeof multipleImagesRaw === 'string' && multipleImagesRaw.trim() === '')) {
            multipleImagesRaw = imageRaw;
          }
          let images = formatAllImageUrls(multipleImagesRaw);
          
          // If no multiple images found or parsed, fall back to the primary image
          if (!images || images.length === 0) {
            images = [image];
          }
          
          const category = String(getVal(["clase", "category", "tipo_de_vehiculo"]) || "");
          const desc = String(getVal(["descripcion", "descripcion_o_notas", "desc"]) || "");
          const mpg = String(getVal(["mpg"]) || "");
          const dispRaw = getVal(["disponibles", "disponible", "status", "estado", "estatus", "o", "O"]);
          const disp = String(dispRaw || "").toLowerCase().trim();
          
          // Handle slugified special chars
          const transmission = String(getVal(["transmision", "transmisin", "transmission"]) || "");
          const drive = String(getVal(["traccion", "traccin", "drive"]) || "");
          const extColor = String(getVal(["color", "color_exterior", "exterior"]) || "");
          const intColor = String(getVal(["color_interior", "interior"]) || "");
          const motor = String(getVal(["motor"]) || "");

          const rawMileage = getVal(["millaje", "mileage", "millas", "millaje_o_km"]);
          let mileage = "0 mi";
          if (rawMileage !== undefined && rawMileage !== null && rawMileage !== "") {
            if (typeof rawMileage === 'number') {
              mileage = `${rawMileage.toLocaleString()} mi`;
            } else {
              const strVal = String(rawMileage).trim();
              if (/mi|millas|miles/i.test(strVal)) {
                mileage = strVal;
              } else {
                const cleanNum = parseInt(strVal.replace(/[^0-9]/g, ''));
                if (!isNaN(cleanNum)) {
                  mileage = `${cleanNum.toLocaleString()} mi`;
                } else {
                  mileage = `${strVal} mi`;
                }
              }
            }
          }

          return {
            id: String(item.vin || index), // Use VIN if available, otherwise index
            make,
            model: trim ? `${model} ${trim}` : model,
            trim,
            year,
            price,
            image,
            images,
            description: stripSalesPitch(desc) || `${category} certificado.`,
            mileage,
            category,
            mpg,
            specialOffer: desc ? "Oferta Especial" : "",
            isAvailable: disp === 'disponible',
            transmission,
            exteriorColor: extColor,
            interiorColor: intColor,
            driveTrain: drive,
            engine: motor
          };
        });
        
        const availableInventory = parsed.filter(v => v.isAvailable);
        
        try {
          localStorage.setItem('gtauto_inventory_cache', JSON.stringify(availableInventory));
        } catch (e) {
          console.warn("Could not save inventory cache to localStorage:", e);
        }

        return availableInventory;
      }

      return MOCK_INVENTORY.map(v => {
        return {
          ...v,
          description: stripSalesPitch(v.description),
          images: v.images && v.images.length > 1 ? v.images : [v.image]
        };
      });
    } catch (error) {
      if (attempt === maxAttempts) {
        console.warn(`Error loading inventory from API on final attempt (using offline fallback):`, error);
        return MOCK_INVENTORY.map(v => {
          return {
            ...v,
            description: stripSalesPitch(v.description),
            images: v.images && v.images.length > 1 ? v.images : [v.image]
          };
        });
      }
      console.log(`Inventory fetch attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return MOCK_INVENTORY.map(v => {
    const fillers = [
      v.image,
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"
    ];
    return {
      ...v,
      description: stripSalesPitch(v.description),
      images: v.images && v.images.length > 1 ? v.images : fillers
    };
  });
}

export function getCachedInventory(): Vehicle[] {
  try {
    const cached = localStorage.getItem('gtauto_inventory_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(v => v.isAvailable);
      }
    }
  } catch (e) {
    console.error("Error reading gtauto_inventory_cache", e);
  }
  return MOCK_INVENTORY.map(v => {
    const fillers = [
      v.image,
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"
    ];
    return {
      ...v,
      description: stripSalesPitch(v.description),
      images: v.images && v.images.length > 1 ? v.images : fillers
    };
  });
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
