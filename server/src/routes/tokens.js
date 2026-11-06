const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { emitQueueUpdate } = require('../socket');

const router = express.Router();

// Helper to re-compact waiting positions 1..N
function compactQueuePositions(queueId) {
  const waitingTokens = db.prepare(`
    SELECT id FROM tokens
    WHERE queue_id = ? AND status = 'WAITING'
    ORDER BY position ASC, id ASC
  `).all(queueId);

  const updateStmt = db.prepare('UPDATE tokens SET position = ? WHERE id = ?');
  waitingTokens.forEach((token, index) => {
    updateStmt.run(index + 1, token.id);
  });
}

// Get all tokens for a queue (waiting, in-service, recent history)
router.get('/queue/:queueId', authenticateToken, (req, res) => {
  const queueId = Number(req.params.queueId);

  try {
    const queue = db.prepare('SELECT * FROM queues WHERE id = ? AND manager_id = ?').get(queueId, req.manager.id);
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    const waiting = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ? AND status = 'WAITING'
      ORDER BY position ASC
    `).all(queueId);

    const serving = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ? AND status = 'IN_SERVICE'
      ORDER BY service_started_at DESC
    `).all(queueId);

    const recentHistory = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ? AND status IN ('COMPLETED', 'CANCELLED')
      ORDER BY COALESCE(service_ended_at, created_at) DESC
      LIMIT 15
    `).all(queueId);

    res.json({
      queue,
      waiting,
      serving,
      recentHistory
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to retrieve tokens.' });
  }
});

// Add new person / token into queue
router.post('/', authenticateToken, (req, res) => {
  const { queue_id, customer_name, customer_phone, priority } = req.body;

  if (!queue_id || !customer_name || !customer_name.trim()) {
    return res.status(400).json({ error: 'Queue ID and customer name are required.' });
  }

  const queueId = Number(queue_id);
  const queue = db.prepare('SELECT * FROM queues WHERE id = ? AND manager_id = ?').get(queueId, req.manager.id);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found.' });
  }

  try {
    // Generate next token number for this queue
    const lastToken = db.prepare(`
      SELECT MAX(token_number) as max_num FROM tokens WHERE queue_id = ?
    `).get(queueId);
    const tokenNumber = (lastToken && lastToken.max_num ? lastToken.max_num : 0) + 1;
    const tokenCode = `${queue.code_prefix}-${String(tokenNumber).padStart(3, '0')}`;

    // Get next position in waiting list
    const maxPos = db.prepare(`
      SELECT MAX(position) as max_pos FROM tokens WHERE queue_id = ? AND status = 'WAITING'
    `).get(queueId);
    const nextPosition = (maxPos && maxPos.max_pos ? maxPos.max_pos : 0) + 1;

    const result = db.prepare(`
      INSERT INTO tokens (
        queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position
      ) VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?)
    `).run(
      queueId,
      tokenNumber,
      tokenCode,
      customer_name.trim(),
      customer_phone ? customer_phone.trim() : null,
      priority ? priority.toUpperCase() : 'NORMAL',
      nextPosition
    );

    const newTokenId = Number(result.lastInsertRowid);
    const newToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(newTokenId);

    emitQueueUpdate(queueId, 'TOKEN_ADDED', newToken);

    res.status(201).json({
      message: `Token ${tokenCode} generated successfully for ${customer_name}`,
      token: newToken
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({ error: 'Failed to add token to queue.' });
  }
});

// Move token UP in the queue (Requirement 5)
router.post('/:id/move-up', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id 
      FROM tokens t 
      JOIN queues q ON t.queue_id = q.id 
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be moved in queue.' });
    }

    if (token.position <= 1) {
      return res.status(400).json({ error: 'Token is already at the top of the queue.' });
    }

    const prevToken = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'WAITING' AND position = ?
    `).get(token.queue_id, token.position - 1);

    if (prevToken) {
      // Swap positions
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position - 1, token.id);
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position, prevToken.id);
    } else {
      // Re-compact if gap detected
      compactQueuePositions(token.queue_id);
    }

    emitQueueUpdate(token.queue_id, 'TOKEN_MOVED', { tokenId, direction: 'UP' });
    res.json({ message: 'Token moved up successfully.' });
  } catch (error) {
    console.error('Move up error:', error);
    res.status(500).json({ error: 'Failed to move token up.' });
  }
});

