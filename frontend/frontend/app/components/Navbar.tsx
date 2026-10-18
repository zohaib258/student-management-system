
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NavbarProps = {
  showProfileMenu?: boolean;
  onSignOut?: () => void;
  profileName?: string;
  profileEmail?: string;
  adminMode?: boolean;
};

export default function Navbar({
  showProfileMenu = false,
  onSignOut,
  profileName,
  profileEmail,
  adminMode = false,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="relative z-40 shrink-0 bg-[#123b73] text-white shadow-sm">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={adminMode ? "/admin/dashboard" : "/"}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/40 bg-white text-sm font-extrabold text-[#123b73]">
            SP
          </span>

          <span className="min-w-0">
            <span className="block text-lg font-bold leading-5">
              Student Portal
            </span>
            <span className="mt-1 block text-xs text-blue-100">
              Student Management System
            </span>
          </span>
        </Link>

        {showProfileMenu && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M5 20c.5-3.5 3.2-5.5 7-5.5s6.5 2 7 5.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl"
              >
                {adminMode ? (
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-bold text-[#123B73]">
                      {profileName || "Administrator"}
                    </p>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#f0efff] hover:text-[#5145b8]"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="3.5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M5 20c.5-3.5 3.2-5.5 7-5.5s6.5 2 7 5.5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                      Edit Profile
                    </Link>

                    <Link
                      href="/change-password"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#f0efff] hover:text-[#5145b8]"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M8 10V7a4 4 0 0 1 8 0v3"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                      Change Password
                    </Link>
                  </>
                )}

                {!adminMode && (
                  <div className="my-1 border-t border-slate-100" />
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#d94848] transition hover:bg-red-50"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M10 17l5-5-5-5M15 12H3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-1 bg-[#f97360]" />
    </header>
  );
}
