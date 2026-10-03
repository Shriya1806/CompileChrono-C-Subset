export interface Cursor {
  offset: number;
  line: number;
  column: number;
}

export function advanceCursor(cursor: Cursor, text: string): Cursor {
  let line = cursor.line;
  let column = cursor.column;
  for (const char of text) {
    if (char === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return {
    offset: cursor.offset + text.length,
    line,
    column
  };
}
