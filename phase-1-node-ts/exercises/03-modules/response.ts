import type { ApiResponse } from "./types.js";

export default function ok<T>(data: T, message?: string): ApiResponse<T> {
  if (message === undefined) {
    return { success: true, data };
  }
  return { success: true, data, message };
}
