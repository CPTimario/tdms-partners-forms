import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../../');
const appDir = path.join(projectRoot, 'app');
const publicDir = path.join(projectRoot, 'public');

function fileExists(filePath: string) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

test.describe('Icon asset guard', () => {
  test('no duplicate Apple icon asset in app/', () => {
    const appAppleIcon = path.join(appDir, 'apple-icon.svg');
    expect(fileExists(appAppleIcon)).toBeFalsy();
  });

  test('canonical Apple icon asset exists in public/', () => {
    const publicAppleIcon = path.join(publicDir, 'apple-icon.svg');
    expect(fileExists(publicAppleIcon)).toBeTruthy();
  });

  test('app/layout.tsx metadata points to /apple-icon.svg and /icon.svg', () => {
    const layoutPath = path.join(appDir, 'layout.tsx');
    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    expect(layoutSource).toMatch(
      /icons:\s*{[\s\S]*?icon:\s*['\"]\/icon\.svg['\"][\s\S]*?apple:\s*['\"]\/apple-icon\.svg['\"][\s\S]*?}/,
    );
  });
});
