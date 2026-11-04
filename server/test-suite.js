const assert = require('assert');

async function runTests() {
  const BASE = 'http://localhost:5000/api';
  console.log('🧪 Starting Full-Stack QueueFlow End-to-End Verification Suite...\n');

  // Test 1: Demo Login / Auth
  console.log('1️⃣ Testing Authentication (Login as Manager)...');
  const loginRes = await fetch(`${BASE}/auth/demo`, { method: 'POST' });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, 'Login failed');
  assert.ok(loginData.token, 'No token returned');
  const token = loginData.token;
  console.log(`   ✅ Logged in successfully as: ${loginData.manager.name} (${loginData.manager.username})\n`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test 2: Create Queue
  console.log('2️⃣ Testing Queue Creation (Name & Prefix)...');
  const createQueueRes = await fetch(`${BASE}/queues`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Express Diagnostic Clinic',
      code_prefix: 'MED',
      counter_name: 'Room 101',
      description: 'Rapid diagnostic and health triage'
    })
  });
  const queueData = await createQueueRes.json();
  assert.strictEqual(createQueueRes.status, 201, 'Queue creation failed');
  const testQueueId = queueData.queue.id;
  console.log(`   ✅ Queue created: "${queueData.queue.name}" (Prefix: ${queueData.queue.code_prefix}, ID: ${testQueueId})\n`);

  // Test 3: Add Tokens / Persons
  console.log('3️⃣ Testing Adding Persons / Generating Tokens...');
  const addP1 = await fetch(`${BASE}/tokens`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      queue_id: testQueueId,
      customer_name: 'Alice Springs',
      customer_phone: '+1-555-1111',
      priority: 'NORMAL'
    })
  });
  const p1Data = await addP1.json();
  assert.strictEqual(addP1.status, 201);
  console.log(`   ✅ Added Token 1: ${p1Data.token.token_code} for ${p1Data.token.customer_name} at Position ${p1Data.token.position}`);

  const addP2 = await fetch(`${BASE}/tokens`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      queue_id: testQueueId,
      customer_name: 'Bob Marley',
      customer_phone: '+1-555-2222',
      priority: 'PRIORITY'
    })
  });
  const p2Data = await addP2.json();
  assert.strictEqual(addP2.status, 201);
  console.log(`   ✅ Added Token 2: ${p2Data.token.token_code} for ${p2Data.token.customer_name} at Position ${p2Data.token.position}`);

  const addP3 = await fetch(`${BASE}/tokens`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      queue_id: testQueueId,
      customer_name: 'Charlie Brown',
      customer_phone: '+1-555-3333',
      priority: 'VIP'
    })
  });
  const p3Data = await addP3.json();
  assert.strictEqual(addP3.status, 201);
  console.log(`   ✅ Added Token 3: ${p3Data.token.token_code} for ${p3Data.token.customer_name} at Position ${p3Data.token.position}\n`);

  // Test 4: Display Queue List
  console.log('4️⃣ Testing Queue Display (Waiting List Retrieval)...');
  const listRes = await fetch(`${BASE}/tokens/queue/${testQueueId}`, { headers: authHeaders });
  const listData = await listRes.json();
  assert.strictEqual(listData.waiting.length, 3, 'Expected 3 waiting tokens');
  console.log(`   ✅ Queue displays ${listData.waiting.length} waiting tokens in order:`);
  listData.waiting.forEach(t => console.log(`      #${t.position} - ${t.token_code} (${t.customer_name})`));
  console.log('');

  // Test 5: Move Token UP and DOWN
  console.log('5️⃣ Testing Token Reordering (Move Bob Marley UP to Position 1)...');
  const moveUpRes = await fetch(`${BASE}/tokens/${p2Data.token.id}/move-up`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(moveUpRes.status, 200, 'Move up failed');

  const afterMoveUpRes = await fetch(`${BASE}/tokens/queue/${testQueueId}`, { headers: authHeaders });
  const afterMoveUpData = await afterMoveUpRes.json();
  assert.strictEqual(afterMoveUpData.waiting[0].id, p2Data.token.id, 'Bob Marley should now be position 1');
  console.log(`   ✅ Token successfully moved UP: Top token is now ${afterMoveUpData.waiting[0].customer_name} (#${afterMoveUpData.waiting[0].position})`);

  console.log('   Testing Move DOWN (Move Bob Marley back to Position 2)...');
  const moveDownRes = await fetch(`${BASE}/tokens/${p2Data.token.id}/move-down`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(moveDownRes.status, 200, 'Move down failed');
  const afterMoveDownRes = await fetch(`${BASE}/tokens/queue/${testQueueId}`, { headers: authHeaders });
  const afterMoveDownData = await afterMoveDownRes.json();
  assert.strictEqual(afterMoveDownData.waiting[1].id, p2Data.token.id, 'Bob Marley should be position 2');
  console.log(`   ✅ Token successfully moved DOWN: Position 2 is now ${afterMoveDownData.waiting[1].customer_name}\n`);

  // Test 6: Assign Token at Top of Queue for Service (1-Click)
  console.log('6️⃣ Testing Assigning Top Token for Service (Serve Next)...');
  const serveNextRes = await fetch(`${BASE}/tokens/queue/${testQueueId}/serve-next`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ counter_name: 'Room 101' })
  });
  const serveNextData = await serveNextRes.json();
  assert.strictEqual(serveNextRes.status, 200, 'Serve next failed');
  assert.strictEqual(serveNextData.token.status, 'IN_SERVICE', 'Token should be IN_SERVICE');
  console.log(`   ✅ Top Token Assigned for Service: ${serveNextData.token.token_code} (${serveNextData.token.customer_name}) at ${serveNextData.token.counter_assigned}`);

  // Complete service
  const completeRes = await fetch(`${BASE}/tokens/${serveNextData.token.id}/complete`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(completeRes.status, 200, 'Complete failed');
  console.log(`   ✅ Service completed for token ${serveNextData.token.token_code}\n`);

  // Test 7: Cancel a Token
  console.log('7️⃣ Testing Token Cancellation...');
  const cancelRes = await fetch(`${BASE}/tokens/${p3Data.token.id}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Customer requested cancellation' })
  });
  const cancelData = await cancelRes.json();
  assert.strictEqual(cancelRes.status, 200, 'Cancel failed');
  assert.strictEqual(cancelData.token.status, 'CANCELLED');
  console.log(`   ✅ Token Cancelled: ${cancelData.token.token_code} Reason: "${cancelData.token.cancellation_reason}"\n`);

  // Test 8: Analytics Dashboard
  console.log('8️⃣ Testing Analytics Dashboard (Wait times, Hourly Trends, Queue Comparison)...');
  const analyticsRes = await fetch(`${BASE}/analytics?period=all`, { headers: authHeaders });
  const analyticsData = await analyticsRes.json();
  assert.strictEqual(analyticsRes.status, 200, 'Analytics failed');
  assert.ok(analyticsData.summary.totalTokens > 0, 'Total tokens should be > 0');
  console.log(`   ✅ Analytics computed:`);
  console.log(`      • Total Tokens Handled: ${analyticsData.summary.totalTokens}`);
  console.log(`      • Total Completed: ${analyticsData.summary.completedCount}`);
  console.log(`      • Currently Waiting: ${analyticsData.summary.waitingCount}`);
  console.log(`      • Avg Wait Time: ${analyticsData.summary.avgWaitMinutes} mins`);
  console.log(`      • Avg Service Time: ${analyticsData.summary.avgServiceMinutes} mins`);
  console.log(`      • Hourly Trend Points: ${analyticsData.hourlyTrends.length}`);
  console.log(`      • Queue Comparison Entries: ${analyticsData.queueComparison.length}\n`);

  // Test 9: Public TV View
  console.log('9️⃣ Testing Public Kiosk / TV Display Endpoint...');
  const publicRes = await fetch(`http://localhost:5000/api/queues/public/${testQueueId}`);
  const publicData = await publicRes.json();
  assert.strictEqual(publicRes.status, 200);
  console.log(`   ✅ Public TV display loaded: Queue "${publicData.queue.name}" - ${publicData.totalWaiting} waiting\n`);

  // Test 10: Frontend HTML delivery
  console.log('🔟 Testing Static Frontend Serving on Root URL (/)...');
  const htmlRes = await fetch('http://localhost:5000/');
  const htmlText = await htmlRes.text();
  assert.strictEqual(htmlRes.status, 200);
  assert.ok(htmlText.includes('QueueFlow'), 'HTML should contain QueueFlow');
  console.log(`   ✅ Root URL (http://localhost:5000) successfully serves production React client!\n`);

  console.log('🎉 ALL 10 VERIFICATION TESTS PASSED WITH 100% SUCCESS! 🎉');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
