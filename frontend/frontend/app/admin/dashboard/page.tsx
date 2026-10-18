"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../../lib/api";

type SessionResponse = {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
  message?: string;
};

type DashboardStats = {
  totalStudents: number;
  activeAccounts: number;
  inactiveAccounts: number;
  graduatedStudents: number;
};

type StatsResponse = {
  stats: DashboardStats;
  message?: string;
};

type StudentRecord = {
  id?: number;
  user_id?: number;
  userId?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  father_name?: string;
  fatherName?: string;
  department?: string;
  semester?: number | string;
  cgpa?: number | string;
  status?: string;
  account_status?: string;
  accountStatus?: string;
  academic_status?: string;
  academicStatus?: string;
  user?: {
    id?: number;
    email?: string;
    status?: string;
  };
  profile?: {
    first_name?: string;
    last_name?: string;
    father_name?: string;
    department?: string;
    semester?: number | string;
    cgpa?: number | string;
    status?: string;
    firstName?: string;
    lastName?: string;
  };
};

type StudentsResponse = {
  students?: StudentRecord[];
  data?: {
    students?: StudentRecord[];
  };
};

type FilterType = "total" | "active" | "inactive" | "graduated";

const initialStats: DashboardStats = {
  totalStudents: 0,
  activeAccounts: 0,
  inactiveAccounts: 0,
  graduatedStudents: 0,
};

const filters: {
  id: FilterType;
  title: string;
  description: string;
  icon: string;
  color: string;
  iconStyle: string;
}[] = [
  {
    id: "total",
    title: "Total Students",
    description: "All registered students",
    icon: "users",
    color: "border-t-[#174A86]",
    iconStyle: "bg-blue-50 text-[#174A86]",
  },
  {
    id: "active",
    title: "Active Accounts",
    description: "Accounts currently active",
    icon: "check",
    color: "border-t-emerald-500",
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "inactive",
    title: "Inactive Accounts",
    description: "Accounts currently inactive",
    icon: "x",
    color: "border-t-[#F97360]",
    iconStyle: "bg-[#FFF1EE] text-[#D95745]",
  },
  {
    id: "graduated",
    title: "Graduated Students",
    description: "Students marked as graduated",
    icon: "graduation",
    color: "border-t-violet-500",
    iconStyle: "bg-violet-50 text-violet-700",
  },
];

function StatIcon({ type }: { type: string }) {
  const common = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (type === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (type === "x") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m2 10 10-5 10 5-10 5-10-5Z" />
      <path d="M6 12v5c3.5 3 8.5 3 12 0v-5M22 10v6" />
    </svg>
  );
}

function getStudentName(student: StudentRecord) {
  const first =
    student.first_name ??
    student.firstName ??
    student.profile?.first_name ??
    student.profile?.firstName ??
    "";

  const last =
    student.last_name ??
    student.lastName ??
    student.profile?.last_name ??
    student.profile?.lastName ??
    "";

  return `${first} ${last}`.trim() || "Name not provided";
}

function getStudentEmail(student: StudentRecord) {
  return student.email ?? student.user?.email ?? "No email available";
}

// Account status is separate from academic status.
function getAccountStatus(student: StudentRecord) {
  return (
    student.account_status ??
    student.accountStatus ??
    student.user?.status ??
    "unknown"
  ).toLowerCase();
}

function getAcademicStatus(student: StudentRecord) {
  return (
    student.academic_status ??
    student.academicStatus ??
    student.profile?.status ??
    student.status ??
    "not specified"
  ).toLowerCase();
}

