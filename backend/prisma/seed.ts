import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const employeeData = [
  { id: "EMP-001", empId: "E-9921", name: "S. Ramesh", email: "s.ramesh@indianrailways.gov.in", phone: "+91 98765 43210", department: "Commercial", designation: "Chief Ticket Inspector", role: "Employee", isActive: true },
  { id: "EMP-002", empId: "E-5563", name: "Priya Menon", email: "p.menon@indianrailways.gov.in", phone: "+91 98765 43211", department: "Security", designation: "Security Officer", role: "Supervisor", isActive: true },
  { id: "EMP-003", empId: "E-2218", name: "M. Khan", email: "m.khan@indianrailways.gov.in", phone: "+91 98765 43212", department: "Engineering", designation: "Senior Engineer", role: "Station Manager", isActive: true },
  { id: "EMP-004", empId: "E-8810", name: "T. Singh", email: "t.singh@indianrailways.gov.in", phone: "+91 98765 43213", department: "S&T", designation: "Technician", role: "Employee", isActive: true },
  { id: "EMP-005", empId: "E-1122", name: "R. Sharma", email: "r.sharma@indianrailways.gov.in", phone: "+91 98765 43214", department: "Administration", designation: "Admin", role: "Admin", isActive: true },
  { id: "EMP-006", empId: "E-3344", name: "A. Gupta", email: "a.gupta@indianrailways.gov.in", phone: "+91 98765 43215", department: "Stores", designation: "Store Keeper", role: "Store Keeper", isActive: true },
];

const vendorData = [
  { id: "V-001", name: "DLW Varanasi", category: "Locomotives", contact: "+91 542 220 1100", rating: 4.8, orders: 142 },
  { id: "V-002", name: "Siemens India", category: "Signalling", contact: "+91 22 3967 7000", rating: 4.6, orders: 89 },
  { id: "V-003", name: "BHEL", category: "Heavy Equipment", contact: "+91 11 6633 7000", rating: 4.4, orders: 67 },
  { id: "V-004", name: "RCF Kapurthala", category: "Coaches", contact: "+91 1822 227 100", rating: 4.7, orders: 211 },
  { id: "V-005", name: "Plasser India", category: "Track Equipment", contact: "+91 124 469 5500", rating: 4.5, orders: 54 },
];

const assetData = [
  { id: "RA-2024-0012", name: "Diesel Locomotive WDM-3A", modelNumber: "WDM-3A-Mod1", description: "Heavy duty passenger locomotive", type: "Locomotive", category: "Rolling Stock", serial: "WDM3A-7821", purchaseDate: "2018-04-12", vendorId: "V-001", cost: 18500000, warranty: "2026-04-12", location: "New Delhi Depot", department: "Mechanical", status: "Available", healthScore: 92 },
  { id: "RA-2024-0013", name: "Track Inspection Vehicle", modelNumber: "TIV-Pro", description: "Motorized track inspection trolley", type: "Vehicle", category: "Track Equipment", serial: "TIV-4421", purchaseDate: "2021-06-09", vendorId: "V-005", cost: 9800000, warranty: "2025-06-09", location: "Mumbai Central", department: "Engineering", status: "Under Maintenance", healthScore: 65 },
  { id: "RA-2024-0014", name: "Signal Controller Unit", modelNumber: "SCU-v4", description: "Main line electronic interlocking unit", type: "Electronics", category: "Signalling", serial: "SCU-220-99", purchaseDate: "2022-01-20", vendorId: "V-002", cost: 425000, warranty: "2025-01-20", location: "Chennai Central", department: "S&T", status: "Assigned", healthScore: 98 },
  { id: "RA-2024-0015", name: "AC Coach LHB", modelNumber: "LHB-3AC", description: "3 Tier AC passenger coach", type: "Coach", category: "Rolling Stock", serial: "LHB-AC-1142", purchaseDate: "2020-09-15", vendorId: "V-004", cost: 32000000, warranty: "2028-09-15", location: "Howrah", department: "Mechanical", status: "Available", healthScore: 88 },
  { id: "RA-2024-0016", name: "Overhead Line Crane", modelNumber: "OHE-C-200", description: "For electrical line maintenance", type: "Heavy Equipment", category: "OHE", serial: "OHC-882", purchaseDate: "2019-11-02", vendorId: "V-003", cost: 5400000, warranty: "Expired", location: "Bhopal", department: "Electrical", status: "Under Maintenance", healthScore: 54 },
  { id: "RA-2024-0017", name: "Ticket Vending Machine", modelNumber: "ATVM-100", description: "Self service smart card ATVM", type: "Kiosk", category: "Commercial", serial: "TVM-3309", purchaseDate: "2023-03-18", vendorId: "V-002", cost: 285000, warranty: "2026-03-18", location: "Bengaluru City", department: "Commercial", status: "Assigned", healthScore: 95 },
  { id: "RA-2024-0018", name: "Wheel Lathe Machine", modelNumber: "WL-Max", description: "CNC underfloor wheel lathe", type: "Machinery", category: "Workshop", serial: "WLM-118", purchaseDate: "2017-07-22", vendorId: "V-003", cost: 12800000, warranty: "Expired", location: "Perambur Workshop", department: "Mechanical", status: "Retired", healthScore: 20 },
  { id: "RA-2024-0019", name: "CCTV Surveillance System", modelNumber: "NVR-64Ch", description: "64-channel NVR with PTZ cameras", type: "Electronics", category: "Security", serial: "CCTV-7741", purchaseDate: "2022-12-01", vendorId: "V-002", cost: 1450000, warranty: "2025-12-01", location: "Secunderabad", department: "Security", status: "Assigned", healthScore: 99 },
];

