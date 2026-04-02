"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  { label: "Admin", name: "Admin", email: "admin@qaa.edu.qa", password: "Admin@2026", role: "admin" },
  { label: "Supervisor", name: "Fatma Al-Thani", email: "fatma@qaa.edu.qa", password: "Fatma@2026", role: "supervisor" },
  { label: "Agent", name: "Khalid Al-Mansouri", email: "khalid@qaa.edu.qa", password: "Khalid@2026", role: "agent" },
  { label: "Agent", name: "Noura Al-Sulaiti", email: "noura@qaa.edu.qa", password: "Noura@2026", role: "agent" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const fillCredentials = (acct: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(acct.email);
    setPassword(acct.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-qaa-navy-950 via-qaa-navy-900 to-qaa-navy-800">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-qaa-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-qaa-navy-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-qaa-navy-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-qaa-navy-700">
              <span className="text-qaa-gold-500 font-bold text-2xl">Q</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-sm text-gray-400 mt-1">Qatar Aeronautical Academy</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 focus:border-transparent bg-gray-50"
                  placeholder="agent@qaa.edu.qa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 focus:border-transparent bg-gray-50"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-qaa-navy-900 text-white font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Login — Demo Accounts</p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.email}
                    type="button"
                    onClick={() => fillCredentials(acct)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition border ${
                      email === acct.email
                        ? "border-qaa-navy-500 bg-qaa-navy-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      acct.role === "admin" ? "bg-qaa-gold-500" : acct.role === "supervisor" ? "bg-qaa-navy-500" : "bg-qaa-navy-300"
                    }`}>
                      {acct.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-qaa-navy-900 truncate">{acct.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{acct.email} / {acct.password}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      acct.role === "admin"
                        ? "bg-qaa-gold-100 text-qaa-gold-500"
                        : acct.role === "supervisor"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {acct.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
