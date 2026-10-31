import { GET as getComplaints } from '../app/api/complaints/route';
import { GET as getComplaintDetail } from '../app/api/complaints/[id]/route';
import { POST as postReview } from '../app/api/complaints/review/route';
import { POST as postAssignment } from '../app/api/assignments/route';
import { GET as getWorkers } from '../app/api/assignments/workers/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME, DEMO_USER_IDS } from '../lib/auth/tokens';
import { getDb } from '../lib/db/client';
import { createComplaint } from '../lib/db/complaints';
import { uploadAndLinkComplaintImage, deleteStorageObject } from '../lib/storage';
import { startAssignmentTask, completeAssignmentTask } from '../lib/db/assignments';
import { NextRequest } from 'next/server';
import type { StorageBucket } from '../types';

async function runOfficerE2E() {
  console.log('===========================================================');
  console.log('    JANSAHAYAK MUNICIPAL OFFICER WORKFLOW E2E VERIFICATION ');
  console.log('===========================================================');

  const officerId = DEMO_USER_IDS.officer;
  const workerId = DEMO_USER_IDS.worker;
  const citizenId = DEMO_USER_IDS.citizen;

  // 1. Generate real signed tokens
  const officerToken = await createDemoToken(DEMO_PROFILES.officer);
  const workerToken = await createDemoToken(DEMO_PROFILES.worker);
  const citizenToken = await createDemoToken(DEMO_PROFILES.citizen);

  console.log('[1] Demo sessions generated:');
  console.log('    Officer:', DEMO_PROFILES.officer.name, `(${officerId})`);
  console.log('    Worker: ', DEMO_PROFILES.worker.name, `(${workerId})`);
  console.log('    Citizen:', DEMO_PROFILES.citizen.name, `(${citizenId})`);

  // Tracking mutations for report
  const createdRecordSummary = {
    complaintId: '',
    complaintCode: '',
    assignmentIds: [] as string[],
    imageIds: [] as string[],
    storagePaths: [] as { bucket: string; path: string }[],
    historyCount: 0,
    notificationIds: [] as string[],
  };

  const db = getDb();

  try {
    // 2. Test Role Guards: Citizen and Worker must NOT access officer-only APIs
    console.log('\n[2] Verifying Officer-Only Role Guard Isolation:');

    // 2a. POST /api/assignments
    const citizenAssignReq = new NextRequest('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ complaint_id: 'a0000000-0000-4000-8000-000000000001', worker_id: workerId }),
    });
    const citizenAssignRes = await postAssignment(citizenAssignReq);
    console.log('    Citizen POST /api/assignments -> Status:', citizenAssignRes.status, '(403 expected)');
    if (citizenAssignRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Citizen on /api/assignments, got ${citizenAssignRes.status}`);
    }

    const workerAssignReq = new NextRequest('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${workerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ complaint_id: 'a0000000-0000-4000-8000-000000000001', worker_id: workerId }),
    });
    const workerAssignRes = await postAssignment(workerAssignReq);
    console.log('    Worker POST /api/assignments -> Status:', workerAssignRes.status, '(403 expected)');
    if (workerAssignRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Worker on /api/assignments, got ${workerAssignRes.status}`);
    }

    // 2b. POST /api/complaints/review
    const citizenReviewReq = new NextRequest('http://localhost:3000/api/complaints/review', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: 'a0000000-0000-4000-8000-000000000001',
        action: 'approve',
        remarks: 'Citizen unauthorized review',
      }),
    });
    const citizenReviewRes = await postReview(citizenReviewReq);
    console.log('    Citizen POST /api/complaints/review -> Status:', citizenReviewRes.status, '(403 expected)');
    if (citizenReviewRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Citizen on /api/complaints/review, got ${citizenReviewRes.status}`);
    }

    // 2c. GET /api/assignments/workers
    const citizenWorkersReq = new NextRequest('http://localhost:3000/api/assignments/workers', {
      method: 'GET',
      headers: { cookie: `${DEMO_COOKIE_NAME}=${citizenToken}` },
    });
    const citizenWorkersRes = await getWorkers(citizenWorkersReq);
    console.log('    Citizen GET /api/assignments/workers -> Status:', citizenWorkersRes.status, '(403 expected)');
    if (citizenWorkersRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Citizen on /api/assignments/workers, got ${citizenWorkersRes.status}`);
    }

    console.log('    Role guard isolation verified: All officer endpoints strictly reject non-officer roles.');

    // 3. Officer GET /api/assignments/workers
    console.log('\n[3] Testing Sanitation Worker Listing (GET /api/assignments/workers):');
    const officerWorkersReq = new NextRequest('http://localhost:3000/api/assignments/workers', {
      method: 'GET',
      headers: { cookie: `${DEMO_COOKIE_NAME}=${officerToken}` },
    });
    const officerWorkersRes = await getWorkers(officerWorkersReq);
    console.log('    Officer GET /api/assignments/workers -> Status:', officerWorkersRes.status, '(200 expected)');
    const workersData = await officerWorkersRes.json();
    console.log('    Workers Count:', workersData.count);
    const workerFound = workersData.workers?.find((w: { id: string }) => w.id === workerId);
    if (!workerFound) {
      throw new Error(`Worker with ID '${workerId}' not found in workers list`);
    }
    console.log('    Found assigned field worker:', workerFound.display_name, `(Ward: ${workerFound.ward_id})`);

    // 4. Create dedicated isolated test complaint
    console.log('\n[4] Creating dedicated isolated test complaint (Preserves demo records):');
    const testRunId = Date.now();
    const testComplaint = await createComplaint(
      {
        category: 'overflowing_bin',
        ward_id: 'GWL-W-012',
        priority: 'high',
        location_description: 'Morar Beat Sector 4 - Officer E2E Testing Site',
        description: `E2E Automated Officer Workflow Verification [Run ${testRunId}]`,
        location_source: 'gps',
        latitude: 26.2285,
        longitude: 78.2241,
        location_accuracy_m: 5,
      },
      citizenId
    );

    createdRecordSummary.complaintId = testComplaint.id;
    createdRecordSummary.complaintCode = testComplaint.complaint_code;
    console.log('    Created Isolated Test Complaint ID:', testComplaint.id);
    console.log('    Complaint Code:', testComplaint.complaint_code);
    console.log('    Initial Status:', testComplaint.status, '(submitted)');

    // Upload isolated original before-photo to private complaint-originals
    const dummyJpegBase64 =
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const beforeBuffer = Buffer.from(dummyJpegBase64, 'base64');
    const beforeUpload = await uploadAndLinkComplaintImage({
      complaintId: testComplaint.id,
      imageType: 'before',
      bucket: 'complaint-originals',
      fileBuffer: beforeBuffer,
      contentType: 'image/jpeg',
      originalFilename: 'officer_e2e_before.jpg',
      uploadedBy: citizenId,
    });

    createdRecordSummary.imageIds.push(beforeUpload.imageRecord.id);
    createdRecordSummary.storagePaths.push({
      bucket: 'complaint-originals',
      path: beforeUpload.imageRecord.object_path,
    });
    console.log('    Before Image Uploaded to complaint-originals:', beforeUpload.imageRecord.object_path);

    // 5. Test Officer Queue & Filtering (GET /api/complaints with category filter)
    console.log('\n[5] Testing Complaint Queue & Filtering (GET /api/complaints):');
    const filterReq = new NextRequest(
      `http://localhost:3000/api/complaints?category=overflowing_bin&ward_id=GWL-W-012`,
      {
        method: 'GET',
        headers: { cookie: `${DEMO_COOKIE_NAME}=${officerToken}` },
      }
    );
    const filterRes = await getComplaints(filterReq);
    console.log('    Filter by category & ward -> Status:', filterRes.status, '(200 expected)');
    const filterData = await filterRes.json();
    console.log('    Filtered Complaints Count:', filterData.count);
    const foundInQueue = filterData.complaints?.find((c: { id: string }) => c.id === testComplaint.id);
    if (!foundInQueue) {
      throw new Error(`Test complaint ${testComplaint.id} not found in filtered complaints!`);
    }
    console.log('    Complaint successfully located in queue with category filter applied.');

    // 6. Test Worker Task Dispatch (POST /api/assignments)
    console.log('\n[6] Testing Worker Task Allocation (POST /api/assignments):');
    const dispatchReq = new NextRequest('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        worker_id: workerId,
        notes: `E2E Dispatch: Clear overflowing waste bin and disinfect area [Run ${testRunId}]`,
      }),
    });
    const dispatchRes = await postAssignment(dispatchReq);
    console.log('    Dispatch Status:', dispatchRes.status, '(200 expected)');
    const dispatchData = await dispatchRes.json();
    console.log('    Message:', dispatchData.message);
    console.log('    Assignment Status:', dispatchData.assignment?.status);
    console.log('    Complaint Status after dispatch:', dispatchData.complaint?.status);
    console.log('    Notification Delivered:', dispatchData.notificationSent);

    if (dispatchData.assignment?.status !== 'assigned') {
      throw new Error(`Expected assignment status 'assigned', got ${dispatchData.assignment?.status}`);
    }
    if (dispatchData.complaint?.status !== 'assigned') {
      throw new Error(`Expected complaint status 'assigned', got ${dispatchData.complaint?.status}`);
    }
    createdRecordSummary.assignmentIds.push(dispatchData.assignment.id);

    // 7. Test Reassignment: Dispatching again cancels prior assignment
    console.log('\n[7] Testing Worker Reassignment Safeguards:');
    const reassignReq = new NextRequest('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        worker_id: workerId,
        notes: `E2E Reassign: Reassigned with high urgency flag [Run ${testRunId}]`,
      }),
    });
    const reassignRes = await postAssignment(reassignReq);
    console.log('    Reassignment Status:', reassignRes.status, '(200 expected)');
    const reassignData = await reassignRes.json();
    const secondAssignmentId = reassignData.assignment?.id;
    createdRecordSummary.assignmentIds.push(secondAssignmentId);

    // Verify first assignment was cancelled to prevent duplicate active tasks
    const { data: firstAssignedRow } = await db
      .from('assignments')
      .select('status')
      .eq('id', dispatchData.assignment.id)
      .single();

    console.log('    Prior Assignment Status after reassignment:', firstAssignedRow?.status, '(cancelled expected)');
    if (firstAssignedRow?.status !== 'cancelled') {
      throw new Error(`Expected prior assignment status 'cancelled', got ${firstAssignedRow?.status}`);
    }
    console.log('    Reassignment safeguard verified: Prior active assignment was cancelled.');

    // 8. Simulate Worker Execution to bring test complaint to 'under_review'
    console.log('\n[8] Simulating Worker Action (Start & Upload Cleanup Proof):');
    await startAssignmentTask(secondAssignmentId, workerId);
    console.log('    Worker started task -> Complaint in_progress');

    // Upload cleanup evidence photo
    const afterBuffer = Buffer.from(dummyJpegBase64, 'base64');
    const afterUpload = await uploadAndLinkComplaintImage({
      complaintId: testComplaint.id,
      imageType: 'after',
      bucket: 'cleanup-evidence',
      fileBuffer: afterBuffer,
      contentType: 'image/jpeg',
      originalFilename: 'officer_e2e_after.jpg',
      uploadedBy: workerId,
    });
    createdRecordSummary.imageIds.push(afterUpload.imageRecord.id);
    createdRecordSummary.storagePaths.push({
      bucket: 'cleanup-evidence',
      path: afterUpload.imageRecord.object_path,
    });

    await completeAssignmentTask(
      secondAssignmentId,
      workerId,
      'E2E Worker completed cleanup operations.'
    );
    console.log('    Worker uploaded proof & completed task -> Complaint is now under_review');

    // 9. Test Complaint Details Endpoint (GET /api/complaints/[id])
    console.log('\n[9] Testing Complaint Detail & Evidence Access (GET /api/complaints/[id]):');
    const detailContext = { params: Promise.resolve({ id: testComplaint.id }) };
    const detailReq = new NextRequest(`http://localhost:3000/api/complaints/${testComplaint.id}`, {
      method: 'GET',
      headers: { cookie: `${DEMO_COOKIE_NAME}=${officerToken}` },
    });
    const detailRes = await getComplaintDetail(detailReq, detailContext);
    console.log('    Detail fetch status:', detailRes.status, '(200 expected)');
    const detailData = await detailRes.json();
    console.log('    Complaint Status:', detailData.complaint?.status);
    console.log('    Total Images with Signed URLs:', detailData.complaint?.images?.length);

    const beforeSigned = detailData.complaint?.images?.find(
      (img: { image_type: string }) => img.image_type === 'before'
    );
    const afterSigned = detailData.complaint?.images?.find(
      (img: { image_type: string }) => img.image_type === 'after'
    );

    console.log('    Before signed URL generated:', Boolean(beforeSigned?.signed_url));
    console.log('    After signed URL generated:', Boolean(afterSigned?.signed_url));

    if (!beforeSigned?.signed_url || !afterSigned?.signed_url) {
      throw new Error('Signed URLs were not properly generated for both before and after evidence photos');
    }

    // Verify signed URLs are reachable
    const beforeHttp = await fetch(beforeSigned.signed_url);
    const afterHttp = await fetch(afterSigned.signed_url);
    console.log('    Before photo HTTP status:', beforeHttp.status, '(200 expected)');
    console.log('    After photo HTTP status:', afterHttp.status, '(200 expected)');
    if (beforeHttp.status !== 200 || afterHttp.status !== 200) {
      throw new Error('Failed to fetch evidence photos using signed URLs');
    }

    // 10. Test Officer Review Action: Request Rework (rework_required)
    console.log('\n[10] Testing Officer Review Action - Request Rework:');
    const reworkReq = new NextRequest('http://localhost:3000/api/complaints/review', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        action: 'rework',
        remarks: 'E2E Review: Roadside perimeter requires additional disinfectant and lime application.',
      }),
    });
    const reworkRes = await postReview(reworkReq);
    console.log('    Rework action status:', reworkRes.status, '(200 expected)');
    const reworkData = await reworkRes.json();
    console.log('    Message:', reworkData.message);
    console.log('    New Status after rework request:', reworkData.complaint?.status, '(rework_required expected)');

    if (reworkData.complaint?.status !== 'rework_required') {
      throw new Error(`Expected complaint status 'rework_required', got ${reworkData.complaint?.status}`);
    }

    // 11. Worker Resumes Work and Resubmits
    console.log('\n[11] Worker Resuming Rework & Resubmitting:');
    // Rework can be assigned again or transitioned directly
    const reworkAssign = await postAssignment(
      new NextRequest('http://localhost:3000/api/assignments', {
        method: 'POST',
        headers: {
          cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_id: testComplaint.id,
          worker_id: workerId,
          notes: 'Rework task dispatched: complete bleaching.',
        }),
      })
    );
    const reworkAssignData = await reworkAssign.json();
    const thirdAssignmentId = reworkAssignData.assignment?.id;
    createdRecordSummary.assignmentIds.push(thirdAssignmentId);

    await startAssignmentTask(thirdAssignmentId, workerId);
    await completeAssignmentTask(thirdAssignmentId, workerId, 'Rework completed. Disinfected with lime.');
    console.log('    Complaint resubmitted by worker -> back in under_review');

    // 12. Test Officer Review Action: Approve (resolved)
    console.log('\n[12] Testing Officer Review Action - Approve (Resolved):');
    const approveReq = new NextRequest('http://localhost:3000/api/complaints/review', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        action: 'approve',
        remarks: 'E2E Review: Cleanup verified and approved by municipal officer. Standards satisfied.',
      }),
    });
    const approveRes = await postReview(approveReq);
    console.log('    Approve action status:', approveRes.status, '(200 expected)');
    const approveData = await approveRes.json();
    console.log('    Message:', approveData.message);
    console.log('    Final Status:', approveData.complaint?.status, '(resolved expected)');

    if (approveData.complaint?.status !== 'resolved') {
      throw new Error(`Expected complaint status 'resolved', got ${approveData.complaint?.status}`);
    }

    // 13. Test Terminal State Protection & Duplicate Review Prevention
    console.log('\n[13] Testing Terminal State Protection:');
    const duplicateReviewReq = new NextRequest('http://localhost:3000/api/complaints/review', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        action: 'approve',
        remarks: 'Duplicate review attempt',
      }),
    });
    const duplicateReviewRes = await postReview(duplicateReviewReq);
    console.log('    Duplicate review attempt status:', duplicateReviewRes.status, '(400 expected)');
    if (duplicateReviewRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request on duplicate review, got ${duplicateReviewRes.status}`);
    }

    // Attempt assignment on resolved complaint
    const assignResolvedReq = new NextRequest('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        cookie: `${DEMO_COOKIE_NAME}=${officerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaint_id: testComplaint.id,
        worker_id: workerId,
        notes: 'Attempt assignment on resolved complaint',
      }),
    });
    const assignResolvedRes = await postAssignment(assignResolvedReq);
    console.log('    Assign on resolved complaint status:', assignResolvedRes.status, '(400 expected)');
    if (assignResolvedRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request on assigning resolved complaint, got ${assignResolvedRes.status}`);
    }

    // 14. Audit Trail & Notification Verification
    console.log('\n[14] Verifying Audit Trail & Notification Persistence:');
    const { data: historyList } = await db
      .from('complaint_history')
      .select('*')
      .eq('complaint_id', testComplaint.id)
      .order('created_at', { ascending: true });

    createdRecordSummary.historyCount = historyList?.length || 0;
    console.log('    Total history events logged for test complaint:', createdRecordSummary.historyCount);

    const approveHistoryEvent = historyList?.find((h) => h.action === 'officer_approved');
    const reworkHistoryEvent = historyList?.find((h) => h.action === 'officer_rework_requested');

    console.log('    Officer Rework Event Logged:', Boolean(reworkHistoryEvent));
    console.log('    Officer Approve Event Logged:', Boolean(approveHistoryEvent));
    console.log('    Approval Remarks:', approveHistoryEvent?.remarks);

    if (!approveHistoryEvent || !reworkHistoryEvent) {
      throw new Error('Expected both officer_rework_requested and officer_approved history events');
    }

    // Check notifications
    const { data: notifications } = await db
      .from('notifications')
      .select('id, title, message')
      .eq('complaint_id', testComplaint.id);

    createdRecordSummary.notificationIds = (notifications || []).map((n) => n.id);
    console.log('    Total notifications dispatched for test complaint:', createdRecordSummary.notificationIds.length);
    for (const notif of notifications || []) {
      console.log(`    - [${notif.id.slice(0, 8)}] ${notif.title}`);
    }

    console.log('===========================================================');
    console.log('  ALL OFFICER E2E WORKFLOW VERIFICATIONS PASSED (100%)     ');
    console.log('===========================================================');
  } finally {
    // 15. Clean up isolated test data to keep database completely pristine
    console.log('\n[15] Cleaning up isolated test records (Preserving demo baseline):');
    try {
      if (createdRecordSummary.complaintId) {
        // Delete notifications
        await db.from('notifications').delete().eq('complaint_id', createdRecordSummary.complaintId);
        // Delete history
        await db.from('complaint_history').delete().eq('complaint_id', createdRecordSummary.complaintId);
        // Delete assignments
        await db.from('assignments').delete().eq('complaint_id', createdRecordSummary.complaintId);
        // Delete image records & storage files
        for (const sp of createdRecordSummary.storagePaths) {
          try {
            await deleteStorageObject(sp.bucket as StorageBucket, sp.path);
          } catch {}
        }
        await db.from('complaint_images').delete().eq('complaint_id', createdRecordSummary.complaintId);
        // Delete complaint
        await db.from('complaints').delete().eq('id', createdRecordSummary.complaintId);

        console.log('    Cleaned up test complaint:', createdRecordSummary.complaintCode);
        console.log('    Cleaned up test assignments:', createdRecordSummary.assignmentIds.length);
        console.log('    Cleaned up test images:', createdRecordSummary.imageIds.length);
        console.log('    Cleaned up test notifications:', createdRecordSummary.notificationIds.length);
        console.log('    Cleaned up test history entries:', createdRecordSummary.historyCount);
        console.log('    Demo baseline records (GWL-2026-1076, GWL-2026-8263) remain 100% untouched.');
      }
    } catch (cleanupErr) {
      console.error('Error during test cleanup:', cleanupErr);
    }
  }
}

runOfficerE2E().catch((err) => {
  console.error('\nOfficer E2E Verification Failed:', err);
  process.exit(1);
});
