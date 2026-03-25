import { expect } from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import * as allure from "allure-js-commons";
test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
});

test('User is able to navigate to login page', async ({ loginPage }) => {
    await expect(loginPage.userInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
});

test('User is able to login with valid credentials', async ({ loginPage, commonPage }) => {
    await loginPage.doLoginAs(TestData.defaultUserDetails.email,TestData.defaultUserDetails.pass)
    await commonPage.getUserMenu()
});

test('User is not able to to login with invalid credentials', async ({ loginPageFF, commonPage }) => {
        await loginPageFF.doLoginAs("blah@blah.blah", "blah")
        await commonPage.waitForNotification("Bitte überprüfen Sie Ihre Zugangsdaten und versuchen Sie es erneut.");
  });