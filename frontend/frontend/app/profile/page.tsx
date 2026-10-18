"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import Navbar from "../components/Navbar";

type StudentProfile = {
  userId: number | string; email: string; accountStatus: string; id: number | null;
  firstName: string; lastName: string; fatherName: string; phone: string; dateOfBirth: string;
  gender: string; city: string; department: string; semester: string; enrollmentDate: string;
  status: string; cgpa: string; address: string;
};
type ProfileResponse = { profile: Partial<StudentProfile>; message?: string };
const emptyProfile: StudentProfile = {
  userId: "", email: "", accountStatus: "active", id: null, firstName: "", lastName: "",
  fatherName: "", phone: "", dateOfBirth: "", gender: "", city: "", department: "",
  semester: "1", enrollmentDate: "", status: "active", cgpa: "", address: "",
};
const departments = [
  { value: "software-engineering", label: "Software Engineering" },
  { value: "computer-science", label: "Computer Science" },
  { value: "information-technology", label: "Information Technology" },
  { value: "business-administration", label: "Business Administration" },
  { value: "mathematics", label: "Mathematics" }, { value: "physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "international-relations", label: "International Relations" },
  { value: "accounting", label: "Accounting" }, { value: "islamic-studies", label: "Islamic Studies" },
];
function dateForInput(value: unknown): string {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeModal, setActiveModal] = useState<"personal" | "education" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadProfile = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = (await apiRequest("/profile")) as ProfileResponse;
      const saved = data.profile ?? {};
      setProfile({
        ...emptyProfile, ...saved, userId: saved.userId ?? "", email: saved.email ?? "",
        accountStatus: saved.accountStatus ?? "active", id: saved.id ?? null,
        firstName: saved.firstName ?? "", lastName: saved.lastName ?? "", fatherName: saved.fatherName ?? "",
        phone: saved.phone ?? "", dateOfBirth: dateForInput(saved.dateOfBirth), gender: saved.gender ?? "",
        city: saved.city ?? "", department: saved.department ?? "",
        semester: saved.semester == null ? "1" : String(saved.semester),
        enrollmentDate: dateForInput(saved.enrollmentDate), status: saved.status ?? "active",
        cgpa: saved.cgpa == null ? "" : String(saved.cgpa), address: saved.address ?? "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load your profile.";
      if (message.toLowerCase().includes("no active login session") || message.toLowerCase().includes("unauthorized")) {
        router.replace("/login"); return;
      }
      setError(message);
    } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void loadProfile(); }, [loadProfile]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setProfile(current => {
      const updated = { ...current, [name]: value };
      if (name === "status" && value === "graduated") updated.semester = "completed";
      if (name === "status" && value !== "graduated" && current.semester === "completed") updated.semester = "1";
      return updated;
    });
    if (value.trim()) setFieldErrors(current => ({ ...current, [name]: "" }));
    setError(""); setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const nextErrors: Record<string, string> = {};
    if (!profile.firstName.trim()) nextErrors.firstName = "This field must be filled.";
    if (!profile.lastName.trim()) nextErrors.lastName = "This field must be filled.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(current => ({ ...current, ...nextErrors }));
      setError("Please fill in the required fields marked in red.");
      setActiveModal("personal");
      return;
    }
    if (profile.cgpa !== "" && (!Number.isFinite(Number(profile.cgpa)) || Number(profile.cgpa) < 0 || Number(profile.cgpa) > 4)) {
      setError("CGPA must be between 0.00 and 4.00."); setActiveModal("education"); return;
    }
    if (profile.status === "graduated" && profile.semester !== "completed") {
      setError("Graduated students must have semester set to Completed."); setActiveModal("education"); return;
    }
    const payload = {
      firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), fatherName: profile.fatherName.trim(),
      phone: profile.phone.trim(), dateOfBirth: profile.dateOfBirth || null, gender: profile.gender || null,
      city: profile.city.trim(), department: profile.department || null,
      semester: profile.status === "graduated" ? "completed" : profile.semester,
      enrollmentDate: profile.enrollmentDate || null, status: profile.status,
      cgpa: profile.cgpa === "" ? null : Number(profile.cgpa), address: profile.address.trim(),
    };
    setSaving(true);
    try {
      const data = (await apiRequest("/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })) as { message?: string };
      setSuccess(data.message ?? "Profile saved successfully."); setActiveModal(null); setFieldErrors({}); await loadProfile();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your profile."); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    try { await apiRequest("/logout", { method: "POST" }); }
    finally { router.replace("/login"); }
  }

  const inputClass = "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
  const fieldClass = (name: string) => `${inputClass} ${fieldErrors[name] ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200"}`;

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"/><p className="text-sm font-semibold text-slate-700">Loading your profile...</p></div></main>;

  return (
    <main className="h-screen overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_#ede9fe_0%,_transparent_38%),linear-gradient(135deg,#f8f9ff_0%,#ffffff_58%,#fff7f5_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Navbar showProfileMenu onSignOut={handleLogout} />
      <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Student services / Account</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">My Profile</h1><p className="mt-1 text-sm text-slate-500">Manage your personal details and academic record.</p></div>
          <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"><span aria-hidden="true">←</span><span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span></Link>
        </div>

        <section className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_30px_-18px_rgba(49,46,129,0.35)] ring-1 ring-indigo-100/70 backdrop-blur sm:flex-row sm:items-center sm:p-4">
          <div className="flex min-w-0 items-center gap-3.5"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-lg font-bold text-white">{`${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.trim() || "S"}</div><div className="min-w-0"><h2 className="truncate font-bold text-slate-900">{`${profile.firstName} ${profile.lastName}`.trim() || "Student profile"}</h2><p className="truncate text-sm text-slate-500">{profile.email || "No email available"}</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${profile.accountStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>Account {profile.accountStatus}</span><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold capitalize text-violet-700">Academic status: {profile.status}</span></div>
        </section>

        {error && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</div>}
        {success && <div role="status" className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">{success}</div>}

        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">Your information</h2><p className="mt-0.5 text-sm text-slate-500">Select a section to review or update your record.</p></div><span className="hidden rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">Profile settings</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => { setActiveModal("personal"); setError(""); }} className="group relative overflow-hidden rounded-2xl border border-indigo-100/90 bg-white p-5 text-left shadow-[0_10px_35px_-25px_rgba(49,46,129,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70 sm:p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-300"/><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-2xl text-indigo-700" aria-hidden="true">♙</div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-indigo-700">Personal</span></div>
            <h3 className="mt-3 text-lg font-bold text-slate-950">Personal Information</h3><p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">Name, contact details, date of birth, and residential address.</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-indigo-700">View personal details</span><span className="text-lg text-indigo-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></div>
          </button>
          <button type="button" onClick={() => { setActiveModal("education"); setError(""); }} className="group relative overflow-hidden rounded-2xl border border-rose-100/90 bg-white p-5 text-left shadow-[0_10px_35px_-25px_rgba(190,54,87,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/60 sm:p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-300 to-rose-200"/><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-orange-50 text-2xl text-rose-600" aria-hidden="true">▤</div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Academic</span></div>
            <h3 className="mt-3 text-lg font-bold text-slate-950">Education Details</h3><p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">Department, semester, enrollment date, academic status, and CGPA.</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-rose-600">View education details</span><span className="text-lg text-rose-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></div>
          </button>
        </div>

        <p className="mt-auto pt-5 text-center text-[11px] text-slate-400">Student Portal <span className="px-1.5 text-indigo-300">•</span> Personal and academic information</p>
      </div>

      {activeModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setActiveModal(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]">
          <div className={`flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6 ${activeModal === "personal" ? "border-violet-100 bg-violet-50/70" : "border-rose-100 bg-rose-50/70"}`}>
            <div><p className={`text-xs font-bold uppercase tracking-[0.16em] ${activeModal === "personal" ? "text-indigo-600" : "text-rose-600"}`}>{activeModal === "personal" ? "Personal profile" : "Academic record"}</p><h2 id="profile-modal-title" className="mt-1 text-xl font-extrabold text-slate-900">{activeModal === "personal" ? "Personal Information" : "Education Details"}</h2><p className="mt-1 text-sm text-slate-500">Update the information below and save your changes.</p></div>
            <button type="button" onClick={() => setActiveModal(null)} aria-label="Close dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100">×</button>
          </div>
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="overflow-y-auto px-5 py-4 sm:px-6 [scrollbar-width:thin] [scrollbar-color:#c7d2fe_transparent]">
              {activeModal === "personal" ? <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div><label className={labelClass} htmlFor="firstName">First name <span className="text-rose-600">*</span></label><input id="firstName" name="firstName" value={profile.firstName} onChange={handleChange} className={fieldClass("firstName")} placeholder="Enter first name" aria-invalid={!!fieldErrors.firstName} aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined} />{fieldErrors.firstName && <p id="firstName-error" className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.firstName}</p>}</div>
                <div><label className={labelClass} htmlFor="lastName">Last name <span className="text-rose-600">*</span></label><input id="lastName" name="lastName" value={profile.lastName} onChange={handleChange} className={fieldClass("lastName")} placeholder="Enter last name" aria-invalid={!!fieldErrors.lastName} aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined} />{fieldErrors.lastName && <p id="lastName-error" className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.lastName}</p>}</div>
                <div><label className={labelClass} htmlFor="fatherName">Father&apos;s name</label><input id="fatherName" name="fatherName" value={profile.fatherName} onChange={handleChange} className={`${inputClass} border-slate-200`} placeholder="Enter father's name" /></div>
                <div><label className={labelClass} htmlFor="email">Email address</label><input id="email" value={profile.email} readOnly className={`${inputClass} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500`} /><p className="mt-1 text-xs text-slate-400">Managed by your account.</p></div>
                <div><label className={labelClass} htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleChange} className={`${inputClass} border-slate-200`} placeholder="e.g. 03XX XXXXXXX" /></div>
                <div><label className={labelClass} htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={handleChange} className={`${inputClass} border-slate-200`} /></div>
                <div><label className={labelClass} htmlFor="gender">Gender</label><select id="gender" name="gender" value={profile.gender} onChange={handleChange} className={`${inputClass} border-slate-200`}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div><label className={labelClass} htmlFor="city">City</label><input id="city" name="city" value={profile.city} onChange={handleChange} className={`${inputClass} border-slate-200`} placeholder="Enter your city" /></div>
                <div className="sm:col-span-2"><label className={labelClass} htmlFor="address">Residential address</label><textarea id="address" name="address" value={profile.address} onChange={handleChange} className={`${inputClass} min-h-24 resize-y border-slate-200`} placeholder="Enter your complete address" rows={3} /></div>
              </div> : <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={labelClass} htmlFor="department">Department</label><select id="department" name="department" value={profile.department} onChange={handleChange} className={`${inputClass} border-slate-200`}><option value="">Select department</option>{departments.map(department => <option key={department.value} value={department.value}>{department.label}</option>)}</select></div>
                <div><label className={labelClass} htmlFor="status">Academic status</label><select id="status" name="status" value={profile.status} onChange={handleChange} className={`${inputClass} border-slate-200`}><option value="active">Active student</option><option value="graduated">Graduated</option><option value="inactive">Inactive student</option></select><p className="mt-1 text-xs text-slate-400">Separate from account access status.</p></div>
                <div><label className={labelClass} htmlFor="semester">Semester</label><select id="semester" name="semester" value={profile.semester} onChange={handleChange} disabled={profile.status === "graduated"} className={`${inputClass} border-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100`}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={String(n)}>Semester {n}</option>)}<option value="completed">Completed</option></select></div>
                <div><label className={labelClass} htmlFor="enrollmentDate">Enrollment date</label><input id="enrollmentDate" name="enrollmentDate" type="date" value={profile.enrollmentDate} onChange={handleChange} className={`${inputClass} border-slate-200`} /></div>
                <div><label className={labelClass} htmlFor="cgpa">CGPA (0.00–4.00)</label><input id="cgpa" name="cgpa" type="number" min="0" max="4" step="0.01" value={profile.cgpa} onChange={handleChange} className={`${inputClass} border-slate-200`} placeholder="e.g. 3.50" /></div>
              </div>}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={() => { setActiveModal(null); setFieldErrors({}); setError(""); }} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving changes..." : "Save changes"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
