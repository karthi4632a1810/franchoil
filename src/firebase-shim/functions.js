import { phpApi } from "../lib/phpApi";

export const getFunctions = () => ({ kind: "functions" });

export const httpsCallable = (_functions, name) => {
  return async (payload = {}) => {
    const { data } = await phpApi.post(`/api/functions/${name}`, payload);
    return { data };
  };
};

