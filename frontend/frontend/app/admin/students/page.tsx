
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { apiRequest } from "../../../lib/api";

type SessionResponse = {
  authenticated: boolean;
  user?: { id: number; email: string; role: "user" | "admin" };
};

type Student = {
  id: number;
  userId?: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fatherName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  city?: string | null;
  department?: string | null;
  semester?: string | number | null;
  enrollmentDate?: string | null;
  status?: string | null;
  accountStatus?: string | null;
  cgpa?: number | string | null;
  address?: string | null;
};

type StudentsResponse = { students: Student[]; message?: string };
type StudentResponse = { message?: string; student?: Student };

type StudentForm = {
  email: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  department: string;
  semester: string;
  enrollmentDate: string;
  status: string;
  accountStatus: string;
  cgpa: string;
  address: string;
};

type FormErrors = Partial<Record<keyof StudentForm, string>>;
type TabName = "personal" | "education";
type Toast = { type: "success" | "error"; message: string };
type Confirmation = {
  type: "delete" | "activate" | "deactivate" | "logout";
  student?: Student;
};

const emptyForm: StudentForm = {
  email: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  city: "",
  department: "",
  semester: "1",
  enrollmentDate: "",
  status: "active",
  accountStatus: "active",
  cgpa: "",
  address: "",
};

const departments = [
  ["software-engineering", "Software Engineering"],
  ["computer-science", "Computer Science"],
  ["information-technology", "Information Technology"],
  ["business-administration", "Business Administration"],
  ["mathematics", "Mathematics"],
  ["physics", "Physics"],
  ["Chemistry", "Chemistry"],
  ["international-relations", "International Relations"],
  ["accounting", "Accounting"],
  ["islamic-studies", "Islamic Studies"],
];

function Icon({
  name,
  size = 16,
}: {
  name: string;
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );
    case "delete":
      return (
        <svg {...props}>
          <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
        </svg>
      );
    case "check":
      return <svg {...props}><path d="m5 12 4 4L19 6" /></svg>;
    case "minus":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
    case "close":
      return <svg {...props}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      );
    case "education":
      return (
        <svg {...props}>
          <path d="m2 10 10-5 10 5-10 5-10-5Z" />
          <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
          <path d="M22 10v6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case "alert":
      return (
        <svg {...props}>
          <path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    default:
      return null;
  }
}

