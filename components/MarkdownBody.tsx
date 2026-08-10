import React from "react";
export function MarkdownBody({ content }: { content:string }) {
  const blocks = content.trim().split(/\n\s*\n/);
  return <div className="article-body">{blocks.map((block,index) => {
    if (block.startsWith("## ")) return <h2 key={index}>{block.slice(3)}</h2>;
    if (block.split("\n").every((line) => line.startsWith("- "))) return <ul key={index}>{block.split("\n").map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
    const parts = block.split(/(\*\*.*?\*\*)/g);
    return <p key={index}>{parts.map((part,partIndex) => part.startsWith("**") ? <strong key={partIndex}>{part.slice(2,-2)}</strong> : part)}</p>;
  })}</div>;
}