// Move token DOWN in the queue (Requirement 5)
router.post('/:id/move-down', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id 
      FROM tokens t 
      JOIN queues q ON t.queue_id = q.id 
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be moved in queue.' });
    }

    const nextToken = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'WAITING' AND position = ?
    `).get(token.queue_id, token.position + 1);

    if (!nextToken) {
      return res.status(400).json({ error: 'Token is already at the bottom of the queue.' });
    }

    // Swap positions
    db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position + 1, token.id);
    db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position, nextToken.id);

    emitQueueUpdate(token.queue_id, 'TOKEN_MOVED', { tokenId, direction: 'DOWN' });
    res.json({ message: 'Token moved down successfully.' });
  } catch (error) {
    console.error('Move down error:', error);
    res.status(500).json({ error: 'Failed to move token down.' });
  }
});

// Assign the token at the top of the queue for service (Requirement 6)
router.post('/queue/:queueId/serve-next', authenticateToken, (req, res) => {
  const queueId = Number(req.params.queueId);
  const { counter_name } = req.body;

  try {
    const queue = db.prepare('SELECT * FROM queues WHERE id = ? AND manager_id = ?').get(queueId, req.manager.id);
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    // Find the token at top of the queue (position = 1 or min position)
    const topToken = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ? AND status = 'WAITING'
      ORDER BY position ASC, id ASC
      LIMIT 1
    `).get(queueId);

    if (!topToken) {
      return res.status(400).json({ error: 'No tokens are currently waiting in this queue.' });
    }

    // Calculate wait duration in seconds
    const createdAtSeconds = Math.floor(new Date(topToken.created_at).getTime() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const waitDurationSeconds = Math.max(0, nowSeconds - createdAtSeconds);

    const deskCounter = counter_name || queue.counter_name || 'Counter 1';

    // Mark as IN_SERVICE
    db.prepare(`
      UPDATE tokens
      SET status = 'IN_SERVICE',
          position = NULL,
          service_started_at = datetime('now'),
          wait_duration_seconds = ?,
          counter_assigned = ?
      WHERE id = ?
    `).run(waitDurationSeconds, deskCounter, topToken.id);

    // Recompact remaining waiting tokens
    compactQueuePositions(queueId);

    const servedToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(topToken.id);

    emitQueueUpdate(queueId, 'TOKEN_SERVED', servedToken);

    res.json({
      message: `Token ${servedToken.token_code} assigned to ${deskCounter}.`,
      token: servedToken
    });
  } catch (error) {
    console.error('Serve next error:', error);
    res.status(500).json({ error: 'Failed to assign token for service.' });
  }
});

// Serve a specific token (even if not top, e.g., priority call)
router.post('/:id/serve', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);
  const { counter_name } = req.body;

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id, q.counter_name as queue_counter
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be assigned for service.' });
    }

    const createdAtSeconds = Math.floor(new Date(token.created_at).getTime() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const waitDurationSeconds = Math.max(0, nowSeconds - createdAtSeconds);
    const deskCounter = counter_name || token.queue_counter || 'Counter 1';

    db.prepare(`
      UPDATE tokens
      SET status = 'IN_SERVICE',
          position = NULL,
          service_started_at = datetime('now'),
          wait_duration_seconds = ?,
          counter_assigned = ?
      WHERE id = ?
    `).run(waitDurationSeconds, deskCounter, tokenId);

    compactQueuePositions(token.queue_id);
    const servedToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    emitQueueUpdate(token.queue_id, 'TOKEN_SERVED', servedToken);
    res.json({ message: `Token ${servedToken.token_code} is now being served.`, token: servedToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve token.' });
  }
});

// Mark token service as completed
router.post('/:id/complete', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({ error: 'Only in-service tokens can be marked as completed.' });
    }

    const startedAtSeconds = token.service_started_at ? Math.floor(new Date(token.service_started_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const serviceDurationSeconds = Math.max(1, nowSeconds - startedAtSeconds);

    db.prepare(`
      UPDATE tokens
      SET status = 'COMPLETED',
          service_ended_at = datetime('now'),
          service_duration_seconds = ?
      WHERE id = ?
    `).run(serviceDurationSeconds, tokenId);

    const completedToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);
    emitQueueUpdate(token.queue_id, 'TOKEN_COMPLETED', completedToken);

    res.json({ message: `Service for Token ${completedToken.token_code} completed.`, token: completedToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete token service.' });
  }
});

// Cancel a token from the queue (Requirement 7)
router.post('/:id/cancel', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);
  const { reason } = req.body;

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Token has already been resolved.' });
    }

    db.prepare(`
      UPDATE tokens
      SET status = 'CANCELLED',
          position = NULL,
          service_ended_at = datetime('now'),
          cancellation_reason = ?
      WHERE id = ?
    `).run(reason ? reason.trim() : 'Cancelled by queue manager', tokenId);

    compactQueuePositions(token.queue_id);

    const cancelledToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);
    emitQueueUpdate(token.queue_id, 'TOKEN_CANCELLED', cancelledToken);

    res.json({ message: `Token ${cancelledToken.token_code} cancelled successfully.`, token: cancelledToken });
  } catch (error) {
    console.error('Cancel token error:', error);
    res.status(500).json({ error: 'Failed to cancel token.' });
  }
});

