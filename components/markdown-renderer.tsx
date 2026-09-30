"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-6 mb-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-6 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold text-slate-700 mt-4 mb-2 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm font-medium text-slate-700 leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-indigo-600 font-semibold not-italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 my-3 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 my-3 ml-1 list-none counter-reset-item">{children}</ol>
          ),
          li: ({ children, ...props }) => {
            const isOrdered = (props as any).ordered
            const index = (props as any).index
            return (
              <li className="flex items-start gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                <span className="inline-flex items-center justify-center size-6 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black shrink-0 mt-0.5 shadow-inner">
                  {isOrdered ? (index ?? 0) + 1 : "•"}
                </span>
                <span className="flex-1">{children}</span>
              </li>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/50 pl-5 py-3 pr-4 rounded-r-xl my-4 text-sm font-semibold text-slate-700 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-6 border-slate-100" />
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-xs font-bold">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto my-3">
                {children}
              </code>
            )
          },
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-300 underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-2xl border border-slate-100">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-t border-slate-50 font-medium text-slate-700">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
