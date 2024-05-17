export interface IStatementMatch {
  statement: string;
  isCommand: boolean;
  start?: number;
  end?: number;
}

/**
 * 텍스트에서 ##으로 시작하는 라인 매칭
 */
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

/**
 * 따옴표("", '') 지원 tokenize
 */
export function tokenize(command: string): string[] {
  const tokens: string[] = [];
  // NOTE: "a b c"를 하나의 토큰으로 처리 (결과에 "는 제외)
  const matches = command.matchAll(/"([^"]*)"|'([^']*)'|\S+/g);
  for (const match of matches) {
    const capturedOrMatched = match[1] || match[0];
    tokens.push(capturedOrMatched);
  }
  return tokens;
}
