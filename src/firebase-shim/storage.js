const STORE_KEY = "__fg_storage__";

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeStore = (s) => localStorage.setItem(STORE_KEY, JSON.stringify(s));

export const getStorage = () => ({ kind: "storage" });
export const ref = (_storage, path) => ({ fullPath: path });

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const uploadBytes = async (refObj, file) => {
  const dataUrl = await fileToDataUrl(file);
  const store = readStore();
  store[refObj.fullPath] = dataUrl;
  writeStore(store);
  return { ref: refObj };
};

export const uploadBytesResumable = (refObj, file) => {
  return {
    on: async (_event, progressCb, errorCb, completeCb) => {
      try {
        progressCb?.({ bytesTransferred: file.size || 1, totalBytes: file.size || 1 });
        await uploadBytes(refObj, file);
        completeCb?.();
      } catch (e) {
        errorCb?.(e);
      }
    },
  };
};

export const getDownloadURL = async (refObj) => {
  const store = readStore();
  return store[refObj.fullPath] || "";
};

