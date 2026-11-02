import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, buttonVariants } from '../components/ui/button';
import { Badge, badgeVariants } from '../components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';

// ============================================================================
// 1. BUTTON PRIMITIVE TESTS
// ============================================================================

test('Button: buttonVariants helper generates correct class string independently', () => {
  const classes = buttonVariants({ variant: 'sanitation', size: 'sm' });
  assert.ok(classes.includes('bg-sanitation-700'));
  assert.ok(classes.includes('h-8'));
});

test('Button: renders primary and default variant with civic brand tokens', () => {
  const primaryHtml = renderToStaticMarkup(
    React.createElement(Button, { variant: 'primary' }, 'Submit Complaint')
  );
  assert.ok(primaryHtml.includes('bg-civic-700'), 'Should contain bg-civic-700');
  assert.ok(primaryHtml.includes('text-white'), 'Should contain text-white');
  assert.ok(primaryHtml.includes('Submit Complaint'));

  const defaultHtml = renderToStaticMarkup(
    React.createElement(Button, null, 'Default Button')
  );
  assert.ok(defaultHtml.includes('bg-civic-700'), 'Default should map to civic-700');
});

test('Button: renders sanitation variant with sanitation green tokens', () => {
  const html = renderToStaticMarkup(
    React.createElement(Button, { variant: 'sanitation' }, 'Complete Cleanup')
  );
  assert.ok(html.includes('bg-sanitation-700'), 'Should contain bg-sanitation-700');
  assert.ok(html.includes('hover:bg-sanitation-800'));
});

test('Button: renders outline, ghost, destructive and link variants', () => {
  const outline = renderToStaticMarkup(
    React.createElement(Button, { variant: 'outline' }, 'Cancel')
  );
  assert.ok(outline.includes('border-slate-300'), 'Outline should have border-slate-300');

  const ghost = renderToStaticMarkup(
    React.createElement(Button, { variant: 'ghost' }, 'View Details')
  );
  assert.ok(ghost.includes('hover:bg-slate-100'), 'Ghost should have hover:bg-slate-100');

  const destructive = renderToStaticMarkup(
    React.createElement(Button, { variant: 'destructive' }, 'Reject')
  );
  assert.ok(destructive.includes('bg-red-600'), 'Destructive should have bg-red-600');

  const link = renderToStaticMarkup(
    React.createElement(Button, { variant: 'link' }, 'Learn More')
  );
  assert.ok(link.includes('hover:underline'), 'Link should have hover:underline');
});

test('Button: preserves legacy variants for backward compatibility', () => {
  const secondary = renderToStaticMarkup(
    React.createElement(Button, { variant: 'secondary' }, 'Secondary')
  );
  assert.ok(secondary.includes('bg-slate-100'));

  const civic = renderToStaticMarkup(
    React.createElement(Button, { variant: 'civic' }, 'Civic')
  );
  assert.ok(civic.includes('bg-civic-800'));
});

test('Button: supports sizes (sm, default, lg, icon)', () => {
  const sm = renderToStaticMarkup(React.createElement(Button, { size: 'sm' }, 'Small'));
  assert.ok(sm.includes('h-8'), 'sm size should be h-8');

  const lg = renderToStaticMarkup(React.createElement(Button, { size: 'lg' }, 'Large'));
  assert.ok(lg.includes('h-11'), 'lg size should be h-11');

  const icon = renderToStaticMarkup(React.createElement(Button, { size: 'icon' }, '★'));
  assert.ok(icon.includes('h-9 w-9'), 'icon size should be h-9 w-9');
});

test('Button: handles disabled and isLoading states', () => {
  const disabled = renderToStaticMarkup(
    React.createElement(Button, { disabled: true }, 'Disabled')
  );
  assert.ok(disabled.includes('disabled=""') || disabled.includes('disabled'), 'Should have disabled attribute');

  const loading = renderToStaticMarkup(
    React.createElement(Button, { isLoading: true }, 'Saving')
  );
  assert.ok(loading.includes('aria-busy="true"'), 'Loading button should have aria-busy="true"');
  assert.ok(loading.includes('disabled=""') || loading.includes('disabled'), 'Loading button should be disabled');
  assert.ok(loading.includes('animate-spin'), 'Loading button should render spinner');
});

// ============================================================================
// 2. BADGE PRIMITIVE TESTS
// ============================================================================

test('Badge: badgeVariants helper generates correct class string independently', () => {
  const classes = badgeVariants({ variant: 'resolved' });
  assert.ok(classes.includes('bg-emerald-50'));
  assert.ok(classes.includes('text-emerald-800'));
});

