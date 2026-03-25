import {expect} from '@playwright/test';
import { test } from '../uifixtures/resource.fixture';
import TestData from "../tests/testdata";
import {sleep} from "../api/utils";
import {init_content_persistent_browser} from "./utils";

test.beforeAll(async ({},testInfo) => {
    await init_content_persistent_browser(testInfo)
})

test.beforeEach(async ({ dashboardPageCP,commonPageCP }) => {
    await sleep(1)
    await dashboardPageCP.navigate()
    await commonPageCP.setOrganization(TestData.altOrganization);
});

test.afterEach(async ({cpPage}) => {
    await cpPage.context().close()
});

[{ query: TestData.defaultQuote.quoteNumber, objectType: 'Quotes' },
    { query: TestData.defaultQuoteWithDetailsContract.contractNumber, objectType: 'Contracts' },
    { query: TestData.defaultQuoteWithDetailsAsset.serialNumber, objectType: 'Assets' },
].forEach(({ query,  objectType}) => {
    test(`User is able to search for ${objectType} in global search`, async ({ commonPageCP }) => {
        let searchPanel=await  commonPageCP.globalSearch(query)
        let results=await commonPageCP.getGlobalSearchResults(searchPanel, objectType)
        expect(results.toString()).toContain(query)
    });
});

test(`User is able to search for query with results in multiple sections of global search`, async ({ commonPageCP }) => {
    let query= TestData.defaultQuote.groupId
    let searchPanel=await  commonPageCP.globalSearch(query)
    expect((await commonPageCP.getGlobalSearchResults(searchPanel, "Quotes")).toString()).toContain(query)
    expect((await commonPageCP.getGlobalSearchResults(searchPanel, "Contracts")).toString()).toContain(query)
});

test(`User is able to search for query without matching results`, async ({ commonPageCP }) => {
    let query="blahblahblah";
    let searchPanel=await  commonPageCP.globalSearch(query)
    expect(await commonPageCP.getGlobalSearchResults(searchPanel, "Quotes")).toHaveLength(0)
    expect(await commonPageCP.getGlobalSearchResults(searchPanel, "Contracts")).toHaveLength(0)
    expect(await commonPageCP.getGlobalSearchResults(searchPanel, "Assets")).toHaveLength(0)
});

[{ query: TestData.defaultQuote.quoteNumber,objectType: 'Quote' },
    { query: TestData.defaultQuoteWithDetailsContract.contractNumber, objectType: 'Contract' },
    { query: TestData.defaultQuoteWithDetailsAsset.serialNumber,title: TestData.defaultQuoteWithDetailsAsset.name, objectType: 'Asset' },
].forEach(({ query, title, objectType}) => {
    test(`User is able to open ${objectType} details page from search results page`, async ({ commonPageCP }) => {
        let searchPanel=await  commonPageCP.globalSearch(query)
        await commonPageCP.clickGlobalSearchResultItem(searchPanel, `${objectType}s`, query)
        if (title===undefined ||title===null ) title=query;
        await sleep(1)
        await commonPageCP.textIsLoadedOnPage(`${(objectType=="Asset")?title:(objectType+" "+title)}`);
    });
});