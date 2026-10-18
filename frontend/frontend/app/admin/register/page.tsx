"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../../lib/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type AdminRegisterResponse = {
  message: string;
};

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

// Reusable eye icon for showing and hiding passwords.
function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.1" />
      <path d="M6.2 6.2C3.9 7.8 2.8 10 2.5 12c.5 1.3 3.8 7 9.5 7 1.2 0 2.3-.2 3.3-.7" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default function AdminRegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  // Validate all fields before sending the registration request.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const newErrors: FieldErrors = {};

    if (!cleanEmail) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please create a password.";
    } else if (password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    } else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      newErrors.password =
        "Include uppercase and lowercase letters, a number, and a special character.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "The passwords do not match.";
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);

      const data = await apiRequest<AdminRegisterResponse>(
        "/admin/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      setMessage(data.message || "Admin account created successfully.");

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFieldErrors({});

      window.setTimeout(() => {
        router.push("/admin/login");
      }, 1200);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register the admin account."
      );
    } finally {
      setLoading(false);
    }
  }

  // Clear the relevant field error when the user edits that field.
  function updateEmail(value: string) {
    setEmail(value);
    setFieldErrors((previous) => ({
      ...previous,
      email: undefined,
    }));
    setError("");
  }

  function updatePassword(value: string) {
    setPassword(value);
    setFieldErrors((previous) => ({
      ...previous,
      password: undefined,
      confirmPassword: undefined,
    }));
    setError("");
  }

  function updateConfirmPassword(value: string) {
    setConfirmPassword(value);
    setFieldErrors((previous) => ({
      ...previous,
      confirmPassword: undefined,
    }));
    setError("");
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-[#174a86] focus:ring-blue-100"
    }`;

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col bg-[#f3f5f8] text-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-2 sm:px-6 lg:justify-center lg:py-1">
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-2 text-xs text-slate-500"
          >
            <Link href="/" className="transition hover:text-[#174a86]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/admin/login"
              className="transition hover:text-[#174a86]"
            >
              Admin Login
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-700">Registration</span>
          </nav>

          <div className="grid w-full grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,620px)_260px] lg:justify-center lg:gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#174a86]">
                  Administrator Portal
                </p>
                <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                  Create Admin Account
                </h1>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Enter your details to register a new administrator.
                </p>
              </div>

              <form noValidate onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Admin Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => updateEmail(event.target.value)}
                    placeholder="admin@example.com"
                    disabled={loading || Boolean(message)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email
                        ? "admin-register-email-error"
                        : undefined
                    }
                    className={inputClass(Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email && (
                    <p
                      id="admin-register-email-error"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => updatePassword(event.target.value)}
                      placeholder="Create a strong password"
                      disabled={loading || Boolean(message)}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password
                          ? "admin-register-password-error"
                          : "admin-register-password-hint"
                      }
                      className={`${inputClass(Boolean(fieldErrors.password))} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={loading || Boolean(message)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-[#174a86] focus:outline-none focus:text-[#174a86] disabled:cursor-not-allowed"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p
                      id="admin-register-password-error"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.password}
                    </p>
                  ) : (
                    <p
                      id="admin-register-password-hint"
                      className="mt-1 text-xs leading-4 text-slate-500"
                    >
                      Minimum 8 characters, including uppercase and lowercase
                      letters, a number, and a special character.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        updateConfirmPassword(event.target.value)
                      }
                      placeholder="Enter your password again"
                      disabled={loading || Boolean(message)}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={
                        fieldErrors.confirmPassword
                          ? "admin-register-confirm-error"
                          : undefined
                      }
                      className={`${inputClass(Boolean(fieldErrors.confirmPassword))} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      disabled={loading || Boolean(message)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-[#174a86] focus:outline-none focus:text-[#174a86] disabled:cursor-not-allowed"
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p
                      id="admin-register-confirm-error"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700"
                  >
                    <p className="font-semibold">Registration failed</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                )}

                {message && (
                  <div
                    role="status"
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-800"
                  >
                    {message} Redirecting to admin login...
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || Boolean(message)}
                  className="w-full rounded-md bg-[#174a86] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123b73] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating Account..." : "Create Admin Account"}
                </button>
              </form>

              <div className="mt-4 border-t border-slate-200 pt-3 text-center">
                <p className="text-sm text-slate-600">
                  Already have an administrator account?
                </p>
                <Link
                  href="/admin/login"
                  className="mt-1 inline-block text-sm font-semibold text-[#174a86] transition hover:text-[#f97360]"
                >
                  Sign in to Admin Portal
                </Link>
              </div>
            </section>

            <aside className="rounded-lg border border-slate-200 border-t-4 border-t-[#f97360] bg-[#edf2fa] p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#174a86] text-sm font-bold text-white">
                  A
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Admin Registration
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Account setup information
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Before you continue
                </h3>
                <ul className="mt-2.5 space-y-2.5 text-sm leading-5 text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-[#174a86]">
                      1
                    </span>
                    <span>Use a valid email address.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-[#174a86]">
                      2
                    </span>
                    <span>
                      Create a strong password that meets all requirements.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-[#174a86]">
                      3
                    </span>
                    <span>Confirm your password before submitting.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-md border border-[#f5c2b8] bg-white p-3">
                <p className="text-sm font-semibold text-slate-800">
                  Administrator limit
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  The system allows a maximum of three administrator accounts.
                  The server rejects additional registrations once this limit
                  is reached.
                </p>
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f97360]" />
                <p>Already registered? Sign in through the admin login page.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}