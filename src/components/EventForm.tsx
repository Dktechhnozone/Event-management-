import React, { useState, useEffect } from "react";
import { Plus, Save, Trash, AlertCircle, Sparkles, Image, MapPin, Calendar, Clock, ChevronRight } from "lucide-react";
import { Event } from "../types";

interface EventFormProps {
  eventToEdit: Event | null;
  onSave: (eventData: any) => void;
  onCancel: () => void;
}

const CATEGORIES = ["Technology", "Artificial Intelligence", "Music", "Business", "Other"];

export default function EventForm({ eventToEdit, onSave, onCancel }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setCategory(eventToEdit.category);
      setDate(eventToEdit.date);
      setTime(eventToEdit.time);
      setLocation(eventToEdit.location);
      setCapacity(eventToEdit.capacity);
      setImageUrl(eventToEdit.imageUrl || "");
    } else {
      // Set default tomorrow date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime("10:00 AM");
    }
  }, [eventToEdit]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Event Name is required.";
    if (title.length > 100) newErrors.title = "Event Name must be under 100 characters.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!time.trim()) newErrors.time = "Time is required.";
    if (!location.trim()) newErrors.location = "Venue location is required.";
    if (!capacity || capacity <= 0) newErrors.capacity = "Capacity must be greater than 0.";
    if (capacity > 10000) newErrors.capacity = "Maximum event capacity is 10,000 guests.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        title,
        description,
        category,
        date,
        time,
        location,
        capacity,
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80"
      });
    }
  };

  const getPreviewImage = () => {
    return imageUrl.trim() || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80";
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          {eventToEdit ? "Edit Hosted Event" : "Create & Host Event"}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Provide accurate details about your event, manage ticket availability, and publish.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Event Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Reactive Web & Mobile Architecture Meetup"
                className={`w-full h-11 px-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
                  errors.title ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                }`}
              />
              {errors.title && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the event schedule, target audience, specific guidelines or prerequisites..."
                rows={5}
                className={`w-full p-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none ${
                  errors.description ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                }`}
              />
              {errors.description && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
                </p>
              )}
            </div>

            {/* Category & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Max Capacity (Seats) *
                </label>
                <input
                  type="number"
                  value={capacity || ""}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  placeholder="e.g., 100"
                  className={`w-full h-11 px-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
                    errors.capacity ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                  }`}
                />
                {errors.capacity && (
                  <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.capacity}
                  </p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full h-11 px-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition bg-white ${
                    errors.date ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                  }`}
                />
                {errors.date && (
                  <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Event Time *
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g., 10:00 AM"
                  className={`w-full h-11 px-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
                    errors.time ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                  }`}
                />
                {errors.time && (
                  <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Venue / Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Venue Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Conference Hall B, Lincoln Center, New York"
                className={`w-full h-11 px-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
                  errors.location ? "border-rose-400 bg-rose-50/10" : "border-slate-200"
                }`}
              />
              {errors.location && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.location}
                </p>
              )}
            </div>

            {/* Banner Image URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="e.g., https://images.unsplash.com/photo-..."
                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <span className="text-slate-400 text-[11px] mt-1.5 block">
                Leave empty for a beautiful high-quality default event placeholder banner.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                {eventToEdit ? "Save Changes" : "Publish Event"}
              </button>
            </div>

          </form>
        </div>

        {/* Real-time Card Preview Column */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-600 pl-1">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Real-time Ticket & Card Preview</span>
            </div>
            
            {/* Mock Card Preview */}
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
              <div className="relative h-44 bg-slate-100">
                <img
                  src={getPreviewImage()}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Set default on error
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80";
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md shadow-sm border border-indigo-500">
                    {category}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-slate-900 line-clamp-1 mb-2">
                  {title.trim() || "Evently Workshop / Meetup Name"}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                  {description.trim() || "Your detailed description will show up here, giving your attendees key highlights of the scheduled events, agenda, and guidelines..."}
                </p>

                <div className="space-y-2 mb-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Event Date"} at {time || "Event Time"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{location || "Venue or Online URL Location"}</span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 flex justify-between items-center">
                  <div className="text-xs text-slate-600 font-medium">
                    Ticket Capacity Limit
                  </div>
                  <div className="text-sm font-bold text-indigo-700">
                    {capacity || 0} Total Seats
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
