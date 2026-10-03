import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";
import type { editor } from "monaco-editor";
import { Play, Trash2 } from "lucide-react";
import { keywords, dataTypes, booleanLiterals } from "../../compiler/language/tokens";
import type { LanguageMode } from "../../compiler/language/cSubset";
import { cSamplePrograms } from "../../compiler/language/cExamples";
import { samplePrograms } from "../../compiler/language/examples";
import { useCompilerStore } from "../../store/compilerStore";
import { BrutalBadge, BrutalButton, BrutalSelect } from "../../components/brutal/BrutalPrimitives";

export function EditorPanel() {
  const language = useCompilerStore((state) => state.language);
  const source = useCompilerStore((state) => state.source);
  const setSource = useCompilerStore((state) => state.setSource);
  const setLanguage = useCompilerStore((state) => state.setLanguage);
  const tokens = useCompilerStore((state) => state.tokens);
  const errors = useCompilerStore((state) => state.errors);
  const selectedTokenId = useCompilerStore((state) => state.selectedTokenId);
  const selectedErrorId = useCompilerStore((state) => state.selectedErrorId);
  const selectedSourceRange = useCompilerStore((state) => state.selectedSourceRange);
  const compile = useCompilerStore((state) => state.compile);
  const loadExample = useCompilerStore((state) => state.loadExample);
  const session = useCompilerStore((state) => state.session);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const highlightedRange = useMemo(() => {
    if (selectedSourceRange) {
      return {
        startOffset: selectedSourceRange.startOffset,
        endOffset: selectedSourceRange.endOffset,
        className: "source-highlight"
      };
    }
    const selectedToken = tokens.find((token) => token.id === selectedTokenId);
    if (selectedToken) {
      return {
        startOffset: selectedToken.startOffset,
        endOffset: selectedToken.endOffset,
        className: "source-highlight"
      };
    }
    const selectedError = errors.find((error) => error.id === selectedErrorId);
    if (selectedError) {
      return {
        startOffset: selectedError.sourceRange.startOffset,
        endOffset: selectedError.sourceRange.endOffset,
        className: "source-error"
      };
    }
    return null;
  }, [errors, selectedErrorId, selectedSourceRange, selectedTokenId, tokens]);

  useEffect(() => {
    const monacoEditor = editorRef.current;
    const model = monacoEditor?.getModel();
    if (!monacoEditor || !model) return;

    const errorDecorations = errors.map((error) => ({
      range: rangeFromOffsets(model, error.sourceRange.startOffset, error.sourceRange.endOffset),
      options: {
        className: "source-error",
        hoverMessage: { value: error.message }
      }
    }));

    const activeDecoration =
      highlightedRange && highlightedRange.endOffset >= highlightedRange.startOffset
        ? [
            {
              range: rangeFromOffsets(model, highlightedRange.startOffset, highlightedRange.endOffset),
              options: { className: highlightedRange.className }
            }
          ]
        : [];

    decorationsRef.current = monacoEditor.deltaDecorations(decorationsRef.current, [...errorDecorations, ...activeDecoration]);
    if (highlightedRange) {
      const position = model.getPositionAt(highlightedRange.startOffset);
      monacoEditor.revealPositionInCenter(position);
      monacoEditor.setPosition(position);
    }
  }, [errors, highlightedRange]);

  const handleMount: OnMount = (mountedEditor, monaco) => {
    editorRef.current = mountedEditor;
    monaco.languages.register({ id: "compilechrono" });
    monaco.languages.setMonarchTokensProvider("compilechrono", {
      keywords: [...keywords, "int", "float", "double", "char", "void", "printf", "puts"],
      typeKeywords: [...dataTypes, "int", "float", "double", "char", "void"],
      booleans: [...booleanLiterals],
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/"[^"\n]*"/, "string"],
          [/[0-9]+\.[0-9]+/, "number.float"],
          [/[0-9]+/, "number"],
          [/[A-Za-z_][A-Za-z0-9_]*/, { cases: { "@typeKeywords": "type", "@booleans": "constant", "@keywords": "keyword", "@default": "identifier" } }],
          [/==|!=|<=|>=|&&|\|\||[+\-*/%=<>!]/, "operator"],
          [/[{}()[\],;]/, "delimiter"]
        ]
      }
    });
    monaco.editor.defineTheme("compilechrono-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "EF4444", fontStyle: "bold" },
        { token: "type", foreground: "2563EB", fontStyle: "bold" },
        { token: "constant", foreground: "0284C7" },
        { token: "identifier", foreground: "000000" },
        { token: "number", foreground: "0284C7" },
        { token: "string", foreground: "D97706" },
        { token: "comment", foreground: "6B7280" },
        { token: "operator", foreground: "000000", fontStyle: "bold" }
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editorLineNumber.foreground": "#000000",
        "editorGutter.background": "#FEF08A",
        "editorCursor.foreground": "#000000",
        "editor.selectionBackground": "#BAE6FD",
        "editor.lineHighlightBackground": "#FEF9C3",
        "editorLineNumber.activeForeground": "#EF4444"
      }
    });
    monaco.editor.setTheme("compilechrono-light");
  };

  return (
    <div className="flex h-full min-h-[520px] flex-col gap-3 p-3">
      <div className="flex shrink-0 items-center gap-2">
        <BrutalSelect
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageMode)}
          aria-label="Language"
        >
          <option value="mini">Mini Language</option>
          <option value="c">C Subset</option>
        </BrutalSelect>
        <BrutalSelect key={language} onChange={(event) => loadExample(Number(event.target.value))} defaultValue="0" aria-label="Example">
          {(language === "c" ? cSamplePrograms : samplePrograms).map((example, index) => (
            <option key={example.name} value={index}>{example.name}</option>
          ))}
        </BrutalSelect>
        <BrutalButton onClick={() => setSource("")}>
          <Trash2 size={14} />
          Clear
        </BrutalButton>
        <BrutalButton tone="yellow" onClick={compile}>
          <Play size={14} className="fill-black" />
          Compile
        </BrutalButton>
        <div className="ml-auto flex items-center gap-2">
          <BrutalBadge tone={session.summary.errorCount > 0 ? "red" : "blue"}>{session.summary.errorCount} Errors</BrutalBadge>
          <BrutalBadge tone="yellow">{session.summary.tokenCount} Tokens</BrutalBadge>
          <BrutalBadge tone="white">{session.summary.targetInstructionCount} Instructions</BrutalBadge>
        </div>
      </div>
      <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
        <Editor
          height="100%"
          width="100%"
          language="compilechrono"
          value={source}
          theme="compilechrono-light"
          onMount={handleMount}
          onChange={(value) => setSource(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "JetBrains Mono, Consolas, monospace",
            lineNumbers: "on",
            bracketPairColorization: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            wordWrap: "on",
            overviewRulerBorder: false,
            renderLineHighlight: "all"
          }}
        />
      </div>
    </div>
  );
}

function rangeFromOffsets(model: editor.ITextModel, startOffset: number, endOffset: number) {
  const start = model.getPositionAt(startOffset);
  const end = model.getPositionAt(Math.max(startOffset + 1, endOffset));
  return {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column
  };
}