function getStudentId(student: StudentRecord) {
  return student.id ?? student.user_id ?? student.userId;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Verify the admin session and load statistics.
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<SessionResponse>("/session");

      if (!session.authenticated || !session.user) {
        router.replace("/admin/login");
        return;
      }

      if (session.user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAdminEmail(session.user.email);

      const result = await apiRequest<StatsResponse>("/admin/stats");

      setStats({
        totalStudents: result.stats.totalStudents,
        activeAccounts: result.stats.activeAccounts,
        inactiveAccounts: result.stats.inactiveAccounts,
        graduatedStudents: result.stats.graduatedStudents,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Load student records when a statistic is selected.
  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError("");

    try {
      const result = await apiRequest<
        StudentsResponse | StudentRecord[]
      >("/admin/students");

      const records = Array.isArray(result)
        ? result
        : result.students ?? result.data?.students;

      if (!Array.isArray(records)) {
        throw new Error(
          "The students API response did not contain a students list."
        );
      }

      setStudents(records);
      setStudentsLoaded(true);
    } catch (err: unknown) {
      setStudentsError(
        err instanceof Error
          ? err.message
          : "Unable to load student records."
      );
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  async function handleCardClick(filter: FilterType) {
    if (selectedFilter === filter) {
      setSelectedFilter(null);
      return;
    }

    setSelectedFilter(filter);

    if (!studentsLoaded) {
      await loadStudents();
    }
  }

  // Sign out after the administrator confirms.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await apiRequest<{ message: string }>("/logout", {
        method: "POST",
      });

      setConfirmSignOut(false);
      router.replace("/admin/login");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to sign out."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const visibleStudents = students.filter((student) => {
    if (selectedFilter === "active") {
      return getAccountStatus(student) === "active";
    }

    if (selectedFilter === "inactive") {
      return getAccountStatus(student) === "inactive";
    }

    if (selectedFilter === "graduated") {
      return getAcademicStatus(student) === "graduated";
    }

    return selectedFilter === "total";
  });

  const selectedTitle = filters.find(
    (filter) => filter.id === selectedFilter
  )?.title;

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-[#F3F5F8] text-sm text-slate-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Navbar
        showProfileMenu
        profileName="Administrator"
        profileEmail={adminEmail}
        adminMode
        onSignOut={() => setConfirmSignOut(true)}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
        {/* Compact welcome banner */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#123B73] to-[#24599A] px-4 py-3 text-white sm:px-5 sm:py-3.5">
          <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full border-[22px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-48 h-28 w-28 rounded-full bg-[#F97360]/20" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F97360]" />
              Administration
            </span>

            <h1 className="mt-1.5 text-lg font-bold tracking-tight sm:text-xl">
              Dashboard Overview
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-4 text-blue-100">
              Monitor student accounts and academic progress from one place.
            </p>
          </div>
        </section>

        {/* Heading and actions */}
        <section className="mb-2 mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#123B73]">
              Student Statistics
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a statistic to view student records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/students")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#174A86] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#123B73]"
            >
              <StatIcon type="users" />
              Manage Students
            </button>

            <button
              type="button"
              onClick={() => {
                setStudentsLoaded(false);
                void loadDashboard();
              }}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#174A86] shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
              </svg>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {loading && (
          <div
            role="status"
            className="mb-2 flex items-center gap-2 text-xs text-slate-500"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-[#174A86]" />
            Loading dashboard statistics...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-[#F97360]/40 bg-[#FFF1EE] p-2.5 text-xs text-[#B9382A]"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-1 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Four compact statistic cards */}
        <section
          aria-label="Student statistics"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {filters.map((filter) => {
            const value =
              filter.id === "total"
                ? stats.totalStudents
                : filter.id === "active"
                  ? stats.activeAccounts
                  : filter.id === "inactive"
                    ? stats.inactiveAccounts
                    : stats.graduatedStudents;

            const isSelected = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => void handleCardClick(filter.id)}
                className={`rounded-xl border border-slate-200 border-t-[3px] ${filter.color} ${
                  isSelected ? "ring-2 ring-[#174A86]/30" : ""
                } bg-white p-2.5 text-left shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174A86] sm:p-3`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-4 text-slate-500">
                      {filter.title}
                    </p>
                    <p className="mt-1 text-xl font-bold leading-tight tracking-tight text-[#123B73]">
                      {loading ? "—" : value.toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${filter.iconStyle}`}
                  >
                    <StatIcon type={filter.icon} />
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2">
                  <span className="text-[10px] leading-4 text-slate-500 sm:text-xs">
                    {filter.description}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-[#174A86]">
                    {isSelected ? "−" : "+"}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Footer stays at the bottom when space is available */}
        <footer className="mt-auto border-t border-slate-200 py-2 text-center text-[11px] text-slate-500">
          Student Management System
          <span className="mx-2 text-[#F97360]">•</span>
          Administration
        </footer>
      </div>

      {/* Student list modal */}
      {selectedFilter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/55 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFilter(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
            className="flex max-h-[85dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#123B73] to-[#24599A] px-4 py-3 text-white sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-100">
                  Student Management
                </p>
                <h2
                  id="student-modal-title"
                  className="mt-1 text-base font-bold sm:text-lg"
                >
                  {selectedTitle}
                </h2>
                <p className="mt-1 text-xs text-blue-100">
                  {studentsLoading
                    ? "Loading student records..."
                    : `${visibleStudents.length} matching student${
                        visibleStudents.length === 1 ? "" : "s"
                      }`}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close student list"
                onClick={() => setSelectedFilter(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-xl transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {studentsLoading && (
                <div
                  role="status"
                  className="flex items-center justify-center gap-3 px-5 py-8 text-xs text-slate-500"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#174A86]" />
                  Loading student records...
                </div>
              )}

              {studentsError && (
                <div className="m-4 rounded-xl border border-[#F97360]/30 bg-[#FFF1EE] p-3 text-xs text-[#B9382A]">
                  <p className="font-semibold">Unable to load students</p>
                  <p className="mt-1">{studentsError}</p>
                  <button
                    type="button"
                    onClick={() => void loadStudents()}
                    className="mt-3 rounded-lg bg-[#174A86] px-3 py-2 font-semibold text-white hover:bg-[#123B73]"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!studentsLoading &&
                !studentsError &&
                visibleStudents.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#174A86]">
                      <StatIcon type="users" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#123B73]">
                      No matching students found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      There are no records in this category.
                    </p>
                  </div>
                )}

              {!studentsLoading &&
                !studentsError &&
                visibleStudents.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead className="sticky top-0 bg-[#F5F7FB] text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 font-bold">Student</th>
                          <th className="px-4 py-2.5 font-bold">Department</th>
                          <th className="px-4 py-2.5 font-bold">Semester</th>
                          <th className="px-4 py-2.5 font-bold">Account</th>
                          <th className="px-4 py-2.5 font-bold">Academic</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {visibleStudents.map((student, index) => {
                          const id = getStudentId(student);
                          const accountStatus = getAccountStatus(student);
                          const academicStatus = getAcademicStatus(student);
                          const department =
                            student.department ??
                            student.profile?.department ??
                            "—";
                          const semester =
                            student.semester ??
                            student.profile?.semester ??
                            "—";

                          return (
                            <tr
                              key={
                                id ??
                                `${getStudentEmail(student)}-${index}`
                              }
                              className="transition hover:bg-[#F8F9FD]"
                            >
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-[#123B73]">
                                  {getStudentName(student)}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-500">
                                  {getStudentEmail(student)}
                                </p>
                              </td>

                              <td className="px-4 py-2.5 text-slate-600">
                                {department}
                              </td>

                              <td className="px-4 py-2.5 text-slate-600">
                                {String(semester).toLowerCase() === "completed"
                                  ? "Completed"
                                  : semester}
                              </td>

                              <td className="px-4 py-2.5">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                                    accountStatus === "active"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : accountStatus === "inactive"
                                        ? "bg-[#FFF1EE] text-[#B9382A]"
                                        : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {accountStatus}
                                </span>
                              </td>

                              <td className="px-4 py-2.5">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                                    academicStatus === "graduated"
                                      ? "bg-violet-50 text-violet-700"
                                      : "bg-blue-50 text-[#174A86]"
                                  }`}
                                >
                                  {academicStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-2.5">
              <p className="hidden text-[10px] text-slate-500 sm:block">
                Account status is separate from academic status.
              </p>
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Sign-out confirmation modal */}
      {confirmSignOut && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1F3A]/55 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            aria-describedby="signout-description"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-white/70 bg-white shadow-2xl"
          >
            <div className="h-1 bg-[#F97360]" />

            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF1EE] text-[#D95745]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5M15 12H3" />
                  <path d="M12 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
                </svg>
              </div>

              <h2
                id="signout-title"
                className="mt-3 text-base font-bold text-[#123B73]"
              >
                Sign out of your account?
              </h2>

              <p
                id="signout-description"
                className="mt-2 text-xs leading-5 text-slate-500"
              >
                Are you sure you want to sign out of the administration portal?
                You will need to log in again to access the dashboard.
              </p>

              {error && (
                <p role="alert" className="mt-3 text-xs text-[#B9382A]">
                  {error}
                </p>
              )}

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setConfirmSignOut(false);
                    setError("");
                  }}
                  className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => void handleLogout()}
                  className="h-9 rounded-lg bg-[#D95745] px-4 text-xs font-bold text-white transition hover:bg-[#BE4637] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? "Signing out..." : "Yes, Sign Out"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}