/** URL for an uploaded venue photo (client-safe; no node-only imports). */
export const photoUrl = (name: string) => `/api/uploads/${encodeURIComponent(name)}`;
