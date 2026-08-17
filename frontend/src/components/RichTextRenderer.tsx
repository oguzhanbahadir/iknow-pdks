import React from 'react';

interface RichTextRendererProps {
  content?: string;
  className?: string;
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  if (!content) {
    return <span className="text-slate-400 italic">Açıklama girilmemiş.</span>;
  }

  // Check if content contains HTML tags
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return <p className={`whitespace-pre-wrap ${className}`}>{content}</p>;
  }

  return (
    <div
      className={`prose max-w-none text-slate-700 text-sm leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-2.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3.5 [&_blockquote]:italic [&_blockquote]:bg-slate-50 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-[12.5px] [&_a]:text-indigo-600 [&_a]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
