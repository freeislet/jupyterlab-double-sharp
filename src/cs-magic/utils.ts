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
