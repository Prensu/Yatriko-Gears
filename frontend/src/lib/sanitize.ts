import DOMPurify from 'dompurify'
export const sanitizeRichHtml = (content: string) => DOMPurify.sanitize(content, { ALLOWED_TAGS: ['p','br','strong','em','b','i','ul','ol','li','a','code'], ALLOWED_ATTR: ['href','target','rel'] })
