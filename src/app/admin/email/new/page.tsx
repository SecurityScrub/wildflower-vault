import Link from "next/link";
import { TemplateEditor } from "../TemplateEditor";

export default function NewEmailTemplatePage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/email" className="font-sans text-xs text-gray-400 hover:text-brand-orange-700">
          ← Back to email
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 mt-2">New Template</h1>
      </div>
      <TemplateEditor />
    </div>
  );
}
