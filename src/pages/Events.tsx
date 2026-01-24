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
// Helper to generate events for multiple years
const generateYearlyEvents = (baseYear: number, yearsToGenerate: number) => {
  const events: Event[] = [];
  
  // Islamic calendar dates are approximate - these shift ~11 days earlier each year
  // 2025 Base dates (approximate):
  // Ramadan 2025: March 1 - March 30
  // Eid al-Fitr 2025: March 30-31
  // Eid al-Adha 2025: June 6-9
  // Islamic New Year 1447: June 26, 2025
  // Mawlid 2025: September 4
  
  const islamicShiftDays = -11; // Islamic calendar shifts ~11 days earlier each solar year
  
  for (let yearOffset = 0; yearOffset < yearsToGenerate; yearOffset++) {
    const year = baseYear + yearOffset;
    const islamicDayShift = yearOffset * islamicShiftDays;
    
    // Helper to add days to a base date
    const addDays = (dateStr: string, days: number) => {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date;
    };
    
    // ==========================================
    // ISLAMIC RELIGIOUS EVENTS (shift each year)
    // ==========================================
    
    // Ramadan Start
    events.push({
      id: `ramadan-start-${year}`,
      name: "Ramadan Begins",
      date: addDays(`${year}-03-01`, islamicDayShift),
      description: "The holy month of fasting begins - major sales across all retailers",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "☪️",
      isUserCreated: false
    });
    
    // Ramadan Sales Period
    events.push({
      id: `ramadan-sales-${year}`,
      name: "Ramadan Sales Season",
      date: addDays(`${year}-03-10`, islamicDayShift),
      description: "Peak Ramadan shopping season - electronics, fashion, home goods",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🛒",
      isUserCreated: false
    });
    
    // Last 10 Days of Ramadan
    events.push({
      id: `ramadan-last-10-${year}`,
      name: "Last 10 Days of Ramadan",
      date: addDays(`${year}-03-20`, islamicDayShift),
      description: "Laylat al-Qadr period - intensified spiritual activities",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "🌙",
      isUserCreated: false
    });
    
    // Eid al-Fitr
    events.push({
      id: `eid-al-fitr-${year}`,
      name: "Eid al-Fitr",
      date: addDays(`${year}-03-30`, islamicDayShift),
      description: "Festival of Breaking the Fast - major holiday sales and celebrations",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "🌙",
      isUserCreated: false
    });
    
    // Eid al-Fitr Sales
    events.push({
      id: `eid-al-fitr-sales-${year}`,
      name: "Eid al-Fitr Mega Sales",
      date: addDays(`${year}-03-28`, islamicDayShift),
      description: "Pre-Eid shopping rush - clothing, gifts, electronics discounts",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🎁",
      isUserCreated: false
    });
    
    // Hajj Season
    events.push({
      id: `hajj-season-${year}`,
      name: "Hajj Season Begins",
      date: addDays(`${year}-05-27`, islamicDayShift),
      description: "Annual Islamic pilgrimage to Mecca",
      location: "Saudi Arabia",
      type: "holiday",
      emoji: "🕋",
      isUserCreated: false
    });
    
    // Day of Arafah
    events.push({
      id: `day-of-arafah-${year}`,
      name: "Day of Arafah",
      date: addDays(`${year}-06-05`, islamicDayShift),
      description: "Holiest day in Islam - day before Eid al-Adha",
      location: "Saudi Arabia & Muslim World",
      type: "holiday",
      emoji: "⛰️",
      isUserCreated: false
    });
    
    // Eid al-Adha
    events.push({
      id: `eid-al-adha-${year}`,
      name: "Eid al-Adha",
      date: addDays(`${year}-06-06`, islamicDayShift),
      description: "Festival of Sacrifice - major holiday with special offers",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "🐑",
      isUserCreated: false
    });
    
    // Eid al-Adha Sales
    events.push({
      id: `eid-al-adha-sales-${year}`,
      name: "Eid al-Adha Sales",
      date: addDays(`${year}-06-04`, islamicDayShift),
      description: "Pre-Eid shopping - meat, gifts, fashion discounts",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🛍️",
      isUserCreated: false
    });
    
    // Islamic New Year
    events.push({
      id: `islamic-new-year-${year}`,
      name: "Islamic New Year (Hijri)",
      date: addDays(`${year}-06-26`, islamicDayShift),
      description: "Beginning of the new Islamic calendar year",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "📅",
      isUserCreated: false
    });
    
    // Ashura
    events.push({
      id: `ashura-${year}`,
      name: "Ashura",
      date: addDays(`${year}-07-05`, islamicDayShift),
      description: "10th day of Muharram - significant religious observance",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "🕌",
      isUserCreated: false
    });
    
    // Mawlid an-Nabi (Prophet's Birthday)
    events.push({
      id: `mawlid-${year}`,
      name: "Mawlid an-Nabi",
      date: addDays(`${year}-09-04`, islamicDayShift),
      description: "Prophet Muhammad's Birthday celebration",
      location: "Middle East & Muslim World",
      type: "holiday",
      emoji: "🌟",
      isUserCreated: false
    });
    
    // ==========================================
    // SAUDI ARABIA EVENTS
    // ==========================================
    
    events.push({
      id: `saudi-founding-day-${year}`,
      name: "Saudi Founding Day",
      date: new Date(`${year}-02-22`),
      description: "Commemorating the establishment of the first Saudi state in 1727",
      location: "Saudi Arabia",
      type: "holiday",
      emoji: "🇸🇦",
      isUserCreated: false
    });
    
    events.push({
      id: `saudi-founding-sales-${year}`,
      name: "Founding Day Sales",
      date: new Date(`${year}-02-20`),
      description: "Major retail discounts celebrating Saudi heritage",
      location: "Saudi Arabia",
      type: "sale",
      emoji: "🛒",
      isUserCreated: false
    });
    
    events.push({
      id: `saudi-national-day-${year}`,
      name: "Saudi National Day",
      date: new Date(`${year}-09-23`),
      description: "Kingdom of Saudi Arabia unification - massive nationwide sales",
      location: "Saudi Arabia",
      type: "holiday",
      emoji: "🇸🇦",
      isUserCreated: false
    });
    
    events.push({
      id: `saudi-national-sales-${year}`,
      name: "National Day Mega Sales",
      date: new Date(`${year}-09-20`),
      description: "Biggest annual sales event in Saudi Arabia",
      location: "Saudi Arabia",
      type: "sale",
      emoji: "💚",
      isUserCreated: false
    });
    
    events.push({
      id: `saudi-flag-day-${year}`,
      name: "Saudi Flag Day",
      date: new Date(`${year}-03-11`),
      description: "Celebrating the Saudi Arabian flag",
      location: "Saudi Arabia",
      type: "holiday",
      emoji: "🏴",
      isUserCreated: false
    });
    
    events.push({
      id: `riyadh-season-${year}`,
      name: "Riyadh Season",
      date: new Date(`${year}-10-15`),
      description: "Major entertainment festival with exclusive shopping deals",
      location: "Saudi Arabia",
      type: "discount",
      emoji: "🎭",
      isUserCreated: false
    });
    
    events.push({
      id: `jeddah-season-${year}`,
      name: "Jeddah Season",
      date: new Date(`${year}-06-01`),
      description: "Summer entertainment and shopping festival",
      location: "Saudi Arabia",
      type: "discount",
      emoji: "🌊",
      isUserCreated: false
    });
    
    // ==========================================
    // UAE EVENTS
    // ==========================================
    
    events.push({
      id: `uae-national-day-${year}`,
      name: "UAE National Day",
      date: new Date(`${year}-12-02`),
      description: "United Arab Emirates formation anniversary",
      location: "UAE",
      type: "holiday",
      emoji: "🇦🇪",
      isUserCreated: false
    });
    
    events.push({
      id: `uae-national-sales-${year}`,
      name: "UAE National Day Sales",
      date: new Date(`${year}-11-28`),
      description: "Week-long sales celebrating UAE National Day",
      location: "UAE",
      type: "sale",
      emoji: "🛍️",
      isUserCreated: false
    });
    
    events.push({
      id: `uae-flag-day-${year}`,
      name: "UAE Flag Day",
      date: new Date(`${year}-11-03`),
      description: "Celebrating UAE unity and identity",
      location: "UAE",
      type: "holiday",
      emoji: "🏳️",
      isUserCreated: false
    });
    
    events.push({
      id: `dubai-shopping-festival-${year}`,
      name: "Dubai Shopping Festival",
      date: new Date(`${year}-12-15`),
      description: "World-famous month-long shopping extravaganza",
      location: "UAE",
      type: "sale",
      emoji: "🏬",
      isUserCreated: false
    });
    
    events.push({
      id: `dubai-summer-surprises-${year}`,
      name: "Dubai Summer Surprises",
      date: new Date(`${year}-07-01`),
      description: "Summer shopping festival with major discounts",
      location: "UAE",
      type: "sale",
      emoji: "☀️",
      isUserCreated: false
    });
    
    events.push({
      id: `abu-dhabi-shopping-${year}`,
      name: "Abu Dhabi Shopping Festival",
      date: new Date(`${year}-08-01`),
      description: "Major retail event with prizes and discounts",
      location: "UAE",
      type: "sale",
      emoji: "🏙️",
      isUserCreated: false
    });
    
    events.push({
      id: `uae-commemoration-day-${year}`,
      name: "UAE Commemoration Day",
      date: new Date(`${year}-12-01`),
      description: "Honoring UAE martyrs - day before National Day",
      location: "UAE",
      type: "holiday",
      emoji: "🕯️",
      isUserCreated: false
    });
    
    // ==========================================
    // KUWAIT EVENTS
    // ==========================================
    
    events.push({
      id: `kuwait-national-day-${year}`,
      name: "Kuwait National Day",
      date: new Date(`${year}-02-25`),
      description: "Independence celebration with nationwide sales",
      location: "Kuwait",
      type: "holiday",
      emoji: "🇰🇼",
      isUserCreated: false
    });
    
    events.push({
      id: `kuwait-liberation-day-${year}`,
      name: "Kuwait Liberation Day",
      date: new Date(`${year}-02-26`),
      description: "Celebrating liberation from Iraqi occupation",
      location: "Kuwait",
      type: "holiday",
      emoji: "🕊️",
      isUserCreated: false
    });
    
    events.push({
      id: `kuwait-hala-feb-${year}`,
      name: "Hala February Festival",
      date: new Date(`${year}-02-01`),
      description: "Month-long shopping and entertainment festival",
      location: "Kuwait",
      type: "sale",
      emoji: "🎉",
      isUserCreated: false
    });
    
    // ==========================================
    // BAHRAIN EVENTS
    // ==========================================
    
    events.push({
      id: `bahrain-national-day-${year}`,
      name: "Bahrain National Day",
      date: new Date(`${year}-12-16`),
      description: "Kingdom of Bahrain national celebration",
      location: "Bahrain",
      type: "holiday",
      emoji: "🇧🇭",
      isUserCreated: false
    });
    
    events.push({
      id: `bahrain-national-day-2-${year}`,
      name: "Bahrain National Day (Day 2)",
      date: new Date(`${year}-12-17`),
      description: "Second day of Bahrain National Day celebrations",
      location: "Bahrain",
      type: "holiday",
      emoji: "🇧🇭",
      isUserCreated: false
    });
    
    events.push({
      id: `bahrain-shop-festival-${year}`,
      name: "Shop Bahrain Festival",
      date: new Date(`${year}-01-15`),
      description: "Annual shopping festival with prizes",
      location: "Bahrain",
      type: "sale",
      emoji: "🎊",
      isUserCreated: false
    });
    
    // ==========================================
    // QATAR EVENTS
    // ==========================================
    
    events.push({
      id: `qatar-national-day-${year}`,
      name: "Qatar National Day",
      date: new Date(`${year}-12-18`),
      description: "Qatar's independence and unity celebration",
      location: "Qatar",
      type: "holiday",
      emoji: "🇶🇦",
      isUserCreated: false
    });
    
    events.push({
      id: `qatar-sports-day-${year}`,
      name: "Qatar Sports Day",
      date: new Date(`${year}-02-11`), // Second Tuesday of February
      description: "National sports holiday promoting fitness",
      location: "Qatar",
      type: "holiday",
      emoji: "⚽",
      isUserCreated: false
    });
    
    events.push({
      id: `qatar-shop-festival-${year}`,
      name: "Shop Qatar Festival",
      date: new Date(`${year}-01-07`),
      description: "Winter shopping festival with major discounts",
      location: "Qatar",
      type: "sale",
      emoji: "🛒",
      isUserCreated: false
    });
    
    events.push({
      id: `qatar-summer-festival-${year}`,
      name: "Qatar Summer Festival",
      date: new Date(`${year}-07-15`),
      description: "Summer entertainment and shopping event",
      location: "Qatar",
      type: "sale",
      emoji: "🌴",
      isUserCreated: false
    });
    
    // ==========================================
    // OMAN EVENTS
    // ==========================================
    
    events.push({
      id: `oman-national-day-${year}`,
      name: "Oman National Day",
      date: new Date(`${year}-11-18`),
      description: "Sultanate of Oman national celebration",
      location: "Oman",
      type: "holiday",
      emoji: "🇴🇲",
      isUserCreated: false
    });
    
    events.push({
      id: `oman-renaissance-day-${year}`,
      name: "Oman Renaissance Day",
      date: new Date(`${year}-07-23`),
      description: "Celebrating Oman's modern development",
      location: "Oman",
      type: "holiday",
      emoji: "🌟",
      isUserCreated: false
    });
    
    events.push({
      id: `muscat-festival-${year}`,
      name: "Muscat Festival",
      date: new Date(`${year}-01-20`),
      description: "Annual cultural and shopping festival",
      location: "Oman",
      type: "sale",
      emoji: "🎪",
      isUserCreated: false
    });
    
    events.push({
      id: `salalah-khareef-${year}`,
      name: "Salalah Khareef Festival",
      date: new Date(`${year}-07-15`),
      description: "Monsoon season festival with special offers",
      location: "Oman",
      type: "discount",
      emoji: "🌧️",
      isUserCreated: false
    });
    
    // ==========================================
    // EGYPT EVENTS
    // ==========================================
    
    events.push({
      id: `egypt-revolution-day-${year}`,
      name: "Egypt Revolution Day",
      date: new Date(`${year}-07-23`),
      description: "1952 Revolution anniversary",
      location: "Egypt",
      type: "holiday",
      emoji: "🇪🇬",
      isUserCreated: false
    });
    
    events.push({
      id: `egypt-national-day-${year}`,
      name: "Egypt Armed Forces Day",
      date: new Date(`${year}-10-06`),
      description: "Commemorating the October War victory",
      location: "Egypt",
      type: "holiday",
      emoji: "⚔️",
      isUserCreated: false
    });
    
    events.push({
      id: `sham-el-nessim-${year}`,
      name: "Sham el-Nessim",
      date: new Date(`${year}-04-21`), // Day after Easter
      description: "Ancient Egyptian spring festival",
      location: "Egypt",
      type: "holiday",
      emoji: "🌸",
      isUserCreated: false
    });
    
    events.push({
      id: `egypt-january-sales-${year}`,
      name: "January Revolution Sales",
      date: new Date(`${year}-01-25`),
      description: "Revolution anniversary with retail promotions",
      location: "Egypt",
      type: "discount",
      emoji: "🛍️",
      isUserCreated: false
    });
    
    // ==========================================
    // JORDAN EVENTS
    // ==========================================
    
    events.push({
      id: `jordan-independence-${year}`,
      name: "Jordan Independence Day",
      date: new Date(`${year}-05-25`),
      description: "Hashemite Kingdom independence celebration",
      location: "Jordan",
      type: "holiday",
      emoji: "🇯🇴",
      isUserCreated: false
    });
    
    events.push({
      id: `jordan-great-revolt-${year}`,
      name: "Great Arab Revolt Day",
      date: new Date(`${year}-06-10`),
      description: "Commemorating the 1916 Arab Revolt",
      location: "Jordan",
      type: "holiday",
      emoji: "🏴",
      isUserCreated: false
    });
    
    events.push({
      id: `jordan-king-birthday-${year}`,
      name: "King Abdullah II Birthday",
      date: new Date(`${year}-01-30`),
      description: "Royal celebration with special offers",
      location: "Jordan",
      type: "holiday",
      emoji: "👑",
      isUserCreated: false
    });
    
    // ==========================================
    // LEBANON EVENTS
    // ==========================================
    
    events.push({
      id: `lebanon-independence-${year}`,
      name: "Lebanon Independence Day",
      date: new Date(`${year}-11-22`),
      description: "Lebanese Republic independence celebration",
      location: "Lebanon",
      type: "holiday",
      emoji: "🇱🇧",
      isUserCreated: false
    });
    
    events.push({
      id: `beirut-holidays-${year}`,
      name: "Beirut Holidays Festival",
      date: new Date(`${year}-12-20`),
      description: "End of year shopping festival",
      location: "Lebanon",
      type: "sale",
      emoji: "🎄",
      isUserCreated: false
    });
    
    // ==========================================
    // IRAQ EVENTS
    // ==========================================
    
    events.push({
      id: `iraq-national-day-${year}`,
      name: "Iraq National Day",
      date: new Date(`${year}-10-03`),
      description: "Iraqi independence celebration",
      location: "Iraq",
      type: "holiday",
      emoji: "🇮🇶",
      isUserCreated: false
    });
    
    events.push({
      id: `iraq-republic-day-${year}`,
      name: "Iraq Republic Day",
      date: new Date(`${year}-07-14`),
      description: "1958 Revolution anniversary",
      location: "Iraq",
      type: "holiday",
      emoji: "🇮🇶",
      isUserCreated: false
    });
    
    // ==========================================
    // MOROCCO EVENTS
    // ==========================================
    
    events.push({
      id: `morocco-throne-day-${year}`,
      name: "Morocco Throne Day",
      date: new Date(`${year}-07-30`),
      description: "King's accession anniversary with national celebrations",
      location: "Morocco",
      type: "holiday",
      emoji: "🇲🇦",
      isUserCreated: false
    });
    
    events.push({
      id: `morocco-independence-${year}`,
      name: "Morocco Independence Day",
      date: new Date(`${year}-11-18`),
      description: "Independence from France celebration",
      location: "Morocco",
      type: "holiday",
      emoji: "🇲🇦",
      isUserCreated: false
    });
    
    events.push({
      id: `morocco-green-march-${year}`,
      name: "Green March Day",
      date: new Date(`${year}-11-06`),
      description: "Commemorating the 1975 peaceful march",
      location: "Morocco",
      type: "holiday",
      emoji: "🌿",
      isUserCreated: false
    });
    
    // ==========================================
    // TUNISIA EVENTS
    // ==========================================
    
    events.push({
      id: `tunisia-revolution-${year}`,
      name: "Tunisia Revolution Day",
      date: new Date(`${year}-01-14`),
      description: "Jasmine Revolution anniversary",
      location: "Tunisia",
      type: "holiday",
      emoji: "🇹🇳",
      isUserCreated: false
    });
    
    events.push({
      id: `tunisia-independence-${year}`,
      name: "Tunisia Independence Day",
      date: new Date(`${year}-03-20`),
      description: "Independence from France celebration",
      location: "Tunisia",
      type: "holiday",
      emoji: "🇹🇳",
      isUserCreated: false
    });
    
    // ==========================================
    // ALGERIA EVENTS
    // ==========================================
    
    events.push({
      id: `algeria-independence-${year}`,
      name: "Algeria Independence Day",
      date: new Date(`${year}-07-05`),
      description: "Independence from France celebration",
      location: "Algeria",
      type: "holiday",
      emoji: "🇩🇿",
      isUserCreated: false
    });
    
    events.push({
      id: `algeria-revolution-${year}`,
      name: "Algeria Revolution Day",
      date: new Date(`${year}-11-01`),
      description: "1954 Revolution anniversary",
      location: "Algeria",
      type: "holiday",
      emoji: "🇩🇿",
      isUserCreated: false
    });
    
    // ==========================================
    // TURKEY EVENTS
    // ==========================================
    
    events.push({
      id: `turkey-republic-day-${year}`,
      name: "Turkey Republic Day",
      date: new Date(`${year}-10-29`),
      description: "Turkish Republic founding anniversary",
      location: "Turkey",
      type: "holiday",
      emoji: "🇹🇷",
      isUserCreated: false
    });
    
    events.push({
      id: `turkey-victory-day-${year}`,
      name: "Turkey Victory Day",
      date: new Date(`${year}-08-30`),
      description: "Victory in War of Independence",
      location: "Turkey",
      type: "holiday",
      emoji: "🏆",
      isUserCreated: false
    });
    
    events.push({
      id: `turkey-youth-day-${year}`,
      name: "Turkey Youth Day",
      date: new Date(`${year}-05-19`),
      description: "Commemoration of Atatürk, Youth and Sports Day",
      location: "Turkey",
      type: "holiday",
      emoji: "🇹🇷",
      isUserCreated: false
    });
    
    events.push({
      id: `turkey-childrens-day-${year}`,
      name: "Turkey Children's Day",
      date: new Date(`${year}-04-23`),
      description: "National Sovereignty and Children's Day",
      location: "Turkey",
      type: "holiday",
      emoji: "👶",
      isUserCreated: false
    });
    
    events.push({
      id: `istanbul-shopping-fest-${year}`,
      name: "Istanbul Shopping Fest",
      date: new Date(`${year}-06-15`),
      description: "Annual shopping festival with major discounts",
      location: "Turkey",
      type: "sale",
      emoji: "🛍️",
      isUserCreated: false
    });
    
    // ==========================================
    // REGIONAL DISCOUNT SEASONS
    // ==========================================
    
    events.push({
      id: `white-friday-${year}`,
      name: "White Friday",
      date: new Date(`${year}-11-28`),
      description: "Middle East's biggest online shopping day",
      location: "Middle East",
      type: "sale",
      emoji: "🏷️",
      isUserCreated: false
    });
    
    events.push({
      id: `yellow-friday-${year}`,
      name: "Yellow Friday (Noon)",
      date: new Date(`${year}-11-27`),
      description: "Noon.com's mega sale event",
      location: "Middle East",
      type: "sale",
      emoji: "💛",
      isUserCreated: false
    });
    
    events.push({
      id: `singles-day-mena-${year}`,
      name: "Singles Day (11.11)",
      date: new Date(`${year}-11-11`),
      description: "World's largest shopping day - huge MENA sales",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🎊",
      isUserCreated: false
    });
    
    events.push({
      id: `end-of-season-winter-${year}`,
      name: "Winter End-of-Season Sale",
      date: new Date(`${year}-01-15`),
      description: "Major clearance on winter fashion and goods",
      location: "Middle East",
      type: "sale",
      emoji: "❄️",
      isUserCreated: false
    });
    
    events.push({
      id: `end-of-season-summer-${year}`,
      name: "Summer End-of-Season Sale",
      date: new Date(`${year}-08-15`),
      description: "Major clearance on summer fashion and goods",
      location: "Middle East",
      type: "sale",
      emoji: "🌞",
      isUserCreated: false
    });
    
    events.push({
      id: `back-to-school-mena-${year}`,
      name: "Back to School Season",
      date: new Date(`${year}-08-25`),
      description: "School supplies, electronics, and uniform sales",
      location: "Middle East",
      type: "sale",
      emoji: "🎒",
      isUserCreated: false
    });
    
    events.push({
      id: `cyber-monday-mena-${year}`,
      name: "Cyber Monday",
      date: new Date(`${year}-12-01`),
      description: "Online shopping deals post-White Friday",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "💻",
      isUserCreated: false
    });
    
    events.push({
      id: `mid-year-sale-${year}`,
      name: "Mid-Year Mega Sale",
      date: new Date(`${year}-06-15`),
      description: "Half-year clearance with major discounts",
      location: "Middle East",
      type: "sale",
      emoji: "🔥",
      isUserCreated: false
    });
    
    events.push({
      id: `amazon-prime-day-mena-${year}`,
      name: "Amazon Prime Day",
      date: new Date(`${year}-07-15`),
      description: "Exclusive deals for Prime members",
      location: "UAE, Saudi Arabia",
      type: "sale",
      emoji: "📦",
      isUserCreated: false
    });
    
    events.push({
      id: `new-year-sale-${year}`,
      name: "New Year Sale",
      date: new Date(`${year}-01-01`),
      description: "New year clearance and fresh start deals",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🎆",
      isUserCreated: false
    });
    
    events.push({
      id: `valentines-day-${year}`,
      name: "Valentine's Day Sales",
      date: new Date(`${year}-02-14`),
      description: "Romantic gifts and special discounts",
      location: "Middle East, Worldwide",
      type: "discount",
      emoji: "💝",
      isUserCreated: false
    });
    
    events.push({
      id: `mothers-day-mena-${year}`,
      name: "Mother's Day (Arab)",
      date: new Date(`${year}-03-21`),
      description: "Arab Mother's Day - gifts and special offers",
      location: "Middle East",
      type: "holiday",
      emoji: "💐",
      isUserCreated: false
    });
    
    // ==========================================
    // GLOBAL EVENTS AFFECTING MENA
    // ==========================================
    
    events.push({
      id: `black-friday-${year}`,
      name: "Black Friday",
      date: new Date(`${year}-11-28`),
      description: "Global mega sales event (coincides with White Friday)",
      location: "Worldwide",
      type: "sale",
      emoji: "🛍️",
      isUserCreated: false
    });
    
    events.push({
      id: `christmas-sales-${year}`,
      name: "Christmas Sales",
      date: new Date(`${year}-12-25`),
      description: "Holiday shopping deals",
      location: "Middle East, Worldwide",
      type: "holiday",
      emoji: "🎄",
      isUserCreated: false
    });
    
    events.push({
      id: `boxing-day-${year}`,
      name: "Boxing Day Sales",
      date: new Date(`${year}-12-26`),
      description: "Post-Christmas clearance sales",
      location: "Middle East, Worldwide",
      type: "sale",
      emoji: "🎁",
      isUserCreated: false
    });
    
    events.push({
      id: `earth-hour-${year}`,
      name: "Earth Hour",
      date: new Date(`${year}-03-29`),
      description: "Environmental awareness - eco-product promotions",
      location: "Worldwide",
      type: "discount",
      emoji: "🌍",
      isUserCreated: false
    });
    
    events.push({
      id: `international-womens-day-${year}`,
      name: "International Women's Day",
      date: new Date(`${year}-03-08`),
      description: "Celebrating women with special offers",
      location: "Worldwide",
      type: "discount",
      emoji: "👩",
      isUserCreated: false
    });
  }
  
  return events;
};

// Generate events for 2025-2029 (5 years)
const defaultEvents: Event[] = [
  ...generateYearlyEvents(2025, 5),
];
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