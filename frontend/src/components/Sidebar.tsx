"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/queue", label: "Escalation Queue" },
    { href: "/metrics", label: "Metrics", roles: ["admin", "supervisor"] },
  ];

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col min-h-screen fixed">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">QAA Admin</h1>
        <p className="text-xs text-gray-400">Agent Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          if (link.roles && user && !link.roles.includes(user.role)) return null;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded text-sm transition ${
                active ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm truncate">{user?.name}</p>
        <p className="text-xs text-gray-400">{user?.role}</p>
        <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 mt-2">
          Logout
        </button>
      </div>
    </aside>
  );
}
