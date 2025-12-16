import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({ value = "12:00", onChange, className, placeholder = "Select time" }: TimePickerProps) {
  const [hours, setHours] = React.useState(() => {
    const [h] = value.split(":");
    return parseInt(h) || 12;
  });
  const [minutes, setMinutes] = React.useState(() => {
    const [, m] = value.split(":");
    return parseInt(m) || 0;
  });
  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    return hours >= 12 ? "PM" : "AM";
  });
  const [open, setOpen] = React.useState(false);

  const displayHours = hours % 12 || 12;

  const updateTime = (newHours: number, newMinutes: number, newPeriod: "AM" | "PM") => {
    let h = newHours % 12;
    if (newPeriod === "PM") h += 12;
    if (h === 24) h = 12;
    if (h === 12 && newPeriod === "AM") h = 0;
    
    const timeString = `${h.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
    onChange?.(timeString);
  };

  const incrementHours = () => {
    const newHours = (displayHours % 12) + 1;
    setHours(period === "PM" ? newHours + 12 : newHours);
    updateTime(newHours, minutes, period);
  };

  const decrementHours = () => {
    const newHours = displayHours === 1 ? 12 : displayHours - 1;
    setHours(period === "PM" ? newHours + 12 : newHours);
    updateTime(newHours, minutes, period);
  };

  const incrementMinutes = () => {
    const newMinutes = (minutes + 5) % 60;
    setMinutes(newMinutes);
    updateTime(displayHours, newMinutes, period);
  };

  const decrementMinutes = () => {
    const newMinutes = minutes < 5 ? 55 : minutes - 5;
    setMinutes(newMinutes);
    updateTime(displayHours, newMinutes, period);
  };

  const togglePeriod = () => {
    const newPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    const newHours = newPeriod === "PM" ? displayHours + 12 : displayHours;
    setHours(newHours);
    updateTime(displayHours, minutes, newPeriod);
  };

  const formattedTime = `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formattedTime : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 pointer-events-auto" align="start">
        <div className="flex items-center gap-2">
          {/* Hours */}
          <div className="flex flex-col items-center gap-1">
            <Label className="text-xs text-muted-foreground">Hour</Label>
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={incrementHours}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="w-12 h-12 flex items-center justify-center bg-muted/50 rounded-lg text-xl font-semibold">
                {displayHours.toString().padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={decrementHours}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <span className="text-2xl font-bold mt-6">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-1">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={incrementMinutes}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="w-12 h-12 flex items-center justify-center bg-muted/50 rounded-lg text-xl font-semibold">
                {minutes.toString().padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={decrementMinutes}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col items-center gap-1 ml-2">
            <Label className="text-xs text-muted-foreground">Period</Label>
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={togglePeriod}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="w-12 h-12 flex items-center justify-center bg-primary/20 rounded-lg text-lg font-semibold text-primary">
                {period}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={togglePeriod}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
