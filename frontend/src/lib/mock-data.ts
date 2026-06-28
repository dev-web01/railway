export const stats = {
  totalAssets: 12847,
  activeAssets: 11203,
  underMaintenance: 642,
  warrantyExpiring: 184,
  transfers: 73,
  disposed: 829,
};

export const assets = [
  { id: "RA-2024-0012", name: "Diesel Locomotive WDM-3A", type: "Locomotive", category: "Rolling Stock", serial: "WDM3A-7821", purchaseDate: "2018-04-12", vendor: "DLW Varanasi", cost: 18500000, warranty: "2026-04-12", location: "New Delhi Depot", department: "Mechanical", status: "Active" },
  { id: "RA-2024-0013", name: "Track Inspection Vehicle", type: "Vehicle", category: "Track Equipment", serial: "TIV-4421", purchaseDate: "2021-06-09", vendor: "Plasser India", cost: 9800000, warranty: "2025-06-09", location: "Mumbai Central", department: "Engineering", status: "Maintenance" },
  { id: "RA-2024-0014", name: "Signal Controller Unit", type: "Electronics", category: "Signalling", serial: "SCU-220-99", purchaseDate: "2022-01-20", vendor: "Siemens India", cost: 425000, warranty: "2025-01-20", location: "Chennai Central", department: "S&T", status: "Active" },
  { id: "RA-2024-0015", name: "AC Coach LHB", type: "Coach", category: "Rolling Stock", serial: "LHB-AC-1142", purchaseDate: "2020-09-15", vendor: "RCF Kapurthala", cost: 32000000, warranty: "2028-09-15", location: "Howrah", department: "Mechanical", status: "Active" },
  { id: "RA-2024-0016", name: "Overhead Line Crane", type: "Heavy Equipment", category: "OHE", serial: "OHC-882", purchaseDate: "2019-11-02", vendor: "BHEL", cost: 5400000, warranty: "Expired", location: "Bhopal", department: "Electrical", status: "Maintenance" },
  { id: "RA-2024-0017", name: "Ticket Vending Machine", type: "Kiosk", category: "Commercial", serial: "TVM-3309", purchaseDate: "2023-03-18", vendor: "CRIS", cost: 285000, warranty: "2026-03-18", location: "Bengaluru City", department: "Commercial", status: "Active" },
  { id: "RA-2024-0018", name: "Wheel Lathe Machine", type: "Machinery", category: "Workshop", serial: "WLM-118", purchaseDate: "2017-07-22", vendor: "HMT Machine Tools", cost: 12800000, warranty: "Expired", location: "Perambur Workshop", department: "Mechanical", status: "Disposed" },
  { id: "RA-2024-0019", name: "CCTV Surveillance System", type: "Electronics", category: "Security", serial: "CCTV-7741", purchaseDate: "2022-12-01", vendor: "Bosch India", cost: 1450000, warranty: "2025-12-01", location: "Secunderabad", department: "Security", status: "Active" },
];

export const activities = [
  { id: 1, who: "R. Sharma", action: "approved transfer", target: "RA-2024-0014", time: "2 min ago" },
  { id: 2, who: "Priya M.", action: "logged maintenance for", target: "RA-2024-0013", time: "18 min ago" },
  { id: 3, who: "System", action: "warranty expiring soon for", target: "RA-2024-0016", time: "1 hr ago" },
  { id: 4, who: "A. Kumar", action: "added new asset", target: "RA-2024-0019", time: "3 hr ago" },
  { id: 5, who: "Station Manager BPL", action: "issued gate pass for", target: "RA-2024-0017", time: "5 hr ago" },
];

export const deptDistribution = [
  { name: "Mechanical", value: 4280 },
  { name: "Electrical", value: 2940 },
  { name: "S&T", value: 1820 },
  { name: "Engineering", value: 2110 },
  { name: "Commercial", value: 980 },
  { name: "Security", value: 717 },
];

