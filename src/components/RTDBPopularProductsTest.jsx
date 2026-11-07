import { useEffect, useState } from "react";
import { useRTDB } from "../hooks/useRealtimeDatabase";
import { dbSet } from "../firebase/config"; // our helper from config.js

export default function RTDBPopularProductsTest() {
    const PATH = "public/popularProducts";
    const { value, loading, error } = useRTDB(PATH);

    // local editable list (always an array)
    const [list, setList] = useState([]);

    useEffect(() => {
        if (!loading) {
            const arr = Array.isArray(value) ? value : [];
            setList(arr);
        }
    }, [loading, value]);

    const add = (id) => {
        if (!id.trim()) return;
        setList((prev) => [...prev, id.trim()]);
    };

    const updateAt = (idx, id) => {
        setList((prev) => prev.map((x, i) => (i === idx ? id : x)));
    };

    const removeAt = (idx) => {
        setList((prev) => prev.filter((_, i) => i !== idx));
    };

    const save = async () => {
        // Write the full array back to RTDB
        await dbSet(PATH, list);
        alert("Saved to RTDB ✅");
    };

    if (loading) return <Card title="Popular Products">Loading…</Card>;
    if (error) return <Card title="Popular Products"><p className="text-red-600 text-sm">{error.message}</p></Card>;

    return (
        <Card title="RTDB: public/popularProducts">
            <AddRow onAdd={add} />
            <ul className="space-y-2 mb-4">
                {list.map((id, i) => (
                    <li key={i} className="flex gap-2 items-center">
                        <span className="text-xs w-6 opacity-60">#{i}</span>
                        <input
                            className="input flex-1"
                            value={id}
                            onChange={(e) => updateAt(i, e.target.value)}
                        />
                        <button className="btn" onClick={() => removeAt(i)}>Delete</button>
                    </li>
                ))}
                {list.length === 0 && <li className="text-sm opacity-70">No popular products yet.</li>}
            </ul>
            <button className="btn" onClick={save}>Save list</button>
        </Card>
    );
}

function AddRow({ onAdd }) {
    const [id, setId] = useState("");
    return (
        <div className="flex gap-2 mb-3">
            <input
                className="input flex-1"
                placeholder='e.g. "product_id_4"'
                value={id}
                onChange={(e) => setId(e.target.value)}
            />
            <button
                className="btn"
                onClick={() => { onAdd(id); setId(""); }}
            >
                Add
            </button>
        </div>
    );
}

function Card({ title, children }) {
    return (
        <div className="rounded-2xl border p-4 shadow-sm bg-blue-500">
            <h3 className="font-semibold mb-3">{title}</h3>
            {children}
        </div>
    );
}
