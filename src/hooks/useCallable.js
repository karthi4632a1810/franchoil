import { useCallback } from "react";
import { functions } from "../firebase/config";
import { httpsCallable } from "firebase/functions";


export default function useCallable(name) {
  return useCallback(async (payload) => {
    const fn = httpsCallable(functions, name);
    const res = await fn(payload);
    return res.data;
  }, [name]);
}