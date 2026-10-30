import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <GwaliorMonumentLogo className="h-16 w-16 text-amber-700/60 mb-4" />
      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
        404 &bull; Page Not Found
      </span>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Civic Resource Not Found
      </h2>
      <p className="max-w-md text-sm text-slate-500 mb-6 leading-relaxed">
        The requested civic portal page or government resource does not exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="default" size="sm" className="gap-2 bg-blue-700 hover:bg-blue-800">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/demo-role">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Demo Roles
          </Button>
        </Link>
      </div>
    </div>
  );
}

