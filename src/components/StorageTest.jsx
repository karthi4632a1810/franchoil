import useStorageUpload from "../hooks/useStorage";

export default function StorageTest() {
  const { upload, progress, url, error, reset } = useStorageUpload("test-uploads");

  return (
    <Card title="Storage Test">
      {error && <p className="text-red-600 text-sm">{error.message}</p>}
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        className="block mb-2"
      />
      <div className="h-2 bg-gray-200 rounded overflow-hidden mb-2">
        <div className="h-full bg-black/80" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs mb-2">Progress: {progress}%</p>
      {url && (
        <div className="space-y-2">
          <a href={url} target="_blank" className="text-blue-600 underline">Open uploaded file</a>
          <img src={url} alt="uploaded" className="max-h-32 rounded" />
          <button className="btn" onClick={reset}>Reset</button>
        </div>
      )}
    </Card>
  );
}

function Card({ title, children }) {
  return <div className="rounded-2xl border p-4 shadow-sm bg-white">
    <h3 className="font-semibold mb-3">{title}</h3>{children}
  </div>;
}