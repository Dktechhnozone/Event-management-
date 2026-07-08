import React, { useState } from "react";
import { Mail, Lock, User, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

const INTERESTS_LIST = ["Technology", "Artificial Intelligence", "Music", "Business", "Design", "Marketing"];

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'attendee' | 'organizer'>("attendee");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const bodyPayload = isLogin 
      ? { email, password } 
      : { name, email, password, role, interests };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const res = await response.json();
      if (!res.success) {
        throw new Error(res.error || "Authentication failed. Please check inputs.");
      }

      onAuthSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col">
        {/* Title & Toggle */}
        <div className="text-center mb-8">
          <div className="inline-flex p-1.5 bg-indigo-50 rounded-full text-indigo-600 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            {isLogin ? "Welcome Back to Evently" : "Create Your Evently Account"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin 
              ? "Sign in to access your dashboard, book events, and download tickets." 
              : "Register to host events, book tickets, and receive confirmation emails."
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Name (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Role Choice (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                What would you like to do?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("attendee")}
                  className={`py-2.5 px-4 rounded-lg text-xs font-semibold border transition text-center ${
                    role === "attendee"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Attend Events
                </button>
                <button
                  type="button"
                  onClick={() => setRole("organizer")}
                  className={`py-2.5 px-4 rounded-lg text-xs font-semibold border transition text-center ${
                    role === "organizer"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Organize Events
                </button>
              </div>
            </div>
          )}

          {/* Interests selection (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Choose Interests (For AI suggestions)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS_LIST.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition flex items-center gap-1 ${
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
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Register"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isLogin ? "Register Now" : "Sign In Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
