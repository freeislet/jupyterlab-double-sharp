export interface IStatementMatch {
  statement: string;
  isCommand: boolean;
  start?: number;
  end?: number;
}

export function* matchAllStatements(
  source: string
): Generator<IStatementMatch> {
  const matches = source.matchAll(/^##[^\S\r\n]*(.*)/gm); // ##으로 시작하는 텍스트 캡쳐
  for (const match of matches) {
    const statement = match[1];
    const start = match.index;
    const statementMatch: IStatementMatch = {
      statement,
      isCommand: statement.startsWith('%'),
      start,
      end: start !== undefined ? start + statement.length : undefined
    };
    yield statementMatch;
  }
}
