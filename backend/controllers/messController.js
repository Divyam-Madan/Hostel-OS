import { MessMenu } from '../models/MessMenu.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { emitOrderUpdate } from '../services/socketService.js';

const MEAL_META = {
  breakfast: { label: 'Breakfast', time: '7:00 – 9:00 AM', icon: '🌅' },
  lunch: { label: 'Lunch', time: '12:00 – 2:00 PM', icon: '☀️' },
  snacks: { label: 'Evening Snacks', time: '5:00 – 6:00 PM', icon: '☕' },
  dinner: { label: 'Dinner', time: '7:30 – 9:30 PM', icon: '🌙' },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Shape expected by Mess.jsx (meals array). */
function menuToFrontend(doc) {
  if (!doc) return null;
  const date = new Date(doc.date + 'T12:00:00.000Z').toDateString();
  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'].map((id) => {
    const items = doc[id] || [];
    const m = MEAL_META[id];
    return {
      id,
      label: m.label,
      time: m.time,
      icon: m.icon,
      items,
      rating: null,
      votes: null,
    };
  });
  return { date, meals, rawDate: doc.date };
}

export async function getTodayMenu(req, res, next) {
  try {
    const key = todayKey();
    let doc = await MessMenu.findOne({ date: key });
    if (!doc) {
      doc = await MessMenu.findOne().sort({ date: -1 });
    }
    res.json({ success: true, menu: menuToFrontend(doc), fallback: !doc || doc.date !== key });
  } catch (e) {
    next(e);
  }
}

async function nextTokenNumber() {
  const last = await Order.findOne().sort({ tokenNumber: -1 }).select('tokenNumber').lean();
  return (last?.tokenNumber || 1000) + 1;
}

export async function placeOrder(req, res, next) {
  try {
    const { items, mealType } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array required' });
    }
    const tokenNumber = await nextTokenNumber();
    const order = await Order.create({
      userId: req.user.id,
      items: items.map((i) => String(i).trim()).filter(Boolean),
      tokenNumber,
      mealType: ['breakfast', 'lunch', 'snacks', 'dinner', 'other'].includes(mealType)
        ? mealType
        : 'other',
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { tokens: { $each: [tokenNumber], $slice: -20 } },
    });
    const payload = {
      tokenNumber,
      orderId: order._id.toString(),
      items: order.items,
      createdAt: order.createdAt,
    };
    emitOrderUpdate({ action: 'created', order: payload });
    res.status(201).json({ success: true, ...payload });
  } catch (e) {
    next(e);
  }
}
