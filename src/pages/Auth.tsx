import React, { useState } from "react";

// PUBLIC asset path — keep the file here: /public/brand/Learnd_Logo_v4_Transparent.png
// If your logo path is different, update the src below.
const LOGO_SRC = "/brand/Learnd_Logo_v4_Transparent.png";

export default function AuthPage() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb] text-slate-900 antialiased">
      {/* Page wrapper */}
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4">
        {/* Header / Logo */}
        <header className="flex flex-col items-center pt-8 sm:pt-10">
          <img
            src={LOGO_SRC}
            alt="Learnd logo"
            className="h-14 w-auto select-none" // keep logo modest
            draggable={false}
          />
          {/* ↓ tighten the vertical gap under the logo intentionally */}
          <div className="h-3" />
          <p className="text-slate-500 text-sm sm:text-base">Learn. Improve. Repeat.</p>
        </header>

        {/* Auth Card */}
        <main className="mx-auto my-6 w-full max-w-xl flex-1">
          <div className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)] ring-1 ring-slate-100">
            {/* Card header */}
            <div className="px-6 pb-2 pt-6 sm:px-8">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Authentication</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account or create a new one</p>

              {/* Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("signIn")}
                  className={
                    "rounded-lg px-4 py-2 transition" +
                    (mode === "signIn"
                      ? " bg-white shadow-sm"
                      : " text-slate-500 hover:text-slate-700")
                  }
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signUp")}
                  className={
                    "rounded-lg px-4 py-2 transition" +
                    (mode === "signUp"
                      ? " bg-white shadow-sm"
                      : " text-slate-500 hover:text-slate-700")
                  }
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 pb-6 sm:px-8">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    required
                  />
                </div>

                {/* Forgot password */}
                {mode === "signIn" && (
                  <div className="flex justify-end">
                    <a href="#/forgot-password" className="text-sm font-semibold text-rose-500 hover:text-rose-600">
                      Forgot your password?
                    </a>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl px-5 py-3 text-center text-base font-bold text-white shadow-lg transition active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #ff7a18 0%, #ff1e8a 100%)", // orange → fuchsia (matches logo)
                  }}
                >
                  {mode === "signIn" ? "Sign In" : "Create Account"}
                </button>

                {/* Alt auth — optional placeholder */}
                <div className="pt-1 text-center text-xs text-slate-400">
                  By continuing you agree to Learnd’s Terms & Privacy.
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Footer (kept compact so the logo gap stays tight) */}
        <footer className="pb-6 pt-2 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Learnd
        </footer>
      </div>

      {/* Optional: remove any global top padding that other layouts add around auth */}
      <style>{`
        /* In case a layout adds large top gap for pages, clamp it here */
        .auth-page header { margin-bottom: 0; }
      `}</style>
    </div>
  );
}