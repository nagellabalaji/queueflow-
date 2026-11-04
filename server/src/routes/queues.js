const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { emitQueueUpdate } = require('../socket');

const router = express.Router();

// List all queues for the logged-in manager
router.get('/', authenticateToken, (req, res) => {
  try {
    const queues = db.prepare(`
      SELECT 
        q.*,
        COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN t.status = 'IN_SERVICE' THEN 1 END) as serving_count,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled_count,
        (
          SELECT t2.token_code 
          FROM tokens t2 
          WHERE t2.queue_id = q.id AND t2.status = 'IN_SERVICE' 
          ORDER BY t2.service_started_at DESC LIMIT 1
        ) as current_serving_token,
        (
          SELECT t3.customer_name 
          FROM tokens t3 
          WHERE t3.queue_id = q.id AND t3.status = 'IN_SERVICE' 
          ORDER BY t3.service_started_at DESC LIMIT 1
        ) as current_serving_customer
      FROM queues q
      LEFT JOIN tokens t ON q.id = t.queue_id
      WHERE q.manager_id = ? AND q.is_active = 1
      GROUP BY q.id
      ORDER BY q.created_at ASC
    `).all(req.manager.id);

    res.json({ queues });
  } catch (error) {
    console.error('Fetch queues error:', error);
    res.status(500).json({ error: 'Failed to retrieve queues.' });
  }
});

// Create new queue
router.post('/', authenticateToken, (req, res) => {
  const { name, code_prefix, description, counter_name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Queue name is required.' });
  }

  // Derive a 2-4 uppercase letter code prefix if not provided
  let prefix = (code_prefix || name.substring(0, 3)).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!prefix) prefix = 'Q';

  try {
    const result = db.prepare(`
      INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.manager.id,
      name.trim(),
      prefix,
      description ? description.trim() : null,
      counter_name ? counter_name.trim() : 'Counter 1'
    );

    const newQueueId = Number(result.lastInsertRowid);
    const newQueue = db.prepare('SELECT * FROM queues WHERE id = ?').get(newQueueId);

    emitQueueUpdate(newQueueId, 'QUEUE_CREATED', newQueue);
    res.status(201).json({ message: 'Queue created successfully', queue: newQueue });
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({ error: 'Failed to create queue.' });
  }
});

// Get queue by ID
router.get('/:id', authenticateToken, (req, res) => {
  const queueId = Number(req.params.id);

  try {
    const queue = db.prepare(`
      SELECT q.*,
        COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN t.status = 'IN_SERVICE' THEN 1 END) as serving_count
      FROM queues q
      LEFT JOIN tokens t ON q.id = t.queue_id
      WHERE q.id = ? AND q.manager_id = ?
      GROUP BY q.id
    `).get(queueId, req.manager.id);

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    res.json({ queue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue details.' });
  }
});

// Update queue
router.put('/:id', authenticateToken, (req, res) => {
  const queueId = Number(req.params.id);
  const { name, code_prefix, description, counter_name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Queue name is required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM queues WHERE id = ? AND manager_id = ?').get(queueId, req.manager.id);
    if (!existing) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    db.prepare(`
      UPDATE queues 
      SET name = ?, code_prefix = ?, description = ?, counter_name = ?
      WHERE id = ?
    `).run(
      name.trim(),
      (code_prefix || 'Q').trim().toUpperCase(),
      description ? description.trim() : null,
      counter_name ? counter_name.trim() : 'Counter 1',
      queueId
    );

    const updatedQueue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);
    emitQueueUpdate(queueId, 'QUEUE_UPDATED', updatedQueue);

    res.json({ message: 'Queue updated successfully', queue: updatedQueue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue.' });
  }
});

// Delete queue (soft or hard)
router.delete('/:id', authenticateToken, (req, res) => {
  const queueId = Number(req.params.id);

  try {
    const existing = db.prepare('SELECT id FROM queues WHERE id = ? AND manager_id = ?').get(queueId, req.manager.id);
    if (!existing) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    db.prepare('DELETE FROM queues WHERE id = ?').run(queueId);
    emitQueueUpdate(queueId, 'QUEUE_DELETED', { queueId });

    res.json({ message: 'Queue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete queue.' });
  }
});

// Public display info for waiting room monitor / TV screen (no manager login required)
router.get('/public/:id', (req, res) => {
  const queueId = Number(req.params.id);

  try {
    const queue = db.prepare('SELECT id, name, code_prefix, counter_name FROM queues WHERE id = ? AND is_active = 1').get(queueId);
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found or inactive.' });
    }

    const serving = db.prepare(`
      SELECT id, token_code, customer_name, priority, service_started_at, counter_assigned
      FROM tokens
      WHERE queue_id = ? AND status = 'IN_SERVICE'
      ORDER BY service_started_at DESC
    `).all(queueId);

    const waiting = db.prepare(`
      SELECT id, token_code, customer_name, priority, position, created_at
      FROM tokens
      WHERE queue_id = ? AND status = 'WAITING'
      ORDER BY position ASC
      LIMIT 10
    `).all(queueId);

    const totalWaiting = db.prepare(`
      SELECT COUNT(*) as count FROM tokens WHERE queue_id = ? AND status = 'WAITING'
    `).get(queueId).count;

    res.json({
      queue,
      serving,
      waiting,
      totalWaiting
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load public queue display.' });
  }
});

module.exports = router;
