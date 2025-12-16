import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  eventDates?: Date[];
  eventColors?: Record<string, string>;
};

function Calendar({ 
  className, 
  classNames, 
  showOutsideDays = true, 
  eventDates = [],
  eventColors = {},
  ...props 
}: CalendarProps) {
  // Create a map of dates with events for quick lookup
  const eventDateStrings = React.useMemo(() => {
    return new Set(eventDates.map(date => date.toDateString()));
  }, [eventDates]);

  // Custom day component to show event dots
  const DayWithEvents = React.useCallback(({ date, ...dayProps }: DayProps) => {
    const hasEvent = eventDateStrings.has(date.toDateString());
    const dateKey = date.toDateString();
    const dotColor = eventColors[dateKey] || "bg-primary";
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{date.getDate()}</span>
        {hasEvent && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
          </div>
        )}
      </div>
    );
  }, [eventDateStrings, eventColors]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 w-full pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col w-full",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-2 pb-4 relative items-center border-b border-border/50 mb-4",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-2 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-card/50 p-0 hover:bg-accent hover:text-accent-foreground transition-colors border-border/50",
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "text-muted-foreground flex-1 font-medium text-xs uppercase tracking-wider py-2 text-center",
        row: "flex w-full",
        cell: cn(
          "flex-1 aspect-square text-center text-sm p-1 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected])]:bg-accent/30",
          "first:[&:has([aria-selected])]:rounded-l-lg",
          "last:[&:has([aria-selected])]:rounded-r-lg",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "h-full w-full flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "hover:bg-accent/50 hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          "hover:bg-primary/90 hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-bold",
          "ring-2 ring-primary/50 ring-inset"
        ),
        day_outside: "day-outside text-muted-foreground/40 hover:text-muted-foreground/60",
        day_disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Day: DayWithEvents,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
