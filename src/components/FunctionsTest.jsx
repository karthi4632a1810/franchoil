import { useState } from "react";
import useCallable from "../hooks/useCallable";

export default function FunctionsTest() {
  const callPing = useCallable("ping");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setErr(null);
    try {
      const data = await callPing();
      setRes(data);
    } catch (e) {
      setErr(e);
    }
  };

  return (
    <Card title="Functions Test">
      <button className="btn mb-2" onClick={run}>Call ping()</button>
      {err && <p className="text-red-600 text-sm">{err.message}</p>}
      {res && <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(res, null, 2)}</pre>}
    </Card>
  );
}

function Card({ title, children }) {
  return <div className="rounded-2xl border p-4 shadow-sm bg-white">
    <h3 className="font-semibold mb-3">{title}</h3>{children}
  </div>;
}