export interface VisaSettings {
  id: string
  visa_rate_1_pax: number      // 1 PAX
  visa_rate_2_pax: number      // 2 PAX
  visa_rate_3_pax: number      // 3 PAX
  visa_rate_4_pax: number      // 4 PAX
  visa_rate_group_pax: number  // 5–49 PAX
  child_sar: number
  infant_sar: number
  transport_mode: 'included' | 'separate'
  makkah_ziarat_rate: number   // flat group rate (SAR)
  madina_ziarat_rate: number   // flat group rate (SAR)
}

export interface CurrencySettings {
  id: string
  sar_to_pkr: number
}

export interface TransportRate {
  id: string
  type: 'bus' | 'private'
  pax_count: number
  rate_sar: number
}

export interface Company {
  id: string
  name: string
  license: string
  phone: string
  website: string
  address: string
  logo_url: string
}

export interface Airline {
  id: string
  name: string
  adult_pkr: number
  child_pkr: number
  infant_pkr: number
}

export interface Hotel {
  id: string
  city: 'Makkah' | 'Madinah'
  name: string
  location: string
  distance: string
  sharing_sar: number
  quad_sar: number
  triple_sar: number
  double_sar: number
}

export type RoomType = 'sharing' | 'quad' | 'triple' | 'double'

export interface Booking {
  id: string
  created_at: string
  booking_date: string
  customer_name: string
  airline_name: string
  total_pkr: number
  cost_pkr: number
  profit_pkr: number
  advance_pkr: number
  paid_pkr: number
  remaining_pkr: number
  adult_count: number
  child_count: number
  infant_count: number
  makkah_hotel_name: string | null
  makkah_hotel_location: string | null
  makkah_hotel_distance: string | null
  makkah_room_type: string | null
  makkah_nights: number | null
  madinah_hotel_name: string | null
  madinah_hotel_location: string | null
  madinah_hotel_distance: string | null
  madinah_room_type: string | null
  madinah_nights: number | null
}

export interface Payment {
  id: string
  created_at: string
  payment_date: string
  booking_id: string
  customer_name: string
  amount_pkr: number
  method: 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'
  note: string
}

export type ExpenseType =
  | 'Umrah Supplier'
  | 'Airline / Ticket'
  | 'Hotel Supplier'
  | 'Transport Supplier'
  | 'Other Umrah Expense'

export interface Expense {
  id: string
  created_at: string
  expense_date: string
  expense_type: ExpenseType
  supplier: string
  amount_pkr: number
  method: 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'
  note: string
}

export interface StaffUser {
  id: string
  name: string
  username: string
  role: StaffRole
  permission: StaffPermission
  status: 'Active' | 'Inactive'
  created_at: string
  email?: string
}

export type StaffRole = 'Admin' | 'Booking Staff' | 'Accounts Staff' | 'Visa Staff' | 'Viewer'
export type StaffPermission = 'Full Access' | 'Bookings + Customers' | 'Accounts Only' | 'Visa Only' | 'View Only'

export interface CalcInput {
  adult: number
  child: number
  infant: number
  airline: Airline | null
  transportType: 'bus' | 'private'
  makkahHotel: Hotel | null
  makkahRoom: RoomType
  makkahNights: number
  madinahHotel: Hotel | null
  madinahRoom: RoomType
  madinahNights: number
  profitType: 'percent' | 'fixed'
  profitValue: number
  sellingOverride: number | null
  advance: number
  customerName: string
  makkahZiarat: boolean
  madinahZiarat: boolean
  customTicket: boolean
  customTicketLabel: string   // airline name + route entered by user
  customTicketPkr: number     // total ticket cost already converted to PKR
}

export interface CalcResult {
  pax: number
  ticketCost: number
  visaCost: number
  transportCost: number
  makkahCost: number
  madinahCost: number
  makkahZiaratCost: number
  madinahZiaratCost: number
  totalCost: number
  selling: number
  profit: number
  remaining: number
  perPax: number
}
