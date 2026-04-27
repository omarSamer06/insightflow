import api from "./api";

/**
 * @param {{ title: string, amount: number, category: string, date?: string }} body
 */
export async function createRecord(body) {
  const res = await api.post("/records", body);
  return {
    success: res.data?.success,
    data: res.data?.data,
    message: res.data?.message,
  };
}

/**
 * @param {string} id
 * @param {{ title?: string, amount?: number, category?: string, date?: string }} body
 */
export async function updateRecord(id, body) {
  const res = await api.put(`/records/${id}`, body);
  return {
    success: res.data?.success,
    data: res.data?.data,
    message: res.data?.message,
  };
}

/**
 * @param {string} id
 */
export async function deleteRecord(id) {
  const res = await api.delete(`/records/${id}`);
  return {
    success: res.data?.success,
    message: res.data?.message,
  };
}
