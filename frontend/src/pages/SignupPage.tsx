import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { registerUser } from "../lib/auth";
import type { SessionUser } from "../lib/auth";

type SignupPageProps = {
  onSignupSuccess: (user: SessionUser) => void;
};

export default function SignupPage({ onSignupSuccess }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = registerUser(name, email, password);
      onSignupSuccess(user);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to create account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50 px-4 py-6">
      <div className="mx-auto grid h-[60vh] min-h-[520px] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <div className="flex items-center bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">OncoAssist</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">Create Your Secure Account</h1>
            <p className="mt-4 text-sm text-slate-300">
              Set up your profile to track risk reports, hospital finder preferences, and AI-assisted health conversations.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-200">
              <li>- Access dashboard and report history</li>
              <li>- Save personalized recommendations</li>
              <li>- Continue chat context across sessions</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-2xl font-semibold text-slate-900">Sign Up</h2>
            <p className="mt-2 text-sm text-slate-600">Create your account to begin using OncoAssist.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                  placeholder="Dr. Alex Morgan"
                  autoComplete="name"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </label>

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
