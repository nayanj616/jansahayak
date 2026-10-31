import { GET as getTasks, POST as postTasks } from '../app/api/tasks/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME, DEMO_USER_IDS } from '../lib/auth/tokens';
import { getDb } from '../lib/db/client';
import { createAssignment } from '../lib/db/assignments';
import { createComplaint } from '../lib/db/complaints';
import { uploadAndLinkComplaintImage } from '../lib/storage';
import { NextRequest } from 'next/server';

async function runWorkerE2E() {
  console.log('===========================================================');
  console.log('   JANSAHAYAK SANITATION WORKER WORKFLOW E2E VERIFICATION  ');
  console.log('===========================================================');

  const workerId = DEMO_USER_IDS.worker;
  const officerId = DEMO_USER_IDS.officer;
  const citizenId = DEMO_USER_IDS.citizen;

  // 1. Generate real signed tokens
  const workerToken = await createDemoToken(DEMO_PROFILES.worker);
  const citizenToken = await createDemoToken(DEMO_PROFILES.citizen);
  const officerToken = await createDemoToken(DEMO_PROFILES.officer);

  console.log('[1] Demo sessions generated:');
  console.log('    Worker:', DEMO_PROFILES.worker.name, `(${workerId})`);
  console.log('    Officer:', DEMO_PROFILES.officer.name, `(${officerId})`);
  console.log('    Citizen:', DEMO_PROFILES.citizen.name, `(${citizenId})`);

  // 2. Create a dedicated isolated test complaint for this test run
  // (Never modifies, resets, or deletes existing demo complaints like GWL-2026-1076)
  const testRunId = Date.now();
  console.log('[2] Creating dedicated test complaint for this isolated run...');
  const testComplaint = await createComplaint(
    {
      category: 'overflowing_bin',
      ward_id: 'GWL-W-012', // Morar Beat (Worker's ward)
      priority: 'high',
      location_description: 'Morar Beat Sector 3 - E2E Verification Site',
      description: `E2E Automated Worker Workflow Verification [Run ${testRunId}]`,
      location_source: 'gps',
      latitude: 26.2285,
      longitude: 78.2241,
      location_accuracy_m: 8,
    },
    citizenId
  );

  // Upload original before-photo to private complaint-originals bucket
  const beforeJpegBase64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const beforeBuffer = Buffer.from(beforeJpegBase64, 'base64');
  await uploadAndLinkComplaintImage({
    complaintId: testComplaint.id,
    imageType: 'before',
    bucket: 'complaint-originals',
    fileBuffer: beforeBuffer,
    contentType: 'image/jpeg',
    originalFilename: 'isolated_before_evidence.jpg',
    uploadedBy: citizenId,
  });

  console.log('    Created Isolated Test Complaint:');
  console.log('    ID:', testComplaint.id);
  console.log('    Code:', testComplaint.complaint_code);
  console.log('    Category:', testComplaint.category);
  console.log('    Initial Status:', testComplaint.status, '(Clean from DB: submitted)');

  // 3. Create assignment via createAssignment service
  console.log('[3] Creating new assignment for worker via createAssignment...');
  const createdAssignment = await createAssignment(
    testComplaint.id,
    workerId,
    officerId,
    `E2E Test: Assigned by Municipal Officer to Morar Sanitation Worker [${testRunId}]`
  );
  const assignmentId = createdAssignment.id;
  console.log('    Created Assignment ID:', assignmentId);
  console.log('    Assignment Status:', createdAssignment.status);

  // 4. Test Role Guards: Citizen and Officer must NOT access worker tasks API
  console.log('[4] Verifying Role Guard Isolation:');
  const citizenReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'GET',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${citizenToken}` },
  });
  const citizenRes = await getTasks(citizenReq);
  console.log('    Citizen accessing /api/tasks -> Status:', citizenRes.status, '(403 expected)');
  if (citizenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Citizen on /api/tasks, got ${citizenRes.status}`);
  }

  const officerReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'GET',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${officerToken}` },
  });
  const officerRes = await getTasks(officerReq);
  console.log('    Officer accessing /api/tasks -> Status:', officerRes.status, '(403 expected)');
  if (officerRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Officer on /api/tasks, got ${officerRes.status}`);
  }

  // 5. Worker GET /api/tasks: Scoped only to authenticated worker
  console.log('[5] Querying Worker Tasks (GET /api/tasks):');
  const workerGetReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'GET',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${workerToken}` },
  });
  const workerGetRes = await getTasks(workerGetReq);
  console.log('    Worker GET /api/tasks -> Status:', workerGetRes.status, '(200 expected)');
  const workerGetData = await workerGetRes.json();
  console.log('    Total tasks returned for worker:', workerGetData.count);

  // Verify worker sees ONLY their own assignments (cross-worker isolation)
  const hasUnauthorizedTask = workerGetData.tasks?.some(
    (t: { worker_id: string }) => t.worker_id !== workerId
  );
  if (hasUnauthorizedTask) {
    throw new Error('Data breach: worker received tasks belonging to another worker!');
  }
  console.log('    Cross-worker isolation verified: 100% of returned tasks belong to authenticated worker.');

  const foundTask = workerGetData.tasks?.find((t: { id: string }) => t.id === assignmentId);
  if (!foundTask) {
    throw new Error(`Assignment ${assignmentId} not found in worker's task list!`);
  }
  console.log('    Found assigned task in list! Complaint Code:', foundTask.complaint?.complaint_code);
  console.log('    Assignment Status:', foundTask.status);
  console.log('    Complaint Status:', foundTask.complaint?.status);
  console.log('    Images attached:', foundTask.complaint?.images?.length);

  const beforePhoto = foundTask.complaint?.images?.find(
    (img: { image_type: string }) => img.image_type === 'before' || img.image_type === 'original'
  );
  if (beforePhoto?.signed_url) {
    const imgFetch = await fetch(beforePhoto.signed_url);
    console.log('    Before-photo signed URL fetch status:', imgFetch.status, '(200 expected)');
  }

  // 6. Test Start Task (action: 'start')
  console.log('[6] Testing Task Start (POST /api/tasks with action: start):');
  const startReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: {
      cookie: `${DEMO_COOKIE_NAME}=${workerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'start',
      assignment_id: assignmentId,
    }),
  });
  const startRes = await postTasks(startReq);
  console.log('    Start Task Status:', startRes.status, '(200 expected)');
  const startData = await startRes.json();
  console.log('    Message:', startData.message);
  console.log('    New Assignment Status:', startData.task?.status);
  console.log('    Started At:', startData.task?.started_at);
  console.log('    New Complaint Status:', startData.task?.complaint?.status);

  if (startData.task?.status !== 'in_progress') {
    throw new Error(`Expected assignment status 'in_progress', got ${startData.task?.status}`);
  }
  if (startData.task?.complaint?.status !== 'in_progress') {
    throw new Error(`Expected complaint status 'in_progress', got ${startData.task?.complaint?.status}`);
  }

  // 7. Test Completion Validation: Missing photo proof MUST be rejected
  console.log('[7] Testing Rejection when Completing Without Photo:');
  const emptyForm = new FormData();
  emptyForm.append('action', 'complete');
  emptyForm.append('assignment_id', assignmentId);
  const rejectReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${workerToken}` },
    body: emptyForm,
  });
  const rejectRes = await postTasks(rejectReq);
  console.log('    Complete without photo -> Status:', rejectRes.status, '(400 expected)');
  const rejectData = await rejectRes.json();
  console.log('    Error Message:', rejectData.message);
  if (rejectRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request when completing without photo, got ${rejectRes.status}`);
  }

  // 8. Test Completion with Valid After-Cleanup Photo Upload
  console.log('[8] Testing Task Completion with Real After-Cleanup Photo:');
  const afterJpegBase64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const afterFileBuffer = Buffer.from(afterJpegBase64, 'base64');
  const afterFile = new File([afterFileBuffer], 'cleaned_site_proof.jpg', {
    type: 'image/jpeg',
  });

  const completeForm = new FormData();
  completeForm.append('action', 'complete');
  completeForm.append('assignment_id', assignmentId);
  completeForm.append('image', afterFile);
  completeForm.append(
    'remarks',
    'E2E Verification: Site cleared of all accumulated waste. Bin washed and 40m perimeter disinfected.'
  );

  const completeReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${workerToken}` },
    body: completeForm,
  });
  const completeRes = await postTasks(completeReq);
  console.log('    Complete Task Status:', completeRes.status, '(200 expected)');
  const completeData = await completeRes.json();

  if (completeRes.status !== 200) {
    console.error('Completion failure details:', completeData);
    throw new Error(`Expected 200 OK on complete, got ${completeRes.status}`);
  }

  console.log('    Message:', completeData.message);
  console.log('    Final Assignment Status:', completeData.task?.status);
  console.log('    Completed At:', completeData.task?.completed_at);
  console.log('    Final Complaint Status:', completeData.task?.complaint?.status);

  if (completeData.task?.status !== 'completed') {
    throw new Error(`Expected assignment status 'completed', got ${completeData.task?.status}`);
  }
  if (completeData.task?.complaint?.status !== 'under_review') {
    throw new Error(`Expected complaint status 'under_review', got ${completeData.task?.complaint?.status}`);
  }

  // 9. Verify After-Image in Database & Storage
  console.log('[9] Verifying After-Image in Database & Supabase Storage:');
  const afterImg = completeData.task?.complaint?.images?.find(
    (img: { image_type: string }) => img.image_type === 'after'
  );
  if (!afterImg) {
    throw new Error('After-image record not found in complaint images!');
  }
  console.log('    Image ID:', afterImg.id);
  console.log('    Image Type:', afterImg.image_type);
  console.log('    Bucket:', afterImg.bucket_name, '(cleanup-evidence expected)');
  console.log('    Object Path:', afterImg.object_path);
  console.log('    Signed URL Generated:', Boolean(afterImg.signed_url));

  if (afterImg.bucket_name !== 'cleanup-evidence') {
    throw new Error(`Expected bucket 'cleanup-evidence', got ${afterImg.bucket_name}`);
  }

  if (afterImg.signed_url) {
    const afterFetch = await fetch(afterImg.signed_url);
    console.log('    After-image Signed URL Fetch Status:', afterFetch.status, '(200 expected)');
    if (afterFetch.status !== 200) {
      throw new Error(`Failed to fetch signed URL of after-image, got ${afterFetch.status}`);
    }
  }

  // 10. Verify Complaint History Trail for Test Complaint
  console.log('[10] Verifying Audit History in Database for Test Complaint:');
  const db = getDb();
  const { data: historyRecords } = await db
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', testComplaint.id)
    .order('created_at', { ascending: true });

  console.log('    Total history events for complaint:', historyRecords?.length);
  const submitEvent = historyRecords?.find((h) => h.action === 'submitted');
  const assignEvent = historyRecords?.find((h) => h.action === 'assigned');
  const startEvent = historyRecords?.find((h) => h.action === 'work_started');
  const completeEvent = historyRecords?.find((h) => h.action === 'cleanup_completed');

  console.log('    Submitted Event Logged:', Boolean(submitEvent));
  console.log('    Assigned Event Logged:', Boolean(assignEvent));
  console.log('    Work Started Event Logged:', Boolean(startEvent));
  console.log('    Cleanup Completed Event Logged:', Boolean(completeEvent));
  console.log('    Completion Event Remarks:', completeEvent?.remarks);

  if (historyRecords?.length !== 4) {
    throw new Error(`Expected exactly 4 history events for fresh test complaint, got ${historyRecords?.length}`);
  }

  // 11. Test Duplicate Completion Prevention
  console.log('[11] Testing Duplicate Completion Prevention:');
  const duplicateReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${workerToken}` },
    body: completeForm,
  });
  const duplicateRes = await postTasks(duplicateReq);
  console.log('    Duplicate Complete Status:', duplicateRes.status, '(400 expected)');
  const duplicateData = await duplicateRes.json();
  console.log('    Rejection Message:', duplicateData.message);
  if (duplicateRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for duplicate completion, got ${duplicateRes.status}`);
  }

  console.log('===========================================================');
  console.log('  ALL SANITATION WORKER E2E VERIFICATIONS PASSED (100%)    ');
  console.log('===========================================================');
}

runWorkerE2E().catch((err) => {
  console.error('Worker E2E Verification Failed:', err);
  process.exit(1);
});
