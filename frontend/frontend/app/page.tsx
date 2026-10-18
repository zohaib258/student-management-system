"use client";

import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const portals = [
  {
    title: "Student Portal",
    description:
      "Access your profile, manage personal information, and view your academic records.",
    features: ["Personal profile", "Academic information", "Account settings"],
    href: "/login",
    buttonText: "Student Login",
    accent: "border-t-[#174a86]",
    iconBg: "bg-blue-50 text-[#174a86]",
    labelBg: "bg-blue-50 text-[#174a86]",
    label: "STUDENT ACCESS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
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
    ),
  },
  {
    title: "Admin Portal",
    description:
      "Manage student records, update academic details, and control account access.",
    features: ["Student management", "Record administration", "Account status"],
    href: "/admin/login",
    buttonText: "Admin Login",
    accent: "border-t-[#f97360]",
    iconBg: "bg-[#fff0ec] text-[#d95743]",
    labelBg: "bg-[#fff0ec] text-[#c94e3b]",
    label: "ADMIN ACCESS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M12 3 19 6v5c0 4.5-2.8 7.6-7 10-4.2-2.4-7-5.5-7-10V6l7-3Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-[#f3f5f8] text-[#24213f] lg:h-dvh lg:min-h-0">
      <Navbar />

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:min-h-0 lg:overflow-hidden lg:py-3">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center sm:mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#174a86]">
              Student Management System
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#123b73] sm:text-3xl">
              Welcome to the Student Portal
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Select your portal to continue to your account.
            </p>

            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-[#f97360]" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {portals.map((portal) => (
              <section
                key={portal.title}
                className={`flex flex-col rounded-xl border border-slate-200 border-t-[3px] ${portal.accent} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${portal.iconBg}`}
                  >
                    {portal.icon}
                  </div>

                  <span
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider ${portal.labelBg}`}
                  >
                    {portal.label}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#123b73]">
                  {portal.title}
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
                  {portal.description}
                </p>

                <div className="my-4 border-t border-slate-100" />

                <ul className="mb-5 space-y-2.5">
                  {portal.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-slate-600"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className="h-3 w-3"
                          aria-hidden="true"
                        >
                          <path
                            d="m4 10 4 4 8-8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    href={portal.href}
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#174a86] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123b73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174a86]"
                  >
                    {portal.buttonText}
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10h12m-5-5 5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </section>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Secure access for students and administrators.
          </p>
        </div>
      </main>

      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
}
