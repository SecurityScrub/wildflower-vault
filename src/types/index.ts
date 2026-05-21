import type { Booking, BookingItem, RentalItem, User, BookingStatus } from "@prisma/client";

export type BookingWithItems = Booking & {
  items: (BookingItem & { rentalItem: RentalItem })[];
  user?: User | null;
};

export type RentalItemWithBookings = RentalItem & {
  bookingItems: (BookingItem & { booking: Booking })[];
};

export interface CartItem {
  rentalItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  guestCount: string;
  notes: string;
}

export interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  upcomingEvents: BookingWithItems[];
  recentBookings: BookingWithItems[];
}

export type { BookingStatus };
