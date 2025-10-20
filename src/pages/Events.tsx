import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, MapPin, Tag, Plus, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { AdSpace } from "@/components/AdSpace";
interface Event {
  id: string;
  name: string;
  date: Date;
  description: string;
  location: string;
  type: 'discount' | 'sale' | 'holiday' | 'personal';
  emoji: string;
  isUserCreated: boolean;
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
  const [events, setEvents] = useState<Event[]>(defaultEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    type: "personal" as Event['type'],
    emoji: "📅"
  });
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      type: "personal",
      emoji: "📅"
    });
    setEditingEvent(null);
  };
  const handleCreateEvent = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    const newEvent: Event = {
      id: Date.now().toString(),
      name: formData.name,
      date: selectedDate,
      description: formData.description,
      location: formData.location,
      type: formData.type,
      emoji: formData.emoji,
      isUserCreated: true
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
      type: event.type,
      emoji: event.emoji
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
  return <div className="space-y-6 px-[10px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.events')}</h1>
          <p className="text-muted-foreground">Plan purchases around global sales, holidays, and national days. Create custom events for personalized shopping strategy.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
              })} placeholder="Enter event name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Event description" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={formData.location} onChange={e => setFormData({
                  ...formData,
                  location: e.target.value
                })} placeholder="Event location" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input id="emoji" value={formData.emoji} onChange={e => setFormData({
                  ...formData,
                  emoji: e.target.value
                })} placeholder="📅" maxLength={2} />
                </div>
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
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-[50px]">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="mx-0 px-[10px] flex gap-4">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} modifiers={{
            hasEvent: events.map(event => event.date)
          }} modifiersStyles={{
            hasEvent: {
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              fontWeight: 'bold'
            }
          }} className="rounded-md border p-3 pointer-events-auto px-0 flex-1" />
            
            {/* Ad Space next to calendar */}
            <AdSpace className="w-[300px] hidden lg:block" height="h-[400px]" />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsForSelectedDate.length > 0 ? eventsForSelectedDate.map(event => <div key={event.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{event.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{event.name}</h4>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.location && <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-2 w-2" />
                              {event.location}
                            </span>}
                        </div>
                      </div>
                    </div>
                    {event.isUserCreated && <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>}
                  </div>
                </div>) : <p className="text-muted-foreground text-sm text-center py-4">
                No events for this date
              </p>}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="mx-0 px-[5px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map(event => <div key={event.id} className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 px-px">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{event.name}</h4>
                      {event.isUserCreated && <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(event.date, 'MMM dd, yyyy')}
                      </span>
                      {event.location && <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>}
                      <Badge variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}