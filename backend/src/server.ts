import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Multer config for asset images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ─── MIDDLEWARE: RBAC ────────────────────────────────────────────────────────
const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers['x-user-role'] as string || 'Admin';
    if (!roles.includes(userRole) && userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// ─── AUDIT HELPER ─────────────────────────────────────────────────────────────
async function audit(action: string, entity: string, entityId: string, user = 'System', details?: string) {
  try {
    await prisma.auditLog.create({ data: { action, entity, entityId, user, details } });
  } catch {}
}

// ─── NOTIFY HELPER ─────────────────────────────────────────────────────────────
async function notify(type: string, title: string, body: string, targetRole?: string) {
  try {
    await prisma.notification.create({ data: { type, title, body, targetRole, isRead: false } });
  } catch {}
}

// ─── HEALTH SCORE HELPER ──────────────────────────────────────────────────────
async function recalculateHealthScore(assetId: string) {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId }, include: { maintenance: true, verifications: true } });
    if (!asset) return;
    const now = new Date();
    const ageYears = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const repairCount = asset.maintenance.filter(m => m.status === 'Completed').length;
    const totalRepairCost = asset.maintenance.reduce((sum, m) => sum + m.cost, 0);
    const lastVerification = asset.verifications[asset.verifications.length - 1];
    let conditionPenalty = 0;
    if (lastVerification) {
      const conditionMap: Record<string, number> = { 'Excellent': 0, 'Good': 5, 'Fair': 15, 'Damaged': 30, 'Missing': 50 };
      conditionPenalty = conditionMap[lastVerification.condition] || 0;
    }
    const score = Math.max(0, Math.min(100,
      100 - Math.floor(ageYears * 5) - (repairCount * 3) - Math.floor(totalRepairCost / 10000) - conditionPenalty
    ));
    let healthCategory = 'Excellent';
    if (score < 30) healthCategory = 'Critical';
    else if (score < 50) healthCategory = 'Poor';
    else if (score < 70) healthCategory = 'Fair';
    else if (score < 90) healthCategory = 'Good';
    await prisma.asset.update({ where: { id: assetId }, data: { healthScore: score, healthCategory, healthUpdatedAt: now } });
    return score;
  } catch {}
}

// ─── EMAIL HELPER ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
});

async function sendEmail(to: string, subject: string, body: string) {
  if (!process.env.SMTP_USER) {
    await prisma.emailNotification.create({ data: { to, subject, body, status: 'Simulated' } });
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'r-ams@railways.gov.in', to, subject, text: body });
    await prisma.emailNotification.create({ data: { to, subject, body, status: 'Sent' } });
  } catch {
    await prisma.emailNotification.create({ data: { to, subject, body, status: 'Failed' } });
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const allAssets = await prisma.asset.findMany({ where: { deletedAt: null }, select: { status: true, warranty: true, healthScore: true } });
    const total = allAssets.length;
    const available = allAssets.filter(a => a.status === 'Available').length;
    const assigned = allAssets.filter(a => a.status === 'Assigned').length;
    const underMaintenance = allAssets.filter(a => a.status === 'Under Maintenance').length;
    const condemned = allAssets.filter(a => a.status === 'Condemned').length;
    const disposed = allAssets.filter(a => a.status === 'Disposed').length;
    const warrantyExpiring = allAssets.filter(a => {
      if (!a.warranty) return false;
      try { const d = new Date(a.warranty); return d >= now && d <= in90Days; } catch { return false; }
    }).length;
    const criticalAssets = allAssets.filter(a => a.healthScore < 30).length;
    const [transfers, pendingTransfers, maintenance] = await Promise.all([
      prisma.transfer.count(),
      prisma.transfer.count({ where: { status: 'Pending' } }),
      prisma.maintenance.aggregate({ _sum: { cost: true } }),
    ]);
    res.json({
      totalAssets: total, available, assigned, activeAssets: assigned, underMaintenance,
      condemned, disposed, warrantyExpiring, criticalAssets, transfers, pendingTransfers,
      totalMaintenanceCost: maintenance._sum.cost || 0
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    res.json(await prisma.employee.findMany({ include: { _count: { select: { allocations: { where: { status: 'Active' } } } } }, orderBy: { name: 'asc' } }));
  } catch { res.status(500).json({ error: 'Failed to fetch employees' }); }
});

