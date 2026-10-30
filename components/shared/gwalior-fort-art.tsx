import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Gwalior Monument / Heritage Emblem for JanSahayak Branding
 * Inspired by Gwalior Fort's iconic Man Singh Palace chhatris and sandstone bastions.
 */
export function GwaliorMonumentLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 text-amber-700', className)}
      aria-label="JanSahayak Gwalior Fort Monument Icon"
    >
      {/* Base Foundation */}
      <rect x="4" y="38" width="40" height="4" rx="1" fill="currentColor" fillOpacity="0.9" />
      <rect x="6" y="32" width="36" height="6" fill="currentColor" fillOpacity="0.85" />
      
      {/* Fortress Wall & Windows */}
      <rect x="8" y="22" width="32" height="10" fill="currentColor" fillOpacity="0.8" />
      <path d="M12 25 H14 V29 H12 Z" fill="#ffffff" fillOpacity="0.85" />
      <path d="M18 25 H20 V29 H18 Z" fill="#ffffff" fillOpacity="0.85" />
      <path d="M28 25 H30 V29 H28 Z" fill="#ffffff" fillOpacity="0.85" />
      <path d="M34 25 H36 V29 H34 Z" fill="#ffffff" fillOpacity="0.85" />

      {/* Central Chhatri Pavilion */}
      <rect x="20" y="16" width="8" height="6" fill="currentColor" fillOpacity="0.9" />
      <path
        d="M18 16 C18 10 24 6 24 6 C24 6 30 10 30 16 Z"
        fill="currentColor"
      />
      {/* Kalash Pinnacle */}
      <circle cx="24" cy="5" r="1.5" fill="#f59e0b" />

      {/* Left Chhatri */}
      <rect x="8" y="17" width="6" height="5" fill="currentColor" fillOpacity="0.85" />
      <path d="M7 17 C7 12 11 9 11 9 C11 9 15 12 15 17 Z" fill="currentColor" />
      <circle cx="11" cy="8" r="1.2" fill="#f59e0b" />

      {/* Right Chhatri */}
      <rect x="34" y="17" width="6" height="5" fill="currentColor" fillOpacity="0.85" />
      <path d="M33 17 C33 12 37 9 37 9 C37 9 41 12 41 17 Z" fill="currentColor" />
      <circle cx="37" cy="8" r="1.2" fill="#f59e0b" />

      {/* Battlements / Kanguras */}
      <path
        d="M9 22 L11 20 L13 22 L15 20 L17 22 L19 20 L21 22 L27 22 L29 20 L31 22 L33 20 L35 22 L37 20 L39 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Gwalior Fort Heritage Silhouette for Footers, Hero Banners and Sidebar Accents
 */
export function GwaliorFortSilhouette({
  className = 'w-full h-24 text-slate-700/20',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1200 160"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {/* Stylized Gopachal & Fort plateau rock face */}
      <path d="M0,160 L0,110 Q150,115 250,90 T500,85 T750,75 T1000,95 Q1100,105 1200,110 L1200,160 Z" />
      
      {/* Fort Battlements, Palaces and Chhatris */}
      {/* Left Ridge & Bastion */}
      <path d="M80,110 L80,70 L95,70 L95,80 L110,80 L110,70 L125,70 L125,110 Z" />
      {/* Teli ka Mandir Shikhara Profile */}
      <path d="M220,95 L220,40 Q235,15 250,40 L250,95 Z" />
      <circle cx="235" cy="18" r="3" />
      
      {/* Man Singh Palace Complex with Chhatris */}
      <rect x="420" y="55" width="220" height="40" rx="2" />
      {/* Chhatri 1 */}
      <path d="M435,55 C435,40 450,30 450,30 C450,30 465,40 465,55 Z" />
      <circle cx="450" cy="27" r="2.5" />
      {/* Chhatri 2 */}
      <path d="M520,55 C520,38 535,26 535,26 C535,26 550,38 550,55 Z" />
      <circle cx="535" cy="23" r="3" />
      {/* Chhatri 3 */}
      <path d="M605,55 C605,40 620,30 620,30 C620,30 635,40 635,55 Z" />
      <circle cx="620" cy="27" r="2.5" />

      {/* Sas Bahu Temple Shikhara Profile */}
      <path d="M780,80 L795,45 L810,80 Z" />
      <path d="M820,80 L840,35 L860,80 Z" />

      {/* East Bastion & Flag */}
      <rect x="940" y="65" width="50" height="35" />
      <line x1="965" y1="65" x2="965" y2="30" stroke="currentColor" strokeWidth="2" />
      <polygon points="965,30 985,37 965,44" />
    </svg>
  );
}

