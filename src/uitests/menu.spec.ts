import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {init_content_persistent_browser} from "../uitests/utils";
import {sleep} from "../api/utils";

test.describe("No re-login",  () => {
    test.beforeAll(async ({}, testInfo) => {
        await init_content_persistent_browser(testInfo)
        await TestData.initUsersAndRoles()
    })
    test.beforeEach(async ({dashboardPageCP}) => {
        await dashboardPageCP.navigate()
        await sleep(1);
    });
    test.afterEach(async ({cpPage,commonPageCP}) => {
        await  commonPageCP.setLanguage("English");
        await cpPage.context().close()
    });

    [{language: "English", code: 'EN'},
        {language: "Deutsch", code: 'DE'},
        {language: "Français", code: 'FR'},
        {language: "Italiano", code: 'IT'}
    ].forEach(({language, code}) => {
        test(`User is able to switch language during session - ${code}`, async ({commonPageCP}) => {
                await commonPageCP.setLanguage(language);
                let elements = await commonPageCP.getSidePanelTabs()
                let res = await elements.allTextContents()
                expect(JSON.stringify(res)).toBe(JSON.stringify(TestData.SIDE_MENU_NAVIGATIONS[code]))
        });
    });

    test(`User is able to see organization icon in header and menu`, async ({commonPageCP}) => {
        let mainIcon = commonPageCP.getCurrentOrganizationIcon()
        await expect(mainIcon).toHaveScreenshot('default_org_icon_big.png')
        let dropdownIcon = await commonPageCP.getOrgIconInDropdown(TestData.defaultOrganization)
        await expect(dropdownIcon).toHaveScreenshot('default_org_icon_small.png')
        dropdownIcon = await commonPageCP.getOrgIconInDropdown(TestData.altOrganization)
        await expect(dropdownIcon).toHaveScreenshot('alt_org_icon_small.png')
        await commonPageCP.setOrganization(TestData.altOrganization)
        await  sleep(1)
        mainIcon=commonPageCP.getCurrentOrganizationIcon()
        await expect(mainIcon).toHaveScreenshot('alt_org_icon_big.png')
    });


});
test.describe("Using re-login",  () => {
    test.beforeEach(async ({loginPage}) => {
        await loginPage.navigate();
    });
    test.afterEach(async ({commonPage}) => {
        await  commonPage.setLanguage("English");
    });

    [{language: "English", code: 'EN'},
        { language: "Deutsch", code: 'DE' },
        { language: "Français", code: 'FR' },
        { language: "Italiano", code: 'IT' }
    ].forEach(({language, code}) => {
        test(`User is able to pick the language from login page - ${code}`, async ({loginPage, commonPage}) => {
            test.setTimeout(60_000);
            await loginPage.navigate();
            await loginPage.setLanguage(language);
            await loginPage.doLoginAs(TestData.defaultUserDetails.email, TestData.defaultUserDetails.pass)
            await sleep(2)
            await commonPage.getUserMenu()
            let elements = await commonPage.getSidePanelTabs()
            let res = await elements.allTextContents()
            expect(JSON.stringify(res)).toBe(JSON.stringify(TestData.SIDE_MENU_NAVIGATIONS[code]))
        });
    });

});