app.post('/api/employees', requireRole(['Admin', 'Store Keeper']), async (req, res) => {
  try {
    const emp = await prisma.employee.create({ data: req.body });
    await audit('CREATE', 'Employee', emp.id, req.headers['x-user'] as string || 'Admin', `Added ${emp.name}`);
    res.status(201).json(emp);
  } catch { res.status(500).json({ error: 'Failed to create employee' }); }
});

app.put('/api/employees/:id', requireRole(['Admin', 'Store Keeper']), async (req, res) => {
  try {
    const emp = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    res.json(emp);
  } catch { res.status(500).json({ error: 'Failed to update employee' }); }
});

// ─── ASSETS (Advanced) ─────────────────────────────────────────────────────────
app.get('/api/assets', async (req, res) => {
  try {
    const { status, category, search, page = '1', limit = '50', sort = 'createdAt', order = 'desc' } = req.query;
    const where: any = { deletedAt: null }; // Exclude soft-deleted
    if (status) where.status = String(status);
    if (category) where.category = String(category);
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { id: { contains: String(search) } },
        { serial: { contains: String(search) } }
      ];
    }
    
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        include: { vendor: true, allocations: { where: { status: 'Active' }, include: { employee: true } } },
        orderBy: { [String(sort)]: String(order) },
        skip,
        take: parseInt(String(limit))
      })
    ]);
    res.json({ total, page: parseInt(String(page)), pages: Math.ceil(total / parseInt(String(limit))), data: assets });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch assets' }); }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        allocations: { include: { employee: true }, orderBy: { assignedAt: 'desc' } },
        maintenance: { orderBy: { scheduled: 'desc' } }
      }
    });
    if (!asset || asset.deletedAt) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch { res.status(500).json({ error: 'Failed to fetch asset details' }); }
});

app.post('/api/assets', requireRole(['Admin', 'Store Keeper']), upload.single('image'), async (req, res) => {
  try {
    const { name, type, category, modelNumber, serial, description, purchaseDate, cost, warranty, location, department, status, vendorId, salvageValue, usefulLifeYears } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const asset = await prisma.asset.create({
      data: {
        name, type: type || 'General', category: category || 'General', modelNumber, serial, description, imageUrl,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        cost: parseFloat(cost) || 0,
        warranty, location: location || '', department: department || '',
        status: status || 'Available', vendorId: (!vendorId || vendorId === 'unassigned') ? null : vendorId,
        salvageValue: parseFloat(salvageValue) || 0,
        usefulLifeYears: parseInt(usefulLifeYears) || 5,
      },
      include: { vendor: true }
    });
    await audit('CREATE', 'Asset', asset.id, req.headers['x-user'] as string || 'Admin', `Created ${asset.name}`);
    res.status(201).json(asset);
  } catch (e) { res.status(500).json({ error: 'Failed to create asset' }); }
});

app.put('/api/assets/:id', requireRole(['Admin', 'Store Keeper', 'Supervisor', 'Station Manager']), upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    if (data.cost) data.cost = parseFloat(data.cost);
    if (data.salvageValue != null) data.salvageValue = parseFloat(data.salvageValue);
    if (data.usefulLifeYears != null) data.usefulLifeYears = parseInt(data.usefulLifeYears);
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
    if (!data.vendorId || data.vendorId === 'unassigned') data.vendorId = null;
    
    if (data.status === 'Disposed') data.disposedAt = new Date();
    const asset = await prisma.asset.update({ where: { id }, data, include: { vendor: true } });
    await audit('UPDATE', 'Asset', id, req.headers['x-user'] as string || 'Admin', `Updated ${asset.name}`);
    res.json(asset);
  } catch { res.status(500).json({ error: 'Failed to update asset' }); }
});