export const maintenanceCost = [
  { month: "Jan", preventive: 4.2, corrective: 2.1 },
  { month: "Feb", preventive: 3.8, corrective: 3.4 },
  { month: "Mar", preventive: 5.1, corrective: 1.9 },
  { month: "Apr", preventive: 4.6, corrective: 2.8 },
  { month: "May", preventive: 5.4, corrective: 3.2 },
  { month: "Jun", preventive: 4.9, corrective: 2.4 },
  { month: "Jul", preventive: 6.1, corrective: 3.8 },
  { month: "Aug", preventive: 5.7, corrective: 2.9 },
];

export const zones = [
  { code: "NR", name: "Northern Railway", hq: "New Delhi", divisions: 5, stations: 1142 },
  { code: "WR", name: "Western Railway", hq: "Mumbai", divisions: 6, stations: 998 },
  { code: "CR", name: "Central Railway", hq: "Mumbai", divisions: 5, stations: 814 },
  { code: "SR", name: "Southern Railway", hq: "Chennai", divisions: 6, stations: 879 },
  { code: "ER", name: "Eastern Railway", hq: "Kolkata", divisions: 4, stations: 692 },
  { code: "SCR", name: "South Central", hq: "Secunderabad", divisions: 6, stations: 763 },
];

export const vendors = [
  { id: "V-001", name: "DLW Varanasi", category: "Locomotives", contact: "+91 542 220 1100", rating: 4.8, orders: 142 },
  { id: "V-002", name: "Siemens India", category: "Signalling", contact: "+91 22 3967 7000", rating: 4.6, orders: 89 },
  { id: "V-003", name: "BHEL", category: "Heavy Equipment", contact: "+91 11 6633 7000", rating: 4.4, orders: 67 },
  { id: "V-004", name: "RCF Kapurthala", category: "Coaches", contact: "+91 1822 227 100", rating: 4.7, orders: 211 },
  { id: "V-005", name: "Plasser India", category: "Track Equipment", contact: "+91 124 469 5500", rating: 4.5, orders: 54 },
];

export const transfers = [
  { id: "TR-9921", asset: "RA-2024-0014", from: "Chennai Central", to: "Madurai Jn.", requested: "2024-09-12", status: "Approved" },
  { id: "TR-9922", asset: "RA-2024-0017", from: "Bengaluru City", to: "Mysuru", requested: "2024-09-14", status: "Pending" },
  { id: "TR-9923", asset: "RA-2024-0012", from: "New Delhi Depot", to: "Ambala", requested: "2024-09-15", status: "In Transit" },
  { id: "TR-9924", asset: "RA-2024-0019", from: "Secunderabad", to: "Vijayawada", requested: "2024-09-18", status: "Rejected" },
];

export const maintenance = [
  { id: "MN-4401", asset: "RA-2024-0013", type: "Preventive", scheduled: "2024-10-02", technician: "S. Iyer", status: "Scheduled", cost: 42000 },
  { id: "MN-4402", asset: "RA-2024-0016", type: "Corrective", scheduled: "2024-09-28", technician: "M. Khan", status: "In Progress", cost: 188000 },
  { id: "MN-4403", asset: "RA-2024-0012", type: "Preventive", scheduled: "2024-10-11", technician: "R. Verma", status: "Scheduled", cost: 95000 },
  { id: "MN-4404", asset: "RA-2024-0015", type: "Preventive", scheduled: "2024-09-21", technician: "T. Singh", status: "Completed", cost: 67000 },
];

export const notifications = [
  { id: 1, type: "warning", title: "Warranty expiring", body: "RA-2024-0016 warranty expired 2 days ago.", time: "2d" },
  { id: 2, type: "info", title: "Transfer approved", body: "TR-9921 approved by DRM Chennai.", time: "5h" },
  { id: 3, type: "success", title: "Asset assigned", body: "RA-2024-0019 assigned to Security dept.", time: "1d" },
  { id: 4, type: "warning", title: "Maintenance due", body: "RA-2024-0013 preventive maintenance due Oct 2.", time: "3h" },
];

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
