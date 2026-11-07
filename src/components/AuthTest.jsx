import useAuth from "../hooks/useAuth";

export default function AuthTest() {
  const { user, loading, error, signInGoogle, logout, register, signIn } = useAuth();

  if (loading) return <Card>Checking auth…</Card>;
  return (
    <Card title="Auth Test">
      {error && <p className="text-red-600 text-sm">{error.message}</p>}
      {user ? (
        <>
          <p className="mb-2">Logged in as <b>{user.displayName || user.email}</b></p>
          <button className="btn" onClick={logout}>Sign out</button>
        </>
      ) : (
        <>
          <button className="btn mr-2" onClick={signInGoogle}>Sign in with Google</button>
          <button
            className="btn"
            onClick={() => signIn("test@example.com", "password123").catch(console.error)}
          >
            Sign in (email/pass)
          </button>
          <div className="text-xs mt-2 opacity-70">
            Tip: First time? Click below to create a test user.
          </div>
          <button
            className="btn mt-2"
            onClick={() => register("test@example.com", "password123", "Test User").catch(console.error)}
          >
            Register test user
          </button>
        </>
      )}
    </Card>
  );
}

function Card({ title = "Auth", children }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}