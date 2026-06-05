import { TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';

export async function setOwner(testInfo: TestInfo, owner: string): Promise<void> {
  await allure.owner(owner);
  testInfo.annotations.push({ type: 'owner', description: owner });
}

export async function setSeverity(testInfo: TestInfo, severity: string): Promise<void> {
  await allure.severity(severity);
  testInfo.annotations.push({ type: 'severity', description: severity });
}
