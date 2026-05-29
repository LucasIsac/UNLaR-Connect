"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { TutoringCalendarEvent } from "@/actions/tutoring-scheduled";

interface TutoringCalendarProps {
  events: TutoringCalendarEvent[];
  onEventClick?: (event: TutoringCalendarEvent) => void;
}

const DAY_NAMES_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function TutoringCalendar({ events, onEventClick }: TutoringCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate days in month and starting day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ day, date });
    }
    
    return days;
  }, [currentMonth, currentYear, daysInMonth, startingDay]);

  // Get events for a specific date
  const getEventsForDate = (date: Date | null): TutoringCalendarEvent[] => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-accent/20 text-accent border-accent/30";
      case "canceled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "completed":
        return "bg-secondary/20 text-secondary border-secondary/30";
      default:
        return "bg-muted text-muted-foreground border-border/30";
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Check if date is selected
  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  // Get events for selected date
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="bg-glass rounded-xl p-6 border border-border/40 space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">
          Calendario de Tutorías
        </h3>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h4 className="font-semibold text-foreground">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h4>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAY_NAMES_SHORT.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((item, index) => {
          const dayEvents = getEventsForDate(item.date);
          const hasEvents = dayEvents.length > 0;
          const isTodayDate = isToday(item.date);
          const isSelectedDate = isSelected(item.date);

          return (
            <div
              key={index}
              onClick={() => item.date && setSelectedDate(item.date)}
              className={`relative min-h-[60px] p-1 rounded-lg border transition-all ${
                !item.day
                  ? "border-transparent"
                  : isSelectedDate
                  ? "border-accent bg-accent/10"
                  : isTodayDate
                  ? "border-accent/50 bg-accent/5"
                  : "border-border/20 hover:border-border/40 hover:bg-muted/20"
              } ${item.day ? "cursor-pointer" : ""}`}
            >
              {item.day && (
                <>
                  <span className={`text-xs font-semibold ${
                    isTodayDate ? "text-accent" : "text-foreground"
                  }`}>
                    {item.day}
                  </span>
                  
                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          className={`px-1 py-0.5 rounded text-[8px] font-bold truncate border ${
                            getStatusColor(event.status)
                          }`}
                          title={event.title}
                        >
                          {event.subject_name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-muted-foreground block text-center">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t border-border/20 pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {selectedDate.toLocaleDateString("es-AR", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}
          </h4>
          
          {selectedDateEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border/20">
              No hay tutorías programadas para este día.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    getStatusColor(event.status)
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{event.subject_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      event.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : "bg-accent/20 text-accent"
                    }`}>
                      {event.status === "confirmed" ? "Confirmada" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(event.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(event.end).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-1">
                    <span className="text-muted-foreground">
                      {event.is_tutor ? "Alumno:" : "Tutor:"}
                    </span>
                    <span className="font-medium">{event.peer_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-semibold">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-muted-foreground">Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Confirmada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Cancelada</span>
        </div>
      </div>
    </div>
  );
}
