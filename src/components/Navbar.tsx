import { useState, useEffect } from "react";
import { Calendar, Bell, Mail, LogOut, User, ShieldCheck, Plus, Menu, X, Inbox } from "lucide-react";
import { User as UserType } from "../types";

interface NavbarProps {
  user: UserType | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, activeTab, setActiveTab, onLogout }: NavbarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmails, setShowEmails] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmails();
      // Poll notifications every 8 seconds to give a "live system" feel!
      const interval = setInterval(fetchEmails, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        setEmails(res.data);
        // Simulate counting unread: for simplicity let's assume they are "new" if they arrived in the last 15 seconds, or just save an read/unread state locally
        const readEmails = JSON.parse(localStorage.getItem(`read_emails_${user?.id}`) || "[]");
        const unread = res.data.filter((e: any) => !readEmails.includes(e.id)).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching simulated inbox:", err);
    }
  };

  const handleToggleEmails = () => {
    setShowEmails(!showEmails);
    if (!showEmails && emails.length > 0) {
      // Mark all as read
      const allIds = emails.map((e: any) => e.id);
      localStorage.setItem(`read_emails_${user?.id}`, JSON.stringify(allIds));
      setUnreadCount(0);
    }
  };

  const navItems = [
    { id: "events", label: "Browse Events", icon: Calendar, show: true },
    { id: "create", label: "Host Event", icon: Plus, show: user?.role === "admin" || user?.role === "organizer" },
    { id: "profile", label: "My Tickets", icon: User, show: !!user },
    { id: "admin", label: "Admin Panel", icon: ShieldCheck, show: user?.role === "admin" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab("events")}>
            <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                Event<span className="text-indigo-600">ly</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (!item.show) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Inbox notifications */}
                <div className="relative">
                  <button
                    onClick={handleToggleEmails}
                    className={`relative p-2 rounded-full hover:bg-slate-100 transition-colors duration-150 ${
                      showEmails ? "bg-slate-100 text-indigo-600" : "text-slate-600"
                    }`}
                    title="Simulated Ticket Email Inbox"
                  >
                    <Mail className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-rose-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Simulated Emails Panel Dropdown */}
                  {showEmails && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 py-2 max-h-[480px] overflow-y-auto z-50">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2 font-display font-semibold text-slate-900 text-sm">
                          <Inbox className="w-4 h-4 text-indigo-600" />
                          Simulated Email Confirmations
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          to: {user.email}
                        </span>
                      </div>
                      
                      {emails.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400">
                          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No ticket confirmation emails yet.</p>
                          <p className="text-xs mt-1">Register for an event to receive your digital ticket email!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {emails.map((email) => (
                            <div key={email.id} className="p-4 hover:bg-slate-50 transition duration-150">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-slate-800 text-xs sm:text-sm">
                                  {email.subject}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                  {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div 
                                className="text-xs text-slate-600 prose prose-slate max-w-none mt-1 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: email.body }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Chip */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800 line-clamp-1">{user.name}</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition duration-200"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab("auth")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-2 pt-2 pb-4 space-y-1 shadow-inner">
          {navItems.map((item) => {
            if (!item.show) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