app.delete('/api/assets/:id', requireRole(['Admin']), async (req, res) => {
  try {
    // Soft Delete
    await prisma.asset.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await audit('DELETE', 'Asset', req.params.id, req.headers['x-user'] as string || 'Admin', 'Soft deleted');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete asset' }); }
});

// ─── ALLOCATIONS ──────────────────────────────────────────────────────────────
app.get('/api/allocations', async (req, res) => {
  try {
    res.json(await prisma.allocation.findMany({ include: { asset: true, employee: true }, orderBy: { assignedAt: 'desc' } }));
  } catch { res.status(500).json({ error: 'Failed to fetch allocations' }); }
});

app.post('/api/allocations', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const { assetId, employeeId, notes } = req.body;
    const alloc = await prisma.allocation.create({
      data: { assetId, employeeId, notes, assignedAt: new Date(), status: 'Active' },
      include: { asset: true, employee: true }
    });
    // Update asset status
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'Assigned' } });
    await audit('ALLOCATE', 'Asset', assetId, req.headers['x-user'] as string || 'Admin', `Assigned to ${alloc.employee.name}`);
    res.status(201).json(alloc);
  } catch { res.status(500).json({ error: 'Failed to assign asset' }); }
});

app.post('/api/allocations/:id/return', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const alloc = await prisma.allocation.update({
      where: { id: req.params.id },
      data: { status: 'Returned', returnedAt: new Date() },
      include: { asset: true }
    });
    await prisma.asset.update({ where: { id: alloc.assetId }, data: { status: 'Available' } });
    await audit('RETURN', 'Asset', alloc.assetId, req.headers['x-user'] as string || 'Admin', `Returned from allocation`);
    res.json(alloc);
  } catch { res.status(500).json({ error: 'Failed to return asset' }); }
});

// ─── QR SCAN LOG & VERIFICATION ─────────────────────────────────────────────────
app.post('/api/qr/scan', async (req, res) => {
  try {
    const { assetId, scannedBy, deviceInfo } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { 
        allocations: { where: { status: 'Active' }, include: { employee: true } },
        maintenance: { orderBy: { scheduled: 'desc' } }
      }
    });
    
    if (!asset || asset.deletedAt) return res.status(404).json({ error: 'Asset not found or deleted' });
    
    await prisma.qRScanLog.create({ 
      data: { assetId, scannedBy: scannedBy || 'Anonymous', deviceInfo, ipAddress, timestamp: new Date() } 
    });
    
    res.json(asset);
  } catch { res.status(500).json({ error: 'Failed to process QR scan' }); }
});

app.post('/api/qr/verify', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const { assetId, condition, notes } = req.body;
    const verifiedBy = req.headers['x-user'] as string || 'Unknown';
    
    const verification = await prisma.physicalVerification.create({
      data: { assetId, condition, notes, verifiedBy, timestamp: new Date() }
    });
    
    await audit('VERIFY', 'Asset', assetId, verifiedBy, `Physical verification: ${condition}`);
    res.json(verification);
  } catch { res.status(500).json({ error: 'Failed to submit verification' }); }
});

app.get('/api/qr/analytics', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const totalScans = await prisma.qRScanLog.count();
    
    // Group by assetId to find most scanned
    const popularRaw = await prisma.qRScanLog.groupBy({
      by: ['assetId'],
      _count: { assetId: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 5
    });
    
    // Fetch asset names for popular ones
    const mostScanned = await Promise.all(popularRaw.map(async (row) => {
      const a = await prisma.asset.findUnique({ where: { id: row.assetId }, select: { id: true, name: true, category: true } });
      return { ...a, scans: row._count.assetId };
    }));
    
    const totalAssets = await prisma.asset.count({ where: { deletedAt: null } });
    
    // Count distinct assets that have a physical verification record
    const verifiedAssetsRaw = await prisma.physicalVerification.groupBy({
      by: ['assetId']
    });
    const verifiedAssetsCount = verifiedAssetsRaw.length;
    
    const verificationRate = totalAssets > 0 ? Math.round((verifiedAssetsCount / totalAssets) * 100) : 0;
    
    res.json({ totalScans, mostScanned, verificationRate, verifiedAssetsCount, totalAssets });
  } catch { res.status(500).json({ error: 'Failed to fetch QR analytics' }); }
});

