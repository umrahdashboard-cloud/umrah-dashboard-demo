'use client'

import { useState, useMemo, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import { getCalc, generateInvoiceNumber } from '@/lib/calculations'
import { pkr as fmtPkr } from '@/lib/formatters'
import { createBooking } from '@/app/actions/bookings'
import type { Airline, Hotel, VisaSettings, CurrencySettings, TransportRate, RoomType, CalcInput } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookmarkPlus, Copy, Printer, Loader2, CheckCircle } from 'lucide-react'
import InvoicePrint from './InvoicePrint'
import type { Company } from '@/lib/types'

interface Props {
  airlines: Airline[]
  makkahHotels: Hotel[]
  madinahHotels: Hotel[]
  visa: VisaSettings
  currency: CurrencySettings
  transportRates: TransportRate[]
  company: Company
}

export default function CalculatorForm({
  airlines, makkahHotels, madinahHotels, visa, currency, transportRates, company
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [adult, setAdult] = useState(1)
  const [child, setChild] = useState(0)
  const [infant, setInfant] = useState(0)
  const [airlineId, setAirlineId] = useState(airlines[0]?.id ?? '')
  const [transportType, setTransportType] = useState<'bus' | 'private'>('bus')
  const [makkahHotelId, setMakkahHotelId] = useState(makkahHotels[0]?.id ?? '')
  const [makkahRoom, setMakkahRoom] = useState<RoomType>('sharing')
  const [makkahNights, setMakkahNights] = useState(10)
  const [madinahHotelId, setMadinahHotelId] = useState(madinahHotels[0]?.id ?? '')
  const [madinahRoom, setMadinahRoom] = useState<RoomType>('sharing')
  const [madinahNights, setMadinahNights] = useState(10)
  const [profitType, setProfitType] = useState<'percent' | 'fixed'>('percent')
  const [profitValue, setProfitValue] = useState(8)
  const [sellingOverride, setSellingOverride] = useState<number | null>(null)
  const [advance, setAdvance] = useState(0)
  const [customerName, setCustomerName] = useState('')

  const airline = airlines.find(a => a.id === airlineId) ?? null
  const makkahHotel = makkahHotels.find(h => h.id === makkahHotelId) ?? null
  const madinahHotel = madinahHotels.find(h => h.id === madinahHotelId) ?? null

  const input: CalcInput = {
    adult, child, infant, airline, transportType,
    makkahHotel, makkahRoom, makkahNights,
    madinahHotel, madinahRoom, madinahNights,
    profitType, profitValue, sellingOverride, advance,
    customerName,
  }

  const calc = useMemo(
    () => getCalc(input, transportRates, currency.sar_to_pkr, visa.adult_sar, visa.infant_sar, visa.transport_mode),
    [adult, child, infant, airlineId, transportType, makkahHotelId, makkahRoom, makkahNights,
     madinahHotelId, madinahRoom, madinahNights, profitType, profitValue, sellingOverride, advance,
     currency.sar_to_pkr, visa.adult_sar, visa.infant_sar, visa.transport_mode, transportRates]
  )

  const handlePrint = useReactToPrint({ contentRef: printRef })

  async function handleSave() {
    startTransition(async () => {
      const result = await createBooking({
        customer_name: customerName || 'Walk-in Customer',
        airline_name: airline?.name ?? '',
        total_pkr: calc.selling,
        cost_pkr: calc.totalCost,
        profit_pkr: calc.profit,
        advance_pkr: advance,
        paid_pkr: advance,
        remaining_pkr: calc.remaining,
        adult_count: adult,
        child_count: child,
        infant_count: infant,
        makkah_hotel_name: makkahHotel?.name ?? null,
        makkah_hotel_location: makkahHotel?.location ?? null,
        makkah_hotel_distance: makkahHotel?.distance ?? null,
        makkah_room_type: makkahRoom,
        makkah_nights: makkahNights,
        madinah_hotel_name: madinahHotel?.name ?? null,
        madinah_hotel_location: madinahHotel?.location ?? null,
        madinah_hotel_distance: madinahHotel?.distance ?? null,
        madinah_room_type: madinahRoom,
        madinah_nights: madinahNights,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Booking saved successfully!')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  function handleCopyWhatsApp() {
    const pax = adult + child + infant
    const text = `*Fast Travels & Tours — Umrah Package*\n\n` +
      `👤 Passengers: ${adult} Adult${adult > 1 ? 's' : ''}${child ? `, ${child} Child` : ''}${infant ? `, ${infant} Infant` : ''}\n` +
      `✈️ Airline: ${airline?.name ?? 'N/A'}\n` +
      `🕌 Makkah: ${makkahHotel?.name ?? 'N/A'} (${makkahRoom}, ${makkahNights} nights)\n` +
      `🕌 Madinah: ${madinahHotel?.name ?? 'N/A'} (${madinahRoom}, ${madinahNights} nights)\n\n` +
      `💰 *Package: ${fmtPkr(calc.selling)}*\n` +
      `💰 Per Person: ${fmtPkr(calc.perPax)}\n\n` +
      `📞 ${company.phone || company.website}`
    navigator.clipboard.writeText(text)
    toast.success('WhatsApp message copied!')
  }

  const rows = [
    { label: 'Tickets', value: fmtPkr(calc.ticketCost) },
    { label: 'Visa SAR', value: fmtPkr(calc.visaCost) },
    { label: visa.transport_mode === 'included' ? 'Transport (Included)' : 'Transport', value: visa.transport_mode === 'included' ? '—' : fmtPkr(calc.transportCost) },
    { label: `Makkah Hotel (${makkahNights}N)`, value: fmtPkr(calc.makkahCost) },
    { label: `Madinah Hotel (${madinahNights}N)`, value: fmtPkr(calc.madinahCost) },
  ]

  const invoiceNo = generateInvoiceNumber()

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left — form */}
        <div className="space-y-5">
          {/* Passengers */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Passengers
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {[
                { label: 'Adults', value: adult, set: setAdult },
                { label: 'Children', value: child, set: setChild },
                { label: 'Infants', value: infant, set: setInfant },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number" min={0} max={20} value={value}
                    onChange={e => set(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-center font-semibold"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Airline + Transport */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Flight & Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Airline</Label>
                  <Select value={airlineId} onValueChange={v => v && setAirlineId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{airlines.find(a => a.id === airlineId)?.name ?? 'Select airline'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[220px] !w-auto">
                    {airlines.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {visa.transport_mode === 'separate' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Transport</Label>
                  <Select value={transportType} onValueChange={v => v && setTransportType(v as 'bus' | 'private')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hotels */}
          {(['Makkah', 'Madinah'] as const).map(city => {
            const isM = city === 'Makkah'
            const hotelId = isM ? makkahHotelId : madinahHotelId
            const setHotelId = isM ? setMakkahHotelId : setMadinahHotelId
            const room = isM ? makkahRoom : madinahRoom
            const setRoom = isM ? setMakkahRoom : setMadinahRoom
            const nights = isM ? makkahNights : madinahNights
            const setNights = isM ? setMakkahNights : setMadinahNights
            const hotels = isM ? makkahHotels : madinahHotels

            return (
              <Card key={city} className="shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {city} Hotel
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs">Hotel</Label>
                    <Select value={hotelId} onValueChange={v => v && setHotelId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{hotels.find(h => h.id === hotelId)?.name ?? 'Select hotel'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="min-w-[360px] !w-auto">
                        {hotels.map(h => (
                          <SelectItem key={h.id} value={h.id} className="py-2">
                            <span className="font-medium">{h.name}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">· {h.distance}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Room Type</Label>
                    <Select value={room} onValueChange={v => v && setRoom(v as RoomType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['sharing', 'quad', 'triple', 'double'].map(r => (
                          <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Nights</Label>
                    <Input
                      type="number" min={1} max={30} value={nights}
                      onChange={e => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Profit */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Profit Type</Label>
                <Select value={profitType} onValueChange={v => setProfitType(v as 'percent' | 'fixed')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage %</SelectItem>
                    <SelectItem value="fixed">Fixed PKR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{profitType === 'percent' ? 'Profit %' : 'Profit PKR'}</Label>
                <Input
                  type="number" min={0} value={profitValue}
                  onChange={e => setProfitValue(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Selling Price Override</Label>
                <Input
                  type="number" min={0} placeholder="Leave blank for auto"
                  value={sellingOverride ?? ''}
                  onChange={e => setSellingOverride(e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Advance Received</Label>
                <Input
                  type="number" min={0} value={advance}
                  onChange={e => setAdvance(parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Name</Label>
                <Input
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — summary */}
        <div className="space-y-4">
          <Card className="shadow-sm border-0 bg-navy text-white sticky top-0">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-white/200 text-xs uppercase tracking-wide mb-1">Package Total</p>
                <p className="text-3xl font-bold text-gold">{fmtPkr(calc.selling)}</p>
                <p className="text-white/100 text-xs mt-1">
                  Per person: {fmtPkr(calc.perPax)} · {calc.pax} pax
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-2">
                {rows.map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-white/60">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Total Cost</span>
                  <span className="font-medium">{fmtPkr(calc.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-gold">
                  <span>Profit</span>
                  <span className="font-semibold">{fmtPkr(calc.profit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Advance</span>
                  <span>{fmtPkr(advance)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Remaining</span>
                  <span className="text-gold">{fmtPkr(calc.remaining)}</span>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <Button
                  onClick={handleSave}
                  disabled={isPending || saved}
                  className="w-full bg-gold-gradient hover:brightness-110 text-navy font-semibold h-10"
                >
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                  {saved ? 'Saved!' : 'Save Booking'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyWhatsApp}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrint()}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print area */}
      <InvoicePrint
        ref={printRef}
        invoiceNo={invoiceNo}
        customerName={customerName || 'Walk-in Customer'}
        adult={adult} child={child} infant={infant}
        airline={airline}
        makkahHotel={makkahHotel} makkahRoom={makkahRoom} makkahNights={makkahNights}
        madinahHotel={madinahHotel} madinahRoom={madinahRoom} madinahNights={madinahNights}
        calc={calc}
        advance={advance}
        transportMode={visa.transport_mode}
        company={company}
      />
    </>
  )
}
