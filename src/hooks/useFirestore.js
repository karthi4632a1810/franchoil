// src/hooks/useFirestore.js
import { useEffect, useState } from "react";
import { firestore as db } from "../firebase/config";
import {
  getDoc, getDocs, doc, collection, query as fsQuery,
} from "firebase/firestore";

export function useDoc(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    let isMounted = true;
    setLoading(true);
    const ref = doc(db, path);
    
    getDoc(ref).then((snap) => {
      if (isMounted) {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      }
    }).catch((e) => {
      if (isMounted) {
        setError(e);
        setLoading(false);
      }
    });
    
    return () => { isMounted = false; };
  }, [path]);

  return { data, loading, error };
}

export function useCollection(queryObj) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(queryObj));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queryObj) return;
    let isMounted = true;
    setLoading(true);
    
    getDocs(queryObj).then((snap) => {
      if (isMounted) {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    }).catch((e) => {
      if (isMounted) {
        setError(e);
        setLoading(false);
      }
    });
    
    return () => { isMounted = false; };
  }, [queryObj]);

  return { data, loading, error };
}

export { collection, fsQuery as query };