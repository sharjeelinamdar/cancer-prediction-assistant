import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { loginWithCredentials } from "../lib/auth";
import type { SessionUser } from "../lib/auth";

type LoginPageProps = {
  onLoginSuccess: (user: SessionUser) => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = loginWithCredentials(email, password);
      onLoginSuccess(user);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to login right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 px-4 py-6">
      <div className="mx-auto grid h-[60vh] min-h-[520px] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <div className="flex items-center bg-slate-900 p-8 text-white lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">OncoAssist</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">Secure Access For Clinical Intelligence</h1>
            <p className="mt-4 text-sm text-slate-300">
              Sign in to view reports, risk insights, hospital recommendations, and your personalized cancer-care guidance.
            </p>
            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-200">
              Demo tip: create an account from the signup screen first, then sign in.
            </div>
          </div>
        </div>

        <div className="flex items-center p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
            <p className="mt-2 text-sm text-slate-600">Welcome back. Enter your credentials to continue.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </label>

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Do not have an account?{" "}
              <Link to="/signup" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
