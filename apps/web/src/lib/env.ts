function resolveApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // If accessed via a remote host/domain (not localhost),
    // and envUrl is either empty or points to localhost, automatically route via /api reverse proxy
    if (!isLocalhost && (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      return "/api";
    }
  }
  return envUrl || "http://localhost:9001/api";
}

export const env = {
  apiUrl: resolveApiUrl(),
};
