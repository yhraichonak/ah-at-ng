import {Page, test as baseTest} from '@playwright/test';
import { QuotesListPage } from '../uipom/quotes_list_page';
import {LoginPage} from "../uipom/login_page";
import {GenericPage} from "../uipom/generic_page";
import {QuoteDetailsPage} from "../uipom/quote_details_page";
import {CustomersListPage} from "../uipom/customers_list_page";
import {CustomerDetailsPage} from "../uipom/customer_details_page";
import {ContractDetailsPage} from "../uipom/contract_details_page";
import { chromium, firefox } from '@playwright/test';
import path from 'path';
import {ContractsListPage} from "../uipom/contracts_list_page";
import {DashboardPage} from "../uipom/dashboard_page";
import {YourOrganizationPage} from "../uipom/your_organization_page";
import {AssetDetailsPage} from "../uipom/asset_details_page";
import {OrganizationsPage} from "../uipom/organizatios_page";
import {ServicePackQuotePage} from "../uipom/sp_quote_page";
import {ServicePackDetailsPage} from "../uipom/sp_details_page";

export const test = baseTest.extend<{
    cpPage: Page;
                                      dashboardPage,dashboardPageCP: DashboardPage,
                                      quotesPage,quotesPageCP: QuotesListPage,
                                      assetDetailsPage, assetDetailsPageCP: AssetDetailsPage,
                                      customersPage,customersPageCP: CustomersListPage,
                                      contracsPage,contracsPageCP: ContractsListPage,
                                      loginPage,loginPageFF,loginPageCP: LoginPage,
                                      organizationsPage,organizationsPageCP: OrganizationsPage,
                                      yourOrganizationPage,yourOrganizationPageCP: YourOrganizationPage,
                                      quoteDetailsPage,quoteDetailsPageCP: QuoteDetailsPage,
                                      spDetailsPage,spDetailsPageCP: ServicePackDetailsPage,
                                      spQuotePage,spQuotePageCP: ServicePackQuotePage,
                                      customerDetailsPage,customerDetailsPageCP: CustomerDetailsPage,
                                      commonPage,commonPageFF,commonPageCP: GenericPage,
                                      contractDetailsPage,contractDetailsPageCP: ContractDetailsPage }>({
    cpPage: async ({}, use,testInfo) => {
        const userDataDir = path.join(__dirname, '../.persistent-context');
        const cpPage = (await chromium.launchPersistentContext(userDataDir, {headless: testInfo.project.use?.headless})).pages()[0];
        await use(cpPage);
    },
    dashboardPage: async ({ page }, use) => {
        await use(new DashboardPage(page));
    },
    dashboardPageCP: async ({ cpPage }, use) => {
        await use(new DashboardPage(cpPage));
    },
    assetDetailsPage: async ({ page }, use) => {
        await use(new AssetDetailsPage(page));
    },
    assetDetailsPageCP: async ({ cpPage }, use) => {
        await use(new AssetDetailsPage(cpPage));
    },
    quotesPage: async ({ page }, use) => {
        await use(new QuotesListPage(page));
    },
    quotesPageCP: async ({ cpPage }, use) => {
        await use(new QuotesListPage(cpPage));
    },
    contracsPage: async ({ page }, use) => {
        await use(new ContractsListPage(page));
    },
    contracsPageCP: async ({ cpPage }, use) => {
        await use(new ContractsListPage(cpPage));
    },
    customersPage: async ({ page }, use) => {
        await use(new CustomersListPage(page));
    },
    customersPageCP: async ({ cpPage }, use) => {
        await use(new CustomersListPage(cpPage));
    },
    spQuotePage: async ({ page }, use) => {
        await use(new ServicePackQuotePage(page));
    },
    spQuotePageCP: async ({ cpPage }, use) => {
        await use(new ServicePackQuotePage(cpPage));
    },

    spDetailsPage: async ({ page }, use) => {
        await use(new ServicePackDetailsPage(page));
    },
    spDetailsPageCP: async ({ cpPage }, use) => {
        await use(new ServicePackDetailsPage(cpPage));
    },

   quoteDetailsPage: async ({ page }, use) => {
        await use(new QuoteDetailsPage(page));
    },
    quoteDetailsPageCP: async ({ cpPage }, use) => {
        await use(new QuoteDetailsPage(cpPage));
    },
    customerDetailsPage: async ({ page }, use) => {
        await use(new CustomerDetailsPage(page));
    },
    customerDetailsPageCP: async ({ cpPage }, use) => {
        await use(new CustomerDetailsPage(cpPage));
    },
    contractDetailsPage: async ({ page }, use) => {
        await use(new ContractDetailsPage(page));
    },
    contractDetailsPageCP: async ({ cpPage }, use) => {
        await use(new ContractDetailsPage(cpPage));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    loginPageFF: async ({page}, use,testInfo) => {
        const cpPage = firefox.launch({headless: testInfo.project.use?.headless});
        await use(new LoginPage(page));
    },
    loginPageCP: async ({ cpPage }, use) => {
        await use(new LoginPage(cpPage));
    },

    yourOrganizationPage: async ({ page }, use) => {
        await use(new YourOrganizationPage(page));
    },

    yourOrganizationPageCP: async ({ cpPage }, use) => {
        await use(new YourOrganizationPage(cpPage));
    },

    organizationsPage: async ({ page }, use) => {
        await use(new OrganizationsPage(page));
    },

    organizationsPageCP: async ({ cpPage }, use) => {
        await use(new OrganizationsPage(cpPage));
    },

    commonPage: async ({ page }, use) => {
       await use(new GenericPage(page));
    },
    // commonPageFF: async ({page}, use,testInfo) => {
    //     await use(new GenericPage(page));
    // },
    commonPageCP: async ({ cpPage }, use) => {
        await use(new GenericPage(cpPage));
    }
});