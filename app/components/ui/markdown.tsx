import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
}

function preprocessText(text: string): string {
  if (!text) return text;
  
  let processed = text;
  
  // Convert bullet points (•) to Markdown list syntax
  // Handle cases where bullet points are at the start of a line
  processed = processed.replace(/\n•\s*/g, "\n- ");
  processed = processed.replace(/^•\s*/gm, "- ");
  
  // Handle cases where there's text before the list (like "...suivantes&nbsp;:•")
  processed = processed.replace(/([.:])\s*\n?•\s*/g, "$1\n- ");
  
  return processed;
}

export function Markdown({ children }: MarkdownProps) {
  const processedContent = preprocessText(children);
  
  return (
    <div className="text-stone-300 text-sm leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="text-amber-200 font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="text-stone-300">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc list-inside space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal list-inside space-y-1">{children}</ol>,
          li: ({ children }) => <li className="my-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-amber-200 font-medium text-lg mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-amber-200 font-medium text-base mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-amber-200 font-medium text-sm mb-2">{children}</h3>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-stone-700 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-stone-800">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-stone-700">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-stone-800/50 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-amber-200 font-semibold border-r border-stone-700 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-r border-stone-700 last:border-r-0">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
