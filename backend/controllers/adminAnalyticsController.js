import {
  buildDashboardPayload,
  listComplaintsAdmin,
  deleteResolvedComplaint,
  listEventsAdmin,
  buildWellbeingInsights,
  searchStudents,
  getStudentDetail,
  getReviewsGroupedByMess,
} from '../services/adminAnalyticsService.js';
import { analyzeMessFeedbackInsights } from '../services/geminiService.js';
import { AnalysisCache } from '../models/AnalysisCache.js';
import { emitAdminStatsUpdate } from '../services/socketService.js';
import { FeeRecord } from '../models/FeeRecord.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await buildDashboardPayload();
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

/** Legacy alias used by older admin UI */
export async function getStats(req, res, next) {
  try {
    const data = await buildDashboardPayload();
    const pendingFeeUsers = await FeeRecord.distinct('userId', { status: { $in: ['pending', 'overdue'] } });
    res.json({
      success: true,
      stats: {
        totalStudents: data.overview.totalStudents,
        activeComplaints: data.overview.pendingComplaints + data.overview.inProgressComplaints,
        pendingLeaves: 0,
        messAttendanceToday: null,
        pendingFees: pendingFeeUsers.length,
        openRooms: null,
      },
      ...data,
    });
  } catch (e) {
    next(e);
  }
}

export async function getComplaints(req, res, next) {
  try {
    const complaints = await listComplaintsAdmin({
      category: req.query.category,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search,
    });
    res.json({ success: true, complaints });
  } catch (e) {
    next(e);
  }
}

export async function removeComplaint(req, res, next) {
  try {
    const result = await deleteResolvedComplaint(req.params.id);
    if (!result.ok) {
      const status = result.code || 500;
      return res.status(status).json({
        success: false,
        message: result.message || 'Cannot delete',
      });
    }
    emitAdminStatsUpdate({ reason: 'complaint_deleted' });
    res.json({ success: true, message: 'Complaint removed' });
  } catch (e) {
    next(e);
  }
}

export async function getEvents(req, res, next) {
  try {
    const data = await listEventsAdmin({
      status: req.query.status,
      search: req.query.search,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

export async function getFeedbackAnalysis(req, res, next) {
  try {
    const groups = await getReviewsGroupedByMess();
    const analyses = [];
    const wantAi = String(req.query.ai || '').toLowerCase() === '1' || String(req.query.ai || '').toLowerCase() === 'true';

    const TTL_MS = 1000 * 60 * 60; // 1 hour
    for (const g of groups) {
      if (g.count === 0) continue;
      const key = `feedback:${g.messHall}`;
      if (!wantAi) {
        analyses.push({ messHall: g.messHall, feedbackCount: g.count, summary: null, sentiment: null });
        continue;
      }

      // try cached value first
      try {
        const cached = await AnalysisCache.findOne({ key }).lean();
        if (cached && cached.updatedAt && Date.now() - new Date(cached.updatedAt).getTime() < TTL_MS) {
          analyses.push({
            messHall: g.messHall,
            feedbackCount: g.count,
            summary: cached.payload?.summary || null,
            sentiment: cached.payload?.sentiment || null,
            fromCache: true,
          });
          continue;
        }
      } catch (err) {
        // ignore cache lookup errors
      }

      try {
        const ai = await analyzeMessFeedbackInsights(g.messHall, g.lines);
        const summary = typeof ai.summary === 'string' ? ai.summary : JSON.stringify(ai.summary);
        const sentiment = ['positive', 'neutral', 'negative'].includes(ai.sentiment) ? ai.sentiment : 'neutral';
        analyses.push({ messHall: g.messHall, feedbackCount: g.count, summary, sentiment });
        // persist cache
        try {
          await AnalysisCache.findOneAndUpdate({ key }, { payload: { summary, sentiment }, updatedAt: new Date() }, { upsert: true });
        } catch (_) {
          // ignore cache write errors
        }
      } catch (err) {
        const friendly = err?.message || 'AI analysis unavailable';
        analyses.push({ messHall: g.messHall, feedbackCount: g.count, summary: friendly, sentiment: 'neutral' });
      }
    }

    res.json({ success: true, analyses });
  } catch (e) {
    next(e);
  }
}

export async function getWellbeing(req, res, next) {
  try {
    const data = await buildWellbeingInsights();
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

export async function getStudents(req, res, next) {
  try {
    const students = await searchStudents(req.query.q);
    res.json({ success: true, students });
  } catch (e) {
    next(e);
  }
}

export async function getOneStudent(req, res, next) {
  try {
    const detail = await getStudentDetail(req.params.id);
    if (!detail) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, ...detail });
  } catch (e) {
    next(e);
  }
}
