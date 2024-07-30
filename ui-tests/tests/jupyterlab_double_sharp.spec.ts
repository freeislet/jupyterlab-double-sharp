import { expect, test, IJupyterLabPageFixture } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should emit an activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(
      s => s === 'JupyterLab extension jupyterlab-double-sharp is activated!'
    )
  ).toHaveLength(1);
});

test.use({
  autoGoto: true
  // video: 'on'
});

// selectors

const INSPECTOR = '#double-sharp\\:inspector.jp-DoubleSharp-Inspector';
const INSPECTOR_CODE = INSPECTOR + ' .jp-DoubleSharp-Group[data-group="Code"]';
const INSPECTOR_CODE_INVALID =
  INSPECTOR_CODE + ' >> text=Code info may be invalid.';
const INSPECTOR_CODE_UPDATE = INSPECTOR_CODE + ' a:has-text("click")';
const INSPECTOR_CODE_ROWS = INSPECTOR_CODE + ' .jp-DoubleSharp-row';
const INSPECTOR_EXECUTION =
  INSPECTOR + ' .jp-DoubleSharp-Group[data-group="Execution"]';
const INSPECTOR_EXECUTION_ROWS = INSPECTOR_EXECUTION + ' .jp-DoubleSharp-row';
const INSPECTOR_EXECUTION_CACHED =
  INSPECTOR_EXECUTION + ' >> text=Execution skipped by cache.';
const INLINE_BLOCK = '.jp-DoubleSharp-InlineBlock';

// 도움 함수

async function createNewNotebook(
  page: IJupyterLabPageFixture,
  name?: string
): Promise<void> {
  await page.notebook.createNew(name);
  await page
    .locator('.jp-Notebook-ExecutionIndicator[data-status="idle"]')
    .waitFor();
  // await page.waitForSelector('text=| Idle');
}

async function clickToolbarButton(
  page: IJupyterLabPageFixture,
  command: string,
  closeMoreCommands = true
): Promise<void> {
  const button = page.locator(
    `.jp-NotebookPanel-toolbar jp-button[data-command="${command}"]`
  );
  const buttonInMore = page.locator(
    `.jp-Toolbar-responsive-popup jp-button[data-command="${command}"]`
  );
  const more = page.locator(
    '.jp-NotebookPanel-toolbar jp-button[title="More commands"]'
  );

  await expect.soft(button.or(buttonInMore).or(more).first()).toBeVisible();

  if (await button.isVisible()) {
    // 툴바 버튼 클릭
    await button.click();
  } else if (await buttonInMore.isVisible()) {
    // 추가 툴바 버튼 클릭
    await buttonInMore.click();
  } else {
    // 툴바에 안 보이면 [...] More commands 클릭
    await more.click();

    // 추가 툴바 버튼 클릭
    await expect.soft(buttonInMore).toBeVisible();
    await buttonInMore.click();

    if (closeMoreCommands) {
      await more.click();
    }
  }
}

async function activateInspector(page: IJupyterLabPageFixture): Promise<void> {
  await clickToolbarButton(page, 'double-sharp:inspector');
  await expect(page.locator(INSPECTOR)).toBeVisible();
}

async function runAllCells(
  page: IJupyterLabPageFixture,
  byShortcut?: boolean
): Promise<void> {
  if (byShortcut) {
    await page.keyboard.press('ControlOrMeta+Shift+Enter'); // github actions 실패?
  } else {
    await clickToolbarButton(page, 'double-sharp:run-all-cells');
  }
}

