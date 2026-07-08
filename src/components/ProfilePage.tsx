import { useState, useEffect } from "react";
import { User, Ticket, QrCode, MapPin, Calendar, Clock, AlertTriangle, Sparkles, Check, Trash2, X } from "lucide-react";
import { User as UserType, Registration } from "../types";

interface ProfilePageProps {
  user: UserType | null;
  onProfileUpdate: (updatedUser: UserType) => void;
  onUnregister: (eventId: string) => Promise<boolean>;
}

const INTERESTS_LIST = ["Technology", "Artificial Intelligence", "Music", "Business", "Design", "Marketing"];

export default function ProfilePage({ user, onProfileUpdate, onUnregister }: ProfilePageProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        setRegistrations(res.data);
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };

  const handleInterestToggle = async (interest: string) => {
    let updatedInterests: string[];
    if (interests.includes(interest)) {
      updatedInterests = interests.filter((i) => i !== interest);
    } else {
      updatedInterests = [...interests, interest];
    }
    setInterests(updatedInterests);
    
    // Auto-save interests immediately!
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ interests: updatedInterests })
      });
      const res = await response.json();
      if (res.success) {
        onProfileUpdate(res.data);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (eventId: string) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel your registration for this event? Your ticket will be released.");
    if (!confirmCancel) return;

    const success = await onUnregister(eventId);
    if (success) {
      setRegistrations(registrations.filter(r => r.eventId !== eventId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl rounded-full mx-auto mb-4">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">{user?.name}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 mt-2 uppercase font-mono tracking-wider">
              {user?.role}
            </span>
            <div className="text-slate-400 text-xs mt-4 border-t border-slate-100 pt-4">
              Registered on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Today"}
            </div>
          </div>

          {/* Interest Profiling Box */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> My Interests
              </h4>
              {isSaving && <span className="text-[10px] text-indigo-600 font-mono animate-pulse">Saving...</span>}
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Select your topic interests to refine your personalized, AI-powered event recommendations catalog.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_LIST.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition duration-150 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tickets Display */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-indigo-600" />
              Registered Digital Tickets
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Your active bookings, seat allocations, unique barcodes, and entrance QR tickets.
            </p>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-40 text-slate-500" />
              <h4 className="font-display font-bold text-slate-800 text-base">No active bookings found</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                Once you register for any upcoming event from the dashboard, your premium digital QR ticket will appear right here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {registrations.map((reg) => (
                <div 
                  key={reg.id} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200 relative group"
                >
                  {/* Digital Ticket Top Tear Block */}
                  <div className="p-5 border-b border-dashed border-slate-200 relative">
                    {/* Left Tear Mark */}
                    <div className="absolute bottom-0 -left-2.5 w-5 h-5 bg-slate-50 rounded-full border-r border-slate-200/80 transform translate-y-1/2 z-10" />
                    {/* Right Tear Mark */}
                    <div className="absolute bottom-0 -right-2.5 w-5 h-5 bg-slate-50 rounded-full border-l border-slate-200/80 transform translate-y-1/2 z-10" />

                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-2 py-0.5 rounded">
                        TICKET CONFIRMED
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-medium">
                        {reg.ticketNumber}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 transition">
                      {reg.eventTitle}
                    </h4>

                    <div className="space-y-2 mt-4 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(reg.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="line-clamp-1">{reg.eventLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Digital Ticket Bottom Barcode block */}
                  <div className="p-4 bg-slate-50 flex items-center justify-between gap-4">
                    <button
                      onClick={() => setSelectedTicket(reg)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-200 px-3.5 py-2 rounded-lg transition"
                    >
                      <QrCode className="w-4 h-4" /> View QR Code
                    </button>
                    
                    <button
                      onClick={() => handleCancelBooking(reg.eventId)}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-3 py-2 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" /> Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* QR Code Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="font-display font-bold text-slate-900 text-sm">Digital QR Pass</h4>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Graphic Body */}
            <div className="p-6 text-center flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Ticket Registration Number
              </span>
              <div className="text-sm font-mono font-bold text-slate-800 mt-1 mb-6">
                {selectedTicket.ticketNumber}
              </div>

              {/* Vector SVG QR Code Container */}
              <div 
                className="w-48 h-48 mb-6 animate-pulse"
                dangerouslySetInnerHTML={{ __html: selectedTicket.qrCodeData }}
              />

              <h3 className="font-display font-extrabold text-slate-900 leading-snug">
                {selectedTicket.eventTitle}
              </h3>
              
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">{selectedTicket.eventLocation}</span>
              </div>
            </div>

            {/* Modal Footer Instruction */}
            <div className="p-4 bg-indigo-50/60 border-t border-slate-100 text-center text-xs text-indigo-700 font-medium">
              Scan this QR code at the event entrance for verification.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
