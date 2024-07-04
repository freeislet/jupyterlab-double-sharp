import { SyntaxNodeRef } from '@lezer/common';

/**
 * syntax node ref가 top-level comment인지 검사
 */
export function isTopLevelCommentNode(nodeRef: SyntaxNodeRef): boolean {
  const isTopLevel = !nodeRef.node.parent?.parent;
  return isTopLevel && nodeRef.name === 'Comment';
}

/**
 * 코드 라인이 Double Sharp statement인지 검사
 */
export function isStatementComment(codeline: string) {
  return codeline.startsWith('##');
}

/**
 * IStatementMatch
 */
export interface IStatementMatch {
  statement: string;
  isCommand: boolean;
  start?: number;
  end?: number;
}

/**
 * syntax tree에서 ##으로 시작하는 라인 매칭
 */
export function* matchAllStatements(
  source: string
): Generator<IStatementMatch> {
  // syntax 테스트 코드
  // const editorView = (cell.editor as CodeMirrorEditor).editor;
  // const tree = syntaxTree(editorView.state);
  // tree.iterate({ enter });
  // const commentNodes = tree.topNode.getChildren('Comment');
  // console.log(commentNodes, tree.topNode);
}

/**
 * 텍스트에서 ##으로 시작하는 라인 매칭
 */
export function* matchAllStatementsFromSource(
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

/**
 * boolean command 파라미터 파싱 (true/false, 1/0 지원)
 * - true 또는 0이 아닌 숫자면 true
 * - false 또는 0이면 false
 * - 그 외 값이면 default_ 리턴
 */
export function paramAsBoolean(
  param: string,
  default_?: boolean
): boolean | undefined {
  param = param.toLowerCase();
  if (param === 'true') return true;
  if (param === 'false') return false;

  const paramAsNumber = +param;
  return !isNaN(paramAsNumber) ? paramAsNumber !== 0 : default_;
}
