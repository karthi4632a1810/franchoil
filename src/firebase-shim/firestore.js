const STORE_KEY = "__fg_firestore__";
const STORE_EVENT = "fg-firestore-change";

const nowIso = () => new Date().toISOString();
const getStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
};
const setStore = (s) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORE_EVENT));
  }
};

const normPath = (input) =>
  (Array.isArray(input) ? input.join("/") : input || "")
    .split("/")
    .filter(Boolean)
    .join("/");

const collectionPath = (parts) => normPath(parts);
const docPath = (parts) => normPath(parts);
const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const toComparable = (value) => {
  if (value && typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  return value;
};

const makeDocSnapshot = (path, value) => ({
  id: path.split("/").pop(),
  exists: () => value != null,
  data: () => (value == null ? undefined : value),
});

const parseCollectionDocs = (colPath) => {
  const store = getStore();
  const colDepth = colPath.split("/").filter(Boolean).length;
  return Object.entries(store)
    .filter(([p]) => p.startsWith(`${colPath}/`) && p.split("/").length === colDepth + 1)
    .map(([path, data]) => ({ id: path.split("/").pop(), path, data }));
};

export const getFirestore = () => ({ kind: "firestore" });
export const collection = (_db, ...path) => ({ __type: "collection", path: collectionPath(path) });
export const doc = (_dbOrRef, ...path) => {
  if (_dbOrRef && _dbOrRef.__type === "collection") {
    return { __type: "doc", path: docPath([_dbOrRef.path, ...path]) };
  }
  return { __type: "doc", path: docPath(path) };
};
export const where = (field, op, value) => ({ t: "where", field, op, value });
export const orderBy = (field, dir = "asc") => ({ t: "orderBy", field, dir });
export const limit = (count) => ({ t: "limit", count });
export const query = (base, ...constraints) => ({ __type: "query", base, constraints });
export const serverTimestamp = () => nowIso();
export const Timestamp = {
  now: () => ({
    toDate: () => new Date(),
  }),
  fromDate: (date) => ({
    toDate: () => new Date(date),
  }),
};

export const getDoc = async (docRef) => {
  const store = getStore();
  return makeDocSnapshot(docRef.path, store[docRef.path]);
};

export const setDoc = async (docRef, data, opts = {}) => {
  const store = getStore();
  const prev = store[docRef.path] || {};
  store[docRef.path] = opts.merge ? { ...prev, ...data } : { ...data };
  setStore(store);
};

export const updateDoc = async (docRef, data) => {
  const store = getStore();
  const prev = store[docRef.path] || {};
  store[docRef.path] = { ...prev, ...data };
  setStore(store);
};

export const addDoc = async (colRef, data) => {
  const id = generateId();
  const path = `${colRef.path}/${id}`;
  const store = getStore();
  store[path] = { ...data };
  setStore(store);
  return { id, path };
};

export const deleteDoc = async (docRef) => {
  const store = getStore();
  delete store[docRef.path];
  setStore(store);
};

const applyConstraints = (docs, constraints = []) => {
  let out = [...docs];
  for (const c of constraints) {
    if (c.t === "where") {
      out = out.filter((d) => {
        const v = toComparable(d.data?.[c.field]);
        const q = toComparable(c.value);
        switch (c.op) {
          case "==":
            return v === q;
          case "<":
            return v < q;
          case "<=":
            return v <= q;
          case ">":
            return v > q;
          case ">=":
            return v >= q;
          default:
            return true;
        }
      });
    }
    if (c.t === "orderBy") {
      out.sort((a, b) => {
        const av = toComparable(a.data?.[c.field]);
        const bv = toComparable(b.data?.[c.field]);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return c.dir === "desc" ? -cmp : cmp;
      });
    }
    if (c.t === "limit") {
      out = out.slice(0, Number(c.count) || 0);
    }
  }
  return out;
};

export const getDocs = async (queryOrCol) => {
  const isQuery = queryOrCol?.__type === "query";
  const col = isQuery ? queryOrCol.base : queryOrCol;
  const constraints = isQuery ? queryOrCol.constraints : [];
  const docs = applyConstraints(parseCollectionDocs(col.path), constraints).map((d) => ({
    id: d.id,
    data: () => d.data,
  }));
  return { docs, empty: docs.length === 0 };
};

export const onSnapshot = (queryOrCol, cb) => {
  let active = true;

  const emit = () => {
    if (!active) return;
    getDocs(queryOrCol).then((snap) => {
      if (active) cb(snap);
    });
  };

  emit();

  const onStoreChange = (event) => {
    if (event?.type === "storage" && event.key !== STORE_KEY) return;
    emit();
  };

  if (typeof window !== "undefined") {
    window.addEventListener(STORE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
  }

  return () => {
    active = false;
    if (typeof window !== "undefined") {
      window.removeEventListener(STORE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    }
  };
};

export const runTransaction = async (_db, updateFn) => {
  const local = getStore();
  const tx = {
    get: async (docRef) => makeDocSnapshot(docRef.path, local[docRef.path]),
    set: (docRef, data, opts = {}) => {
      const prev = local[docRef.path] || {};
      local[docRef.path] = opts.merge ? { ...prev, ...data } : { ...data };
    },
    update: (docRef, data) => {
      const prev = local[docRef.path] || {};
      local[docRef.path] = { ...prev, ...data };
    },
  };
  const result = await updateFn(tx);
  setStore(local);
  return result;
};

