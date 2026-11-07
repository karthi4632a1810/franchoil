// Admin dashboard login only — customers use /login
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export default function Auth() {
    const navigate = useNavigate();
    const { user, signIn, signInGoogle, logout } = useAuth();
    const isAdmin = !!user && (user.isAdmin || ADMIN_EMAILS.includes((user.email || "").toLowerCase()));

    const [form, setForm] = useState({ email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        if (isAdmin) {
            navigate("/admin/panel", { replace: true });
            return;
        }
        if (user && !user.isAnonymous && !isAdmin) {
            logout().then(() => {
                setErr("This Google account is not authorized for admin access.");
            });
        }
    }, [user, isAdmin, navigate, logout]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setErr("");
        setMsg("");
        if (!form.email.trim() || !form.password) {
            setErr("Enter admin email or client ID and password.");
            return;
        }
        try {
            setBusy(true);
            await signIn(form.email.trim(), form.password);
            setMsg("Welcome. Redirecting to admin panel…");
        } catch (e) {
            setErr(e?.message || "Login failed.");
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
        <div className="min-h-screen text-xl flex fixed inset-0 items-center justify-center bg-slate-900 p-4 z-999">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="text-3xl font-bold text-center text-black">Admin login</h2>
                <p className="text-center text-sm text-slate-600 mt-2">
                    Staff only — manage orders, products, and settings.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
                    <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 text-black border border-slate-400 focus:outline-none focus:border-green-700"
                        placeholder="Admin email or Client ID"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                    />

                    <div className="flex w-full items-center gap-2">
                        <input
                            type={showPass ? "text" : "password"}
                            className="flex-1 w-full px-3 py-2 rounded-lg bg-slate-100 text-black border border-slate-400 focus:outline-none focus:border-green-700"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            required
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="px-3 py-2 bg-slate-200 rounded-lg text-black text-sm">
                            {showPass ? "Hide" : "Show"}
                        </button>
                    </div>

                    {err && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm border border-red-200">{err}</div>}
                    {msg && <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm border border-green-200">{msg}</div>}

                    <button
                        type="submit"
                        disabled={busy}
                        className="bg-green-700 hover:bg-green-800 transition-colors text-white rounded-lg py-2.5 disabled:opacity-60"
                    >
                        {busy ? "Please wait…" : "Sign in to admin"}
                    </button>
                </form>

                <div className="flex items-center gap-2 text-slate-400 text-sm my-4">
                    <span className="flex-1 h-px bg-slate-300" />
                    OR
                    <span className="flex-1 h-px bg-slate-300" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="bg-white border border-slate-300 flex justify-center items-center gap-3 text-slate-800 w-full rounded-lg py-2.5 hover:bg-slate-50 disabled:opacity-60"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 14 14" aria-hidden="true">
                        <path fill="currentColor" d="M7.14 8.33v-2.6h6.69c.1.44.18.85.18 1.44c0 4-2.74 6.84-6.86 6.84S0 10.86 0 7s3.2-7 7.14-7c1.93 0 3.54.69 4.78 1.83L9.89 3.76c-.51-.48-1.41-1.04-2.75-1.04c-2.36 0-4.29 1.93-4.29 4.28s1.93 4.28 4.29 4.28c2.74 0 3.74-1.86 3.93-2.95H7.13Z" />
                    </svg>
                    Sign in with Google
                </button>

                <p className="text-center text-xs text-slate-500 mt-3 m-0">
                    Only approved staff Google accounts can access admin.
                </p>

                <p className="text-center text-sm text-slate-500 mt-6 m-0">
                    Shopping on the website?{" "}
                    <Link to="/login" className="text-green-700 font-medium hover:underline">
                        Customer login
                    </Link>
                </p>
            </div>
        </div>
    );
}
