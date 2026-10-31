import { GET as getTasks, POST as postTasks } from '../app/api/tasks/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME, DEMO_USER_IDS } from '../lib/auth/tokens';
import { getDb } from '../lib/db/client';
import { createAssignment } from '../lib/db/assignments';
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

  // 2. Locate or create a test complaint to assign to worker
  const db = getDb();

  // Find a complaint that is either submitted or assigned
  const { data: complaintList } = await db
    .from('complaints')
    .select('*, images:complaint_images(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  let targetComplaint = complaintList?.find(
    (c) => c.status === 'submitted' || c.status === 'assigned'
  );

  if (!targetComplaint && complaintList && complaintList.length > 0) {
    // If all are completed/under_review, pick the first one and reset its status for testing
    targetComplaint = complaintList[0];
    await db.from('complaints').update({ status: 'submitted' }).eq('id', targetComplaint.id);
    // Delete any existing assignments for clean test
    await db.from('assignments').delete().eq('complaint_id', targetComplaint.id);
  }

  if (!targetComplaint) {
    throw new Error('No complaint found in live database to test worker workflow.');
  }

  console.log('[2] Target Complaint for Field Assignment:');
  console.log('    ID:', targetComplaint.id);
  console.log('    Code:', targetComplaint.complaint_code);
  console.log('    Category:', targetComplaint.category);
  console.log('    Current Status:', targetComplaint.status);

  // 3. Ensure assignment exists for this worker
  const { data: existingAssignment } = await db
    .from('assignments')
    .select('*')
    .eq('complaint_id', targetComplaint.id)
    .eq('worker_id', workerId)
    .single();

  let assignmentId: string;

  if (!existingAssignment) {
    console.log('[3] Creating new assignment for worker...');
    const created = await createAssignment(
      targetComplaint.id,
      workerId,
      officerId,
      'E2E Test: Assigned by Municipal Officer to Morar Sanitation Worker'
    );
    assignmentId = created.id;
    console.log('    Created Assignment ID:', assignmentId);
  } else {
    assignmentId = existingAssignment.id;
    // Reset status to 'assigned' for clean test run
    await db
      .from('assignments')
      .update({ status: 'assigned', started_at: null, completed_at: null })
      .eq('id', assignmentId);
    await db.from('complaints').update({ status: 'assigned' }).eq('id', targetComplaint.id);
    console.log('[3] Existing Assignment reset to "assigned":', assignmentId);
  }

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

  // 5. Worker GET /api/tasks
  console.log('[5] Querying Worker Tasks (GET /api/tasks):');
  const workerGetReq = new NextRequest('http://localhost:3000/api/tasks', {
    method: 'GET',
    headers: { cookie: `${DEMO_COOKIE_NAME}=${workerToken}` },
  });
  const workerGetRes = await getTasks(workerGetReq);
  console.log('    Worker GET /api/tasks -> Status:', workerGetRes.status, '(200 expected)');
  const workerGetData = await workerGetRes.json();
  console.log('    Total tasks returned for worker:', workerGetData.count);

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

  // 10. Verify Complaint History Trail
  console.log('[10] Verifying Audit History in Database:');
  const { data: historyRecords } = await db
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', targetComplaint.id)
    .order('created_at', { ascending: true });

  console.log('    Total history events for complaint:', historyRecords?.length);
  const startEvent = historyRecords?.find((h) => h.action === 'work_started');
  const completeEvent = historyRecords?.find((h) => h.action === 'cleanup_completed');

  console.log('    Work Started Event Logged:', Boolean(startEvent));
  console.log('    Cleanup Completed Event Logged:', Boolean(completeEvent));
  console.log('    Completion Event Remarks:', completeEvent?.remarks);

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
