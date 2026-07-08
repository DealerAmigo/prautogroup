export interface Vehicle {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  price: number;
  image: string;
  images?: string[];
  description: string;
  mileage?: string;
  category?: string;
  exteriorColor?: string;
  interiorColor?: string;
  transmission?: string;
  driveTrain?: string;
  engine?: string;
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
  appointmentConfirmed?: boolean;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  monthlyBudget?: string;
  town?: string;
  createdAt: number;
}