function formatLabel(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayName(student: Student) {
  return (
    [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
    student.email ||
    `Student #${student.id}`
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    error
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
  }`;
}

function Field({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="break-words text-sm font-medium text-slate-800">
        {value || "Not provided"}
      </div>
    </div>
  );
}

function Badge({ status }: { status: string | null | undefined }) {
  const value = (status || "unknown").toLowerCase();
  const style =
    value === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "inactive"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : value === "graduated"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {formatLabel(value)}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-[3px] px-3 py-3 text-xs font-bold transition sm:text-sm ${
        active
          ? "border-blue-700 bg-blue-50 text-blue-800"
          : "border-transparent bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon name={icon} size={16} />
      {children}
    </button>
  );
}

export default function AdminStudentsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState<TabName>("personal");
  const [editTab, setEditTab] = useState<TabName>("personal");

  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [adminName, setAdminName] = useState("Administrator");

  const showToast = useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadStudents = useCallback(async (term = "") => {
    setLoading(true);
    setPageError("");

    try {
      const endpoint = term.trim()
        ? `/admin/students?search=${encodeURIComponent(term.trim())}`
        : "/admin/students";

      const response = (await apiRequest(endpoint)) as StudentsResponse;
      setStudents(Array.isArray(response.students) ? response.students : []);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Unable to load students.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      try {
        const response = (await apiRequest("/session")) as SessionResponse;
        if (cancelled) return;

        if (!response.authenticated) {
          router.replace("/admin/login");
          return;
        }

        if (response.user?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAdminName(response.user.email || "Administrator");
        await loadStudents("");
      } catch {
        if (!cancelled) router.replace("/admin/login");
      }
    }

    void verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [loadStudents, router]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = searchTerm.trim();
    setActiveSearch(term);
    void loadStudents(term);
  }

  function clearSearch() {
    setSearchTerm("");
    setActiveSearch("");
    void loadStudents("");
  }

  function openView(student: Student) {
    setViewingStudent(student);
    setViewTab("personal");
  }

  function openEdit(student: Student) {
    setViewingStudent(null);
    setEditingStudent(student);
    setEditTab("personal");
    setErrors({});
    setPageError("");

    const academicStatus = student.status || "active";

    setForm({
      email: student.email || "",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      fatherName: student.fatherName || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth?.slice(0, 10) || "",
      gender: student.gender || "",
      city: student.city || "",
      department: student.department || "",
      semester:
        academicStatus === "graduated"
          ? "completed"
          : String(student.semester ?? "1"),
      enrollmentDate: student.enrollmentDate?.slice(0, 10) || "",
      status: academicStatus,
      accountStatus: student.accountStatus || "active",
      cgpa:
        student.cgpa === null || student.cgpa === undefined
          ? ""
          : String(student.cgpa),
      address: student.address || "",
    });
  }

  function updateField<K extends keyof StudentForm>(
    field: K,
    value: StudentForm[K],
  ) {
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "status" && value === "graduated") {
        next.semester = "completed";
      } else if (
        field === "status" &&
        value !== "graduated" &&
        previous.semester === "completed"
      ) {
        next.semester = "1";
      }

      return next;
    });

    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function validateForm(): FormErrors {
    const next: FormErrors = {};

    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.fatherName.trim()) next.fatherName = "Father's name is required.";

    if (!form.phone.trim()) {
      next.phone = "Phone number is required.";
    } else {
      const digits = form.phone.replace(/\D/g, "");
      if (!/^[+()\d\s-]+$/.test(form.phone) || digits.length < 7 || digits.length > 15) {
        next.phone = "Enter a valid phone number with 7–15 digits.";
      }
    }

    if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    else if (form.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      next.dateOfBirth = "Date of birth cannot be in the future.";
    }

    if (!form.gender) next.gender = "Select a gender.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.department) next.department = "Select a department.";
    if (!form.semester) next.semester = "Select a semester.";
    if (!form.enrollmentDate) next.enrollmentDate = "Enrollment date is required.";

    if (
      form.enrollmentDate &&
      form.dateOfBirth &&
      form.enrollmentDate < form.dateOfBirth
    ) {
      next.enrollmentDate = "Enrollment date cannot be before date of birth.";
    }

    if (!["active", "inactive", "graduated"].includes(form.status)) {
      next.status = "Select a valid academic status.";
    }

    if (!["active", "inactive"].includes(form.accountStatus)) {
      next.accountStatus = "Select a valid account status.";
    }

    if (form.cgpa.trim()) {
      const cgpa = Number(form.cgpa);
      if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 4) {
        next.cgpa = "CGPA must be between 0.00 and 4.00.";
      }
    }

    return next;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingStudent) return;

    const validation = validateForm();
    setErrors(validation);

    if (Object.keys(validation).length) {
      const personalFields: (keyof StudentForm)[] = [
        "email",
        "firstName",
        "lastName",
        "fatherName",
        "phone",
        "dateOfBirth",
        "gender",
        "city",
        "address",
        "accountStatus",
      ];

      setEditTab(
        Object.keys(validation).some((key) =>
          personalFields.includes(key as keyof StudentForm),
        )
          ? "personal"
          : "education",
      );
      showToast("error", "Please correct the highlighted fields.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fatherName: form.fatherName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        semester: form.status === "graduated" ? "completed" : form.semester,
        cgpa: form.cgpa.trim() ? Number(form.cgpa) : null,
      };

      const response = (await apiRequest(
        `/admin/students/${editingStudent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )) as StudentResponse;

      setEditingStudent(null);
      setErrors({});
      showToast("success", response.message || "Student details updated.");
      await loadStudents(activeSearch);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Unable to update student.",
      );
    } finally {
      setSaving(false);
    }
  }

  function requestConfirmation(
    type: Confirmation["type"],
    student?: Student,
  ) {
    setConfirmation({ type, student });
  }

  async function handleConfirm() {
    if (!confirmation) return;
    const { type, student } = confirmation;
    setConfirming(true);

    try {
      if (type === "logout") {
        await apiRequest("/logout", { method: "POST" });
        setConfirmation(null);
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      if (!student) return;

      if (type === "delete") {
        const response = (await apiRequest(`/admin/students/${student.id}`, {
          method: "DELETE",
        })) as StudentResponse;

        setViewingStudent(null);
        showToast("success", response.message || "Student deleted successfully.");
      } else {
        const status = type === "activate" ? "active" : "inactive";

        const response = (await apiRequest(
          `/admin/students/${student.id}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        )) as StudentResponse;

        showToast(
          "success",
          response.message ||
            `Student account ${status === "active" ? "activated" : "deactivated"}.`,
        );
      }

      setConfirmation(null);
      await loadStudents(activeSearch);
    } catch (error) {
      setConfirmation(null);

      if (type === "logout") {
        router.replace("/admin/login");
        router.refresh();
      } else {
        showToast(
          "error",
          error instanceof Error ? error.message : "The action failed.",
        );
      }
    } finally {
      setConfirming(false);
    }
  }

  const personalErrors = [
    "email",
    "firstName",
    "lastName",
    "fatherName",
    "phone",
    "dateOfBirth",
    "gender",
    "city",
    "address",
    "accountStatus",
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f5f8] text-slate-800">
      <Navbar
        showProfileMenu
        adminMode
        profileName={adminName}
        onSignOut={() => requestConfirmation("logout")}
      />

      <main className="flex min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-col">
          <div className="mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold tracking-widest text-blue-700">
                ADMINISTRATION
              </p>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Student Management
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Search, view, and manage student records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:self-auto"
            >
              <Icon name="dashboard" size={16} />
              Dashboard
            </button>
          </div>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Student Records
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Loading records..."
                    : `${students.length} student${students.length === 1 ? "" : "s"} shown`}
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
              >
                <div className="relative min-w-0 sm:w-72">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    type="search"
                    aria-label="Search students"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search name, email, department..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <Icon name="search" size={14} />
                  Search
                </button>

                {activeSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {pageError && (
              <div className="m-4 flex shrink-0 items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <Icon name="alert" size={17} />
                <p>{pageError}</p>
              </div>
            )}

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {loading ? (
                <div className="flex h-full min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
                  Loading student records...
                </div>
              ) : students.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Icon name="user" size={20} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">
                    No students found
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeSearch
                      ? "Try another search or clear the current search."
                      : "Student records will appear here when available."}
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="border-b border-slate-200">
                        {[
                          "Student",
                          "Department",
                          "Semester",
                          "Academic Status",
                          "Account",
                          "Actions",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className={`whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 ${
                              heading === "Actions" ? "text-right" : ""
                            }`}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => {
                        const active =
                          (student.accountStatus || "active") === "active";

                        return (
                          <tr
                            key={student.id}
                            className="transition hover:bg-blue-50/40"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-800">
                                  {(student.firstName?.[0] || "") +
                                    (student.lastName?.[0] || "") ||
                                    <Icon name="user" size={16} />}
                                </span>
                                <div className="min-w-0">
                                  <p className="max-w-56 truncate text-sm font-semibold text-slate-800">
                                    {displayName(student)}
                                  </p>
                                  <p className="mt-0.5 max-w-56 truncate text-xs text-slate-500">
                                    {student.email}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    ID: {student.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-48 px-4 py-3 text-xs text-slate-600">
                              {formatLabel(student.department)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                              {student.status === "graduated"
                                ? "Completed"
                                : formatLabel(student.semester)}
                            </td>

                            <td className="px-4 py-3">
                              <Badge status={student.status || "active"} />
                            </td>

                            <td className="px-4 py-3">
                              <Badge status={student.accountStatus || "active"} />
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  title="View student"
                                  aria-label={`View ${displayName(student)}`}
                                  onClick={() => openView(student)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800 transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  <Icon name="eye" size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="Edit student"
                                  aria-label={`Edit ${displayName(student)}`}
                                  onClick={() => openEdit(student)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  <Icon name="edit" size={15} />
                                </button>

                                <button
                                  type="button"
                                  title={active ? "Deactivate account" : "Activate account"}
                                  aria-label={`${active ? "Deactivate" : "Activate"} ${displayName(student)}`}
                                  onClick={() =>
                                    requestConfirmation(
                                      active ? "deactivate" : "activate",
                                      student,
                                    )
                                  }
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 ${
                                    active
                                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-200"
                                      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-200"
                                  }`}
                                >
                                  <Icon name={active ? "minus" : "check"} size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="Delete student"
                                  aria-label={`Delete ${displayName(student)}`}
                                  onClick={() =>
                                    requestConfirmation("delete", student)
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 text-rose-800 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                >
                                  <Icon name="delete" size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-1 border-t border-slate-200 bg-slate-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                {loading ? "Updating records..." : `Showing ${students.length} record(s)`}
              </p>
              <p className="text-[11px] text-slate-400">
                Use the action icons to manage a student.
              </p>
            </div>
          </section>
        </div>
      </main>

      <div className="shrink-0">
        <Footer />
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg ${
            toast.type === "success" ? "border-emerald-200" : "border-rose-200"
          }`}
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <Icon name={toast.type === "success" ? "check" : "alert"} size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800">
              {toast.type === "success" ? "Success" : "Please check"}
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-slate-600">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {viewingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingStudent(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-title"
            className="my-auto flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Icon name="user" size={20} />
                </span>
                <div className="min-w-0">
                  <h2 id="view-title" className="text-base font-bold text-slate-900">
                    Student Details
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayName(viewingStudent)} · ID {viewingStudent.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setViewingStudent(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 px-3 sm:px-5">
              <TabButton active={viewTab === "personal"} onClick={() => setViewTab("personal")} icon="user">
                Personal Details
              </TabButton>
              <TabButton active={viewTab === "education"} onClick={() => setViewTab("education")} icon="education">
                Educational Details
              </TabButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
              {viewTab === "personal" ? (
                <div className="space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Detail label="First Name" value={viewingStudent.firstName} />
                    <Detail label="Last Name" value={viewingStudent.lastName} />
                    <Detail label="Father's Name" value={viewingStudent.fatherName} />
                    <Detail label="Email Address" value={viewingStudent.email} />
                    <Detail label="Phone Number" value={viewingStudent.phone} />
                    <Detail label="Date of Birth" value={formatDate(viewingStudent.dateOfBirth)} />
                    <Detail label="Gender" value={formatLabel(viewingStudent.gender)} />
                    <Detail label="City" value={viewingStudent.city} />
                    <div className="sm:col-span-2">
                      <Detail label="Residential Address" value={viewingStudent.address} />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Account Access
                  </h3>
                  <Detail
                    label="Account Status"
                    value={<Badge status={viewingStudent.accountStatus || "active"} />}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Detail label="Department" value={formatLabel(viewingStudent.department)} />
                    <Detail
                      label="Semester"
                      value={
                        viewingStudent.status === "graduated"
                          ? "Completed"
                          : formatLabel(viewingStudent.semester)
                      }
                    />
                    <Detail label="Enrollment Date" value={formatDate(viewingStudent.enrollmentDate)} />
                    <Detail
                      label="CGPA"
                      value={
                        viewingStudent.cgpa === null ||
                        viewingStudent.cgpa === undefined ||
                        viewingStudent.cgpa === ""
                          ? "Not provided"
                          : Number(viewingStudent.cgpa).toFixed(2)
                      }
                    />
                    <Detail
                      label="Academic Status"
                      value={<Badge status={viewingStudent.status || "active"} />}
                    />
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                    Academic status and account access are managed separately.
                    Graduation does not automatically deactivate an account.
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={() => requestConfirmation("delete", viewingStudent)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <Icon name="delete" size={15} />
                Delete Student
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(viewingStudent)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <Icon name="edit" size={15} />
                  Edit Student
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setEditingStudent(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            className="my-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Icon name="edit" size={20} />
                </span>
                <div className="min-w-0">
                  <h2 id="edit-title" className="text-base font-bold text-slate-900">
                    Edit Student
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayName(editingStudent)} · ID {editingStudent.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                aria-label="Close edit form"
                onClick={() => setEditingStudent(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 px-3 sm:px-5">
              <TabButton active={editTab === "personal"} onClick={() => setEditTab("personal")} icon="user">
                Personal Details
              </TabButton>
              <TabButton active={editTab === "education"} onClick={() => setEditTab("education")} icon="education">
                Educational Details
              </TabButton>
            </div>

            <form onSubmit={handleSave} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
                {Object.keys(errors).length > 0 && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <Icon name="alert" size={16} />
                    Please correct the highlighted fields before saving.
                  </div>
                )}

                {editTab === "personal" ? (
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <Field label="First Name" name="firstName" required error={errors.firstName}>
                        <input id="firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} className={inputClass(errors.firstName)} />
                      </Field>
                      <Field label="Last Name" name="lastName" required error={errors.lastName}>
                        <input id="lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} className={inputClass(errors.lastName)} />
                      </Field>
                      <Field label="Father's Name" name="fatherName" required error={errors.fatherName}>
                        <input id="fatherName" value={form.fatherName} onChange={(e) => updateField("fatherName", e.target.value)} className={inputClass(errors.fatherName)} />
                      </Field>
                      <Field label="Email Address" name="email" required error={errors.email}>
                        <input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass(errors.email)} />
                      </Field>
                      <Field label="Phone Number" name="phone" required error={errors.phone}>
                        <input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClass(errors.phone)} placeholder="+92 300 1234567" />
                      </Field>
                      <Field label="Date of Birth" name="dateOfBirth" required error={errors.dateOfBirth}>
                        <input id="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className={inputClass(errors.dateOfBirth)} />
                      </Field>
                      <Field label="Gender" name="gender" required error={errors.gender}>
                        <select id="gender" value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className={inputClass(errors.gender)}>
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="City" name="city" required error={errors.city}>
                        <input id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} className={inputClass(errors.city)} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Residential Address" name="address" error={errors.address}>
                          <textarea id="address" rows={2} value={form.address} onChange={(e) => updateField("address", e.target.value)} className={`${inputClass(errors.address)} resize-y`} placeholder="Optional" />
                        </Field>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Account Access
                      </h3>
                      <Field label="Account Status" name="accountStatus" required error={errors.accountStatus}>
                        <select id="accountStatus" value={form.accountStatus} onChange={(e) => updateField("accountStatus", e.target.value)} className={inputClass(errors.accountStatus)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </Field>
                      <p className="mt-2 text-[11px] leading-5 text-slate-500">
                        Account status controls login access independently of academic status.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Educational Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <Field label="Department" name="department" required error={errors.department}>
                        <select id="department" value={form.department} onChange={(e) => updateField("department", e.target.value)} className={inputClass(errors.department)}>
                          <option value="">Select department</option>
                          {departments.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Semester" name="semester" required error={errors.semester}>
                        <select id="semester" value={form.semester} disabled={form.status === "graduated"} onChange={(e) => updateField("semester", e.target.value)} className={`${inputClass(errors.semester)} disabled:cursor-not-allowed disabled:bg-slate-100`}>
                          {form.status === "graduated" ? (
                            <option value="completed">Completed</option>
                          ) : (
                            <>
                              <option value="">Select semester</option>
                              {Array.from({ length: 8 }, (_, index) => (
                                <option key={index + 1} value={String(index + 1)}>
                                  Semester {index + 1}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </Field>
                      <Field label="Enrollment Date" name="enrollmentDate" required error={errors.enrollmentDate}>
                        <input id="enrollmentDate" type="date" value={form.enrollmentDate} onChange={(e) => updateField("enrollmentDate", e.target.value)} className={inputClass(errors.enrollmentDate)} />
                      </Field>
                      <Field label="CGPA" name="cgpa" error={errors.cgpa}>
                        <input id="cgpa" type="number" min="0" max="4" step="0.01" value={form.cgpa} onChange={(e) => updateField("cgpa", e.target.value)} className={inputClass(errors.cgpa)} placeholder="0.00 – 4.00" />
                      </Field>
                      <Field label="Academic Status" name="status" required error={errors.status}>
                        <select id="status" value={form.status} onChange={(e) => updateField("status", e.target.value)} className={inputClass(errors.status)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                        </select>
                      </Field>
                    </div>

                    {form.status === "graduated" && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-900">
                        Semester will be set to Completed. The student's account status will not change automatically.
                      </div>
                    )}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                      Required fields are marked with an asterisk. CGPA is optional.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[11px] text-slate-500">
                  <span className="text-rose-600">*</span> Required field
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingStudent(null)}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  {editTab === "personal" ? (
                    <button
                      type="button"
                      onClick={() => setEditTab("education")}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Next: Education <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditTab("personal")}
                        className="min-h-10 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        ← Personal Details
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : <><Icon name="check" size={15} /> Save Changes</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirming) {
              setConfirmation(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="p-5 sm:p-6">
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                  confirmation.type === "delete" || confirmation.type === "logout"
                    ? "bg-rose-50 text-rose-700"
                    : confirmation.type === "deactivate"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-800"
                }`}
              >
                <Icon
                  name={
                    confirmation.type === "delete"
                      ? "delete"
                      : confirmation.type === "logout"
                        ? "close"
                        : confirmation.type === "deactivate"
                          ? "minus"
                          : "check"
                  }
                  size={21}
                />
              </div>

              <h2 id="confirm-title" className="text-base font-bold text-slate-900">
                {confirmation.type === "delete"
                  ? "Delete Student?"
                  : confirmation.type === "logout"
                    ? "Sign Out?"
                    : confirmation.type === "deactivate"
                      ? "Deactivate Student Account?"
                      : "Activate Student Account?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {confirmation.type === "delete"
                  ? `Are you sure you want to delete ${displayName(confirmation.student!)}? This action cannot be undone.`
                  : confirmation.type === "logout"
                    ? "Are you sure you want to sign out of the administrator account?"
                    : confirmation.type === "deactivate"
                      ? `Are you sure you want to deactivate ${displayName(confirmation.student!)}? They will lose account access.`
                      : `Are you sure you want to activate ${displayName(confirmation.student!)}? They will be able to access their account.`}
              </p>

              {(confirmation.type === "activate" || confirmation.type === "deactivate") && (
                <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  This changes account access only. Academic status and semester will remain unchanged.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={confirming}
                onClick={() => setConfirmation(null)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirm}
                className={`min-h-10 rounded-lg px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmation.type === "delete" || confirmation.type === "logout"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmation.type === "deactivate"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {confirming
                  ? "Please wait..."
                  : confirmation.type === "delete"
                    ? "Yes, Delete"
                    : confirmation.type === "logout"
                      ? "Yes, Sign Out"
                      : confirmation.type === "deactivate"
                        ? "Yes, Deactivate"
                        : "Yes, Activate"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