// Recall an in-service token (re-announces to counter & increments recall count)
router.post('/:id/recall', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id, q.counter_name as queue_counter
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({ error: 'Only in-service tokens can be recalled.' });
    }

    const currentRecall = (token.recall_count || 0) + 1;
    db.prepare(`
      UPDATE tokens
      SET recall_count = ?
      WHERE id = ?
    `).run(currentRecall, tokenId);

    const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);
    emitQueueUpdate(token.queue_id, 'TOKEN_RECALLED', updated);

    res.json({
      message: `Token ${updated.token_code} recalled (Call #${currentRecall})`,
      token: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to recall token.' });
  }
});

// Skip a waiting token (moves down in queue)
router.post('/:id/skip', authenticateToken, (req, res) => {
  const tokenId = Number(req.params.id);

  try {
    const token = db.prepare(`
      SELECT t.*, q.manager_id
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE t.id = ?
    `).get(tokenId);

    if (!token || token.manager_id !== req.manager.id) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be skipped.' });
    }

    // Move token to position 3 or swap with next
    const nextToken = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' AND position = ?
    `).get(token.queue_id, token.position + 1);

    if (nextToken) {
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position + 1, token.id);
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(token.position, nextToken.id);
    }

    emitQueueUpdate(token.queue_id, 'TOKEN_SKIPPED', { tokenId });
    res.json({ message: `Token ${token.token_code} skipped to next position.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to skip token.' });
  }
});

// Customer Self-Service: Public Token Generation (No login required)
router.post('/public-generate', (req, res) => {
  const { queue_id, customer_name, customer_phone, priority } = req.body;

  if (!queue_id || !customer_name || !customer_name.trim()) {
    return res.status(400).json({ error: 'Queue and your name are required.' });
  }

  const queueId = Number(queue_id);
  const queue = db.prepare('SELECT * FROM queues WHERE id = ? AND is_active = 1').get(queueId);
  if (!queue) {
    return res.status(404).json({ error: 'Selected queue is not active.' });
  }

  try {
    const lastToken = db.prepare(`SELECT MAX(token_number) as max_num FROM tokens WHERE queue_id = ?`).get(queueId);
    const tokenNumber = (lastToken && lastToken.max_num ? lastToken.max_num : 0) + 1;
    const tokenCode = `${queue.code_prefix}-${String(tokenNumber).padStart(3, '0')}`;

    const maxPos = db.prepare(`SELECT MAX(position) as max_pos FROM tokens WHERE queue_id = ? AND status = 'WAITING'`).get(queueId);
    const nextPosition = (maxPos && maxPos.max_pos ? maxPos.max_pos : 0) + 1;

    const result = db.prepare(`
      INSERT INTO tokens (
        queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position
      ) VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?)
    `).run(
      queueId,
      tokenNumber,
      tokenCode,
      customer_name.trim(),
      customer_phone ? customer_phone.trim() : null,
      priority ? priority.toUpperCase() : 'NORMAL',
      nextPosition
    );

    const newToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(Number(result.lastInsertRowid));
    emitQueueUpdate(queueId, 'TOKEN_ADDED', newToken);

    // Compute estimated wait time (~3 minutes per person ahead)
    const estimatedWaitMinutes = Math.max(1, (nextPosition - 1) * 3);

    res.status(201).json({
      message: `Your Token ${tokenCode} is confirmed!`,
      token: newToken,
      queue: { id: queue.id, name: queue.name, counter_name: queue.counter_name },
      position: nextPosition,
      estimatedWaitMinutes
    });
  } catch (error) {
    console.error('Public token creation error:', error);
    res.status(500).json({ error: 'Failed to generate token.' });
  }
});

// Customer Tracking: Check status of a specific token
router.get('/public-track/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();

  try {
    const token = db.prepare(`
      SELECT t.*, q.name as queue_name, q.counter_name
      FROM tokens t
      JOIN queues q ON t.queue_id = q.id
      WHERE UPPER(t.token_code) = ?
      ORDER BY t.created_at DESC LIMIT 1
    `).get(code);

    if (!token) {
      return res.status(404).json({ error: 'Token not found. Please check your token number.' });
    }

    let peopleAhead = 0;
    let estimatedWaitMinutes = 0;

    if (token.status === 'WAITING' && token.position) {
      peopleAhead = Math.max(0, token.position - 1);
      estimatedWaitMinutes = Math.max(2, peopleAhead * 3);
    }

    res.json({
      token,
      peopleAhead,
      estimatedWaitMinutes,
      isNowServing: token.status === 'IN_SERVICE'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to look up token.' });
  }
});

module.exports = router;
