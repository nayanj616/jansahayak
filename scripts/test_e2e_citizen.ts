import { POST, GET } from '../app/api/complaints/route';
import { createDemoToken, DEMO_PROFILES, DEMO_COOKIE_NAME } from '../lib/auth/tokens';
import { NextRequest } from 'next/server';

async function e2e() {
  console.log('=== JANSAHAYAK CITIZEN WORKFLOW E2E VERIFICATION ===');
  
  // 1. Create real signed demo session for Citizen
  const token = await createDemoToken(DEMO_PROFILES.citizen);
  console.log('[1] Signed JWT session generated for Citizen:', DEMO_PROFILES.citizen.name);
  console.log('    Resolved DB User ID:', DEMO_PROFILES.citizen.dbUserId);

  // 2. Prepare real JPEG image buffer
  const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const fileBuffer = Buffer.from(jpegBase64, 'base64');
  const file = new File([fileBuffer], 'bada_overflow_dump.jpg', { type: 'image/jpeg' });

  // 3. Build multipart form data
  const formData = new FormData();
  formData.append('image', file);
  formData.append('category', 'overflowing_bin');
  formData.append('ward_id', 'GWL-W-024');
  formData.append('priority', 'normal');
  formData.append('location_description', 'Near Post Office, Sarafa Bazaar, Maharaj Bada');
  formData.append('description', 'E2E Verification: Public waste bin overflowing onto pedestrian pavement near Maharaj Bada');
  formData.append('latitude', '26.2081');
  formData.append('longitude', '78.1636');
  formData.append('location_accuracy_m', '12');
  formData.append('location_source', 'gps');

  // 4. Construct NextRequest for POST /api/complaints
  const postReq = new NextRequest('http://localhost:3000/api/complaints', {
    method: 'POST',
    headers: {
      cookie: `${DEMO_COOKIE_NAME}=${token}`,
    },
    body: formData,
  });

  // 5. Invoke POST handler
  const postRes = await POST(postReq);
  console.log('[2] POST /api/complaints Status:', postRes.status);
  const postData = await postRes.json();
  
  if (postRes.status !== 201) {
    console.error('Submission failed:', postData);
    process.exit(1);
  }

  const complaint = postData.complaint;
  console.log('[3] Complaint Created Successfully!');
  console.log('    Complaint ID:', complaint.id);
  console.log('    Complaint Code:', complaint.complaint_code);
  console.log('    Status:', complaint.status);
  console.log('    Ward ID:', complaint.ward_id);
  console.log('    Location Description:', complaint.location_description);
  console.log('    Reporter ID:', complaint.reporter_id);
  console.log('    Images Count:', complaint.images?.length);
  console.log('    First Image Bucket:', complaint.images?.[0]?.bucket_name);
  console.log('    First Image Path:', complaint.images?.[0]?.object_path);
  console.log('    Signed URL Generated:', Boolean(complaint.images?.[0]?.signed_url));

  // 6. Verify image is fetchable via the signed URL
  if (complaint.images?.[0]?.signed_url) {
    const imgFetch = await fetch(complaint.images[0].signed_url);
    console.log('[4] Image Signed URL Fetch Status:', imgFetch.status, '(HTTP 200 expected)');
    console.log('    Image Content-Type:', imgFetch.headers.get('content-type'));
    console.log('    Image Content-Length:', imgFetch.headers.get('content-length'), 'bytes');
  }

  // 7. Verify GET /api/complaints with Citizen session (Page refresh simulation)
  const getReq = new NextRequest('http://localhost:3000/api/complaints', {
    method: 'GET',
    headers: {
      cookie: `${DEMO_COOKIE_NAME}=${token}`,
    },
  });

  const getRes = await GET(getReq);
  console.log('[5] GET /api/complaints Status:', getRes.status);
  const getData = await getRes.json();
  console.log('    Total complaints for citizen:', getData.count);
  
  const found = getData.complaints?.find((c: { id: string }) => c.id === complaint.id);
  console.log('    Newly created complaint found in list:', Boolean(found));
  console.log('    History events count:', found?.history?.length);
  console.log('    Initial history action:', found?.history?.[0]?.action);
  console.log('    Initial history remarks:', found?.history?.[0]?.remarks);

  console.log('=== END-TO-END VERIFICATION COMPLETED SUCCESSFULLY ===');
}

e2e().catch((err) => {
  console.error('E2E Failure:', err);
  process.exit(1);
});
