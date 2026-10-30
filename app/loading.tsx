import { Loader2 } from 'lucide-react';
import { GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <GwaliorMonumentLogo className="h-12 w-12 text-amber-700 animate-pulse mb-4" />
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
        <span>Loading JanSahayak...</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">Gwalior Municipal Civic Platform</p>
    </div>
  );
}

