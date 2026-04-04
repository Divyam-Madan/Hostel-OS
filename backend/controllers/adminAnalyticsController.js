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
import { emitAdminStatsUpdate } from '../services/socketService.js';

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
    res.json({
      success: true,
      stats: {
        totalStudents: data.overview.totalStudents,
        activeComplaints: data.overview.pendingComplaints + data.overview.inProgressComplaints,
        pendingLeaves: 0,
        messAttendanceToday: null,
        pendingFees: null,
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
    const events = await listEventsAdmin();
    res.json({ success: true, events });
  } catch (e) {
    next(e);
  }
}

export async function getFeedbackAnalysis(req, res, next) {
  try {
    const groups = await getReviewsGroupedByMess();
    const analyses = [];
    for (const g of groups) {
      if (g.count === 0) continue;
      let summary = 'No feedback text.';
      let sentiment = 'neutral';
      try {
        const ai = await analyzeMessFeedbackInsights(g.messHall, g.lines);
        summary = typeof ai.summary === 'string' ? ai.summary : JSON.stringify(ai.summary);
        sentiment = ['positive', 'neutral', 'negative'].includes(ai.sentiment) ? ai.sentiment : 'neutral';
      } catch (err) {
        summary = err.message || 'AI analysis unavailable';
      }
      analyses.push({
        messHall: g.messHall,
        feedbackCount: g.count,
        summary,
        sentiment,
      });
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
