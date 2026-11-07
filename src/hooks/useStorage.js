// src/hooks/useStorage.js
import { useCallback, useState } from "react";
import { phpApi } from "../lib/phpApi";
import { storage } from "../firebase/config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function useStorageUpload(pathPrefix = "uploads") {
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file, newPath = "") => {
    setProgress(0);
    setUrl(null);
    setError(null);

    // Try PHP backend multipart upload first
    try {
      const formData = new FormData();
      formData.append("file", file);
      const cleanFolder = (pathPrefix || "products").replace(/[^a-zA-Z0-9_-]/g, "") || "products";
      formData.append("folder", cleanFolder);

      const response = await phpApi.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      if (response.data && (response.data.url || response.data.downloadURL)) {
        const downloadURL = response.data.downloadURL || response.data.url;
        setProgress(100);
        setUrl(downloadURL);
        return { downloadURL, path: downloadURL };
      }
    } catch (phpErr) {
      console.warn("PHP upload endpoint failed, falling back:", phpErr);
    }

    // Fallback to Firebase storage
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fileRef = ref(storage, `${pathPrefix}/${newPath}${filename}`);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, file);
      task.on(
        "state_changed",
        (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (e) => { setError(e); reject(e); },
        async () => {
          try {
            const downloadURL = await getDownloadURL(fileRef);
            setProgress(100);
            setUrl(downloadURL);
            resolve({ downloadURL, path: fileRef.fullPath });
          } catch (getErr) {
            setError(getErr);
            reject(getErr);
          }
        }
      );
    });
  }, [pathPrefix]);

  const reset = () => { setProgress(0); setUrl(null); setError(null); };

  return { upload, progress, url, error, reset };
}