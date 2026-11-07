// src/hooks/useRealtimeDatabase.js
import { useEffect, useState } from "react";
import { rtdb } from "../firebase/config";
import { ref, onValue, set, update, push } from "firebase/database";

export function useRTDB(path) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    const r = ref(rtdb, path);
    const unsub = onValue(
      r,
      (snap) => { setValue(snap.val()); setLoading(false); },
      (e) => { setError(e); setLoading(false); }
    );
    return () => unsub();
  }, [path]);

  return { value, loading, error };
}

export const rtdbSet = (path, val) => set(ref(rtdb, path), val);
export const rtdbUpdate = (path, val) => update(ref(rtdb, path), val);
export const rtdbPush = (path, val) => push(ref(rtdb, path), val);