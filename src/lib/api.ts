// API Client untuk memanggil Next.js API Routes

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = 'Terjadi kesalahan pada server';
    try {
      const errData = await res.json();
      errMsg = errData.message || errMsg;
    } catch {
      // Abaikan jika bukan json
    }
    throw new Error(errMsg);
  }

  // Jika response tidak ada content (misal status 204 atau delete sukses)
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Autentikasi
  auth: {
    login: (body: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
    me: () => request<any>('/api/auth/me', { method: 'GET' }),
  },

  // Dashboard
  dashboard: {
    getStats: () => request<any>('/api/dashboard/stats'),
    getChart: (range?: string) => request<any>(`/api/dashboard/chart?range=${range || '30d'}`),
    getTopOutbound: () => request<any>('/api/dashboard/top-outbound'),
    getLowStock: () => request<any>('/api/dashboard/low-stock'),
    getRecentActivity: () => request<any>('/api/dashboard/recent-activity'),
    getMachineAlerts: () => request<any>('/api/dashboard/machine-alerts'),
  },

  // Suku Cadang / Parts
  parts: {
    list: (params?: { search?: string; categoryId?: string; rackLocation?: string; lowStock?: boolean; hasMachine?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.categoryId) q.set('categoryId', params.categoryId);
      if (params?.rackLocation) q.set('rackLocation', params.rackLocation);
      if (params?.lowStock) q.set('lowStock', 'true');
      if (params?.hasMachine) q.set('hasMachine', 'true');
      return request<any[]>(`/api/parts?${q.toString()}`);
    },
    getById: (id: string) => request<any>(`/api/parts/${id}`),
    create: (body: any) => request<any>('/api/parts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/api/parts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/parts/${id}`, { method: 'DELETE' }),
    getHistory: (id: string) => request<any[]>(`/api/parts/${id}/history`),
  },

  // Mesin / Machines
  machines: {
    list: (params?: { search?: string; area?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.area) q.set('area', params.area);
      if (params?.status) q.set('status', params.status);
      return request<any[]>(`/api/machines?${q.toString()}`);
    },
    getById: (id: string) => request<any>(`/api/machines/${id}`),
    create: (body: any) => request<any>('/api/machines', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/api/machines/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/machines/${id}`, { method: 'DELETE' }),
    
    // Hubungan Mesin & Part
    getParts: (machineId: string) => request<any[]>(`/api/machines/${machineId}/parts`),
    assignPart: (machineId: string, body: { partId: string; partType: string; recommendedMinQty: number; notes?: string }) => 
      request<any>(`/api/machines/${machineId}/parts`, { method: 'POST', body: JSON.stringify(body) }),
    updatePart: (machineId: string, partId: string, body: { recommendedMinQty: number; notes?: string }) => 
      request<any>(`/api/machines/${machineId}/parts/${partId}`, { method: 'PUT', body: JSON.stringify(body) }),
    unassignPart: (machineId: string, partId: string) => 
      request<any>(`/api/machines/${machineId}/parts/${partId}`, { method: 'DELETE' }),
    importPartsExcel: (machineId: string, formData: FormData) => 
      request<any>(`/api/machines/${machineId}/parts/import-excel`, { method: 'POST', body: formData }),
  },

  // Transaksi
  transactions: {
    getInbound: () => request<any[]>('/api/transactions/inbound'),
    createInbound: (body: any) => request<any>('/api/transactions/inbound', { method: 'POST', body: JSON.stringify(body) }),
    getOutbound: () => request<any[]>('/api/transactions/outbound'),
    createOutbound: (body: any) => request<any>('/api/transactions/outbound', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Kategori Master
  categories: {
    list: () => request<any[]>('/api/categories'),
    create: (body: any) => request<any>('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/categories/${id}`, { method: 'DELETE' }),
  },

  // Tujuan Penggunaan
  purposes: {
    list: () => request<any[]>('/api/purposes'),
    create: (body: any) => request<any>('/api/purposes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/api/purposes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/purposes/${id}`, { method: 'DELETE' }),
  },

  // Manajemen User
  users: {
    list: () => request<any[]>('/api/users'),
    create: (body: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/users/${id}`, { method: 'DELETE' }),
  },

  // Utilitas
  utils: {
    importCsv: (formData: FormData) => request<any>('/api/import-csv', { method: 'POST', body: formData }),
    importExcel: (formData: FormData) => request<any>('/api/import-excel', { method: 'POST', body: formData }),
    importMachinesExcel: (formData: FormData) => request<any>('/api/machines/import-excel', { method: 'POST', body: formData }),
    seedDb: () => request<any>('/api/seed', { method: 'POST' }),
    clearDb: () => request<any>('/api/seed?clear=true', { method: 'POST' }),
  }
};
