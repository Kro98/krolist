import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  type: 'discount' | 'sale' | 'holiday';
  emoji: string;
}

const events: Event[] = [
  {
    id: "saudi-national-day",
    name: "Saudi National Day",
    date: "2024-09-23",
    description: "Special discounts across Saudi retailers",
    location: "SA",
    type: "discount",
    emoji: "🇸🇦"
  },
  {
    id: "black-friday",
    name: "Black Friday",
    date: "2024-11-29",
    description: "Worldwide mega sales event",
    location: "GLOBAL",
    type: "sale",
    emoji: "🛍️"
  },
  {
    id: "cyber-monday",
    name: "Cyber Monday",
    date: "2024-12-02",
    description: "Online shopping deals",
    location: "GLOBAL",
    type: "sale",
    emoji: "💻"
  },
  {
    id: "ramadan-sales",
    name: "Ramadan Sales",
    date: "2024-03-10",
    description: "Special Ramadan discounts",
    location: "MENA",
    type: "discount",
    emoji: "🌙"
  }
];

const getUserLocation = (): string => {
  // Simple location detection - in a real app, you'd use geolocation API
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  if (timezone.includes('Riyadh') || timezone.includes('Mecca')) return 'SA';
  if (timezone.includes('Dubai') || timezone.includes('Cairo')) return 'MENA';
  if (timezone.includes('New_York') || timezone.includes('Los_Angeles')) return 'US';
  
  return 'GLOBAL';
};

const getUpcomingEvent = (userLocation: string): Event | null => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const relevantEvents = events.filter(event => 
    event.location === userLocation || event.location === 'GLOBAL'
  );
  
  const upcomingEvents = relevantEvents
    .map(event => ({
      ...event,
      date: event.date.replace('2024', currentYear.toString()),
      eventDate: new Date(event.date.replace('2024', currentYear.toString()))
    }))
    .filter(event => event.eventDate >= today)
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  
  return upcomingEvents[0] || null;
};

const formatDaysUntil = (eventDate: Date): string => {
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
};

export function UpcomingEvents() {
  const { t } = useLanguage();
  const [userLocation] = useState(getUserLocation());
  const upcomingEvent = getUpcomingEvent(userLocation);

  if (!upcomingEvent) return null;

  const eventDate = new Date(upcomingEvent.date);
  const daysUntil = formatDaysUntil(eventDate);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          {t('events.upcoming')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{upcomingEvent.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{upcomingEvent.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {daysUntil}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {upcomingEvent.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {eventDate.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {upcomingEvent.location === 'GLOBAL' ? 'Worldwide' : 
                 upcomingEvent.location === 'SA' ? 'Saudi Arabia' :
                 upcomingEvent.location === 'MENA' ? 'MENA Region' : 'Local'}
              </span>
              <Badge variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {upcomingEvent.type}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}