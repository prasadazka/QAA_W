"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Settings {
  escalation_threshold: number;
  max_queue_size: number;
  auto_resolve_hours: number;
  welcome_message_en: string;
  welcome_message_ar: string;
  default_department: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    const load = async () => {
      try {
        setSettings(await api.get<Settings>("/admin/api/settings"));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/admin/api/settings", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-qaa-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">System Settings</h2>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Escalation Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-qaa-navy-900 mb-4">Escalation Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Confidence Threshold</label>
              <input
                type="number" step="0.05" min="0" max="1"
                value={settings.escalation_threshold}
                onChange={(e) => setSettings({ ...settings, escalation_threshold: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
              />
              <p className="text-xs text-gray-400 mt-1">Below this, bot will suggest escalation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Queue Size</label>
              <input
                type="number" min="1" max="200"
                value={settings.max_queue_size}
                onChange={(e) => setSettings({ ...settings, max_queue_size: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Resolve After (hours)</label>
              <input
                type="number" min="1" max="168"
                value={settings.auto_resolve_hours}
                onChange={(e) => setSettings({ ...settings, auto_resolve_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Department</label>
              <select
                value={settings.default_department}
                onChange={(e) => setSettings({ ...settings, default_department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="registration">Registration</option>
                <option value="student_affairs">Student Affairs</option>
                <option value="finance">Finance</option>
                <option value="it_support">IT Support</option>
                <option value="training">Training</option>
                <option value="administration">Administration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Welcome Messages */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-qaa-navy-900 mb-4">Welcome Messages</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
              <textarea
                rows={3} value={settings.welcome_message_en}
                onChange={(e) => setSettings({ ...settings, welcome_message_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
                placeholder="Welcome to QAA! How can we help you today?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arabic</label>
              <textarea
                rows={3} dir="rtl" value={settings.welcome_message_ar}
                onChange={(e) => setSettings({ ...settings, welcome_message_ar: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
                placeholder="!مرحبًا بك في أكاديمية قطر للطيران"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={saving}
            className="px-6 py-2.5 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">Settings saved successfully</span>
          )}
        </div>
      </form>
    </ProtectedLayout>
  );
}
