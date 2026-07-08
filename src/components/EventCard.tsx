import { Calendar, MapPin, Users, Edit3, ShieldAlert } from "lucide-react";
import { Event, User } from "../types";

interface EventCardProps {
  key?: string;
  event: Event;
  currentUser: User | null;
  onSelect: (event: Event) => void;
  onEdit?: (event: Event) => void;
}

export default function EventCard({ event, currentUser, onSelect, onEdit }: EventCardProps) {
  const isCreator = currentUser && (event.creatorId === currentUser.id || currentUser.role === "admin");
  const seatsLeft = Math.max(0, event.capacity - event.registeredCount);
  const percentFilled = Math.min(100, (event.registeredCount / event.capacity) * 100);

  // Category specific styles
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "technology":
        return "bg-cyan-50 text-cyan-700 border-cyan-100";
      case "artificial intelligence":
      case "ai":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "music":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "business":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-slate-200/80 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Event Header Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border ${getCategoryColor(event.category)} shadow-sm`}>
            {event.category}
          </span>
          {isCreator && (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-600 text-white shadow-sm flex items-center gap-1">
              Host
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onSelect(event)}
            className="font-display font-bold text-lg text-slate-900 group-hover:text-indigo-600 cursor-pointer transition line-clamp-1 mb-2.5 leading-snug"
          >
            {event.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>

          {/* Details block */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{formattedDate} at {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Capacity / Registrations tracker */}
        <div className="pt-4 border-t border-slate-100 mt-auto">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {event.registeredCount} / {event.capacity} Registered
            </span>
            {seatsLeft === 0 ? (
              <span className="text-rose-500 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Sold Out
              </span>
            ) : seatsLeft <= 10 ? (
              <span className="text-amber-500 font-semibold">Only {seatsLeft} left!</span>
            ) : (
              <span className="text-emerald-600 font-semibold">{seatsLeft} Seats Left</span>
            )}
          </div>
          
          {/* Custom Styled Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                seatsLeft === 0 
                  ? "bg-rose-500" 
                  : seatsLeft <= 10 
                  ? "bg-amber-500" 
                  : "bg-indigo-600"
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSelect(event)}
              className="flex-1 text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-lg text-sm font-semibold transition"
            >
              View details
            </button>
            {isCreator && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
                className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition"
                title="Edit Event"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