const allocationData = [
  { id: "AL-2241", assetId: "RA-2024-0017", employeeId: "EMP-001", assignedAt: "2024-06-12", status: "Active" },
  { id: "AL-2242", assetId: "RA-2024-0019", employeeId: "EMP-002", assignedAt: "2024-04-09", status: "Active" },
  { id: "AL-2243", assetId: "RA-2024-0014", employeeId: "EMP-004", assignedAt: "2024-02-22", status: "Active" },
];

const maintenanceData = [
  { id: "MN-4401", assetId: "RA-2024-0013", type: "Inspection", description: "Monthly track inspection engine check", scheduled: "2024-10-02", nextDueDate: "2024-11-02", technician: "S. Iyer", status: "Pending", cost: 42000 },
  { id: "MN-4402", assetId: "RA-2024-0016", type: "Hardware Repair", description: "Hydraulic pump failure", scheduled: "2024-09-28", nextDueDate: "2025-09-28", technician: "M. Khan", status: "In Progress", cost: 188000 },
  { id: "MN-4403", assetId: "RA-2024-0012", type: "Cleaning", description: "Routine exterior wash and interior dust blow", scheduled: "2024-10-11", nextDueDate: "2024-11-11", technician: "R. Verma", status: "Pending", cost: 95000 },
  { id: "MN-4404", assetId: "RA-2024-0015", type: "Inspection", description: "AC gas levels and compressor check", scheduled: "2024-09-21", nextDueDate: "2025-03-21", technician: "T. Singh", status: "Completed", cost: 67000 },
];

const transferData = [
  { id: "TR-9921", assetId: "RA-2024-0014", from: "Chennai Central", to: "Madurai Jn.", requested: "2024-09-12", status: "Approved" },
  { id: "TR-9922", assetId: "RA-2024-0017", from: "Bengaluru City", to: "Mysuru", requested: "2024-09-14", status: "Pending" },
  { id: "TR-9923", assetId: "RA-2024-0012", from: "New Delhi Depot", to: "Ambala", requested: "2024-09-15", status: "In Transit" },
];

const notificationData = [
  { type: "warning", title: "Warranty expiring", body: "RA-2024-0016 warranty expired 2 days ago.", time: "2d" },
  { type: "info", title: "Transfer approved", body: "TR-9921 approved by DRM Chennai.", time: "5h" },
  { type: "success", title: "Asset assigned", body: "RA-2024-0019 assigned to Security dept.", time: "1d" },
  { type: "warning", title: "Maintenance due", body: "RA-2024-0013 inspection due Oct 2.", time: "3h" },
];

const activityData = [
  { who: "R. Sharma", action: "approved transfer", target: "RA-2024-0014", time: "2 min ago" },
  { who: "Priya M.", action: "logged maintenance for", target: "RA-2024-0013", time: "18 min ago" },
  { who: "System", action: "warranty expiring soon for", target: "RA-2024-0016", time: "1 hr ago" },
];

async function main() {
  console.log('🌱 Seeding enterprise database...');

  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.qRScanLog.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.employee.deleteMany();

  // Employees
  for (const e of employeeData) {
    await prisma.employee.create({ data: e });
  }
  console.log('✅ Employees seeded');

  // Vendors
  for (const v of vendorData) {
    await prisma.vendor.create({ data: v });
  }
  console.log('✅ Vendors seeded');

  // Assets
  for (const a of assetData) {
    await prisma.asset.create({
      data: { ...a, purchaseDate: new Date(a.purchaseDate) }
    });
  }
  console.log('✅ Assets seeded');

  // Allocations
  for (const al of allocationData) {
    await prisma.allocation.create({
      data: { ...al, assignedAt: new Date(al.assignedAt) }
    });
  }
  console.log('✅ Allocations seeded');

  // Maintenance
  for (const m of maintenanceData) {
    await prisma.maintenance.create({
      data: { ...m, scheduled: new Date(m.scheduled), nextDueDate: m.nextDueDate ? new Date(m.nextDueDate) : null }
    });
  }
  console.log('✅ Maintenance seeded');

  // Transfers
  for (const t of transferData) {
    await prisma.transfer.create({
      data: { ...t, requested: new Date(t.requested) }
    });
  }
  console.log('✅ Transfers seeded');

  for (const n of notificationData) {
    await prisma.notification.create({ data: n });
  }
  for (const act of activityData) {
    await prisma.activity.create({ data: act });
  }

  console.log('\n🎉 Enterprise database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
