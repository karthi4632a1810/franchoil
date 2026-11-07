import { useMemo, useState } from "react";
import { db } from "../firebase/config";
import { addDoc, collection, serverTimestamp, orderBy, query } from "firebase/firestore";
import { useCollection } from "../hooks/useFirestore";

export default function FirestoreTest() {
  const [text, setText] = useState("");
  const col = useMemo(() => collection(db, "debugMessages"), []);
  const q = useMemo(() => query(col, orderBy("createdAt", "desc")), [col]);
  const { data: items, loading, error } = useCollection(q);

  const addItem = async () => {
    if (!text.trim()) return;
    await addDoc(col, { text: text.trim(), createdAt: serverTimestamp() });
    setText("");
  };

  return (
    <Card title="Firestore Test">
      {error && <p className="text-red-600 text-sm">{error.message}</p>}
      <div className="flex gap-2 mb-3">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <button className="btn" onClick={addItem}>Add</button>
      </div>
      {loading ? <p>Loading…</p> : (
        <ul className="space-y-1">
          {items.map(it => <li key={it.id} className="text-sm">• {it.text || <i>(no text)</i>}</li>)}
        </ul>
      )}
    </Card>
  );
}

function Card({ title, children }) {
  return <div className="rounded-2xl border p-4 shadow-sm bg-white">
    <h3 className="font-semibold mb-3">{title}</h3>{children}
  </div>;
}