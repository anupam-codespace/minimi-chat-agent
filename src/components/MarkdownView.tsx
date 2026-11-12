"use client";

import React from "react";

interface MarkdownViewProps {
  content: string;
  onCitationClick?: (index: number) => void;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  onCitationClick,
}) => {
  const renderFormattedText = (text: string) => {
    // Split by citation markers like [1], [2], [10]
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, idx) => {
      const citeMatch = part.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const citeIndex = parseInt(citeMatch[1], 10);
        return (
          <button
            key={idx}
            onClick={() => onCitationClick?.(citeIndex)}
            className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-100 transition-colors mx-0.5 align-baseline"
            title={`View Source [${citeIndex}]`}
          >
            {part}
          </button>
        );
      }

      // Format bold text **word**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, bidx) => {
        if (bp.startsWith("**") && bp.endsWith("**")) {
          return (
            <strong key={`${idx}-${bidx}`} className="text-slate-900 font-semibold">
              {bp.slice(2, -2)}
            </strong>
          );
        }

        // Format inline code `code`
        const codeParts = bp.split(/(`[^`]+`)/g);
        return codeParts.map((cp, cidx) => {
          if (cp.startsWith("`") && cp.endsWith("`")) {
            return (
              <code
                key={`${idx}-${bidx}-${cidx}`}
                className="bg-slate-100 text-blue-600 px-1 py-0.5 rounded text-[11px] font-mono"
              >
                {cp.slice(1, -1)}
              </code>
            );
          }
          return cp;
        });
      });
    });
  };

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect markdown table rows
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Check if it's separator line |:---|:---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      // Flush table
      renderedElements.push(renderTable(tableRows, `table-${i}`));
      tableRows = [];
      inTable = false;
    }

    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={i} className="text-xs font-bold text-slate-900 mt-3 mb-1">
          {renderFormattedText(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={i} className="text-sm font-bold text-slate-900 mt-3 mb-1.5 border-b border-slate-200 pb-1">
          {renderFormattedText(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={i} className="text-base font-extrabold text-slate-950 mt-4 mb-2">
          {renderFormattedText(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      renderedElements.push(
        <li key={i} className="text-slate-700 ml-3.5 list-disc text-xs leading-relaxed mb-1">
          {renderFormattedText(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
      renderedElements.push(
        <li key={i} className="text-slate-700 ml-3.5 list-decimal text-xs leading-relaxed mb-1">
          {renderFormattedText(numMatch ? numMatch[2] : line)}
        </li>
      );
    } else if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={i}
          className="border-l-2 border-blue-500 pl-2.5 my-2 text-slate-600 italic text-xs bg-blue-50/50 py-1 rounded-r"
        >
          {renderFormattedText(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim().length === 0) {
      renderedElements.push(<div key={i} className="h-1.5" />);
    } else {
      renderedElements.push(
        <p key={i} className="text-slate-700 text-xs leading-relaxed mb-1.5">
          {renderFormattedText(line)}
        </p>
      );
    }
  }

  if (inTable && tableRows.length > 0) {
    renderedElements.push(renderTable(tableRows, "table-final"));
  }

  function renderTable(rows: string[][], key: string) {
    if (rows.length === 0) return null;
    const header = rows[0];
    const body = rows.slice(1);

    return (
      <div key={key} className="overflow-x-auto my-2 border border-slate-200 rounded-lg">
        <table className="w-full text-[11px] text-left border-collapse">
          <thead className="bg-slate-100 text-slate-800">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="px-2.5 py-1.5 border-b border-slate-200 font-semibold">
                  {renderFormattedText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2.5 py-1.5 text-slate-700">
                    {renderFormattedText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="prose-light space-y-0.5">{renderedElements}</div>;
};
