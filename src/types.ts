export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image: string;
  description: string;
  mileage?: string;
  category?: string;
  exteriorColor?: string;
  interiorColor?: string;
  transmission?: string;
  mpg?: string;
  specialOffer?: string;
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  vehicles?: Vehicle[];
  isBookingForm?: boolean;
  intent?: string;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  createdAt: number;
}
