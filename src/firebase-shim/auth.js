const USER_KEY = "__fg_auth_current_user__";
const USERS_KEY = "__fg_auth_users__";
const listeners = new Set();

const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
  } catch {
    return d;
  }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const id = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const currentUser = () => read(USER_KEY, null);
const setCurrentUser = (u) => {
  write(USER_KEY, u);
  auth.currentUser = u;
  listeners.forEach((cb) => cb(u));
};

export const auth = { currentUser: currentUser() };
export const getAuth = () => auth;

export const onAuthStateChanged = (_auth, next, error) => {
  try {
    next(currentUser());
    listeners.add(next);
    return () => listeners.delete(next);
  } catch (e) {
    if (error) error(e);
    return () => {};
  }
};

export class GoogleAuthProvider {}
export const signInWithPopup = async () => {
  const u = {
    uid: id(),
    displayName: "Google User",
    email: `user_${Date.now()}@example.com`,
    isAnonymous: false,
  };
  setCurrentUser(u);
  return { user: u };
};

export const createUserWithEmailAndPassword = async (_auth, email, password) => {
  const users = read(USERS_KEY, []);
  if (users.some((u) => u.email === email)) {
    throw new Error("Email already exists");
  }
  const u = { uid: id(), email, password, displayName: "", isAnonymous: false };
  users.push(u);
  write(USERS_KEY, users);
  setCurrentUser(u);
  return { user: u };
};

export const signInWithEmailAndPassword = async (_auth, email, password) => {
  const users = read(USERS_KEY, []);
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) throw new Error("Invalid credentials");
  setCurrentUser(u);
  return { user: u };
};

export const updateProfile = async (user, data) => {
  const users = read(USERS_KEY, []);
  const idx = users.findIndex((u) => u.uid === user?.uid);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...data };
    write(USERS_KEY, users);
    setCurrentUser(users[idx]);
  }
};

export const sendPasswordResetEmail = async () => ({ ok: true });
export const signOut = async () => setCurrentUser(null);

export const EmailAuthProvider = {
  credential: (email, password) => ({ email, password }),
};

export const linkWithCredential = async (_user, credential) => {
  const u = currentUser();
  if (!u) throw new Error("No current user");
  const merged = { ...u, email: credential.email, isAnonymous: false };
  setCurrentUser(merged);
  return { user: merged };
};

