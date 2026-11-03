import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { ComplaintTrackingView } from '@/components/complaints/complaint-tracking-view';
import { getDemoSession } from '@/lib/auth/demo-session';
import { resolveDemoUserId } from '@/lib/db/users';
import { getComplaintById } from '@/lib/db/complaints';
import { getDb } from '@/lib/db/client';
import { attachSignedUrlsToComplaint } from '@/lib/storage';
import { ShieldAlert, UserCheck, ArrowLeft, Lock } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Grievance Dossier & Tracking | JanSahayak Gwalior',
  description: 'Detailed complaint tracking with photographic evidence, Gemini Vision verification, and administrative audit history.',
};

export default async function ComplaintDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getDemoSession();

  // 1. Session verification check
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-civic-100 text-civic-700 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Demo Persona Required</h2>
              <p className="text-xs text-slate-500">
                To inspect grievance tracking and verification evidence, please select an active demo persona.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/demo-role?required=citizen&redirect=/complaints/${id}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-xs font-semibold py-2.5 shadow-xs transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>Continue as Citizen</span>
              </Link>
              <Link
                href={`/demo-role?required=worker&redirect=/complaints/${id}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sanitation-700 hover:bg-sanitation-800 text-white text-xs font-semibold py-2.5 shadow-xs transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>Continue as Sanitation Worker</span>
              </Link>
              <Link
                href={`/demo-role?required=officer&redirect=/complaints/${id}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold py-2.5 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>Continue as Municipal Officer</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 2. Fetch complaint by ID
  const complaint = await getComplaintById(id);
  if (!complaint) {
    notFound();
  }

  // 3. Enforce role-scoped authorization
  let isAuthorized = false;
  let restrictionReason = '';

  if (session.user.role === 'citizen') {
    const citizenId = session.user.dbUserId || (await resolveDemoUserId('citizen'));
    isAuthorized = complaint.reporter_id === citizenId;
    if (!isAuthorized) {
      restrictionReason =
        'Under the Citizen demo persona, access is strictly limited to grievances you reported yourself. This complaint was filed by a different resident.';
    }
  } else if (session.user.role === 'worker') {
    const workerId = session.user.dbUserId || (await resolveDemoUserId('worker'));
    const assignedWorkerId =
      complaint.current_or_latest_assignment?.worker_id ||
      complaint.active_assignment?.worker_id;

    if (assignedWorkerId === workerId) {
      isAuthorized = true;
    } else {
      const db = getDb();
      const { data: assignment } = await db
        .from('assignments')
        .select('id')
        .eq('complaint_id', id)
        .eq('worker_id', workerId)
        .limit(1)
        .maybeSingle();

      isAuthorized = Boolean(assignment);
      if (!isAuthorized) {
        restrictionReason =
          'Under the Sanitation Worker demo persona, you can only inspect grievances assigned to your beat. This complaint is not assigned to you.';
      }
    }
  } else if (session.user.role === 'officer') {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 shadow-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{restrictionReason}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/demo-role?redirect=/complaints/${id}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-xs font-semibold py-2.5 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>Switch Demo Persona</span>
              </Link>
              <Link
                href="/swachh-gwalior"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium py-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Swachh Gwalior</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 4. Attach fresh signed URLs for secure storage photos
  const enrichedComplaint = await attachSignedUrlsToComplaint(complaint);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="flex-1">
        <ComplaintTrackingView
          complaint={enrichedComplaint}
          currentRole={session.user.role}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
