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
  // Render text segments and parse [1], [2] citations into interactive buttons
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
            className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 hover:bg-indigo-900 hover:text-indigo-200 transition-colors mx-0.5 align-baseline"
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
            <strong key={`${idx}-${bidx}`} className="text-slate-100 font-semibold">
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
                className="bg-slate-800/80 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
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
        <h3 key={i} className="text-base font-semibold text-slate-100 mt-4 mb-2">
          {renderFormattedText(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={i} className="text-lg font-bold text-slate-50 mt-5 mb-2 border-b border-slate-800 pb-1">
          {renderFormattedText(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-6 mb-3">
          {renderFormattedText(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      renderedElements.push(
        <li key={i} className="text-slate-300 ml-4 list-disc text-sm leading-relaxed mb-1">
          {renderFormattedText(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
      renderedElements.push(
        <li key={i} className="text-slate-300 ml-4 list-decimal text-sm leading-relaxed mb-1">
          {renderFormattedText(numMatch ? numMatch[2] : line)}
        </li>
      );
    } else if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={i}
          className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic text-sm bg-slate-900/40 py-1 rounded-r"
        >
          {renderFormattedText(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim().length === 0) {
      renderedElements.push(<div key={i} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2">
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
      <div key={key} className="overflow-x-auto my-3 border border-slate-800 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-800/80 text-slate-200">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="px-3 py-2 border-b border-slate-700 font-semibold">
                  {renderFormattedText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-300">
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

  return <div className="prose-dark space-y-1">{renderedElements}</div>;
};

