import { useState, useEffect } from "react";
import { Users, Calendar, Award, FileText, Download, TrendingUp, BarChart2, ShieldAlert } from "lucide-react";
import { AdminStats, Attendee, Event } from "../types";

interface AdminDashboardProps {
  events: Event[];
}

export default function AdminDashboard({ events }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAttendees();
  }, [selectedEventId]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Error fetching admin metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const url = selectedEventId 
        ? `/api/admin/attendees?eventId=${selectedEventId}` 
        : "/api/admin/attendees";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const res = await response.json();
      if (res.success) {
        setAttendees(res.data);
      }
    } catch (err) {
      console.error("Error fetching attendee lists:", err);
    }
  };

  const handleExportCSV = () => {
    const url = selectedEventId 
      ? `/api/admin/attendees/export?eventId=${selectedEventId}` 
      : "/api/admin/attendees/export";
    
    // Create link and trigger direct browser file download
    const link = document.createElement("a");
    link.href = url;
    // Set headers for auth proxy
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.setAttribute("download", `event_attendees_${selectedEventId || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    })
    .catch(err => console.error("Error downloading attendee list:", err));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const overallFillRate = stats && stats.totalEvents > 0 
    ? Math.round((stats.totalRegistrations / (events.reduce((acc, curr) => acc + curr.capacity, 0))) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Executive Admin Portal
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time analytics, booking metrics, capacity fill rates, and dynamic list compilation.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Download className="w-4 h-4" /> Export Attendee List
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Users */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{stats?.totalUsers || 0}</h3>
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-cyan-50 rounded-xl text-cyan-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Events</span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{stats?.totalEvents || 0}</h3>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registrations</span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{stats?.totalRegistrations || 0}</h3>
          </div>
        </div>

        {/* Overall Seat Fill Rate */}
        <div className="bg-white border border-slate-200/85 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Fill Rate</span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{overallFillRate}%</h3>
          </div>
        </div>

      </div>

      {/* Analytics Visualization / SVG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bookings by Category */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Bookings distribution by Category
          </h3>
          
          {stats && stats.categoryStats.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryStats.map((item) => {
                const maxVal = Math.max(...stats.categoryStats.map(s => s.count)) || 1;
                const pct = (item.count / maxVal) * 100;
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-bold font-mono">{item.count} tickets</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No categories data available yet. Keep registering to see metrics.
            </div>
          )}
        </div>

        {/* Registrations Daily Timeline trend */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Daily Bookings Growth Trend
          </h3>
          
          {stats && stats.registrationsOverTime.length > 0 ? (
            <div className="h-44 flex items-end justify-between gap-2.5 pt-4">
              {stats.registrationsOverTime.map((item, index) => {
                const maxVal = Math.max(...stats.registrationsOverTime.map(s => s.count)) || 1;
                const barHeight = (item.count / maxVal) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded font-mono font-bold transition duration-150 z-20 whitespace-nowrap">
                        {item.count} tickets
                      </span>
                      <div 
                        className="w-full sm:w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(5, barHeight)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {item.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No daily timeline trend compiled yet.
            </div>
          )}
        </div>

      </div>

      {/* Attendee Registry Listing */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">System Attendees Registry</h3>
            <p className="text-slate-500 text-xs mt-0.5">Filter registries by event name to inspect and audit gate tickets.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Filter Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Hosted Events</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>

        {attendees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-sm">No attendee records found for this query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Ticket ID</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Registered Event</th>
                  <th className="py-3 px-6">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 text-xs">
                      {attendee.ticketNumber}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {attendee.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {attendee.email}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-600 max-w-xs truncate">
                      {attendee.eventTitle}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                      {new Date(attendee.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
