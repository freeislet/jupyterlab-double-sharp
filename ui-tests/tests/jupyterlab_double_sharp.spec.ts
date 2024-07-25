import { expect, test } from '@jupyterlab/galata';

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

test.use({ autoGoto: true });

// 툴바 버튼
const SHOW_INSPECTOR =
  '.jp-NotebookPanel-toolbar jp-button[data-command="double-sharp:inspector"]';
const RUN_ALL =
  '.jp-NotebookPanel-toolbar jp-button[data-command="double-sharp:run-all-cells"]';

// Inspector
const INSPECTOR = '#double-sharp\\:inspector.jp-DoubleSharp-Inspector';
const INSPECTOR_CODE = '.jp-DoubleSharp-Group[data-group="Code"]';
const INSPECTOR_CODE_INVALID =
  INSPECTOR_CODE + ' >> text=Code info may be invalid.';
const INSPECTOR_CODE_UPDATE = INSPECTOR_CODE + ' a:has-text("click")';
const INSPECTOR_CODE_ROWS = INSPECTOR_CODE + ' .jp-DoubleSharp-row';
const INLINE_BLOCK = '.jp-DoubleSharp-InlineBlock';

test('툴바 버튼 노출, Inspector 버튼 클릭 시 노출', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');
  await page.waitForSelector('text=| Idle');

  // 툴바 버튼 노출
  await expect(page.locator(SHOW_INSPECTOR)).toBeVisible();
  await expect(page.locator(RUN_ALL)).toBeVisible();

  // Inspector 버튼 클릭 시 노출
  await page.locator(SHOW_INSPECTOR).click();
  await expect(page.locator(INSPECTOR)).toBeVisible();
});

test('code inspector variables 수집', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');
  await page.waitForSelector('text=| Idle');

  // Inspector 열기
  await page.locator(SHOW_INSPECTOR).click();

  // code 입력 시 Cell Inspector에 update 메시지 표시
  await page.notebook.setCell(0, 'code', 'a = 1\nb = 2\nc = 3');
  expect(await page.waitForSelector(INSPECTOR_CODE_INVALID)).toBeTruthy();

  // code 정보 update 시 variables 노출
  await page.locator(INSPECTOR_CODE_UPDATE).click();
  const variables = page.locator(INSPECTOR_CODE_ROWS, {
    has: page.locator('text="Variables:"')
  });
  await expect(variables.locator(INLINE_BLOCK)).toHaveText(['a', 'b', 'c']);
});
/*
test('auto dependency 수집, 셀 실행 시 dependency 실행', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');
  await page.waitForSelector('text=| Idle');

  // Auto Dependency 수집
  await page.notebook.setCell(0, 'code', 'print("Hello, JupyterLab")');

  // 셀 실행 시 dependency 실행
  await page.notebook.runCell(0);
});

test('모든 셀 실행 시 cache 적용', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');
  await page.waitForSelector('text=| Idle');

  // Code Inspector 동작
  await page.notebook.setCell(0, 'code', 'print("Hello, JupyterLab")');

  // 모든 셀 실행 (with cache)
});
*/
