
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type SessionResponse = {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
};

type StudentProfile = {
  firstName?: string | null;
  lastName?: string | null;
  department?: string | null;
  semester?: string | number | null;
  status?: string | null;
  cgpa?: string | number | null;
};

type ProfileResponse = {
  profile?: StudentProfile | null;
  message?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Verify the student session and load their profile.
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<SessionResponse>("/session");

      if (!session.authenticated || !session.user) {
        router.replace("/login");
        return;
      }

      if (session.user.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      setEmail(session.user.email);

      try {
        const result = await apiRequest<ProfileResponse>("/profile");
        setProfile(result.profile ?? null);
      } catch {
        setProfile(null);
      }
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Allow Escape to close the sign-out dialog.
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loggingOut) {
        setConfirmLogout(false);
        setError("");
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loggingOut]);

  // Sign out and return to the student login page.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await apiRequest<{ message?: string }>("/logout", {
        method: "POST",
      });

      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out. Please try again."
      );
      setLoggingOut(false);
    }
  }

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Student";

  const departmentName = profile?.department
    ? profile.department
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Not added yet";

  const semesterLabel =
    profile?.semester === "completed"
      ? "Completed"
      : profile?.semester
        ? `Semester ${profile.semester}`
        : "Not added yet";

  const academicStatus = profile?.status
    ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1)
    : "Not added yet";

  const cgpaLabel =
    profile?.cgpa !== null &&
    profile?.cgpa !== undefined &&
    profile.cgpa !== ""
      ? `${Number(profile.cgpa).toFixed(2)} / 4.00`
      : "Not added yet";

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center bg-[#f3f5f8] px-4">
          <div
            role="status"
            className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm"
          >
            Loading your dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f3f5f8]">
      {/* Profile icon is enabled only on the student dashboard. */}
      <Navbar
        showProfileMenu
        onSignOut={() => {
          setError("");
          setConfirmLogout(true);
        }}
      />

      <main className="flex-1 text-slate-800">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
          {/* Compact page heading */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5145b8]">
                Student Portal
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                Student Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Welcome back, {fullName}.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[#dcd9ff] bg-white px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">
                Student Portal
              </span>
            </div>
          </div>

          {error && !confirmLogout && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Student identity card */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#5145b8] via-[#8176df] to-[#f97360]" />

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eeecff] text-xl font-bold text-[#5145b8]">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Signed-in student
                </p>

                <h2 className="mt-0.5 break-words text-lg font-bold text-slate-900">
                  {fullName}
                </h2>

                <p className="break-all text-sm text-slate-500">{email}</p>
              </div>

              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5145b8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#40359c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5145b8]"
              >
                View profile
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          {/* Academic summary */}
          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Academic Overview
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  A summary of your current academic record.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#5145b8] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Department
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eeecff] text-sm font-bold text-[#5145b8]">
                    D
                  </span>
                </div>
                <p className="mt-2 break-words text-base font-bold leading-snug text-slate-900">
                  {departmentName}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#f97360] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Semester
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0ec] text-sm font-bold text-[#d95e4b]">
                    S
                  </span>
                </div>
                <p className="mt-2 break-words text-base font-bold leading-snug text-slate-900">
                  {semesterLabel}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Academic Status
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                    ✓
                  </span>
                </div>
                <p className="mt-2 break-words text-base font-bold leading-snug text-slate-900">
                  {academicStatus}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#8b7cf6] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Current CGPA
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1efff] text-sm font-bold text-[#5145b8]">
                    ★
                  </span>
                </div>
                <p className="mt-2 break-words text-base font-bold leading-snug text-slate-900">
                  {cgpaLabel}
                </p>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="mt-5">
            <h2 className="mb-3 text-base font-bold text-slate-900 sm:text-lg">
              Account &amp; Services
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Link
                href="/profile"
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#c9c3ff] hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eeecff] text-[#5145b8] transition group-hover:bg-[#e3dfff]">
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
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">
                    Manage Profile
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Update your personal and academic information.
                  </span>
                </span>

                <span className="text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#5145b8]">
                  →
                </span>
              </Link>

              <Link
                href="/change-password"
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#ffc9be] hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff0ec] text-[#d95e4b] transition group-hover:bg-[#ffe4dd]">
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
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">
                    Account Security
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Change your password and protect your account.
                  </span>
                </span>

                <span className="text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#d95e4b]">
                  →
                </span>
              </Link>
            </div>
          </section>

          {!profile && (
            <section className="mt-4 flex flex-col gap-3 rounded-xl border border-[#dcd9ff] bg-[#f0efff] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Complete your student profile
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Add your personal and academic details to complete your
                  portal information.
                </p>
              </div>

              <Link
                href="/profile"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#5145b8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#40359c]"
              >
                Complete profile
              </Link>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* Sign-out confirmation dialog */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !loggingOut
            ) {
              setConfirmLogout(false);
              setError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#d94848]">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
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
            </div>

            <h2
              id="logout-title"
              className="mt-3 text-center text-lg font-bold text-slate-900"
            >
              Sign out of your account?
            </h2>

            <p className="mt-2 text-center text-sm leading-5 text-slate-600">
              You will return to the student login page.
            </p>

            {error && (
              <p role="alert" className="mt-3 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => {
                  setConfirmLogout(false);
                  setError("");
                }}
                className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="inline-flex justify-center rounded-lg bg-[#d94848] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b83232] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Yes, sign out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
