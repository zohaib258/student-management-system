
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type LoginResponse = {
  message?: string;
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
};

type FieldErrors = {
  email?: string;
  password?: string;
};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {visible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3" />
          <path d="M6.2 6.2C3.9 7.6 2.7 9.7 2.5 12c.8 2.2 4.3 7 9.5 7 1 0 2-.2 2.9-.5" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validateForm() {
    const errors: FieldErrors = {};
    const cleanEmail = email.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      errors.email = "Please enter your email address.";
    } else if (
      cleanEmail.length > 254 ||
      !emailPattern.test(cleanEmail)
    ) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      // Student login must not redirect an administrator to the student dashboard.
      if (response.user?.role === "admin") {
        setError("Please use the administrator login page.");
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#174a86] focus:ring-2 focus:ring-blue-100";

  const passwordToggleClass =
    "absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-[#174a86] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#174a86]";

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col bg-[#f3f5f8] text-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-3 sm:px-6 lg:justify-center lg:py-2">
          <div className="mb-2 shrink-0 text-xs text-slate-500">
            Home <span className="mx-1.5 text-slate-400">/</span>
            <span className="font-semibold text-[#174a86]">Student Login</span>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,620px)_260px] lg:justify-center lg:gap-5">
            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#174a86]">
                  Student Portal
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome back
                </h1>

                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  Sign in to access your student account and academic
                  information.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFieldErrors((previous) => ({
                        ...previous,
                        email: undefined,
                      }));
                      setError("");
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? "email-error" : undefined
                    }
                    className={`${inputClass} ${
                      fieldErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setFieldErrors((previous) => ({
                          ...previous,
                          password: undefined,
                        }));
                        setError("");
                      }}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? "password-error" : undefined
                      }
                      className={`${inputClass} pr-12 ${
                        fieldErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className={passwordToggleClass}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>

                  {fieldErrors.password && (
                    <p
                      id="password-error"
                      className="mt-1 text-xs text-red-600"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-md bg-[#174a86] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123b73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174a86] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#174a86] underline-offset-4 hover:text-[#123b73] hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </form>
            </section>

            <aside className="min-w-0 self-start rounded-lg border border-slate-200 border-t-4 border-t-[#f97360] bg-[#edf2fa] p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#174a86] text-sm font-bold text-white">
                SP
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Secure student access
              </h2>

              <p className="mt-2 text-sm leading-5 text-slate-600">
                Sign in to manage your student information through the
                Student Portal.
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#174a86] ring-1 ring-slate-200">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Sign in with your email
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Use the email address registered with your account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#174a86] ring-1 ring-slate-200">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Access your dashboard
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      View your account and student portal features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-3">
                <p className="text-xs leading-5 text-slate-500">
                  Keep your login credentials private. Sign out when using a
                  shared computer.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
