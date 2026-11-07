import { useEffect } from "react";
import { useRTDB, rtdbSet } from "../hooks/useRealtimeDatabase";

export default function RTDBTest() {
  const { value, loading, error } = useRTDB("/public/videos");
  // console.log("RealTime Database", value)

  if (loading) return <div></div>
  return (
    <pre>
      {value.map(v => <div>{v.name}</div>)}
    </pre>
  );
}
