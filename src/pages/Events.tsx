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
}];
export default function Events() {
  const {
    t
  } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>(defaultEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (!event.reminderMinutes || event.reminderShown) return event;
          
          const eventDateTime = event.time 
            ? parse(event.time, 'HH:mm', event.date)
            : event.date;
          
          const minutesUntil = differenceInMinutes(eventDateTime, now);
          
          if (minutesUntil <= event.reminderMinutes && minutesUntil > 0) {
            toast.info(`🔔 Reminder: ${event.name}`, {
              description: `Starting in ${minutesUntil} minutes`,
              duration: 10000
            });
            return { ...event, reminderShown: true };
          }
          return event;
        })
      );
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

    if (!selectedDate) {
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
      date: selectedDate,
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
    setSelectedDate(event.date);
    setIsDialogOpen(true);
  };
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast.success("Event deleted successfully");
  };
  const eventsForSelectedDate = selectedDate ? events.filter(event => format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) : [];
  const upcomingEvents = events.filter(event => event.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('nav.events')}</h1>
          <p className="text-muted-foreground">Plan purchases around global sales, holidays, and national days. Create custom events for personalized shopping strategy.</p>
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
                <TimePicker 
                  value={formData.time} 
                  onChange={(time) => setFormData({...formData, time})} 
                />
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
                <Select value={formData.reminderMinutes.toString()} onValueChange={(value) => setFormData({
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
          <CardContent className="flex gap-4 flex-col lg:flex-row">
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate} 
              eventDates={events.map(event => event.date)}
              eventColors={eventColors}
              className="rounded-md border p-4 pointer-events-auto flex-1 w-full" 
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="shadow-card border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsForSelectedDate.length > 0 ? eventsForSelectedDate.map(event => <div key={event.id} className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-all duration-200 border border-border">
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