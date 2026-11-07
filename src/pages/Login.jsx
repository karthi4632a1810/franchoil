import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export default function Login() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { user, signIn, register, resetPassword, signInGoogle, logout } = useAuth();

    const [mode, setMode] = useState(state?.mode || "login");
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [showPass, setShowPass] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        if (user?.isAdmin) {
            logout().then(() => {
                setErr("Admin accounts must sign in at /auth");
            });
            return;
        }
        if (user && !user.isAnonymous) {
            const returnTo = state?.returnTo || "/my-orders";
            navigate(returnTo, { replace: true });
        }
    }, [user, navigate, state?.returnTo, logout]);

    const isSignup = mode === "signup";
    const isLogin = mode === "login";
    const isReset = mode === "reset";

    const passwordScore = useMemo(() => {
        const p = form.password || "";
        let score = 0;
        if (p.length >= 6) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[a-z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return Math.min(score, 4);
    }, [form.password]);

    const validate = () => {
        const errors = [];
        const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
        if ((isSignup || isReset) && !emailLooksValid) errors.push("Enter a valid email.");
        if (isLogin && !form.email.trim()) errors.push("Enter your email.");
        if (isSignup) {
            if (!form.name.trim()) errors.push("Name is required.");
            if ((form.password || "").length < 6) errors.push("Password must be at least 6 characters.");
            if (form.password !== form.confirm) errors.push("Passwords do not match.");
        }
        if (isLogin && !(form.password || "").length) errors.push("Password is required.");
        if (isReset && !emailLooksValid) errors.push("Enter a valid email to reset.");
        return errors;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setErr("");
        setMsg("");
        const errors = validate();
        if (errors.length) {
            setErr(errors.join(" "));
            return;
        }
        if (isLogin && ADMIN_EMAILS.includes(form.email.trim().toLowerCase())) {
            setErr("Staff/admin accounts must sign in at the Admin Portal (/auth). Click 'Admin login' below.");
            return;
        }
        try {
            setBusy(true);
            if (isSignup) {
                await register(form.email, form.password, form.name.trim(), "");
                setMsg("Account created. Redirecting…");
            } else if (isLogin) {
                await signIn(form.email.trim(), form.password);
                setMsg("Welcome back! Redirecting…");
            } else if (isReset) {
                await resetPassword(form.email);
                setMsg("Password reset email sent. Check your inbox.");
            }
        } catch (e) {
            setErr(e?.message || "Something went wrong.");
        } finally {
            setBusy(false);
        }
    };

    const handleGoogle = async () => {
        setErr("");
        setMsg("");
        try {
            setBusy(true);
            await signInGoogle();
            setMsg("Signed in with Google. Redirecting…");
        } catch (e) {
            setErr(e?.message || "Google sign-in failed.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen poppins flex items-center justify-center bg-slate-100 p-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                <h1 className="text-2xl font-bold text-center text-slate-900 m-0">Customer login</h1>
                <p className="text-center text-sm text-slate-600 mt-2 m-0">
                    {isLogin && "Sign in to shop and track your orders on any device."}
                    {isSignup && "Create your account to checkout and track orders."}
                    {isReset && "Reset your password"}
                </p>

                <div className="grid grid-cols-3 gap-2 bg-slate-100 rounded-xl mt-5 p-1">
                    <button type="button" onClick={() => setMode("login")} className={`py-2 rounded-lg text-sm ${isLogin ? "bg-green-700 text-white" : "text-slate-700"}`}>Login</button>
                    <button type="button" onClick={() => setMode("signup")} className={`py-2 rounded-lg text-sm ${isSignup ? "bg-green-700 text-white" : "text-slate-700"}`}>Sign up</button>
                    <button type="button" onClick={() => setMode("reset")} className={`py-2 rounded-lg text-sm ${isReset ? "bg-green-700 text-white" : "text-slate-700"}`}>Forgot?</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
                    {isSignup && (
                        <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 focus:outline-none focus:border-green-700"
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    )}

                    <input
                        type="email"
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 focus:outline-none focus:border-green-700"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                    />

                    {(isLogin || isSignup) && (
                        <div>
                            <div className="flex w-full items-center gap-2">
                                <input
                                    type={showPass ? "text" : "password"}
                                    className="flex-1 w-full px-3 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 focus:outline-none focus:border-green-700"
                                    placeholder={isSignup ? "Create password" : "Password"}
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="px-3 py-2 bg-slate-200 rounded-lg text-slate-800 text-sm">
                                    {showPass ? "Hide" : "Show"}
                                </button>
                            </div>
                            {isSignup && (
                                <div className="h-1 w-full bg-slate-200 rounded mt-1 overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all" style={{ width: `${(passwordScore + 1) * 20}%` }} />
                                </div>
                            )}
                        </div>
                    )}

                    {isSignup && (
                        <input
                            type={showPass ? "text" : "password"}
                            className="w-full px-3 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 focus:outline-none focus:border-green-700"
                            placeholder="Confirm password"
                            value={form.confirm}
                            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                            required
                        />
                    )}

                    {err && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm border border-red-200">{err}</div>}
                    {msg && <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm border border-green-200">{msg}</div>}

                    <button
                        type="submit"
                        disabled={busy}
                        className="bg-green-700 hover:bg-green-800 transition-colors text-white rounded-lg py-2.5 mt-1 disabled:opacity-60"
                    >
                        {busy ? "Please wait…" : isSignup ? "Create account" : isReset ? "Send reset link" : "Sign in"}
                    </button>
                </form>

                {!isReset && (
                    <>
                        <div className="flex items-center gap-2 text-slate-400 text-sm my-4">
                            <span className="flex-1 h-px bg-slate-300" />
                            OR
                            <span className="flex-1 h-px bg-slate-300" />
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={busy}
                            className="group bg-white border border-slate-200 flex justify-center items-center gap-3 text-slate-700 font-medium w-full rounded-xl py-2.5 shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            aria-label="Sign in with Google"
                        >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.05em" height="1.05em" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.2 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.41 6.5 29.46 4 24 4C12.95 4 4 12.95 4 24s8.95 20 20 20s20-8.95 20-20c0-1.34-.14-2.65-.39-3.92Z"/>
                                <path fill="#FF3D00" d="M6.31 14.69l6.57 4.82C14.66 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.41 6.5 29.46 4 24 4c-7.68 0-14.34 4.34-17.69 10.69Z"/>
                                <path fill="#4CAF50" d="M24 44c5.35 0 10.21-2.05 13.89-5.39l-6.41-5.42C29.41 34.74 26.82 36 24 36c-5.18 0-9.62-3.32-11.28-7.94l-6.52 5.02C9.5 39.56 16.23 44 24 44Z"/>
                                <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3c-.79 2.18-2.19 4.08-3.82 5.19l.01-.01l6.41 5.42C37.44 39 44 34 44 24c0-1.34-.14-2.65-.39-3.92Z"/>
                                </svg>
                            </span>
                            <span className="tracking-[0.01em]">Continue with Google</span>
                        </button>
                    </>
                )}

                <p className="text-center text-xs text-slate-500 mt-5 m-0">
                    Staff member?{" "}
                    <Link to="/auth" className="text-green-700 font-medium hover:underline">
                        Admin login
                    </Link>
                </p>
            </div>
        </div>
    );
}
