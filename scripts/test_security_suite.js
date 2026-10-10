// scripts/test_security_suite.js
// Automated Defensive Security Verification Suite for QuinceCA Platform

import { signAuthToken, verifyAuthToken, timingSafeCompare } from '../src/utils/tokenUtil.ts';
import { validateFileContent, sanitizeUploadedFilename } from '../src/utils/fileSecurity.ts';
import { sanitizeObject } from '../src/middleware/validateInput.ts';

async function runSecurityTests() {
  console.log('========================================================');
  console.log('🛡️  QUINCECA AUTOMATED SECURITY VERIFICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // TEST 1: Rate Limiting & Security Headers
  // ----------------------------------------------------
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const hasRateLimit = res.headers.has('x-ratelimit-limit');
    const hasNosniff = res.headers.get('x-content-type-options') === 'nosniff';
    const hasFrameOptions = res.headers.get('x-frame-options') === 'SAMEORIGIN';

    if (hasRateLimit && hasNosniff && hasFrameOptions) {
      console.log('✓ TEST 1 PASSED: Sliding-window rate limiter & OWASP security headers active.');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Missing rate limit or security headers', {
        rateLimit: hasRateLimit,
        nosniff: hasNosniff,
        frameOptions: hasFrameOptions,
      });
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 1 ERROR:', e.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 2: Input Validation & Prototype Pollution / SQL Injection Defense
  // ----------------------------------------------------
  try {
    const dangerousInput = {
      __proto__: { isAdmin: true },
      search: "SELECT * FROM users WHERE '1'='1' --",
      cleanParam: "Client 123",
      nested: {
        constructor: { name: 'exploit' },
        nullByteStr: "report.pdf\0.exe"
      }
    };

    const { clean: sanitized, hasDangerousPayload } = sanitizeObject(dangerousInput);
    const protoPollutionBlocked = !Object.prototype.hasOwnProperty.call(Object.prototype, 'isAdmin');
    const nullByteCleaned = !sanitized.nested.nullByteStr.includes('\0');
    const dangerousKeysRemoved = !Object.prototype.hasOwnProperty.call(sanitized, '__proto__') && !Object.prototype.hasOwnProperty.call(sanitized.nested, 'constructor');

    if (protoPollutionBlocked && nullByteCleaned && dangerousKeysRemoved && hasDangerousPayload) {
      console.log('✓ TEST 2 PASSED: Prototype pollution blocked, null bytes stripped, recursive payload sanitized.');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Sanitizer failed to neutralize payload', sanitized);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 2 ERROR:', e.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 3: Authentication != Authorization (RBAC & IDOR)
  // ----------------------------------------------------
  try {
    // 3a. Unauthenticated request to protected endpoint (/api/users)
    const unauthRes = await fetch('http://localhost:3000/api/users');
    const unauthBlocked = unauthRes.status === 401;

    // 3b. Authenticate as Client using seeded client GSTIN
    const clientLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '29AAAGM0289C1ZF', role: 'client' })
    });
    const clientData = await clientLogin.json();
    const clientToken = clientData.user?.token;

    // 3c. Client attempts to access administrative endpoint (/api/users) -> Must return 403 Forbidden
    const forbiddenRes = await fetch('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const rbacBlocked = forbiddenRes.status === 403;

    // 3d. Client attempts to update SaaS subscription -> Must return 403 Forbidden
    const saasUpdateRes = await fetch('http://localhost:3000/api/saas/subscription/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({ planTier: 'enterprise_unlimited' })
    });
    const saasBlocked = saasUpdateRes.status === 403;

    if (unauthBlocked && rbacBlocked && saasBlocked) {
      console.log('✓ TEST 3 PASSED: Strict RBAC enforced: 401 Unauthenticated & 403 Forbidden for unauthorized roles.');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: RBAC check failed', {
        unauthStatus: unauthRes.status,
        rbacStatus: forbiddenRes.status,
        saasStatus: saasUpdateRes.status,
      });
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 3 ERROR:', e.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 4: Secret Management & Cryptographic HMAC Verification
  // ----------------------------------------------------
  try {
    const validToken = signAuthToken({ uid: 'usr_001', role: 'ca_admin' });
    const verified = verifyAuthToken(validToken);
    
    // Tamper with the token (modify last character of signature)
    const tampered = validToken.slice(0, -1) + (validToken.endsWith('a') ? 'b' : 'a');
    const tamperBlocked = verifyAuthToken(tampered) === null;

    // Timing-safe compare
    const timingSafeMatch = timingSafeCompare('secret_pass_123', 'secret_pass_123');
    const timingSafeMismatch = !timingSafeCompare('secret_pass_123', 'wrong_pass_456');

    if (verified && tamperBlocked && timingSafeMatch && timingSafeMismatch) {
      console.log('✓ TEST 4 PASSED: HMAC-SHA256 signature verification blocks tampered tokens; timing-safe comparisons active.');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Token integrity or timing comparison failed');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 4 ERROR:', e.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 5: File Upload Security & Magic Byte Signature Inspection
  // ----------------------------------------------------
  try {
    // 5a. Dangerous executable disguised as PDF (should be rejected)
    const fakePdfExecutable = Buffer.from('MZ\x90\x00This is a Windows EXE disguised as PDF');
    const fakePdfCheck = validateFileContent(fakePdfExecutable, 'invoice.pdf');

    // 5b. Legitimate PDF magic bytes
    const realPdf = Buffer.from('%PDF-1.7\n%Valid PDF content...');
    const realPdfCheck = validateFileContent(realPdf, 'tax_audit_report.pdf');

    // 5c. Filename traversal sanitization
    const sanitizedName = sanitizeUploadedFilename('../../../etc/passwd/exploit.exe.pdf');
    const traversalBlocked = !sanitizedName.includes('..') && !sanitizedName.includes('/') && !sanitizedName.includes('\\');

    if (!fakePdfCheck.isValid && realPdfCheck.isValid && traversalBlocked) {
      console.log('✓ TEST 5 PASSED: Magic bytes inspection blocked spoofed files; path traversal filenames sanitized.');
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: File security validation failed', {
        fakePdfAllowed: fakePdfCheck.isValid,
        realPdfRejected: !realPdfCheck.isValid,
        traversalBlocked,
      });
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 5 ERROR:', e.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 6: Unauthenticated Client Session Enumeration (IDOR Prevention)
  // ----------------------------------------------------
  try {
    // Attempting to query client portal session without a token or valid authorization
    const idorRes = await fetch('http://localhost:3000/api/client-portal/session?clientId=client_001');
    const idorBlocked = idorRes.status === 401 || idorRes.status === 403;

    if (idorBlocked) {
      console.log('✓ TEST 6 PASSED: Client portal session IDOR vector closed (unauthorized queries rejected).');
      passed++;
    } else {
      console.error('❌ TEST 6 FAILED: Client portal session returned data without authentication:', idorRes.status);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 6 ERROR:', e.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`SECURITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
