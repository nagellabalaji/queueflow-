const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get analytics overview and trends
router.get('/', authenticateToken, (req, res) => {
  const managerId = req.manager.id;
  const queueId = req.query.queue_id ? Number(req.query.queue_id) : null;
  const period = req.query.period || 'all'; // 'today', 'week', 'all'

  try {
    let timeFilter = '';
    if (period === 'today') {
      timeFilter = "AND date(t.created_at) = date('now')";
    } else if (period === 'week') {
      timeFilter = "AND date(t.created_at) >= date('now', '-7 days')";
    }

    let queueFilter = '';
    const params = [managerId];
    if (queueId) {
      queueFilter = 'AND t.queue_id = ?';
      params.push(queueId);
    }

    // 1. Overall Metrics
    const metricsQuery = `
      SELECT 
        COUNT(t.id) as total_tokens,
        COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN t.status = 'IN_SERVICE' THEN 1 END) as serving_count,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled_count,
        ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds END), 1) as avg_wait_seconds,
        ROUND(AVG(CASE WHEN t.service_duration_seconds IS NOT NULL THEN t.service_duration_seconds END), 1) as avg_service_seconds,
        MIN(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds END) as min_wait_seconds,
        MAX(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds END) as max_wait_seconds
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE q.manager_id = ? ${queueFilter} ${timeFilter}
    `;

    const metrics = db.prepare(metricsQuery).get(...params) || {};

    // 2. Hourly Queue Trends (Creation vs Completed per hour)
    const hourlyQuery = `
      SELECT 
        strftime('%H:00', t.created_at) as hour,
        COUNT(t.id) as arrivals,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as served,
        COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled,
        ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds / 60.0 END), 1) as avg_wait_min
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE q.manager_id = ? ${queueFilter} ${timeFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `;
    const hourlyTrends = db.prepare(hourlyQuery).all(...params);

    // 3. Queue Performance Comparison
    const queueComparisonQuery = `
      SELECT 
        q.id,
        q.name,
        q.code_prefix,
        COUNT(t.id) as total_tokens,
        COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_now,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tokens,
        COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled_tokens,
        ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds / 60.0 END), 1) as avg_wait_min,
        ROUND(AVG(CASE WHEN t.service_duration_seconds IS NOT NULL THEN t.service_duration_seconds / 60.0 END), 1) as avg_service_min
      FROM queues q
      LEFT JOIN tokens t ON q.id = t.queue_id ${timeFilter}
      WHERE q.manager_id = ? AND q.is_active = 1
      GROUP BY q.id
      ORDER BY total_tokens DESC
    `;
    const queueComparison = db.prepare(queueComparisonQuery).all(managerId);

    // 4. Status Breakdown for Pie/Donut Chart
    const statusBreakdown = [
      { name: 'Waiting', value: metrics.waiting_count || 0, color: '#3B82F6' },
      { name: 'In Service', value: metrics.serving_count || 0, color: '#10B981' },
      { name: 'Completed', value: metrics.completed_count || 0, color: '#6366F1' },
      { name: 'Cancelled', value: metrics.cancelled_count || 0, color: '#EF4444' }
    ];

    // 5. Priority distribution
    const priorityQuery = `
      SELECT 
        t.priority,
        COUNT(t.id) as count,
        ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds / 60.0 END), 1) as avg_wait_min
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE q.manager_id = ? ${queueFilter} ${timeFilter}
      GROUP BY t.priority
    `;
    const priorityStats = db.prepare(priorityQuery).all(...params);

    // Calculate rates
    const totalFinished = (metrics.completed_count || 0) + (metrics.cancelled_count || 0);
    const cancellationRate = totalFinished > 0 
      ? Math.round(((metrics.cancelled_count || 0) / totalFinished) * 100) 
      : 0;

    res.json({
      summary: {
        totalTokens: metrics.total_tokens || 0,
        waitingCount: metrics.waiting_count || 0,
        servingCount: metrics.serving_count || 0,
        completedCount: metrics.completed_count || 0,
        cancelledCount: metrics.cancelled_count || 0,
        avgWaitSeconds: metrics.avg_wait_seconds || 0,
        avgWaitMinutes: metrics.avg_wait_seconds ? Math.round(metrics.avg_wait_seconds / 6) / 10 : 0,
        avgServiceSeconds: metrics.avg_service_seconds || 0,
        avgServiceMinutes: metrics.avg_service_seconds ? Math.round(metrics.avg_service_seconds / 6) / 10 : 0,
        minWaitSeconds: metrics.min_wait_seconds || 0,
        maxWaitSeconds: metrics.max_wait_seconds || 0,
        cancellationRate
      },
      hourlyTrends,
      queueComparison,
      statusBreakdown,
      priorityStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to compute queue analytics.' });
  }
});

// Export CSV report of tokens
router.get('/export', authenticateToken, (req, res) => {
  try {
    const managerId = req.manager.id;
    const tokens = db.prepare(`
      SELECT 
        t.token_code,
        t.customer_name,
        t.customer_phone,
        q.name as queue_name,
        t.priority,
        t.status,
        t.position,
        t.wait_duration_seconds,
        t.service_duration_seconds,
        t.counter_assigned,
        t.cancellation_reason,
        t.created_at,
        t.service_started_at,
        t.service_ended_at
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE q.manager_id = ?
      ORDER BY t.created_at DESC
    `).all(managerId);

    const headers = [
      'Token Code',
      'Customer Name',
      'Phone',
      'Queue Name',
      'Priority',
      'Status',
      'Position',
      'Wait Time (sec)',
      'Service Time (sec)',
      'Counter',
      'Cancellation Reason',
      'Created At',
      'Service Started At',
      'Service Ended At'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];
    tokens.forEach((t) => {
      csvRows.push([
        escapeCsv(t.token_code),
        escapeCsv(t.customer_name),
        escapeCsv(t.customer_phone),
        escapeCsv(t.queue_name),
        escapeCsv(t.priority),
        escapeCsv(t.status),
        escapeCsv(t.position),
        escapeCsv(t.wait_duration_seconds),
        escapeCsv(t.service_duration_seconds),
        escapeCsv(t.counter_assigned),
        escapeCsv(t.cancellation_reason),
        escapeCsv(t.created_at),
        escapeCsv(t.service_started_at),
        escapeCsv(t.service_ended_at)
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="queueflow_report_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
});

module.exports = router;
