
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import Navbar from "../components/Navbar";

type SessionResponse = {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
};

type ChangePasswordResponse = {
  message: string;
};

type FieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Protect this page so only logged-in students can access it.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const data = await apiRequest<SessionResponse>("/session");

        if (cancelled) return;

        if (!data.authenticated || !data.user) {
          router.replace("/login");
          return;
        }

        if (data.user.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }

        if (data.user.role !== "user") {
          router.replace("/login");
          return;
        }

        setCheckingSession(false);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Check the password requirements in one place.
  const passwordRules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    different: currentPassword.length > 0 &&
      newPassword !== currentPassword,
  };

  const passwordIsValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.different;

  // Validate one field so users see clear, field-specific feedback.
  function validateField(
    field: keyof FieldErrors,
    current = currentPassword,
    next = newPassword,
    confirmation = confirmPassword
  ): string {
    if (field === "currentPassword") {
      if (!current) return "This field must be filled.";
    }

    if (field === "newPassword") {
      if (!next) return "This field must be filled.";
      if (next.length < 8) return "Use at least 8 characters.";
      if (!/[A-Z]/.test(next))
        return "Include at least one uppercase letter.";
      if (!/[a-z]/.test(next))
        return "Include at least one lowercase letter.";
      if (!/[0-9]/.test(next))
        return "Include at least one number.";
      if (!/[^A-Za-z0-9]/.test(next))
        return "Include at least one special character.";
      if (current && next === current)
        return "Choose a password different from your current one.";
    }

    if (field === "confirmPassword") {
      if (!confirmation) return "This field must be filled.";
      if (next !== confirmation)
        return "The passwords do not match.";
    }

    return "";
  }

  // Update field values and refresh validation after submission or interaction.
  function updateField(
    field: keyof FieldErrors,
    value: string
  ) {
    setError("");
    setMessage("");

    if (field === "currentPassword") setCurrentPassword(value);
    if (field === "newPassword") setNewPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    const current =
      field === "currentPassword" ? value : currentPassword;
    const next =
      field === "newPassword" ? value : newPassword;
    const confirmation =
      field === "confirmPassword" ? value : confirmPassword;

    if (submitted) {
      setFieldErrors({
        currentPassword: validateField(
          "currentPassword", current, next, confirmation
        ),
        newPassword: validateField(
          "newPassword", current, next, confirmation
        ),
        confirmPassword: validateField(
          "confirmPassword", current, next, confirmation
        ),
      });
    } else {
      setFieldErrors((previous) => ({
        ...previous,
        [field]: "",
        ...(field === "currentPassword" || field === "newPassword"
          ? { newPassword: "" }
          : {}),
        ...(field === "newPassword" || field === "confirmPassword"
          ? { confirmPassword: "" }
          : {}),
      }));
    }
  }

  // Validate all fields before sending the request to the backend.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted(true);
    setMessage("");
    setError("");

    const errors: FieldErrors = {
      currentPassword: validateField("currentPassword"),
      newPassword: validateField("newPassword"),
      confirmPassword: validateField("confirmPassword"),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) return;

    try {
      setLoading(true);

      const data = await apiRequest<ChangePasswordResponse>(
        "/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      setMessage(data.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      setFieldErrors({});
      setSubmitted(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Reusable eye icon button for each password field.
  function EyeButton({
    visible,
    onClick,
    label,
  }: {
    visible: boolean;
    onClick: () => void;
    label: string;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${visible ? "Hide" : "Show"} ${label}`}
        title={`${visible ? "Hide" : "Show"} ${label}`}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#174A86] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#174A86]"
      >
        {visible ? (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8" />
            <path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10 10 0 0 0 4-.8" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    );
  }

  // Display a compact loading state while the session is checked.
  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F5F8]">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#174A86]" />
          <p className="text-sm font-medium text-slate-600">
            Verifying your session...
          </p>
        </div>
      </main>
    );
  }

  const inputClass = (field: keyof FieldErrors) =>
    `h-10 w-full rounded-lg border bg-white px-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
      fieldErrors[field]
        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
        : "border-slate-300 focus:border-[#174A86] focus:ring-blue-100"
    }`;

  const labelClass =
    "mb-1.5 block text-sm font-semibold text-[#123B73]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F3F5F8] text-slate-800 lg:h-screen lg:overflow-hidden">
      <Navbar showProfileMenu />

      <section className="mx-auto w-full max-w-5xl px-4 pb-5 pt-5 sm:px-6 lg:flex lg:h-[calc(100vh-68px)] lg:flex-col lg:justify-center lg:py-4">
        {/* Page heading */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              title="Back to Dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#174A86] shadow-sm transition hover:border-[#174A86] hover:bg-blue-50"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
                <path d="M9 12h12" />
              </svg>
            </Link>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#174A86]">
                Student Portal
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-[#123B73] sm:text-2xl">
                Change Password
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Update your account security settings.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="hidden shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#174A86] shadow-sm transition hover:bg-blue-50 sm:inline-flex"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9v11h14V9" />
              <path d="M9 20v-6h6v6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Narrower two-column layout */}
        <div className="mx-auto grid w-full max-w-4xl gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          {/* Password form card */}
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#123B73] text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#123B73]">
                  Password Details
                </h2>
                <p className="text-xs text-slate-500">
                  Complete all three fields.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {/* Current password */}
              <div>
                <label htmlFor="currentPassword" className={labelClass}>
                  Current Password <span className="text-[#F97360]">*</span>
                </label>

                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) =>
                      updateField("currentPassword", event.target.value)
                    }
                    onBlur={() =>
                      setFieldErrors((previous) => ({
                        ...previous,
                        currentPassword: validateField("currentPassword"),
                        newPassword: submitted
                          ? validateField("newPassword")
                          : previous.newPassword,
                      }))
                    }
                    placeholder="Enter current password"
                    aria-invalid={Boolean(fieldErrors.currentPassword)}
                    aria-describedby={
                      fieldErrors.currentPassword
                        ? "currentPassword-error"
                        : undefined
                    }
                    className={inputClass("currentPassword")}
                  />
                  <EyeButton
                    visible={showCurrent}
                    onClick={() => setShowCurrent((value) => !value)}
                    label="current password"
                  />
                </div>

                {fieldErrors.currentPassword && (
                  <p
                    id="currentPassword-error"
                    className="mt-1 text-xs font-medium text-rose-600"
                  >
                    {fieldErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New password */}
              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  New Password <span className="text-[#F97360]">*</span>
                </label>

                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) =>
                      updateField("newPassword", event.target.value)
                    }
                    onBlur={() =>
                      setFieldErrors((previous) => ({
                        ...previous,
                        newPassword: validateField("newPassword"),
                        confirmPassword: confirmPassword
                          ? validateField("confirmPassword")
                          : previous.confirmPassword,
                      }))
                    }
                    placeholder="Create a new password"
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                    aria-describedby="password-requirements"
                    className={inputClass("newPassword")}
                  />
                  <EyeButton
                    visible={showNew}
                    onClick={() => setShowNew((value) => !value)}
                    label="new password"
                  />
                </div>

                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {fieldErrors.newPassword}
                  </p>
                )}

                {/* Live password requirements */}
                <div
                  id="password-requirements"
                  className="mt-2 rounded-lg bg-[#F3F5F8] p-3"
                >
                  <p className="mb-2 text-xs font-bold text-[#123B73]">
                    Password requirements
                  </p>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {[
                      { label: "8+ characters", met: passwordRules.length },
                      { label: "Uppercase letter", met: passwordRules.uppercase },
                      { label: "Lowercase letter", met: passwordRules.lowercase },
                      { label: "At least one number", met: passwordRules.number },
                      { label: "Special character", met: passwordRules.special },
                      {
                        label: "Different from current",
                        met: passwordRules.different,
                      },
                    ].map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-start gap-1.5 text-[11px] ${
                          rule.met ? "text-[#174A86]" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                            rule.met
                              ? "bg-[#174A86] text-white"
                              : "border border-slate-300 text-slate-400"
                          }`}
                        >
                          {rule.met ? "✓" : ""}
                        </span>
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm New Password{" "}
                  <span className="text-[#F97360]">*</span>
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    onBlur={() =>
                      setFieldErrors((previous) => ({
                        ...previous,
                        confirmPassword: validateField("confirmPassword"),
                      }))
                    }
                    placeholder="Re-enter new password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                    className={inputClass("confirmPassword")}
                  />
                  <EyeButton
                    visible={showConfirm}
                    onClick={() => setShowConfirm((value) => !value)}
                    label="password confirmation"
                  />
                </div>

                {fieldErrors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="mt-1 text-xs font-medium text-rose-600"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Server response */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-[#174A86]"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (submitted && !passwordIsValid)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#174A86] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#103765] focus:outline-none focus:ring-2 focus:ring-[#174A86] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 15v2" />
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    Update Password
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Compact security information card */}
          <aside className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="absolute left-0 top-0 h-1 w-full bg-[#F97360]" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#174A86]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#123B73]">
                  Account Security
                </h2>
                <p className="text-xs text-slate-500">
                  Protect your student account
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Your account protects your personal information and academic
              records. Follow these practices to help keep it secure.
            </p>

            <div className="my-4 border-t border-slate-100" />

            <h3 className="text-sm font-bold text-[#123B73]">
              Security tips
            </h3>

            <ul className="mt-3 space-y-3">
              {[
                "Use a unique password for your student account.",
                "Never share your password with anyone.",
                "Avoid using personal details in your password.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#174A86]">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-lg border border-[#F97360]/30 bg-[#FFF5F2] p-3">
              <p className="text-xs font-bold text-[#123B73]">
                Important
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Choose a password you have not used for another account.
              </p>
            </div>
          </aside>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Student Management System · Secure Account Settings
        </p>
      </section>
    </main>
  );
}
