import { initializeApp, getApps, getApp } from "../firebase-shim/app";
import { getAnalytics, isSupported as analyticsSupported } from "../firebase-shim/analytics";
import {
    getDatabase,
    ref as rtdbRef,
    set as rtdbSet,
    update as rtdbUpdate,
    push as rtdbPush,
} from "../firebase-shim/database";
import {
    getFirestore,
    doc as fsDoc,
    setDoc as fsSetDoc,
    updateDoc as fsUpdateDoc,
    addDoc as fsAddDoc,
    collection as fsCollection,
} from "../firebase-shim/firestore";
import { getAuth } from "../firebase-shim/auth";
import {
    getStorage,
    ref as storageRef,
    uploadBytes as storageUploadBytes,
    uploadBytesResumable as storageUploadBytesResumable,
    getDownloadURL as storageGetDownloadURL,
} from "../firebase-shim/storage";
import { getFunctions } from "../firebase-shim/functions";

const app = getApps().length ? getApp() : initializeApp({});

let analytics = null;
if (typeof window !== "undefined") {
    analyticsSupported().then((ok) => {
        if (ok) analytics = getAnalytics(app);
    });
}

const rtdb = getDatabase(app);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const dbRef = (path) => rtdbRef(rtdb, path);
const dbSet = (path, val) => rtdbSet(rtdbRef(rtdb, path), val);
const dbUpdate = (path, val) => rtdbUpdate(rtdbRef(rtdb, path), val);
const dbPush = (path, val) => rtdbPush(rtdbRef(rtdb, path), val);

const fsRef = (path) => fsDoc(firestore, path);
const fsCol = (path) => fsCollection(firestore, path);
const fsSet = (path, data, opts) => fsSetDoc(fsDoc(firestore, path), data, opts);
const fsUpdate = (path, data) => fsUpdateDoc(fsDoc(firestore, path), data);
const fsAdd = (colPath, data) => fsAddDoc(fsCollection(firestore, colPath), data);

const stRef = (path) => storageRef(storage, path);
const stUpload = (path, file) => storageUploadBytes(storageRef(storage, path), file);
const stUploadResumable = (path, file) => storageUploadBytesResumable(storageRef(storage, path), file);
const stGetURL = (path) => storageGetDownloadURL(storageRef(storage, path));

export {
    app,
    analytics,
    rtdb,
    firestore,
    auth,
    storage,
    functions,
    // RTDB
    dbRef,
    dbSet,
    dbUpdate,
    dbPush,
    // Firestore
    fsRef,
    fsCol,
    fsSet,
    fsUpdate,
    fsAdd,
    // Storage
    stRef,
    stUpload,
    stUploadResumable,
    stGetURL
};