// ─── MAINTENANCE, VENDORS, TRANSFERS, STATS, REPORTS, BACKUP (Unchanged Core Logic) ───
app.get('/api/maintenance', async (req, res) => {
  try { res.json(await prisma.maintenance.findMany({ include: { asset: true }, orderBy: { scheduled: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch maintenance' }); }
});

app.post('/api/maintenance', requireRole(['Admin', 'Supervisor', 'Store Keeper', 'Employee']), async (req, res) => {
  try {
    const { assetId, type, description, scheduled, nextDueDate, technician, cost, status } = req.body;
    const record = await prisma.maintenance.create({
      data: {
        assetId, type: type || 'Hardware Repair', description,
        scheduled: scheduled ? new Date(scheduled) : new Date(),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        technician, cost: parseFloat(cost) || 0, status: status || 'Pending'
      },
      include: { asset: true }
    });
    if (status === 'In Progress') {
      await prisma.asset.update({ where: { id: assetId }, data: { status: 'Under Maintenance' } });
    }
    await audit('CREATE', 'Maintenance', record.id, req.headers['x-user'] as string || 'Admin', `Scheduled ${type} for ${assetId}`);
    res.status(201).json(record);
  } catch { res.status(500).json({ error: 'Failed to create maintenance' }); }
});

app.put('/api/maintenance/:id', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.scheduled) data.scheduled = new Date(data.scheduled);
    if (data.nextDueDate) data.nextDueDate = new Date(data.nextDueDate);
    if (data.cost) data.cost = parseFloat(data.cost);
    const record = await prisma.maintenance.update({ where: { id: req.params.id }, data, include: { asset: true } });
    if (data.status === 'Completed') {
      // Revert asset to previous status or Available
      await prisma.asset.update({ where: { id: record.assetId }, data: { status: 'Available' } }); // Simplified for demo
    } else if (data.status === 'In Progress') {
      await prisma.asset.update({ where: { id: record.assetId }, data: { status: 'Under Maintenance' } });
    }
    res.json(record);
  } catch { res.status(500).json({ error: 'Failed to update maintenance' }); }
});

app.get('/api/vendors', async (req, res) => {
  try { res.json(await prisma.vendor.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch vendors' }); }
});

app.post('/api/vendors', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const { name, category, contact, rating } = req.body;
    const vendor = await prisma.vendor.create({
      data: { name, category, contact, rating: rating ? parseFloat(rating) : null, orders: 0 }
    });
    await audit('CREATE', 'Vendor', vendor.id, req.headers['x-user'] as string || 'Admin', `Added vendor ${vendor.name}`);
    res.status(201).json(vendor);
  } catch { res.status(500).json({ error: 'Failed to create vendor' }); }
});

// ─── TRANSFERS ────────────────────────────────────────────────────────────────
app.get('/api/transfers', async (req, res) => {
  try { res.json(await prisma.transfer.findMany({ include: { asset: true }, orderBy: { createdAt: 'desc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch transfers' }); }
});

app.post('/api/transfers', requireRole(['Admin', 'Supervisor', 'Store Keeper']), async (req, res) => {
  try {
    const { assetId, fromLocation, toLocation, remarks } = req.body;
    const requestedBy = req.headers['x-user'] as string || 'Admin';
    const transfer = await prisma.transfer.create({
      data: { assetId, fromLocation, toLocation, requestedBy, remarks, status: 'Pending' },
      include: { asset: true }
    });
    await audit('CREATE', 'Transfer', transfer.id, requestedBy, `Transfer request: ${fromLocation} → ${toLocation}`);
    await notify('TRANSFER', 'New Transfer Request', `${transfer.asset.name} needs to be moved from ${fromLocation} to ${toLocation}`, 'Station Manager');
    res.status(201).json(transfer);
  } catch { res.status(500).json({ error: 'Failed to create transfer' }); }
});

app.put('/api/transfers/:id/approve', requireRole(['Admin', 'Station Manager']), async (req, res) => {
  try {
    const approvedBy = req.headers['x-user'] as string || 'Admin';
    const transfer = await prisma.transfer.update({ where: { id: req.params.id }, data: { status: 'Approved', approvedBy }, include: { asset: true } });
    await audit('APPROVE', 'Transfer', transfer.id, approvedBy, `Approved transfer to ${transfer.toLocation}`);
    await notify('TRANSFER', 'Transfer Approved', `Transfer for ${transfer.asset.name} to ${transfer.toLocation} has been approved`, 'Store Keeper');
    res.json(transfer);
  } catch { res.status(500).json({ error: 'Failed to approve transfer' }); }
});

app.put('/api/transfers/:id/reject', requireRole(['Admin', 'Station Manager']), async (req, res) => {
  try {
    const approvedBy = req.headers['x-user'] as string || 'Admin';
    const transfer = await prisma.transfer.update({ where: { id: req.params.id }, data: { status: 'Rejected', approvedBy }, include: { asset: true } });
    await audit('REJECT', 'Transfer', transfer.id, approvedBy, `Rejected transfer for ${transfer.asset.name}`);
    await notify('TRANSFER', 'Transfer Rejected', `Transfer for ${transfer.asset.name} was rejected`, 'Store Keeper');
    res.json(transfer);
  } catch { res.status(500).json({ error: 'Failed to reject transfer' }); }
});

app.put('/api/transfers/:id/complete', requireRole(['Admin', 'Store Keeper', 'Supervisor']), async (req, res) => {
  try {
    const transfer = await prisma.transfer.update({ where: { id: req.params.id }, data: { status: 'Completed', transferDate: new Date() }, include: { asset: true } });
    await prisma.asset.update({ where: { id: transfer.assetId }, data: { location: transfer.toLocation } });
    await audit('COMPLETE', 'Transfer', transfer.id, req.headers['x-user'] as string || 'Admin', `Completed transfer to ${transfer.toLocation}`);
    await notify('TRANSFER', 'Transfer Completed', `${transfer.asset.name} has been moved to ${transfer.toLocation}`, 'Admin');
    res.json(transfer);
  } catch { res.status(500).json({ error: 'Failed to complete transfer' }); }
});

// ─── DISPOSAL ─────────────────────────────────────────────────────────────────
app.get('/api/disposal', async (req, res) => {
  try { res.json(await prisma.disposal.findMany({ include: { asset: true }, orderBy: { createdAt: 'desc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch disposals' }); }
});

app.post('/api/disposal', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const { assetId, reason, condition, inspectionNotes, disposalValue } = req.body;
    const requestedBy = req.headers['x-user'] as string || 'Admin';
    const disposal = await prisma.disposal.create({
      data: { assetId, reason, condition, inspectionNotes, disposalValue: parseFloat(disposalValue) || 0, status: 'Under Review' },
      include: { asset: true }
    });
    // Mark asset as Condemned to prevent further allocation
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'Condemned' } });
    await audit('CONDEMN', 'Asset', assetId, requestedBy, `Disposal initiated: ${reason}`);
    await notify('DISPOSAL', 'Disposal Request Submitted', `${disposal.asset.name} has been flagged for disposal review`, 'Admin');
    res.status(201).json(disposal);
  } catch { res.status(500).json({ error: 'Failed to create disposal' }); }
});

// Allow Station Manager to move disposal from 'Under Review' to 'Condemned' (pre-approve step)
app.put('/api/disposal/:id/condemn', requireRole(['Admin', 'Station Manager']), async (req, res) => {
  try {
    const approvedBy = req.headers['x-user'] as string || 'Admin';
    const disposal = await prisma.disposal.update({ where: { id: Number(req.params.id) }, data: { status: 'Condemned', approvedBy }, include: { asset: true } });
    await audit('CONDEMN_REVIEW', 'Disposal', String(disposal.id), approvedBy, `Condemned disposal of ${disposal.asset.name}`);
    res.json(disposal);
  } catch { res.status(500).json({ error: 'Failed to condemn disposal' }); }
});

app.put('/api/disposal/:id/approve', requireRole(['Admin', 'Station Manager']), async (req, res) => {
  try {
    const approvedBy = req.headers['x-user'] as string || 'Admin';
    const disposal = await prisma.disposal.update({ where: { id: Number(req.params.id) }, data: { status: 'Approved for Disposal', approvedBy }, include: { asset: true } });
    await audit('APPROVE_DISPOSAL', 'Disposal', String(disposal.id), approvedBy, `Approved disposal of ${disposal.asset.name}`);
    await notify('DISPOSAL', 'Disposal Approved', `Disposal of ${disposal.asset.name} has been approved`, 'Supervisor');
    res.json(disposal);
  } catch { res.status(500).json({ error: 'Failed to approve disposal' }); }
});

app.put('/api/disposal/:id/complete', requireRole(['Admin']), async (req, res) => {
  try {
    const disposal = await prisma.disposal.update({ where: { id: Number(req.params.id) }, data: { status: 'Disposed', disposalDate: new Date() }, include: { asset: true } });
    await prisma.asset.update({ where: { id: disposal.assetId }, data: { status: 'Disposed', disposedAt: new Date(), disposalReason: disposal.reason } });
    await audit('DISPOSE', 'Asset', disposal.assetId, req.headers['x-user'] as string || 'Admin', `Asset fully disposed`);
    res.json(disposal);
  } catch { res.status(500).json({ error: 'Failed to complete disposal' }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string || 'Admin';
    const notifs = await prisma.notification.findMany({
      where: { OR: [{ targetRole: null }, { targetRole: role }, { targetRole: 'Admin' }] },
      orderBy: { createdAt: 'desc' }, take: 50
    });
    res.json(notifs);
  } catch { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

app.get('/api/notifications/count', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string || 'Admin';
    const count = await prisma.notification.count({
      where: { isRead: false, OR: [{ targetRole: null }, { targetRole: role }] }
    });
    res.json({ count });
  } catch { res.status(500).json({ error: 'Failed to count notifications' }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notif = await prisma.notification.update({ where: { id: Number(req.params.id) }, data: { isRead: true } });
    res.json(notif);
  } catch { res.status(500).json({ error: 'Failed to mark notification as read' }); }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string || 'Admin';
    await prisma.notification.updateMany({ where: { OR: [{ targetRole: null }, { targetRole: role }] }, data: { isRead: true } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ─── WARRANTY ALERTS ──────────────────────────────────────────────────────────
app.get('/api/warranty/alerts', async (req, res) => {
  try {
    const now = new Date();
    const assets = await prisma.asset.findMany({ where: { warranty: { not: null }, deletedAt: null }, select: { id: true, name: true, warranty: true, category: true, location: true, status: true, vendor: true, vendorContact: true } });
    const results = assets.map(a => {
      try {
        const expiry = new Date(a.warranty as string);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...a, expiryDate: expiry.toISOString(), daysLeft };
      } catch { return null; }
    }).filter(Boolean);
    const expired = results.filter(a => a!.daysLeft <= 0);
    const in30 = results.filter(a => a!.daysLeft > 0 && a!.daysLeft <= 30);
    const in60 = results.filter(a => a!.daysLeft > 30 && a!.daysLeft <= 60);
    const in90 = results.filter(a => a!.daysLeft > 60 && a!.daysLeft <= 90);
    res.json({ expired, in30, in60, in90 });
  } catch { res.status(500).json({ error: 'Failed to fetch warranty alerts' }); }
});

// ─── HEALTH SCORE ─────────────────────────────────────────────────────────────
app.post('/api/assets/:id/recalculate-health', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const score = await recalculateHealthScore(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id }, select: { healthScore: true, healthCategory: true, healthUpdatedAt: true } });
    res.json(asset);
  } catch { res.status(500).json({ error: 'Failed to recalculate health score' }); }
});

app.get('/api/assets/health-distribution', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({ where: { deletedAt: null }, select: { healthScore: true, healthCategory: true, name: true, id: true } });
    const distribution = {
      excellent: assets.filter(a => a.healthScore >= 90).length,
      good: assets.filter(a => a.healthScore >= 70 && a.healthScore < 90).length,
      fair: assets.filter(a => a.healthScore >= 50 && a.healthScore < 70).length,
      poor: assets.filter(a => a.healthScore >= 30 && a.healthScore < 50).length,
      critical: assets.filter(a => a.healthScore < 30).length,
    };
    const criticalAssets = assets.filter(a => a.healthScore < 50).sort((a, b) => a.healthScore - b.healthScore).slice(0, 10);
    res.json({ distribution, criticalAssets });
  } catch { res.status(500).json({ error: 'Failed to fetch health distribution' }); }
});

// ─── VERIFICATION CAMPAIGNS ───────────────────────────────────────────────────
app.get('/api/campaigns', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const campaigns = await prisma.verificationCampaign.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch { res.status(500).json({ error: 'Failed to fetch campaigns' }); }
});

