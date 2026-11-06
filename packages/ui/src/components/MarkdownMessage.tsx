import { useState, type FC, type ReactNode } from "react";
import { marked, type Tokens } from "marked";
import { InteractiveMCQ, type MCQData } from "./InteractiveMCQ.js";
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  Cpu,
  Copy,
  Check,
  ArrowDownToLine,
  Terminal,
  Layers,
  Flag,
  ClipboardList,
} from "lucide-react";

// Configure marked with GFM and line breaks
marked.use({
  gfm: true,
  breaks: true,
});

export interface MarkdownMessageProps {
  content: string;
  onLoadCode?: ((code: string) => void) | undefined;
  onSelectMCQOption?: ((answer: string) => void) | undefined;
  className?: string | undefined;
}

type ProcessedItem =
  | { type: "token"; token: Tokens.Generic }
  | { type: "example_block"; title: string; listToken: Tokens.List }
  | { type: "constraints_block"; listToken: Tokens.List }
  | {
      type: "followup_block";
      badge: string;
      badgeStyle: string;
      icon: ReactNode;
      tokens: Tokens.Generic[];
      subList?: Tokens.List | undefined;
    };

export const MarkdownMessage: FC<MarkdownMessageProps> = ({
  content,
  onLoadCode,
  onSelectMCQOption,
  className = "",
}) => {
  // Strip any [STARTER_CODE] tags from chat rendering
  const cleanContent = content
    .replace(/\[STARTER_CODE\][\s\S]*?\[\/STARTER_CODE\]/i, "")
    .replace(/\[STARTER_CODE\][\s\S]*$/i, "")
    .trim();

  // Extract [MCQ] JSON block if present
  let mcqData: MCQData | null = null;
  let textToLex = cleanContent;
  const mcqMatch = /\[MCQ\]([\s\S]*?)\[\/MCQ\]/i.exec(cleanContent);
  if (mcqMatch && mcqMatch[1]) {
    try {
      mcqData = JSON.parse(mcqMatch[1].trim());
      textToLex = cleanContent.replace(/\[MCQ\][\s\S]*?\[\/MCQ\]/i, "").trim();
    } catch {
      // JSON may be partial while streaming
    }
  }

  // If this message is presenting a problem, omit code blocks from the chatbox
  const isProblemStatement =
    cleanContent.toLowerCase().includes("problem") ||
    cleanContent.includes("Example 1") ||
    cleanContent.includes("Constraints");

  // Lex raw markdown tokens
  const rawTokens = marked.lexer(textToLex);

  // Pre-process tokens to group Examples + Lists, Constraints + Lists, and Follow-up questions
  const items: ProcessedItem[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (!token) continue;

    // Do not display starter code blocks in the chatbox during problem presentation
    if (token.type === "code" && isProblemStatement) {
      continue;
    }

    // Check for Example header followed by list
    if (token.type === "paragraph") {
      const pToken = token as Tokens.Paragraph;
      const text = pToken.text.trim();

      const exampleMatch = /^\s*\*?\*?Example\s*(\d*)[:\s]/i.exec(text);
      if (exampleMatch) {
        const nextToken = rawTokens[i + 1];
        if (nextToken && nextToken.type === "list") {
          items.push({
            type: "example_block",
            title: `Example ${exampleMatch[1] || ""}`.trim(),
            listToken: nextToken as Tokens.List,
          });
          i++; // skip list token
          continue;
        }
      }

      // Check for Constraints header followed by list
      const isConstraints = /^\s*\*?\*?Constraints:?/i.test(text);
      if (isConstraints) {
        const nextToken = rawTokens[i + 1];
        if (nextToken && nextToken.type === "list") {
          items.push({
            type: "constraints_block",
            listToken: nextToken as Tokens.List,
          });
          i++; // skip list token
          continue;
        }
      }

      // Check for Follow-up or Concept question in paragraph
      const isFollowUp =
        /^\s*\*?\*?(Follow-?up|Question\s*\d*|Time Complexity|Space Complexity|Edge Cases?|Concept Question):?/i.test(
          text
        ) ||
        /^\s*(Looking at your solution|Can you explain|How would (it|this|you) scale|What if (the input|there are)|Quick concept question|What is the fundamental difference)/i.test(
          text
        );

      if (isFollowUp) {
        let badge = "Follow-Up";
        let badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40";
        let icon: ReactNode = <HelpCircle size={13} className="text-purple-400" />;

        const lower = text.toLowerCase();
        if (lower.includes("complexity") || lower.includes("scale") || lower.includes("time") || lower.includes("space")) {
          badge = "Complexity & Scaling";
          badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
          icon = <Cpu size={13} className="text-emerald-400" />;
        } else if (lower.includes("edge") || lower.includes("empty") || lower.includes("duplicate")) {
          badge = "Edge Case Analysis";
          badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
          icon = <AlertTriangle size={13} className="text-amber-400" />;
        } else if (lower.includes("concept") || lower.includes("dsa") || lower.includes("oop") || lower.includes("database") || lower.includes("linked list")) {
          badge = "Concept Question";
          badgeStyle = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
          icon = <Layers size={13} className="text-cyan-400" />;
        }

        const nextToken = rawTokens[i + 1];
        let subList: Tokens.List | undefined = undefined;
        if (nextToken && nextToken.type === "list") {
          subList = nextToken as Tokens.List;
          i++; // consume list as sub-questions
        }

        items.push({
          type: "followup_block",
          badge,
          badgeStyle,
          icon,
          tokens: pToken.tokens,
          subList,
        });
        continue;
      }
    }

    items.push({ type: "token", token });
  }

  return (
    <div className={`space-y-3 leading-relaxed text-gray-200 text-sm ${className}`}>
      {items.map((item, idx) => {
        if (item.type === "example_block") {
          return (
            <ExampleCard
              key={idx}
              title={item.title}
              listToken={item.listToken}
              onLoadCode={onLoadCode}
            />
          );
        }
        if (item.type === "constraints_block") {
          return (
            <ConstraintsCard
              key={idx}
              listToken={item.listToken}
              onLoadCode={onLoadCode}
            />
          );
        }
        if (item.type === "followup_block") {
          return (
            <FollowUpCard
              key={idx}
              badge={item.badge}
              badgeStyle={item.badgeStyle}
              icon={item.icon}
              tokens={item.tokens}
              subList={item.subList}
              onLoadCode={onLoadCode}
            />
          );
        }
        return (
          <TokenRenderer
            key={idx}
            token={item.token}
            onLoadCode={onLoadCode}
          />
        );
      })}

      {mcqData && (
        <InteractiveMCQ
          data={mcqData}
          onSelectOption={onSelectMCQOption}
        />
      )}
    </div>
  );
};

