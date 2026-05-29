import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import LostFound from '../models/LostFound.js';
import { emitLostFoundUpdate, emitAdminStatsUpdate, emitLostFoundCreated, emitLostFoundDeleted } from '../services/socketService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'lostfound');

// multer in-memory storage + limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);
    cb(null, ok);
  },
});

async function uploadLostFoundImage(file) {
  if (!file) return null;

  const cloudinaryReady = !!(cloudinary?.config?.().cloud_name && cloudinary?.config?.().api_key && cloudinary?.config?.().api_secret);
  if (cloudinaryReady) {
    try {
      const streamUpload = (buffer) => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'lostfound' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
      });
      const result = await streamUpload(file.buffer);
      if (result?.secure_url) return result.secure_url;
    } catch (error) {
      console.warn('Cloudinary upload failed for Lost & Found, falling back to local storage:', error.message);
    }
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const diskPath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(diskPath, file.buffer);
  return `/uploads/lostfound/${filename}`;
}

// GET list
router.get('/', async (req, res, next) => {
  try {
    const type = String(req.query.type || 'all').trim().toLowerCase();
    const status = String(req.query.status || 'all').trim().toLowerCase();
    const search = String(req.query.search || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const q = {};
    if (type !== 'all' && ['lost', 'found'].includes(type)) q.type = type;
    if (status !== 'all' && ['open', 'claimed'].includes(status)) q.status = status;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      q.$or = [{ title: regex }, { desc: regex }, { location: regex }, { postedBy: regex }, { claimedBy: regex }];
    }

    const [total, rows] = await Promise.all([
      LostFound.countDocuments(q),
      LostFound.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    res.json({
      success: true,
      items: rows.map((item) => ({ ...item, id: item.id || item._id?.toString?.() || String(item._id) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST create with optional image upload
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { type, title, desc, location, postedBy, emoji } = req.body;
    if (!type || !title) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const imageUrl = await uploadLostFoundImage(req.file);
      // If local path was returned (starts with '/uploads'), convert to absolute backend URL
      let imageUrlToStore = imageUrl || null;
      if (imageUrlToStore && imageUrlToStore.startsWith('/')) {
        imageUrlToStore = `${req.protocol}://${req.get('host')}${imageUrlToStore}`;
      }

      const item = await LostFound.create({ type, title, desc, location, postedBy, emoji, imageUrl: imageUrlToStore });
    const payload = item.toObject ? item.toObject() : item;
    // notify realtime clients
    emitLostFoundUpdate({ action: 'create', item: payload });
    emitLostFoundCreated({ action: 'create', item: payload });
    emitAdminStatsUpdate({ source: 'lostfound' });
    res.status(201).json({ success: true, item: { ...payload, id: payload.id || payload._id?.toString?.() || String(payload._id) } });
  } catch (err) {
    console.error('Lost & Found create failed:', err);
    next(err);
  }
});

// Claim an item (mark claimed)
router.patch('/:id/claim', async (req, res, next) => {
  try {
    const { id } = req.params;
    const claimedBy = req.body.claimedBy || 'Claimed user';
    const item = await LostFound.findByIdAndUpdate(id, { $set: { status: 'claimed', claimedBy } }, { new: true }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    emitLostFoundUpdate({ action: 'update', item });
    emitAdminStatsUpdate({ source: 'lostfound' });
    return res.json({ success: true, item: { ...item, id: item.id || item._id?.toString?.() || String(item._id) } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    const requester = `${req.user?.username || ''}`.toLowerCase();
    const owner = `${item.postedBy || ''}`.toLowerCase();
    const canDelete = req.user?.role === 'admin' || (requester && owner && owner.includes(requester));
    if (!canDelete) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await LostFound.findByIdAndDelete(id);
    emitLostFoundUpdate({ action: 'delete', id });
    emitLostFoundDeleted({ action: 'delete', id });
    emitAdminStatsUpdate({ source: 'lostfound' });
    return res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;
