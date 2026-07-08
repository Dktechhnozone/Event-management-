import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, SlidersHorizontal, Sparkles, AlertCircle, MapPin, 
  Clock, Calendar, Users, ChevronRight, CheckCircle2, Ticket,
  X, HelpCircle, Inbox, Send, RefreshCw, ArrowLeft, Trash2, Edit2
} from "lucide-react";
import Navbar from "./components/Navbar";
import EventCard from "./components/EventCard";
import EventForm from "./components/EventForm";
import AuthPage from "./components/AuthPage";
import ProfilePage from "./components/ProfilePage";
import AdminDashboard from "./components/AdminDashboard";
import { Event, User, Registration } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  
  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedScope, setSelectedScope] = useState("upcoming"); // upcoming, past, all
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Global Alerts / Notifications
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: "", type: null });

  useEffect(() => {
    // Check existing login session token
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser(token);
    }
    fetchEvents();
  }, [searchQuery, selectedCategory, selectedScope]);

  useEffect(() => {
    if (user) {
      fetchAIRecommendations();
    } else {
      setAiRecommendations([]);
    }
  }, [user]);

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (res.success) {
        setUser(res.data);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      console.error("Auth Session Restore Failure:", err);
      localStorage.removeItem("token");
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      let url = `/api/events?scope=${selectedScope}`;
      if (selectedCategory && selectedCategory !== "All") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      const res = await response.json();
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchAIRecommendations = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch("/api/events/recommendations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        setAiRecommendations(res.data);
      }
    } catch (err) {
      console.error("Error loading AI recommendations:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAuthSuccess = (token: string, userProfile: User) => {
    localStorage.setItem("token", token);
    setUser(userProfile);
    showAlert("Logged in successfully!", "success");
    setActiveTab("events");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAiRecommendations([]);
    setActiveTab("events");
    showAlert("Successfully signed out.", "success");
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert({ message: "", type: null });
    }, 4500);
  };

  // Event Registration actions
  const handleRegisterEvent = async (event: Event) => {
    if (!user) {
      setActiveTab("auth");
      showAlert("Please register or log in to book a seat.", "error");
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        showAlert(`Seat Confirmed! Ticket confirmation email has been sent.`, "success");
        // Reload statistics and states
        fetchEvents();
        fetchAIRecommendations();
        if (selectedEvent && selectedEvent.id === event.id) {
          setSelectedEvent({
            ...selectedEvent,
            registeredCount: selectedEvent.registeredCount + 1
          });
        }
      } else {
        showAlert(res.error || "Unable to register.", "error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showAlert("Connection failure. Unable to confirm registration.", "error");
    }
  };

  const handleUnregisterEvent = async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/events/${eventId}/unregister`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        showAlert("Registration cancelled. Your ticket was released.", "success");
        fetchEvents();
        fetchAIRecommendations();
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent({
            ...selectedEvent,
            registeredCount: Math.max(0, selectedEvent.registeredCount - 1)
          });
        }
        return true;
      } else {
        showAlert(res.error || "Unable to cancel registration.", "error");
        return false;
      }
    } catch (err) {
      console.error("Cancel registration error:", err);
      showAlert("Connection failure.", "error");
      return false;
    }
  };

  // Event creation & edits
  const handleSaveEvent = async (eventData: any) => {
    const isEdit = !!eventToEdit;
    const url = isEdit ? `/api/events/${eventToEdit.id}` : "/api/events";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(eventData)
      });
      const res = await response.json();
      if (res.success) {
        showAlert(isEdit ? "Event updated successfully!" : "Event published successfully!", "success");
        fetchEvents();
        setEventToEdit(null);
        setActiveTab("events");
      } else {
        showAlert(res.error || "Unable to save event.", "error");
      }
    } catch (err) {
      console.error("Save event error:", err);
      showAlert("Error saving event.", "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete this event? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        showAlert("Event deleted successfully.", "success");
        fetchEvents();
        setSelectedEvent(null);
      } else {
        showAlert(res.error || "Unable to delete event.", "error");
      }
    } catch (err) {
      console.error("Delete event error:", err);
      showAlert("Error deleting event.", "error");
    }
  };

  const categories = ["All", "Technology", "Artificial Intelligence", "Music", "Business", "Other"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      
      {/* Alert Notification Popup banner */}
      <AnimatePresence>
        {alert.message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 sm:right-10 z-50 max-w-sm w-full shadow-xl pointer-events-auto"
          >
            <div className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md ${
              alert.type === "success" 
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-800" 
                : "bg-rose-50/95 border-rose-200 text-rose-800"
            }`}>
              {alert.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-xs sm:text-sm">
                  {alert.type === "success" ? "Notification" : "Action Required"}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">{alert.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navbar */}
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedEvent(null);
          setEventToEdit(null);
        }} 
        onLogout={handleLogout} 
      />

      {/* Content wrapper */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* Browse events panel */}
          {activeTab === "events" && !selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
            >
              {/* Hero branding */}
              <div className="text-center sm:text-left py-6">
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                  Discover Spectacular <span className="text-indigo-600">Local & Tech</span> Events
                </h1>
                <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl">
                  Register for exclusive workshops, conferences, symphonies, and executive classes. Access unique digital tickets.
                </p>
              </div>

              {/* AI Recommendations section (Premium design with Sparkles) */}
              {user && (
                <div className="bg-gradient-to-r from-indigo-50/60 via-violet-50/60 to-slate-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2 className="font-display font-bold text-slate-900 text-base">
                        AI Personalized Recommendations
                      </h2>
                    </div>
                    <button 
                      onClick={fetchAIRecommendations}
                      disabled={loadingAi}
                      className="p-1 text-indigo-600 hover:bg-white rounded transition self-center"
                      title="Refresh Recommendations"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loadingAi ? (
                    <div className="flex justify-center items-center py-6">
                      <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  ) : aiRecommendations.length === 0 ? (
                    <p className="text-slate-500 text-xs italic pl-1">
                      Setup your interests in the "My Tickets" profile to load highly customized AI event rankings!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiRecommendations.map(({ event, reason }) => (
                        <div 
                          key={event.id}
                          className="bg-white border border-indigo-100 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-300 transition duration-150 group cursor-pointer shadow-sm/40"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 font-mono">
                              {event.category}
                            </span>
                            <h4 className="font-display font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 mt-1">
                              {event.title}
                            </h4>
                            <p className="text-slate-500 text-[11px] line-clamp-2 mt-1.5 leading-relaxed bg-slate-50 p-2 border border-slate-100/50 rounded-lg">
                              {reason}
                            </p>
                          </div>
                          <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-3">
                            View Pass details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Filters / Search Bar layout */}
              <div className="flex flex-col gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
                
                {/* Search Text input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hosted conference, music festival, workshop title, city or venue location..."
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Date Scope select tab */}
                  <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedScope("upcoming")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                        selectedScope === "upcoming" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setSelectedScope("past")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                        selectedScope === "past" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Past Events
                    </button>
                  </div>
                </div>

                {/* Category selector capsules */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono mr-2 shrink-0">
                    Categories:
                  </span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                        selectedCategory === cat
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

              </div>

              {/* Events Grid layout */}
              {loadingEvents ? (
                <div className="flex justify-center items-center py-20">
                  <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                  <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-display font-bold text-slate-800">No events matched</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                    Adjust your keyword searches or category parameters to query other events hosted.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUser={user}
                      onSelect={(ev) => setSelectedEvent(ev)}
                      onEdit={(ev) => {
                        setEventToEdit(ev);
                        setActiveTab("create");
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Event Details Expanded View */}
          {activeTab === "events" && selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto py-8 px-4"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold mb-6 group transition"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to catalog
              </button>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Event Image Banner */}
                <div className="relative h-64 sm:h-80 bg-slate-100">
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-md font-semibold text-xs tracking-wide shadow-sm border border-indigo-500">
                      {selectedEvent.category}
                    </span>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
                        {selectedEvent.title}
                      </h1>
                      <p className="text-slate-400 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                        Hosted by <span className="text-slate-600 font-bold">{selectedEvent.creatorName}</span>
                      </p>
                    </div>

                    {/* Manage event triggers (creator only) */}
                    {user && (selectedEvent.creatorId === user.id || user.role === "admin") && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEventToEdit(selectedEvent);
                            setActiveTab("create");
                          }}
                          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Event
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(selectedEvent.id)}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Event
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-100 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          {new Date(selectedEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">{selectedEvent.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1" title={selectedEvent.location}>
                          {selectedEvent.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description body */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-slate-900 text-base">About the Event</h3>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* Interactive Mock Map of Venue (Elite UI requirement) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" /> Interactive Venue Map Location
                    </h3>
                    
                    {/* Mock Map Vector Visual */}
                    <div className="relative h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4f46ed_1px,transparent_1px)] [background-size:16px_16px]" />
                      
                      {/* Grid representation of a mock city map */}
                      <svg className="absolute inset-0 w-full h-full text-indigo-200" xmlns="http://www.w3.org/2000/svg">
                        <line x1="10%" y1="0" x2="10%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="currentColor" strokeWidth="1" />
                        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="currentColor" strokeWidth="1" />
                        <line x1="90%" y1="0" x2="90%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        
                        <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeWidth="1" />
                        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="80%" x2="100%" y2="80%" stroke="currentColor" strokeWidth="1" />
                      </svg>

                      {/* Mock Route path */}
                      <svg className="absolute inset-0 w-full h-full text-indigo-500" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 120 40 L 250 40 L 250 110 L 450 110 L 520 110" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" className="animate-pulse" />
                      </svg>

                      {/* Map Pins */}
                      <div className="absolute left-[250px] top-[40px] flex flex-col items-center">
                        <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full ring-4 ring-indigo-100 animate-ping" />
                      </div>

                      {/* Center pin indicating venue location */}
                      <div className="relative flex flex-col items-center z-10">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-full shadow-lg border-2 border-white animate-bounce">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="mt-2 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-md border border-slate-700/50">
                          {selectedEvent.location.split(',')[0]}
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded px-2 py-1 text-[10px] font-mono text-slate-400 font-bold shadow-sm">
                        GPS CONNECTED
                      </div>
                    </div>
                  </div>

                  {/* Seat Limit Tracking CTA */}
                  <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-medium">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Registered Attendees count:</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEvent.registeredCount} out of {selectedEvent.capacity} seats taken
                      </p>
                    </div>

                    <button
                      onClick={() => handleRegisterEvent(selectedEvent)}
                      disabled={selectedEvent.registeredCount >= selectedEvent.capacity}
                      className={`h-12 px-6 rounded-lg font-semibold text-sm transition shadow-sm ${
                        selectedEvent.registeredCount >= selectedEvent.capacity
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {selectedEvent.registeredCount >= selectedEvent.capacity ? "Sold Out" : "Confirm Seat Reservation"}
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* Create / Edit event screen */}
          {activeTab === "create" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EventForm
                eventToEdit={eventToEdit}
                onSave={handleSaveEvent}
                onCancel={() => {
                  setEventToEdit(null);
                  setActiveTab("events");
                }}
              />
            </motion.div>
          )}

          {/* Authentication portal screen */}
          {activeTab === "auth" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          )}

          {/* Profile & Tickets Screen */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProfilePage 
                user={user} 
                onProfileUpdate={(updatedUser) => setUser(updatedUser)} 
                onUnregister={handleUnregisterEvent} 
              />
            </motion.div>
          )}

          {/* Admin Dashboard Screen */}
          {activeTab === "admin" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard events={events} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Modern Compact Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <span>&copy; {new Date().getFullYear()} Evently Full-Stack platform. All rights reserved.</span>
          <div className="flex gap-4 justify-center">
            <span className="hover:text-slate-600 cursor-pointer">Support</span>
            <span className="hover:text-slate-600 cursor-pointer">Security Terms</span>
            <span className="hover:text-slate-600 cursor-pointer font-bold text-indigo-600 font-mono">PRO</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
