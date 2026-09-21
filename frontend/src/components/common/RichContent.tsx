import DOMPurify from 'dompurify'
import { useState, useRef, useEffect } from 'react'

interface RichContentProps {
  content: string
  title?: string
}

export default function RichContent({ content, title }: RichContentProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsToggle, setNeedsToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && contentRef.current.scrollHeight > 300) {
      setNeedsToggle(true)
    }
  }, [content])

  if (!content) return null

  // Clean the HTML
  const cleanHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'style']
  })

  return (
    <div className="mt-12 rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm">
      {title && (
        <h2 className="mb-6 font-display text-2xl font-bold text-navy-900 border-b border-slate-100 pb-4">
          {title}
        </h2>
      )}
      
      <div className={`relative overflow-hidden transition-all duration-500 ${!expanded && needsToggle ? 'max-h-[300px]' : ''}`}>
        <div 
          ref={contentRef}
          className="prose prose-slate prose-forest max-w-none 
                     prose-headings:font-display prose-headings:text-navy-900 
                     prose-a:text-forest-600 prose-a:font-semibold hover:prose-a:text-forest-700
                     prose-ul:list-disc prose-ol:list-decimal
                     prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
        
        {/* Fade Out Gradient */}
        {!expanded && needsToggle && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {needsToggle && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-forest-600 transition-colors hover:text-forest-800"
          >
            {expanded ? 'Show less' : 'Show more'}
            <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