test('Badge: supports all complaint lifecycle status variants with semantic tokens', () => {
  const statuses = [
    { variant: 'submitted', colorClass: 'bg-sky-50' },
    { variant: 'assigned', colorClass: 'bg-indigo-50' },
    { variant: 'in_progress', colorClass: 'bg-amber-50' },
    { variant: 'under_review', colorClass: 'bg-purple-50' },
    { variant: 'resolved', colorClass: 'bg-emerald-50' },
    { variant: 'rework_required', colorClass: 'bg-rose-50' },
    { variant: 'rejected', colorClass: 'bg-slate-100' },
  ] as const;

  for (const { variant, colorClass } of statuses) {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant }, variant)
    );
    assert.ok(html.includes(colorClass), `Badge variant ${variant} should include ${colorClass}`);
    assert.ok(html.includes('role="status"'), `Status badge should have role="status"`);
    assert.ok(html.includes(`data-status="${variant}"`), `Status badge should include data-status`);
    // Status badges include an indicator dot so status is not communicated by color alone
    assert.ok(html.includes('rounded-full shrink-0 bg-current'), 'Status badge should include indicator dot');
  }
});

test('Badge: supports neutral and legacy variants without mandatory dot', () => {
  const neutral = renderToStaticMarkup(
    React.createElement(Badge, { variant: 'neutral' }, 'General Info')
  );
  assert.ok(neutral.includes('bg-slate-100'));

  const outline = renderToStaticMarkup(
    React.createElement(Badge, { variant: 'outline' }, 'Outline Badge')
  );
  assert.ok(outline.includes('border-slate-300'));
});

// ============================================================================
// 3. CARD PRIMITIVE TESTS
// ============================================================================

test('Card: compound component renders complete card structure', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Card,
      { className: 'custom-card' },
      React.createElement(
        CardHeader,
        null,
        React.createElement(CardTitle, null, 'Gwalior Fort Cleanliness Drive'),
        React.createElement(CardDescription, null, 'Ward 12 Municipal Action')
      ),
      React.createElement(CardContent, null, 'Work details here'),
      React.createElement(CardFooter, null, 'Last updated today')
    )
  );

  assert.ok(html.includes('rounded-xl border border-slate-200 bg-white'), 'Card root structure');
  assert.ok(html.includes('custom-card'), 'Custom className preserved');
  assert.ok(html.includes('<h3'), 'CardTitle should render h3');
  assert.ok(html.includes('Gwalior Fort Cleanliness Drive'));
  assert.ok(html.includes('<p'), 'CardDescription should render p');
  assert.ok(html.includes('Ward 12 Municipal Action'));
  assert.ok(html.includes('Work details here'));
  assert.ok(html.includes('Last updated today'));
});

// ============================================================================
// 4. INPUT AND TEXTAREA PRIMITIVE TESTS
// ============================================================================

test('Input: renders with standard, disabled, and error attributes', () => {
  const normal = renderToStaticMarkup(
    React.createElement(Input, { placeholder: 'Enter citizen name', type: 'text' })
  );
  assert.ok(normal.includes('type="text"'));
  assert.ok(normal.includes('placeholder="Enter citizen name"'));
  assert.ok(normal.includes('border-slate-300 focus-visible:ring-civic-600'));

  const disabled = renderToStaticMarkup(
    React.createElement(Input, { disabled: true })
  );
  assert.ok(disabled.includes('disabled'));
  assert.ok(disabled.includes('disabled:cursor-not-allowed'));

  const error = renderToStaticMarkup(
    React.createElement(Input, { error: true, 'aria-label': 'Mobile Number' })
  );
  assert.ok(error.includes('aria-invalid="true"'));
  assert.ok(error.includes('border-red-500 focus-visible:ring-red-500'));
});

test('Textarea: renders with consistent focus, disabled, and error styling', () => {
  const normal = renderToStaticMarkup(
    React.createElement(Textarea, { placeholder: 'Describe the issue...', rows: 4 })
  );
  assert.ok(normal.includes('<textarea'));
  assert.ok(normal.includes('placeholder="Describe the issue..."'));
  assert.ok(normal.includes('min-h-[80px]'));
  assert.ok(normal.includes('border-slate-300 focus-visible:ring-civic-600'));

  const error = renderToStaticMarkup(
    React.createElement(Textarea, { error: 'Remarks required' })
  );
  assert.ok(error.includes('aria-invalid="true"'));
  assert.ok(error.includes('border-red-500 focus-visible:ring-red-500'));
});

// ============================================================================
// 5. SELECT PRIMITIVE TESTS
// ============================================================================