app.post('/api/campaigns', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const { name, startDate, endDate, location, auditor } = req.body;
    const campaign = await prisma.verificationCampaign.create({
      data: { name, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, location, auditor, status: 'Active' }
    });
    await audit('CREATE', 'Campaign', String(campaign.id), req.headers['x-user'] as string || 'Admin', `Created campaign: ${name}`);
    res.status(201).json(campaign);
  } catch { res.status(500).json({ error: 'Failed to create campaign' }); }
});

app.put('/api/campaigns/:id/complete', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const campaign = await prisma.verificationCampaign.update({ where: { id: Number(req.params.id) }, data: { status: 'Completed', endDate: new Date() } });
    await audit('COMPLETE', 'Campaign', String(campaign.id), req.headers['x-user'] as string || 'Admin', `Completed campaign: ${campaign.name}`);
    res.json(campaign);
  } catch { res.status(500).json({ error: 'Failed to complete campaign' }); }
});

app.get('/api/campaigns/:id/report', requireRole(['Admin', 'Supervisor']), async (req, res) => {
  try {
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: Number(req.params.id) },
      include: { entries: { include: { asset: true } } }
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const totalAssets = await prisma.asset.count({ where: { deletedAt: null } });
    const conditions: Record<string, number> = {};
    campaign.entries.forEach(e => { conditions[e.condition] = (conditions[e.condition] || 0) + 1; });
    res.json({ campaign, totalAssets, verified: campaign.entries.length, completionRate: Math.round((campaign.entries.length / totalAssets) * 100), conditions });
  } catch { res.status(500).json({ error: 'Failed to generate campaign report' }); }
});

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'docs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadDoc = multer({ storage: docStorage });

