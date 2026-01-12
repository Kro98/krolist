import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "sonner";
import { Calendar as CalendarIcon, MapPin, Tag, Plus, Edit, Trash2, Clock, Bell, BellOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, differenceInMinutes, isSameDay, parse, addMinutes } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Event type color mapping
const EVENT_TYPE_COLORS: Record<string, string> = {
  sale: "bg-green-500",
  holiday: "bg-amber-500",
  discount: "bg-blue-500",
  personal: "bg-purple-500"
};
const EVENT_TYPE_BADGE_COLORS: Record<string, string> = {
  sale: "bg-green-500/20 text-green-600 border-green-500/30",
  holiday: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  discount: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  personal: "bg-purple-500/20 text-purple-600 border-purple-500/30"
};
interface Event {
  id: string;
  name: string;
  date: Date;
  time?: string;
  description: string;
  location: string;
  type: 'discount' | 'sale' | 'holiday' | 'personal';
  emoji: string;
  isUserCreated: boolean;
  reminderMinutes?: number;
  reminderShown?: boolean;
}
const defaultEvents: Event[] = [
// Global Shopping Events
{
  id: "amazon-prime-day",
  name: "Amazon Prime Day",
  date: new Date("2025-07-15"),
  description: "Exclusive deals for Prime members",
  location: "Worldwide",
  type: "sale",
  emoji: "📦",
  isUserCreated: false
}, {
  id: "black-friday",
  name: "Black Friday",
  date: new Date("2025-11-28"),
  description: "Worldwide mega sales event",
  location: "Worldwide",
  type: "sale",
  emoji: "🛍️",
  isUserCreated: false
}, {
  id: "cyber-monday",
  name: "Cyber Monday",
  date: new Date("2025-12-01"),
  description: "Online shopping deals",
  location: "Worldwide",
  type: "sale",
  emoji: "💻",
  isUserCreated: false
}, {
  id: "singles-day",
  name: "Single's Day",
  date: new Date("2025-11-11"),
  description: "World's largest shopping event from China",
  location: "Worldwide",
  type: "sale",
  emoji: "🎊",
  isUserCreated: false
}, {
  id: "boxing-day",
  name: "Boxing Day",
  date: new Date("2025-12-26"),
  description: "Post-Christmas sales and clearance",
  location: "UK, Canada, Australia",
  type: "sale",
  emoji: "🎁",
  isUserCreated: false
}, {
  id: "back-to-school",
  name: "Back-to-School Sales",
  date: new Date("2025-08-15"),
  description: "Educational supplies and electronics discounts",
  location: "Worldwide",
  type: "sale",
  emoji: "🎒",
  isUserCreated: false
}, {
  id: "eofy-sales",
  name: "End of Financial Year (EOFY) Sales",
  date: new Date("2025-06-30"),
  description: "Major discounts before new financial year",
  location: "Australia",
  type: "sale",
  emoji: "💰",
  isUserCreated: false
},
// Holiday Shopping Events
{
  id: "fathers-day",
  name: "Father's Day Sales",
  date: new Date("2025-06-15"),
  description: "Special offers for Father's Day gifts",
  location: "Worldwide",
  type: "holiday",
  emoji: "👨‍👧‍👦",
  isUserCreated: false
}, {
  id: "valentines-day",
  name: "Valentine's Day Sales",
  date: new Date("2025-02-14"),
  description: "Romantic gifts and special discounts",
  location: "Worldwide",
  type: "holiday",
  emoji: "💝",
  isUserCreated: false
}, {
  id: "christmas-sales",
  name: "Christmas Sales",
  date: new Date("2025-12-25"),
  description: "Holiday shopping deals and gift discounts",
  location: "Worldwide",
  type: "holiday",
  emoji: "🎄",
  isUserCreated: false
}, {
  id: "mothers-day",
  name: "Mother's Day Sales",
  date: new Date("2025-05-11"),
  description: "Special discounts for Mother's Day gifts",
  location: "Worldwide",
  type: "holiday",
  emoji: "💐",
  isUserCreated: false
}, {
  id: "easter-sales",
  name: "Easter Sales",
  date: new Date("2025-04-20"),
  description: "Spring holiday shopping deals",
  location: "Worldwide",
  type: "holiday",
  emoji: "🐰",
  isUserCreated: false
}, {
  id: "new-year-sales",
  name: "New Year Sales",
  date: new Date("2025-01-01"),
  description: "New year clearance and fresh start deals",
  location: "Worldwide",
  type: "sale",
  emoji: "🎆",
  isUserCreated: false
},
// National Days and Regional Events
{
  id: "saudi-national-day",
  name: "Saudi National Day",
  date: new Date("2025-09-23"),
  description: "Special discounts across Saudi retailers",
  location: "Saudi Arabia",
  type: "discount",
  emoji: "🇸🇦",
  isUserCreated: false
}, {
  id: "uae-national-day",
  name: "UAE National Day",
  date: new Date("2025-12-02"),
  description: "Celebrate UAE with special offers",
  location: "UAE",
  type: "discount",
  emoji: "🇦🇪",
  isUserCreated: false
}, {
  id: "independence-day-us",
  name: "Independence Day Sales",
  date: new Date("2025-07-04"),
  description: "4th of July shopping deals",
  location: "United States",
  type: "discount",
  emoji: "🇺🇸",
  isUserCreated: false
}, {
  id: "canada-day",
  name: "Canada Day Sales",
  date: new Date("2025-07-01"),
  description: "Canadian retailers celebrate with discounts",
  location: "Canada",
  type: "discount",
  emoji: "🇨🇦",
  isUserCreated: false
}, {
  id: "diwali-sales",
  name: "Diwali Festival Sales",
  date: new Date("2025-10-20"),
  description: "Festival of lights shopping extravaganza",
  location: "India, Worldwide",
  type: "holiday",
  emoji: "🪔",
  isUserCreated: false
}, {
  id: "golden-week",
  name: "Golden Week Sales",
  date: new Date("2025-04-29"),
  description: "Japanese holiday shopping period",
  location: "Japan",
  type: "holiday",
  emoji: "🌸",
  isUserCreated: false
}, {
  id: "eid-al-fitr",
  name: "Eid Al-Fitr Sales",
  date: new Date("2025-03-30"),
  description: "End of Ramadan celebration discounts",
  location: "Middle East, Worldwide",
  type: "holiday",
  emoji: "🌙",
  isUserCreated: false
}, {
  id: "eid-al-adha",
  name: "Eid Al-Adha Sales",
  date: new Date("2025-06-06"),
  description: "Festival of Sacrifice shopping deals",
  location: "Middle East, Worldwide",
  type: "holiday",
  emoji: "🐑",
  isUserCreated: false
}, {
  id: "ramadan-sales",
  name: "Ramadan Sales",
  date: new Date("2025-03-01"),
  description: "Special offers during the holy month",
  location: "Middle East, Worldwide",
  type: "discount",
  emoji: "☪️",
  isUserCreated: false
}, {
  id: "chinese-new-year",
  name: "Chinese New Year Sales",
  date: new Date("2025-01-29"),
  description: "Lunar New Year shopping festival",
  location: "China, Southeast Asia",
  type: "holiday",
  emoji: "🐉",
  isUserCreated: false
}, {
  id: "brazil-independence",
  name: "Brazil Independence Day",
  date: new Date("2025-09-07"),
  description: "Brazilian national day sales",
  location: "Brazil",
  type: "discount",
  emoji: "🇧🇷",
  isUserCreated: false
}, {
  id: "mexico-independence",
  name: "Mexico Independence Day",
  date: new Date("2025-09-16"),
  description: "Mexican national celebration sales",
  location: "Mexico",
  type: "discount",
  emoji: "🇲🇽",
  isUserCreated: false
}, {
  id: "bastille-day",
  name: "Bastille Day Sales",
  date: new Date("2025-07-14"),
  description: "French national day shopping deals",
  location: "France",
  type: "discount",
  emoji: "🇫🇷",
  isUserCreated: false
}, {
  id: "german-unity-day",
  name: "German Unity Day",
  date: new Date("2025-10-03"),
  description: "German national day retail discounts",
  location: "Germany",
  type: "discount",
  emoji: "🇩🇪",
  isUserCreated: false
}, {
  id: "australia-day",
  name: "Australia Day Sales",
  date: new Date("2025-01-26"),
  description: "Australian national day shopping event",
  location: "Australia",
  type: "discount",
  emoji: "🇦🇺",
  isUserCreated: false
}, {
  id: "republic-day-india",
  name: "Republic Day Sales",
  date: new Date("2025-01-26"),
  description: "Indian Republic Day shopping offers",
  location: "India",
  type: "discount",
  emoji: "🇮🇳",
  isUserCreated: false
}, {
  id: "independence-day-india",
  name: "India Independence Day",
  date: new Date("2025-08-15"),
  description: "Indian Independence Day sales",
  location: "India",
  type: "discount",
  emoji: "🇮🇳",
  isUserCreated: false
}, {
  id: "qatar-national-day",
  name: "Qatar National Day",
  date: new Date("2025-12-18"),
  description: "Qatar national celebration discounts",
  location: "Qatar",
  type: "discount",
  emoji: "🇶🇦",
  isUserCreated: false
}, {
  id: "kuwait-national-day",
  name: "Kuwait National Day",
  date: new Date("2025-02-25"),
  description: "Kuwait national day sales",
  location: "Kuwait",
  type: "discount",
  emoji: "🇰🇼",
  isUserCreated: false
}, {
  id: "bahrain-national-day",
  name: "Bahrain National Day",
  date: new Date("2025-12-16"),
  description: "Bahrain national celebration offers",
  location: "Bahrain",
  type: "discount",
  emoji: "🇧🇭",
  isUserCreated: false
}, {
  id: "oman-national-day",
  name: "Oman National Day",
  date: new Date("2025-11-18"),
  description: "Oman national day shopping deals",
  location: "Oman",
  type: "discount",
  emoji: "🇴🇲",
  isUserCreated: false
}, {
  id: "egypt-revolution-day",
  name: "Egypt Revolution Day",
  date: new Date("2025-07-23"),
  description: "Egyptian national celebration sales",
  location: "Egypt",
  type: "discount",
  emoji: "🇪🇬",
  isUserCreated: false
}, {
  id: "turkey-republic-day",
  name: "Turkey Republic Day",
  date: new Date("2025-10-29"),
  description: "Turkish national day discounts",
  location: "Turkey",
  type: "discount",
  emoji: "🇹🇷",
  isUserCreated: false
}, {
  id: "malaysia-merdeka",
  name: "Malaysia Merdeka Day",
  date: new Date("2025-08-31"),
  description: "Malaysian Independence Day sales",
  location: "Malaysia",
  type: "discount",
  emoji: "🇲🇾",
  isUserCreated: false
}, {
  id: "indonesia-independence",
  name: "Indonesia Independence Day",
  date: new Date("2025-08-17"),
  description: "Indonesian national day shopping",
  location: "Indonesia",
  type: "discount",
  emoji: "🇮🇩",
  isUserCreated: false
}, {
  id: "philippines-independence",
  name: "Philippines Independence Day",
  date: new Date("2025-06-12"),
  description: "Filipino national day sales",
  location: "Philippines",
  type: "discount",
  emoji: "🇵🇭",
  isUserCreated: false
}, {
  id: "thailand-king-birthday",
  name: "Thailand King's Birthday",
  date: new Date("2025-07-28"),
  description: "Thai national holiday sales",
  location: "Thailand",
  type: "holiday",
  emoji: "🇹🇭",
  isUserCreated: false
}, {
  id: "vietnam-national-day",
  name: "Vietnam National Day",
  date: new Date("2025-09-02"),
  description: "Vietnamese national celebration",
  location: "Vietnam",
  type: "discount",
  emoji: "🇻🇳",
  isUserCreated: false
}, {
  id: "south-korea-liberation",
  name: "Korea Liberation Day",
  date: new Date("2025-08-15"),
  description: "Korean national day shopping",
  location: "South Korea",
  type: "discount",
  emoji: "🇰🇷",
  isUserCreated: false
}, {
  id: "chuseok",
  name: "Chuseok Festival",
  date: new Date("2025-10-06"),
  description: "Korean harvest festival sales",
  location: "South Korea",
  type: "holiday",
  emoji: "🥮",
  isUserCreated: false
}, {
  id: "mid-autumn-festival",
  name: "Mid-Autumn Festival",
  date: new Date("2025-10-06"),
  description: "Chinese Moon Festival sales",
  location: "China, East Asia",
  type: "holiday",
  emoji: "🥮",
  isUserCreated: false
}, {
  id: "thanksgiving",
  name: "Thanksgiving Sales",
  date: new Date("2025-11-27"),
  description: "Pre-Black Friday shopping deals",
  location: "United States",
  type: "sale",
  emoji: "🦃",
  isUserCreated: false
}, {
  id: "labor-day-us",
  name: "Labor Day Sales",
  date: new Date("2025-09-01"),
  description: "End of summer sales event",
  location: "United States",
  type: "sale",
  emoji: "⚒️",
  isUserCreated: false
}, {
  id: "memorial-day",
  name: "Memorial Day Sales",
  date: new Date("2025-05-26"),
  description: "Start of summer shopping deals",
  location: "United States",
  type: "sale",
  emoji: "🇺🇸",
  isUserCreated: false
}, {
  id: "presidents-day",
  name: "Presidents Day Sales",
  date: new Date("2025-02-17"),
  description: "Winter clearance and discounts",
  location: "United States",
  type: "sale",
  emoji: "🏛️",
  isUserCreated: false
}, {
  id: "st-patricks-day",
  name: "St. Patrick's Day Sales",
  date: new Date("2025-03-17"),
  description: "Irish celebration shopping deals",
  location: "Ireland, Worldwide",
  type: "holiday",
  emoji: "☘️",
  isUserCreated: false
}, {
  id: "halloween-sales",
  name: "Halloween Sales",
  date: new Date("2025-10-31"),
  description: "Spooky season shopping deals",
  location: "Worldwide",
  type: "holiday",
  emoji: "🎃",
  isUserCreated: false
}, {
  id: "white-day",
  name: "White Day Sales",
  date: new Date("2025-03-14"),
  description: "Japanese gift-giving holiday",
  location: "Japan, South Korea",
  type: "holiday",
  emoji: "🤍",
  isUserCreated: false
}, {
  id: "jordan-independence",
  name: "Jordan Independence Day",
  date: new Date("2025-05-25"),
  description: "Jordanian national day sales",
  location: "Jordan",
  type: "discount",
  emoji: "🇯🇴",
  isUserCreated: false
}, {
  id: "morocco-throne-day",
  name: "Morocco Throne Day",
  date: new Date("2025-07-30"),
  description: "Moroccan national celebration",
  location: "Morocco",
  type: "discount",
  emoji: "🇲🇦",
  isUserCreated: false
}, {
  id: "pakistan-independence",
  name: "Pakistan Independence Day",
  date: new Date("2025-08-14"),
  description: "Pakistani national day sales",
  location: "Pakistan",
  type: "discount",
  emoji: "🇵🇰",
  isUserCreated: false
}, {
  id: "nigeria-independence",
  name: "Nigeria Independence Day",
  date: new Date("2025-10-01"),
  description: "Nigerian national celebration",
  location: "Nigeria",
  type: "discount",
  emoji: "🇳🇬",
  isUserCreated: false
}, {
  id: "south-africa-heritage",
  name: "South Africa Heritage Day",
  date: new Date("2025-09-24"),
  description: "South African national day",
  location: "South Africa",
  type: "discount",
  emoji: "🇿🇦",
  isUserCreated: false
}];
export default function Events() {
  const {
    t
  } = useLanguage();
  const {
    isGuest
  } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>(defaultEvents);
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    time: "12:00",
    type: "personal" as Event['type'],
    emoji: "📅",
    reminderMinutes: 0
  });

  // Check for upcoming event reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setEvents(prevEvents => prevEvents.map(event => {
        if (!event.reminderMinutes || event.reminderShown) return event;
        const eventDateTime = event.time ? parse(event.time, 'HH:mm', event.date) : event.date;
        const minutesUntil = differenceInMinutes(eventDateTime, now);
        if (minutesUntil <= event.reminderMinutes && minutesUntil > 0) {
          toast.info(`🔔 Reminder: ${event.name}`, {
            description: `Starting in ${minutesUntil} minutes`,
            duration: 10000
          });
          return {
            ...event,
            reminderShown: true
          };
        }
        return event;
      }));
    };
    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check
    return () => clearInterval(interval);
  }, []);

  // Generate event colors for calendar
  const eventColors = events.reduce((acc, event) => {
    const dateKey = event.date.toDateString();
    acc[dateKey] = EVENT_TYPE_COLORS[event.type];
    return acc;
  }, {} as Record<string, string>);
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      time: "12:00",
      type: "personal",
      emoji: "📅",
      reminderMinutes: 0
    });
    setEditingEvent(null);
  };
  const handleCreateEvent = () => {
    if (isGuest) {
      toast.error("Please create an account to add events");
      return;
    }
    if (selectedDates.length === 0) {
      toast.error("Please select a date");
      return;
    }

    // Check if user has reached the limit of 5 events (only for new events)
    if (!editingEvent) {
      const userCreatedEvents = events.filter(event => event.isUserCreated);
      if (userCreatedEvents.length >= 5) {
        toast.error("You can only create up to 5 events");
        return;
      }
    }
    const newEvent: Event = {
      id: Date.now().toString(),
      name: formData.name,
      date: selectedDates[0],
      time: formData.time,
      description: formData.description,
      location: formData.location,
      type: formData.type,
      emoji: formData.emoji,
      isUserCreated: true,
      reminderMinutes: formData.reminderMinutes,
      reminderShown: false
    };
    if (editingEvent) {
      setEvents(events.map(event => event.id === editingEvent.id ? {
        ...newEvent,
        id: editingEvent.id
      } : event));
      toast.success("Event updated successfully");
    } else {
      setEvents([...events, newEvent]);
      toast.success("Event created successfully");
    }
    setIsDialogOpen(false);
    resetForm();
  };
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      location: event.location,
      time: event.time || "12:00",
      type: event.type,
      emoji: event.emoji,
      reminderMinutes: event.reminderMinutes || 0
    });
    setSelectedDates([event.date]);
    setIsDialogOpen(true);
  };
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast.success("Event deleted successfully");
  };
  const eventsForSelectedDates = selectedDates.length > 0 ? events.filter(event => selectedDates.some(date => format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))) : [];
  const upcomingEvents = events.filter(event => event.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-center">{t('nav.events')}</h1>
          <p className="text-muted-foreground text-center">Plan purchases around global sales, holidays, and national days. Create custom events for personalized shopping strategy.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={isGuest} className="bg-gradient-primary hover:shadow-hover transition-all duration-300 h-11 px-6 flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Enter event name" maxLength={50} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Event description" rows={2} maxLength={120} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData({
                ...formData,
                location: e.target.value
              })} placeholder="Event location" maxLength={20} />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <TimePicker value={formData.time} onChange={time => setFormData({
                ...formData,
                time
              })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={formData.type} onValueChange={(value: Event['type']) => setFormData({
                ...formData,
                type: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500" />Personal</span></SelectItem>
                    <SelectItem value="discount"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" />Discount</span></SelectItem>
                    <SelectItem value="sale"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" />Sale</span></SelectItem>
                    <SelectItem value="holiday"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />Holiday</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder">Reminder</Label>
                <Select value={formData.reminderMinutes.toString()} onValueChange={value => setFormData({
                ...formData,
                reminderMinutes: parseInt(value)
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0"><span className="flex items-center gap-2"><BellOff className="h-3 w-3" />No reminder</span></SelectItem>
                    <SelectItem value="15"><span className="flex items-center gap-2"><Bell className="h-3 w-3" />15 minutes before</span></SelectItem>
                    <SelectItem value="30"><span className="flex items-center gap-2"><Bell className="h-3 w-3" />30 minutes before</span></SelectItem>
                    <SelectItem value="60"><span className="flex items-center gap-2"><Bell className="h-3 w-3" />1 hour before</span></SelectItem>
                    <SelectItem value="1440"><span className="flex items-center gap-2"><Bell className="h-3 w-3" />1 day before</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateEvent} className="w-full">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-card border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-col">
            <Calendar mode="multiple" selected={selectedDates} onSelect={dates => setSelectedDates(dates || [])} eventDates={events.map(event => event.date)} eventColors={eventColors} className="rounded-md border p-4 pointer-events-auto flex-1 w-full" />
            {/* Event Type Legend */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Sale</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Discount</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-muted-foreground">Personal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="shadow-card border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDates.length > 0 ? selectedDates.length === 1 ? format(selectedDates[0], 'MMM dd, yyyy') : `${selectedDates.length} dates selected` : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsForSelectedDates.length > 0 ? eventsForSelectedDates.map(event => <div key={event.id} className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-all duration-200 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{event.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{event.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${EVENT_TYPE_BADGE_COLORS[event.type]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${EVENT_TYPE_COLORS[event.type]}`} />
                            {event.type}
                          </Badge>
                          {event.time && <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>}
                          {event.reminderMinutes && event.reminderMinutes > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              {event.reminderMinutes >= 1440 ? '1 day' : `${event.reminderMinutes}m`}
                            </span>}
                          {event.location && <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>}
                        </div>
                      </div>
                    </div>
                    {event.isUserCreated && <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)} className="h-8 w-8 p-0 hover:bg-accent transition-all">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>}
                  </div>
                </div>) : <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No events for this date</p>
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="shadow-card border-border animate-fade-in">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map(event => <div key={event.id} className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="font-semibold text-sm truncate">{event.name}</h4>
                      {event.isUserCreated && <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)} className="h-8 w-8 p-0 hover:bg-accent transition-all">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-all">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                        {format(event.date, 'MMM dd, yyyy')}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.location && <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>}
                        <Badge variant="outline" className={`text-xs flex-shrink-0 ${EVENT_TYPE_BADGE_COLORS[event.type]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${EVENT_TYPE_COLORS[event.type]}`} />
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}