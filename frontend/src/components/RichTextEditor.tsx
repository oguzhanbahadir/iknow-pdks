import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  RemoveFormatting,
  Code2,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Açıklama ve detayları buraya yazın...',
  minHeight = '140px',
  maxHeight = '320px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');

  // Synchronize external value to contentEditable when not focused
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setRawHtml(value || '');
  }, [value, isSourceMode]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const cleanHtml = html === '<p><br></p>' || html === '<br>' ? '' : html;
      onChange(cleanHtml);
      setRawHtml(cleanHtml);
    }
  };

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleAddLink = () => {
    const url = prompt('Bağlantı URL adresini girin (örn: https://...):');
    if (url) {
      exec('createLink', url);
    }
  };

  const handleFormatBlock = (tag: string) => {
    exec('formatBlock', tag);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-indigo-600 transition-all flex flex-col">
      {/* PRIMARY SINGLE-LINE TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 flex items-center justify-between gap-1 text-slate-700 select-none overflow-x-auto">
        <div className="flex items-center space-x-1 shrink-0">
          {/* Headings */}
          <div className="flex items-center space-x-0.5 pr-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => handleFormatBlock('H1')}
              title="Başlık 1 (H1)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('H2')}
              title="Başlık 2 (H2)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Heading2 className="w-4 h-4" />
            </button>
          </div>

          {/* Essential Formats */}
          <div className="flex items-center space-x-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => exec('bold')}
              title="Kalın (Ctrl+B)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg font-bold transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('italic')}
              title="İtalik (Ctrl+I)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('underline')}
              title="Altı Çizili (Ctrl+U)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              title="Madde İşaretli Liste"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertOrderedList')}
              title="Numaralı Liste"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Code & Link */}
          <div className="flex items-center space-x-0.5 px-1">
            <button
              type="button"
              onClick={() => handleFormatBlock('PRE')}
              title="Kod Bloğu"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              title="Bağlantı Ekle"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Controls: Expand Tools + HTML Code Toggle */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2 py-1 text-[11px] rounded-lg font-semibold flex items-center space-x-1 transition-colors border ${
              isExpanded
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={isExpanded ? 'Daha az araç göster' : 'Daha fazla biçimlendirme aracı'}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExpanded ? 'Gizle' : 'Araçlar'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSourceMode(!isSourceMode)}
            className={`px-2 py-1 text-[11px] rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
              isSourceMode
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
            title={isSourceMode ? 'Görsel Editöre Geç' : 'HTML Kod Moduna Geç'}
          >
            {isSourceMode ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Görsel</span>
              </>
            ) : (
              <>
                <Code2 className="w-3 h-3" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXPANDED SECONDARY TOOLBAR */}
      {isExpanded && (
        <div className="bg-slate-100/70 border-b border-slate-200 px-2 py-1.5 flex flex-wrap items-center gap-1 text-slate-700 select-none animate-in slide-in-from-top-1 duration-150 text-[11px]">
          {/* Strikethrough & Quote */}
          <div className="flex items-center space-x-0.5 pr-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              title="Üstü Çizili"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('BLOCKQUOTE')}
              title="Alıntı Bloğu"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignments */}
          <div className="flex items-center space-x-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => exec('justifyLeft')}
              title="Sola Hizala"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyCenter')}
              title="Ortala"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyRight')}
              title="Sağa Hizala"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear Formatting */}
          <div className="flex items-center space-x-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onClick={() => exec('removeFormat')}
              title="Biçimlendirmeyi Temizle"
              className="p-1 hover:bg-slate-200/70 hover:text-red-600 rounded-lg transition-colors flex items-center space-x-1"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-500 font-medium">Temizle</span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center space-x-0.5 px-1">
            <button
              type="button"
              onClick={() => exec('undo')}
              title="Geri Al (Ctrl+Z)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('redo')}
              title="İleri Al (Ctrl+Y)"
              className="p-1 hover:bg-slate-200/70 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* EDITOR AREA */}
      {isSourceMode ? (
        <textarea
          value={rawHtml}
          onChange={(e) => {
            setRawHtml(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="HTML kaynak kodunu girin..."
          className="w-full p-4 font-mono text-[13px] bg-slate-900 text-emerald-400 focus:outline-none resize-y"
          style={{ minHeight, maxHeight }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className="p-4 focus:outline-none overflow-y-auto text-slate-800 text-sm leading-relaxed prose max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-2.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3.5 [&_blockquote]:italic [&_blockquote]:bg-slate-50 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-[12.5px] [&_a]:text-indigo-600 [&_a]:underline"
          style={{ minHeight, maxHeight }}
        />
      )}
    </div>
  );
}
