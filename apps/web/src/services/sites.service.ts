import api from "@/lib/api";
import type { Site, ApiResponse } from "@/types";

export const sitesApi = {
  getAll: () => api.get<ApiResponse<{ sites: Site[] }>>("/sites"),

  create: (url: string, label?: string) =>
    api.post<ApiResponse<{ site: Site }>>("/sites", { url, label }),

  delete: (id: string) => api.delete<ApiResponse>(`/sites/${id}`),
};
