import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { Token } from "../../../compiler/lexer/token";
import { TokenType } from "../../../compiler/language/tokens";
import { getLexicalRuleForToken } from "../../../compiler/language/lexicalRules";
import { useCompilerStore } from "../../../store/compilerStore";

export function TokenTable() {
  const tokens = useCompilerStore((state) => state.tokens);
  const selectedTokenId = useCompilerStore((state) => state.selectedTokenId);
  const selectToken = useCompilerStore((state) => state.selectToken);
  const visibleTokens = useMemo(() => tokens.filter((token) => token.type !== TokenType.EOF), [tokens]);

  const columns = useMemo<ColumnDef<Token>[]>(
    () => [
      { accessorKey: "lexeme", header: "Lexeme" },
      { accessorKey: "type", header: "Token Type" },
      {
        header: "Pattern",
        cell: ({ row }) => {
          const rule = getLexicalRuleForToken(row.original.type, row.original.ruleId);
          return <span className="font-mono text-xs text-black">{rule?.pattern ?? row.original.lexeme}</span>;
        }
      },
      { accessorKey: "line", header: "Line" },
      { accessorKey: "column", header: "Column" }
    ],
    []
  );

  const table = useReactTable({
    data: visibleTokens,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      <table className="w-full text-left text-xs">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.original.id}
              onClick={() => selectToken(row.original.id)}
              className={`cursor-pointer transition-colors ${
                selectedTokenId === row.original.id ? "bg-[#FEF08A] font-bold" : "hover:bg-zinc-50 text-black"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="font-mono">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