app.get('/api/assets/:id/documents', async (req, res) => {
  try { res.json(await prisma.assetDocument.findMany({ where: { assetId: req.params.id }, orderBy: { createdAt: 'desc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch documents' }); }
});

app.post('/api/assets/:id/documents', requireRole(['Admin', 'Store Keeper', 'Supervisor']), uploadDoc.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const uploadedBy = req.headers['x-user'] as string || 'Admin';
    const doc = await prisma.assetDocument.create({
      data: {
        assetId: req.params.id,
        fileName: req.body.fileName || req.file.originalname,
        fileType: req.body.fileType || 'Other',
        filePath: `/uploads/docs/${req.file.filename}`,
        fileSize: req.file.size,
        uploadedBy
      }
    });
    await audit('UPLOAD', 'Document', String(doc.id), uploadedBy, `Uploaded ${doc.fileName} for asset ${req.params.id}`);
    res.status(201).json(doc);
  } catch { res.status(500).json({ error: 'Failed to upload document' }); }
});

app.delete('/api/documents/:id', requireRole(['Admin', 'Store Keeper', 'Supervisor']), async (req, res) => {
  try {
    const doc = await prisma.assetDocument.findUnique({ where: { id: Number(req.params.id) } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const filePath = path.join(process.cwd(), doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.assetDocument.delete({ where: { id: Number(req.params.id) } });
    await audit('DELETE', 'Document', String(req.params.id), req.headers['x-user'] as string || 'Admin', `Deleted ${doc.fileName}`);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete document' }); }
});

// ─── ASSET TIMELINE ───────────────────────────────────────────────────────────
app.get('/api/assets/:id/timeline', async (req, res) => {
  try {
    const assetId = req.params.id;
    const [audits, allocs, maint, transfers, verifications] = await Promise.all([
      prisma.auditLog.findMany({ where: { entityId: assetId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.allocation.findMany({ where: { assetId }, include: { employee: true }, orderBy: { assignedAt: 'desc' } }),
      prisma.maintenance.findMany({ where: { assetId }, orderBy: { scheduled: 'desc' } }),
      prisma.transfer.findMany({ where: { assetId }, orderBy: { createdAt: 'desc' } }),
      prisma.physicalVerification.findMany({ where: { assetId }, orderBy: { timestamp: 'desc' } })
    ]);
    const timeline: any[] = [];
    audits.forEach(a => timeline.push({ type: 'audit', action: a.action, user: a.user, description: a.details, timestamp: a.createdAt }));
    allocs.forEach(a => {
      timeline.push({ type: 'allocation', action: 'ASSIGNED', user: a.employee.name, description: `Assigned to ${a.employee.name}`, timestamp: a.assignedAt });
      if (a.returnedAt) timeline.push({ type: 'allocation', action: 'RETURNED', user: a.employee.name, description: `Returned by ${a.employee.name}`, timestamp: a.returnedAt });
    });
    maint.forEach(m => timeline.push({ type: 'maintenance', action: m.status, user: m.technician || 'Unknown', description: `${m.type}: ${m.description || ''}`, timestamp: m.scheduled }));
    transfers.forEach(t => timeline.push({ type: 'transfer', action: 'TRANSFER', user: t.requestedBy, description: `Transfer ${t.fromLocation} → ${t.toLocation} (${t.status})`, timestamp: t.createdAt }));
    verifications.forEach(v => timeline.push({ type: 'verification', action: 'VERIFY', user: v.verifiedBy, description: `Physical condition: ${v.condition}`, timestamp: v.timestamp }));
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(timeline);
  } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

// ─── EXISTING REPORTS, DEPRECIATION, DISPOSE ─────────────────────────────────
app.get('/api/audit', requireRole(['Admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit }));
  } catch { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});

app.get('/api/reports/available', async (req, res) => {
  try { res.json(await prisma.asset.findMany({ where: { status: 'Available', deletedAt: null }, include: { vendor: true } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
app.get('/api/reports/faulty', async (req, res) => {
  try { res.json(await prisma.asset.findMany({ where: { status: 'Under Maintenance', deletedAt: null }, include: { vendor: true } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
app.get('/api/depreciation', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({ where: { deletedAt: null, NOT: { status: 'Disposed' } }, include: { vendor: true } });
    const now = new Date();
    res.json(assets.map(a => {
      const yearsOwned = (now.getTime() - new Date(a.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const annualDep = (a.cost - a.salvageValue) / (a.usefulLifeYears || 5);
      const acc = Math.min(annualDep * yearsOwned, a.cost - a.salvageValue);
      return { ...a, yearsOwned: parseFloat(yearsOwned.toFixed(2)), annualDepreciation: parseFloat(annualDep.toFixed(2)), accumulatedDepreciation: parseFloat(acc.toFixed(2)), bookValue: Math.max(a.cost - acc, a.salvageValue), pctDepreciated: a.cost > 0 ? (acc / a.cost) * 100 : 0 };
    }));
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/assets/:id/dispose', requireRole(['Admin', 'Station Manager']), async (req, res) => {
  try {
    const asset = await prisma.asset.update({ where: { id: req.params.id }, data: { status: 'Disposed', disposalReason: req.body.disposalReason, disposedAt: new Date() } });
    await audit('DISPOSE', 'Asset', req.params.id, req.headers['x-user'] as string || 'Admin', `Disposed: ${req.body.disposalReason}`);
    res.json(asset);
  } catch { res.status(500).json({ error: 'Failed to dispose asset' }); }
});

// ─── BACKUP ───────────────────────────────────────────────────────────────────
app.get('/api/backup', requireRole(['Admin']), async (req, res) => {
  try {
    const [assets, employees, vendors, maintenance, transfers, allocations, disposals, notifications, auditLogs] = await Promise.all([
      prisma.asset.findMany(),
      prisma.employee.findMany(),
      prisma.vendor.findMany(),
      prisma.maintenance.findMany(),
      prisma.transfer.findMany(),
      prisma.allocation.findMany(),
      prisma.disposal.findMany(),
      prisma.notification.findMany(),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
    ]);
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: { assets, employees, vendors, maintenance, transfers, allocations, disposals, notifications, auditLogs }
    };
    res.setHeader('Content-Disposition', `attachment; filename=rms-backup-${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch { res.status(500).json({ error: 'Failed to create backup' }); }
});

app.listen(port, () => console.log(`✅ R-AMS Enterprise Backend running on http://localhost:${port}`));
