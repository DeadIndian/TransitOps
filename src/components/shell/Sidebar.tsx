"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/core/security/rbac";

// Fixed left rail on desktop; off-canvas drawer on mobile (plan §7). Client
// component for the drawer toggle — nav items are RBAC-filtered server-side in
// AppShell and passed in (navFor pulls in server-only auth, can't run here).
export function Sidebar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger — sits over the empty left of the topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-20 h-8 w-8 flex items-center justify-center bg-ink text-paper border-2 border-ink rounded-[4px]"
      >
        ☰
      </button>

      {/* Drawer backdrop (mobile only) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-ink/50"
          aria-hidden
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-[220px] shrink-0 bg-ink border-r-[3px] border-ink text-paper flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b-[3px] border-paper/20">
          <span className="inline-block h-6 w-6 bg-brand border-2 border-paper rounded-[3px]" />
          <span className="font-comic font-bold text-lg">TransitOps</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden ml-auto text-paper text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col p-2 gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] font-comic hover:bg-panel-3 transition-transform hover:translate-x-0.5"
            >
              <span aria-hidden className="text-brand">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