async function expectVisible(
  page: IJupyterLabPageFixture,
  selector: string
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

async function expectOutput(
  page: IJupyterLabPageFixture,
  output: string,
  nth?: number
): Promise<void> {
  let locator = page.locator('.jp-OutputArea-output');
  if (nth !== undefined) {
    locator = locator.nth(nth);
  }
  locator = locator.getByText(output);
  await expect(locator).toBeVisible();
}

async function expectCodeVariables(
  page: IJupyterLabPageFixture,
  name: 'Variables' | 'Unbound Vars',
  variables: string[]
): Promise<void> {
  if (await page.locator(INSPECTOR_CODE_INVALID).isVisible()) {
    await page.locator(INSPECTOR_CODE_UPDATE).click();
  }

  const locator = page
    .locator(INSPECTOR_CODE_ROWS, { has: page.locator(`text="${name}:"`) })
    .locator(INLINE_BLOCK);
  await expect(locator).toHaveText(variables);
}

async function expectExecutionVariables(
  page: IJupyterLabPageFixture,
  name: 'Variables' | 'Unbound Vars' | 'Cached Vars',
  variables: string[]
): Promise<void> {
  if (name === 'Variables' || name === 'Unbound Vars') throw Error('미구현');

  const locator = page
    .locator(INSPECTOR_EXECUTION_ROWS, { has: page.locator(`text="${name}:"`) })
    .locator(INLINE_BLOCK);
  await expect(locator).toHaveText(variables);
}

async function expectExecutionDependency(
  page: IJupyterLabPageFixture,
  dependencyCellCount: number
): Promise<void> {
  const locator = page
    .locator(INSPECTOR_EXECUTION_ROWS, {
      has: page.locator(`text="Dependency:"`)
    })
    .locator(INLINE_BLOCK);
  await expect(locator).toHaveCount(dependencyCellCount);
}

/**
 * tests
 */

test('code inspector variables 수집', async ({ page }) => {
  await createNewNotebook(page);
  await activateInspector(page);

  // code 입력 시 Cell Inspector에 update 메시지 표시
  await page.notebook.setCell(0, 'code', 'a = 1\nb = 2\nc = 3');
  await expectVisible(page, INSPECTOR_CODE_INVALID);

  // code 정보 update 시 variables
  await expectCodeVariables(page, 'Variables', ['a', 'b', 'c']);

  // unbound variables
  await page.notebook.addCell('code', 'a = d'); // #1
  await expectCodeVariables(page, 'Unbound Vars', ['d']);

  // imported module
  await page.notebook.addCell(
    'code',
    `import os
print(os.name)

import base64 as b64
encoded = b64.b64encode(b'data to be encoded')
print(encoded)`
  ); // #2
  await page.notebook.runCell(2, true);
  await expectCodeVariables(page, 'Variables', ['os', 'b64', 'encoded']);
  await expectOutput(page, "b'ZGF0YSB0byBiZSBlbmNvZGVk'");
});

test('셀 실행 시 auto dependency 실행', async ({ page }) => {
  await createNewNotebook(page);
  await activateInspector(page);

  // 셀 실행 시 auto dependency 실행
  await page.notebook.setCell(0, 'code', 'a = 1234');
  await page.notebook.addCell('code', 'print(a)'); // #1
  await page.notebook.runCell(1, true);
  await expectCodeVariables(page, 'Unbound Vars', ['a']);
  await expectExecutionDependency(page, 1);
  await expectOutput(page, '1234');

  // recursive dependency
  await page.notebook.addCell('code', 'b = 10\nc = 5'); // #2
  await page.notebook.addCell('code', 'd = a * b + c'); // #3
  await page.notebook.addCell('code', 'print(d)'); // #4
  await page.notebook.runCell(4, true);
  await expectCodeVariables(page, 'Unbound Vars', ['d']);
  await expectExecutionDependency(page, 3); // #0 (a), #2 (b, c), #4 (d)
  await expectOutput(page, '12345');
});

test('cache', async ({ page }) => {
  await createNewNotebook(page);
  await activateInspector(page);

  // 모든 셀 실행 시 cache 적용
  await page.notebook.setCell(
    0,
    'code',
    'text = "Hello, JupyterLab"\nprint(text)'
  );
  await runAllCells(page); // 첫 번째 실행 시 text 변수가 kernel interactive namespace에 저장됨
  await runAllCells(page); // 두 번째 실행 시 cache에 의해 실행 skip
  await expectVisible(page, INSPECTOR_EXECUTION_CACHED);
  await expectExecutionVariables(page, 'Cached Vars', ['text']);
  await expectOutput(page, 'Hello, JupyterLab');
});