test('Select: renders native HTML select with placeholder and options', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Select,
      { placeholder: 'Select Ward', name: 'ward_id' },
      React.createElement('option', { value: 'GWL-W-001' }, 'Ward 1 - Maharaj Bada'),
      React.createElement('option', { value: 'GWL-W-002' }, 'Ward 2 - Morar')
    )
  );

  assert.ok(html.includes('<select'), 'Should render native select element');
  assert.ok(html.includes('name="ward_id"'));
  assert.ok(html.includes('<option value="" disabled=""'), 'Should render disabled placeholder option');
  assert.ok(html.includes('Select Ward'));
  assert.ok(html.includes('Ward 1 - Maharaj Bada'));
  assert.ok(html.includes('Ward 2 - Morar'));
  assert.ok(html.includes('lucide-chevron-down') || html.includes('svg'), 'Should include dropdown indicator icon');
});

test('Select: handles disabled and error states', () => {
  const disabled = renderToStaticMarkup(
    React.createElement(Select, { disabled: true })
  );
  assert.ok(disabled.includes('disabled'));

  const error = renderToStaticMarkup(
    React.createElement(Select, { error: true })
  );
  assert.ok(error.includes('aria-invalid="true"'));
  assert.ok(error.includes('border-red-500'));
});

// ============================================================================
// 6. TABLE PRIMITIVES TESTS
// ============================================================================

test('Table: renders complete compound table with horizontal overflow wrapper', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Table,
      null,
      React.createElement(TableCaption, null, 'Gwalior Municipal Complaints'),
      React.createElement(
        TableHeader,
        null,
        React.createElement(
          TableRow,
          null,
          React.createElement(TableHead, null, 'ID'),
          React.createElement(TableHead, null, 'Ward'),
          React.createElement(TableHead, null, 'Status')
        )
      ),
      React.createElement(
        TableBody,
        null,
        React.createElement(
          TableRow,
          null,
          React.createElement(TableCell, null, 'CMP-001'),
          React.createElement(TableCell, null, 'Ward 12'),
          React.createElement(TableCell, null, 'Resolved')
        )
      ),
      React.createElement(
        TableFooter,
        null,
        React.createElement(
          TableRow,
          null,
          React.createElement(TableCell, { colSpan: 3 }, 'Total: 1 record')
        )
      )
    )
  );

  assert.ok(html.includes('overflow-auto'), 'Table wrapper must provide horizontal overflow');
  assert.ok(html.includes('<caption'), 'TableCaption element');
  assert.ok(html.includes('<thead'), 'TableHeader element');
  assert.ok(html.includes('<tbody'), 'TableBody element');
  assert.ok(html.includes('<tfoot'), 'TableFooter element');
  assert.ok(html.includes('<th'), 'TableHead element');
  assert.ok(html.includes('<td'), 'TableCell element');
  assert.ok(html.includes('CMP-001'));
});

// ============================================================================
// 7. DIALOG PRIMITIVE TESTS
// ============================================================================

test('Dialog: renders nothing when open is false', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Dialog,
      { open: false, onOpenChange: () => {} },
      React.createElement(DialogContent, null, 'Modal Content')
    )
  );
  assert.strictEqual(html, '', 'Closed dialog should render null/empty string');
});

test('Dialog: renders modal dialog with accessible title, description, and close button when open', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Dialog,
      { open: true, onOpenChange: () => {} },
      React.createElement(
        DialogContent,
        null,
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, 'Assign Sanitation Worker'),
          React.createElement(DialogDescription, null, 'Assign this complaint to an active field worker.')
        ),
        React.createElement('div', null, 'Worker assignment select goes here'),
        React.createElement(
          DialogFooter,
          null,
          React.createElement(DialogClose, null, 'Cancel')
        )
      )
    )
  );

  assert.ok(html.includes('<dialog'), 'Should render native dialog element');
  assert.ok(html.includes('aria-labelledby="dialog-title-'), 'Should link aria-labelledby to DialogTitle');
  assert.ok(html.includes('aria-describedby="dialog-desc-'), 'Should link aria-describedby to DialogDescription');
  assert.ok(html.includes('Assign Sanitation Worker'));
  assert.ok(html.includes('Assign this complaint to an active field worker.'));
  assert.ok(html.includes('aria-label="Close dialog"'), 'Should render accessible close button');
});

// ============================================================================
// 8. SKELETON PRIMITIVE TESTS
// ============================================================================

test('Skeleton: renders loading placeholder with accessibility and reduced-motion tokens', () => {
  const html = renderToStaticMarkup(
    React.createElement(Skeleton, { className: 'h-6 w-32 rounded-lg' })
  );

  assert.ok(html.includes('role="status"'), 'Skeleton should have role="status"');
  assert.ok(html.includes('aria-label="Loading content"'), 'Skeleton should have accessible label');
  assert.ok(html.includes('animate-pulse'), 'Skeleton should have animate-pulse');
  assert.ok(html.includes('motion-reduce:animate-none'), 'Skeleton should respect prefers-reduced-motion');
  assert.ok(html.includes('h-6 w-32 rounded-lg'), 'Skeleton should apply custom className');
});

