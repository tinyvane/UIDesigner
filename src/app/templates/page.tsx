import { redirect } from 'next/navigation';

// Templates are now managed in the editor's left panel (模板 tab).
// Redirect legacy /templates URL to dashboard.
export default function TemplatesPage() {
  redirect('/dashboard');
}
