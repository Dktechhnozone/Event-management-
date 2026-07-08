export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer' | 'attendee';
  avatar?: string;
  interests?: string[];
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registeredCount: number;
  creatorId: string;
  creatorName: string;
  imageUrl?: string;
}

export interface Registration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketNumber: string;
  qrCodeData: string; // Dynamic path/data for QR code
  registeredAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  categoryStats: { category: string; count: number }[];
  registrationsOverTime: { date: string; count: number }[];
}

export interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  ticketNumber: string;
  registeredAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
