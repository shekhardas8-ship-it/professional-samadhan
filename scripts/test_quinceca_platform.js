// scripts/test_quinceca_platform.js (Legacy alias for scripts/test_platform.js)
import http from 'http';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING QUINCECA INTEGRITY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Endpoint
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const json = await res.json();
    if (res.status === 200 && json.status === 'ok') {
      console.log('✓ TEST 1 PASSED: /api/health returned 200 OK with uptime: ' + json.uptimeSeconds + 's');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED:', json);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 1 EXCEPTION:', e.message);
    failed++;
  }

  // Test 2: Security Headers
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const xcto = res.headers.get('x-content-type-options');
    const xfo = res.headers.get('x-frame-options');
    if (xcto === 'nosniff' && xfo === 'SAMEORIGIN') {
      console.log('✓ TEST 2 PASSED: Security hardening headers (nosniff, SAMEORIGIN) verified.');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Missing security headers');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 2 EXCEPTION:', e.message);
    failed++;
  }

  // Test 3: CA Admin Authentication
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ca@quinceca.com',
        password: 'Samadhan@2026',
        role: 'ca_admin',
      }),
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.user.role === 'ca_admin') {
      console.log('✓ TEST 3 PASSED: CA Partner authentication successful. User: ' + json.user.displayName);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Auth failed', json);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 3 EXCEPTION:', e.message);
    failed++;
  }

  // Test 4: Monthly Requests Pipeline
  try {
    const res = await fetch('http://localhost:3000/api/monthly-requests', {
      headers: { 'x-user-role': 'ca_admin' },
    });
    const json = await res.json();
    if (res.status === 200 && Array.isArray(json)) {
      console.log('✓ TEST 4 PASSED: Monthly Requests returned ' + json.length + ' requests.');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED:', json);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 4 EXCEPTION:', e.message);
    failed++;
  }

  // Test 5: Root SPA serving
  try {
    const res = await fetch('http://localhost:3000/');
    const text = await res.text();
    if (res.status === 200 && (text.includes('QuinceCA') || text.includes('id="root"'))) {
      console.log('✓ TEST 5 PASSED: Root index.html successfully served by Vite dev server.');
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: Root page not serving correctly');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 5 EXCEPTION:', e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
