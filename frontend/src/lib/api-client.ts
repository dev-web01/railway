export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;

const getHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("r-ams-user");
    if (userStr) {
      const user = JSON.parse(userStr);
      headers["x-user"] = user.name;
      headers["x-user-role"] = user.role;
    }
  }
  return headers;
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const fetchStats = async () => {
  const res = await fetch(`${API}/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

// ─── ASSETS ─────────────────────────────────────────────────────────────────
export const fetchAssets = async (params?: Record<string, string>) => {
  const qs = params ? new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API}/assets${qs ? `?${qs}` : ''}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch assets");
  const data = await res.json();
  return data.data ? data.data : data; // Handle paginated vs non-paginated
};

export const fetchAssetDetails = async (id: string) => {
  const res = await fetch(`${API}/assets/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch asset details");
  return res.json();
};

export const createAsset = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  if (isFormData) delete headers["Content-Type"]; // Let browser set boundary

  const res = await fetch(`${API}/assets`, {
    method: "POST",
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create asset");
  return res.json();
};

export const updateAsset = async (id: string, data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  const headers = getHeaders();
  if (isFormData) delete headers["Content-Type"];

  const res = await fetch(`${API}/assets/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update asset");
  return res.json();
};

export const deleteAsset = async (id: string) => {
  const res = await fetch(`${API}/assets/${id}`, { method: "DELETE", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to delete asset");
  return res.json();
};

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────
export const fetchEmployees = async () => {
  const res = await fetch(`${API}/employees`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
};

export const createEmployee = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/employees`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create employee");
  return res.json();
};

// ─── ALLOCATIONS ────────────────────────────────────────────────────────────
export const fetchAllocations = async () => {
  const res = await fetch(`${API}/allocations`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch allocations");
  return res.json();
};

export const createAllocation = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/allocations`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to allocate asset");
  return res.json();
};

export const returnAllocation = async (id: string) => {
  const res = await fetch(`${API}/allocations/${id}/return`, { method: "POST", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to return asset");
  return res.json();
};

// ─── QR SCANNER ─────────────────────────────────────────────────────────────
export const scanQR = async (assetId: string, deviceInfo: string) => {
  const res = await fetch(`${API}/qr/scan`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify({ assetId, deviceInfo }),
  });
  if (!res.ok) throw new Error("Failed to scan QR");
  return res.json();
};

export const verifyAsset = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/qr/verify`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to verify asset");
  return res.json();
};

export const fetchQRAnalytics = async () => {
  const res = await fetch(`${API}/qr/analytics`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch QR analytics");
  return res.json();
};

// ─── OTHERS (VENDORS, MAINTENANCE, TRANSFERS) ──────────────────────────────
export const fetchVendors = async () => {
  const res = await fetch(`${API}/vendors`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
};

export const createVendor = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/vendors`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create vendor");
  return res.json();
};

export const fetchMaintenance = async () => {
  const res = await fetch(`${API}/maintenance`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch maintenance");
  return res.json();
};

export const createMaintenance = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/maintenance`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to schedule maintenance");
  return res.json();
};

export const fetchTransfers = async () => {
  const res = await fetch(`${API}/transfers`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch transfers");
  return res.json();
};

export const createTransfer = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/transfers`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transfer");
  return res.json();
};

export const updateTransfer = async (id: string, data: Record<string, any>) => {
  const res = await fetch(`${API}/transfers/${id}`, {
    method: "PUT", headers: getHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update transfer");
  return res.json();
};

export const approveTransfer = async (id: string) => {
  const res = await fetch(`${API}/transfers/${id}/approve`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to approve transfer");
  return res.json();
};

export const rejectTransfer = async (id: string) => {
  const res = await fetch(`${API}/transfers/${id}/reject`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to reject transfer");
  return res.json();
};

export const completeTransfer = async (id: string) => {
  const res = await fetch(`${API}/transfers/${id}/complete`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to complete transfer");
  return res.json();
};

// Disposal
export const fetchDisposals = async () => {
  const res = await fetch(`${API}/disposal`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch disposals");
  return res.json();
};

export const createDisposal = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/disposal`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create disposal");
  return res.json();
};

export const approveDisposal = async (id: number) => {
  const res = await fetch(`${API}/disposal/${id}/approve`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to approve disposal");
  return res.json();
};

export const completeDisposal = async (id: number) => {
  const res = await fetch(`${API}/disposal/${id}/complete`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to complete disposal");
  return res.json();
};

// Notifications
export const fetchNotifications = async () => {
  const res = await fetch(`${API}/notifications`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};

export const fetchNotificationCount = async () => {
  const res = await fetch(`${API}/notifications/count`, { headers: getHeaders() });
  if (!res.ok) return { count: 0 };
  return res.json();
};

export const markNotificationRead = async (id: number) => {
  const res = await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to mark as read");
  return res.json();
};

export const markAllNotificationsRead = async () => {
  const res = await fetch(`${API}/notifications/read-all`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to mark all as read");
  return res.json();
};

// Warranty
export const fetchWarrantyAlerts = async () => {
  const res = await fetch(`${API}/warranty/alerts`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch warranty alerts");
  return res.json();
};

// Health Score
export const fetchHealthDistribution = async () => {
  const res = await fetch(`${API}/assets/health-distribution`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch health distribution");
  return res.json();
};

export const recalculateHealth = async (assetId: string) => {
  const res = await fetch(`${API}/assets/${assetId}/recalculate-health`, { method: "POST", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to recalculate health");
  return res.json();
};

// Campaigns
export const fetchCampaigns = async () => {
  const res = await fetch(`${API}/campaigns`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
};

export const createCampaign = async (data: Record<string, any>) => {
  const res = await fetch(`${API}/campaigns`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
};

export const completeCampaign = async (id: number) => {
  const res = await fetch(`${API}/campaigns/${id}/complete`, { method: "PUT", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to complete campaign");
  return res.json();
};

export const fetchCampaignReport = async (id: number) => {
  const res = await fetch(`${API}/campaigns/${id}/report`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to get campaign report");
  return res.json();
};

// Documents
export const fetchAssetDocuments = async (assetId: string) => {
  const res = await fetch(`${API}/assets/${assetId}/documents`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
};

export const uploadAssetDocument = async (assetId: string, file: File, fileType: string) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("fileType", fileType);
  const headers = getHeaders();
  delete headers["Content-Type"];
  const res = await fetch(`${API}/assets/${assetId}/documents`, { method: "POST", headers, body: fd });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
};

export const deleteDocument = async (id: number) => {
  const res = await fetch(`${API}/documents/${id}`, { method: "DELETE", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to delete document");
  return res.json();
};

// Asset Timeline
export const fetchAssetTimeline = async (assetId: string) => {
  const res = await fetch(`${API}/assets/${assetId}/timeline`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
};

