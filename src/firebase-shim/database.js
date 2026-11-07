const STORE_KEY = "__fg_rtdb__";
const listeners = new Map();

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeStore = (s) => localStorage.setItem(STORE_KEY, JSON.stringify(s));
const norm = (p) => (p || "").split("/").filter(Boolean).join("/");
const notify = (path) => {
  const key = norm(path);
  const cbs = listeners.get(key) || [];
  const value = readStore()[key];
  cbs.forEach((cb) => cb({ val: () => value }));
};

export const getDatabase = () => ({ kind: "rtdb" });
export const ref = (_db, path) => ({ path: norm(path) });
export const query = (refObj) => refObj;

export const set = async (refObj, value) => {
  const s = readStore();
  s[refObj.path] = value;
  writeStore(s);
  notify(refObj.path);
};

export const update = async (refObj, value) => {
  const s = readStore();
  const prev = s[refObj.path] || {};
  s[refObj.path] = { ...prev, ...value };
  writeStore(s);
  notify(refObj.path);
};

export const push = async (refObj, value = null) => {
  const key = `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const childPath = `${refObj.path}/${key}`;
  const s = readStore();
  s[childPath] = value;
  writeStore(s);
  notify(refObj.path);
  return { key, path: childPath };
};

export const onValue = (refObj, cb) => {
  const key = refObj.path;
  const arr = listeners.get(key) || [];
  arr.push(cb);
  listeners.set(key, arr);
  cb({ val: () => readStore()[key] });
  return () => {
    const list = listeners.get(key) || [];
    listeners.set(
      key,
      list.filter((x) => x !== cb)
    );
  };
};