const TokenRenderer: React.FC<{
  token: Tokens.Generic;
  onLoadCode?: ((code: string) => void) | undefined;
}> = ({ token, onLoadCode }) => {
  switch (token.type) {
    case "heading": {
      const headingToken = token as Tokens.Heading;
      const depth = headingToken.depth;
      const rawTitle = headingToken.text.toLowerCase();

      // Select badge & style based on title keywords
      let badge = "";
      let badgeStyle = "bg-gray-800 text-gray-300 border-gray-700";
      let accentBar = "bg-blue-500";
      let iconNode: ReactNode = null;

      if (rawTitle.includes("roadmap") || rawTitle.includes("plan") || rawTitle.includes("agenda") || rawTitle.includes("schedule")) {
        badge = "Roadmap & Plan";
        badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/40";
        accentBar = "bg-blue-500";
        iconNode = <ClipboardList size={13} className="text-blue-400" />;
      } else if (rawTitle.includes("problem") || rawTitle.includes("challenge") || rawTitle.includes("task")) {
        badge = "Problem";
        badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/40";
        accentBar = "bg-blue-500";
        iconNode = <Terminal size={13} className="text-blue-400" />;
      } else if (rawTitle.includes("complexity") || rawTitle.includes("scaling") || rawTitle.includes("time") || rawTitle.includes("space")) {
        badge = "Complexity";
        badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
        accentBar = "bg-emerald-500";
        iconNode = <Cpu size={13} className="text-emerald-400" />;
      } else if (rawTitle.includes("edge") || rawTitle.includes("case") || rawTitle.includes("test")) {
        badge = "Edge Cases";
        badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
        accentBar = "bg-amber-500";
        iconNode = <AlertTriangle size={13} className="text-amber-400" />;
      } else if (rawTitle.includes("concept") || rawTitle.includes("theory") || rawTitle.includes("dsa") || rawTitle.includes("oop") || rawTitle.includes("database")) {
        badge = "Concept Question";
        badgeStyle = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
        accentBar = "bg-cyan-500";
        iconNode = <Layers size={13} className="text-cyan-400" />;
      } else if (rawTitle.includes("wrap") || rawTitle.includes("conclus") || rawTitle.includes("complete")) {
        badge = "Wrap-Up";
        badgeStyle = "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
        accentBar = "bg-indigo-500";
        iconNode = <Flag size={13} className="text-indigo-400" />;
      } else if (rawTitle.includes("follow-up") || rawTitle.includes("followup")) {
        badge = "Follow-Up";
        badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40";
        accentBar = "bg-purple-500";
        iconNode = <HelpCircle size={13} className="text-purple-400" />;
      }

      if (depth === 1) {
        return (
          <h1 className="mt-4 mb-2 text-xl font-bold tracking-tight text-white border-b border-gray-700/60 pb-2 flex items-center gap-2">
            <span className={`h-4 w-1 ${accentBar} rounded-full inline-block`} />
            <InlineTokens tokens={headingToken.tokens} />
          </h1>
        );
      }
      if (depth === 2) {
        return (
          <h2 className="mt-3 mb-2 text-base font-bold text-white flex items-center gap-2">
            <span className={`h-3.5 w-1 ${accentBar} rounded-full inline-block`} />
            <InlineTokens tokens={headingToken.tokens} />
          </h2>
        );
      }

      // Depth 3+ (e.g. ### Follow-Up: Time Complexity, ### The Problem, ### Technical Interview Roadmap & Plan)
      if (badge) {
        return (
          <div className="mt-3 mb-2 flex items-center gap-2.5 rounded-lg bg-gray-900/90 border border-gray-700/70 px-3 py-2 shadow-sm">
            <span>{iconNode}</span>
            <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeStyle}`}>
              {badge}
            </span>
            <h3 className="text-sm font-semibold text-white flex-1">
              <InlineTokens tokens={headingToken.tokens} />
            </h3>
          </div>
        );
      }

      return (
        <h3 className="mt-3 mb-1.5 text-sm font-bold text-white flex items-center gap-2">
          <span className={`h-3 w-1 ${accentBar} rounded-full inline-block`} />
          <InlineTokens tokens={headingToken.tokens} />
        </h3>
      );
    }

    case "paragraph": {
      const pToken = token as Tokens.Paragraph;
      return (
        <p className="my-1.5 leading-relaxed text-gray-200 text-sm">
          <InlineTokens tokens={pToken.tokens} />
        </p>
      );
    }

    case "text": {
      const textToken = token as Tokens.Text;
      return (
        <span className="leading-relaxed text-gray-200 text-sm">
          {textToken.tokens && textToken.tokens.length > 0 ? (
            <InlineTokens tokens={textToken.tokens} />
          ) : (
            <FormattedText text={textToken.text} />
          )}
        </span>
      );
    }

    case "code": {
      const codeToken = token as Tokens.Code;
      return (
        <CodeBlockCard
          code={codeToken.text}
          language={codeToken.lang || "python"}
          onLoadCode={onLoadCode}
        />
      );
    }

    case "list": {
      const listToken = token as Tokens.List;
      return (
        <div className="my-2.5 space-y-2">
          {listToken.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-gray-200">
              {listToken.ordered ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900/60 border border-blue-500/40 font-mono text-[11px] font-bold text-blue-300 mt-0.5 select-none">
                  {i + 1}
                </span>
              ) : (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              )}
              <div className="flex-1 leading-relaxed text-sm">
                {item.tokens.map((t, ti) => {
                  if (t.type === "paragraph") {
                    const pt = t as Tokens.Paragraph;
                    return (
                      <p key={ti} className="my-0.5 leading-relaxed">
                        <InlineTokens tokens={pt.tokens} />
                      </p>
                    );
                  }
                  if (t.type === "text") {
                    const tt = t as Tokens.Text;
                    return (
                      <span key={ti} className="leading-relaxed">
                        {tt.tokens && tt.tokens.length > 0 ? (
                          <InlineTokens tokens={tt.tokens} />
                        ) : (
                          <FormattedText text={tt.text} />
                        )}
                      </span>
                    );
                  }
                  return <TokenRenderer key={ti} token={t} onLoadCode={onLoadCode} />;
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "hr":
      return <hr className="my-3 border-gray-700/60" />;

    case "blockquote": {
      const bqToken = token as Tokens.Blockquote;
      return (
        <blockquote className="my-2 border-l-4 border-blue-500 bg-gray-900/40 pl-3 py-1.5 text-gray-300 italic rounded-r text-sm">
          {bqToken.tokens.map((t, i) => (
            <TokenRenderer key={i} token={t} onLoadCode={onLoadCode} />
          ))}
        </blockquote>
      );
    }

    default:
      if ("text" in token && typeof token.text === "string") {
        return <p className="my-1 text-sm text-gray-200">{token.text}</p>;
      }
      return null;
  }
};

/** Render inline tokens (bold, italics, codespan, links, breaks) */
const InlineTokens: React.FC<{ tokens?: Tokens.Generic[] }> = ({ tokens }) => {
  if (!tokens || tokens.length === 0) return null;

  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case "br":
            return <br key={i} />;
          case "space":
            return " ";
          case "strong": {
            const strong = token as Tokens.Strong;
            return (
              <strong key={i} className="font-semibold text-white">
                <InlineTokens tokens={strong.tokens} />
              </strong>
            );
          }
          case "em": {
            const em = token as Tokens.Em;
            return (
              <em key={i} className="italic text-gray-300">
                <InlineTokens tokens={em.tokens} />
              </em>
            );
          }
          case "codespan": {
            const code = token as Tokens.Codespan;
            const text = code.text;
            const isBigO = /^O\(.*\)$/i.test(text.trim());
            return (
              <code
                key={i}
                className={`mx-0.5 rounded border px-1.5 py-0.5 font-mono text-xs font-semibold ${
                  isBigO
                    ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                    : "border-gray-700 bg-gray-900/90 px-1.5 py-0.5 text-blue-300"
                }`}
              >
                {text}
              </code>
            );
          }
          case "link": {
            const link = token as Tokens.Link;
            return (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {link.text}
              </a>
            );
          }
          case "text": {
            const textToken = token as Tokens.Text;
            if (textToken.tokens && textToken.tokens.length > 0) {
              return <InlineTokens key={i} tokens={textToken.tokens} />;
            }
            return <FormattedText key={i} text={textToken.text} />;
          }
          default:
            return <span key={i}>{token.raw}</span>;
        }
      })}
    </>
  );
};

/** Text formatter that highlights Big-O, scales, and constraints even outside backticks */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const regex = /(\bO\([a-zA-Z0-9\s^+\-*/log]+\)|\b10\^\d+\b|\b\d+\s*million\b)/gi;
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <span>{text}</span>;
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (regex.test(part)) {
          const isBigO = /^O\(.*\)$/i.test(part.trim());
          return (
            <code
              key={idx}
              className={`mx-0.5 rounded border px-1.5 py-0.5 font-mono text-xs font-semibold ${
                isBigO
                  ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                  : "border-cyan-500/40 bg-cyan-950/60 text-cyan-300"
              }`}
            >
              {part}
            </code>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
};

/** HackerRank Example Card */
const ExampleCard: React.FC<{
  title: string;
  listToken: Tokens.List;
  onLoadCode?: ((code: string) => void) | undefined;
}> = ({ title, listToken }) => {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-blue-500/30 bg-[#0c1322] shadow-md">
      <div className="flex items-center gap-2 border-b border-blue-500/20 bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-300">
        <FileText size={13} className="text-blue-400" />
        <span>{title || "Example Walkthrough"}</span>
      </div>
      <div className="p-3.5 space-y-2 font-mono text-xs text-gray-200">
        {listToken.items.map((item, idx) => {
          const raw = item.text.trim();
          let chip = null;

          if (/^Input\s*:/i.test(raw)) {
            chip = (
              <span className="rounded bg-blue-950 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Input
              </span>
            );
          } else if (/^Output\s*:/i.test(raw)) {
            chip = (
              <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Output
              </span>
            );
          } else if (/^Explanation\s*:/i.test(raw)) {
            chip = (
              <span className="rounded bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Explanation
              </span>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
              {chip ? (
                <>
                  <div className="shrink-0">{chip}</div>
                  <div className="flex-1 text-gray-200">
                    <InlineTokens tokens={item.tokens} />
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 text-gray-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  <div className="flex-1">
                    <InlineTokens tokens={item.tokens} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Constraints Card */
const ConstraintsCard: React.FC<{
  listToken: Tokens.List;
  onLoadCode?: ((code: string) => void) | undefined;
}> = ({ listToken }) => {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-amber-500/30 bg-[#161208] shadow-md">
      <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-950/40 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
        <AlertTriangle size={13} className="text-amber-400" />
        <span>Constraints & Specifications</span>
      </div>
      <div className="p-3.5 space-y-1.5 font-mono text-xs text-amber-100/90">
        {listToken.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
            <div className="flex-1">
              <InlineTokens tokens={item.tokens} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Follow-Up and Concept Question Card */
const FollowUpCard: React.FC<{
  badge: string;
  badgeStyle: string;
  icon: ReactNode;
  tokens: Tokens.Generic[];
  subList?: Tokens.List | undefined;
  onLoadCode?: ((code: string) => void) | undefined;
}> = ({ badge, badgeStyle, icon, tokens, subList, onLoadCode }) => {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-purple-500/30 bg-[#120e24] shadow-md">
      <div className="flex items-center gap-2 border-b border-purple-500/20 bg-purple-950/40 px-3.5 py-1.5 text-xs font-semibold text-purple-200">
        <span>{icon}</span>
        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
          {badge}
        </span>
      </div>
      <div className="p-3.5 space-y-2 text-sm leading-relaxed text-gray-100">
        <p className="leading-relaxed">
          <InlineTokens tokens={tokens} />
        </p>
        {subList && (
          <div className="mt-2.5 space-y-2 pl-2 border-l-2 border-purple-500/40">
            {subList.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-purple-100/90">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                <div className="flex-1">
                  {item.tokens.map((t, ti) => (
                    <TokenRenderer key={ti} token={t} onLoadCode={onLoadCode} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Code Block Card with Copy & 'Load into Editor' actions */
const CodeBlockCard: React.FC<{
  code: string;
  language: string;
  onLoadCode?: ((code: string) => void) | undefined;
}> = ({ code, language, onLoadCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-gray-700 bg-[#0d1117] shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <span className="font-mono font-medium uppercase tracking-wider text-gray-400">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onLoadCode && (
            <button
              onClick={() => onLoadCode(code)}
              className="inline-flex items-center gap-1 rounded bg-blue-600/30 border border-blue-500/40 px-2 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-600 hover:text-white"
              title="Replace editor code with this starter template"
            >
              <ArrowDownToLine size={11} />
              <span>Load into Editor</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-800/80 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-700 hover:text-white"
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};
