"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navGroups = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { href: "/queue", label: "Escalation Queue", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      { href: "/conversations", label: "All Conversations", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", roles: ["admin", "supervisor"] },
    ],
  },
  {
    items: [
      { href: "/users", label: "Users & Agents", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", roles: ["admin"] },
      { href: "/kb", label: "Knowledge Base", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25", roles: ["admin"] },
      { href: "/activity", label: "Activity Log", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", roles: ["admin", "supervisor"] },
      { href: "/metrics", label: "Metrics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", roles: ["admin", "supervisor"] },
    ],
  },
  {
    items: [
      { href: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", roles: ["admin"] },
    ],
  },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-qaa-navy-950 text-white flex flex-col min-h-screen fixed">
      {/* Logo */}
      <div className="p-5 border-b border-qaa-navy-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-qaa-navy-800 rounded-lg flex items-center justify-center">
            <span className="text-qaa-gold-500 font-bold text-lg">Q</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">QAA</p>
            <p className="text-[11px] text-gray-400 leading-tight">Admin Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-3 mx-5 border-t border-qaa-navy-800" />}
            {group.items.map((link) => {
              if (link.roles && user && !link.roles.includes(user.role)) return null;
              const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    active
                      ? "bg-qaa-navy-800 text-white border-l-3 border-qaa-gold-500"
                      : "text-gray-400 hover:bg-qaa-navy-900 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-qaa-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-qaa-navy-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-qaa-gold-400">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-xs text-gray-500 hover:text-red-400 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
