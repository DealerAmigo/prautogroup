export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image: string;
  description: string;
  mileage?: string;
  exteriorColor?: string;
  interiorColor?: string;
  transmission?: string;
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  vehicles?: Vehicle[];
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  createdAt: number;
}
