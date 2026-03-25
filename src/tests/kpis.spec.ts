import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
import * as allure from "allure-js-commons";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));

afterEach(async () => {
    await ahAPI.clearCommonSession();})
beforeEach(async () => {
    await ahAPI.getCommonSessionForSA();
    await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})

describe('[jest] KPI', () => {

    test("KPI - Schema", async () => {
        const response = await ahAPI.getKPIs( ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/kpis'})
    })

    test("KPI - Unauthorized", async () => {
        const response = await ahAPI.getMetrics("blah",TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("KPI - Unprivileged", async () => {
        let TOKEN=await ahAPI.getUserToken(TestData.restrictedUserDetails)
        const response = await ahAPI.getMetrics(TOKEN,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("KPI - Unknow OrgId", async () => {
        const response = await ahAPI.getMetrics(ahAPI.COMMON_TOKEN,TestData.nonExisingId);
        expect([401,403]).toContain(response.statusCode);
    })

    test("KPI - Info - Contracts", async () => {
        const response = await ahAPI.getKPIs( ahAPI.COMMON_SA_TOKEN, TestData.altOrgId);
        let allContracts =await ahAPI.getAllContracts(ahAPI.COMMON_SA_TOKEN,TestData.altOrgId);
        expect(allContracts.length).toBe(response.body.contracts.total);
        expect(allContracts.filter((t)=>t.uiStatus=="Expired").length).toBe(response.body.contracts.status.Expired);
        expect(allContracts.filter((t)=>t.uiStatus=="Renewed").length).toBe(response.body.contracts.status.Renewed);
        expect(allContracts.filter((t)=>t.uiStatus=="Terminated").length).toBe(response.body.contracts.status.Terminated);
        expect(allContracts.filter((t)=>t.uiStatus=="Active").length).toBe(response.body.contracts.status.Active);
    })

    test("KPI - Info - Quotes", async () => {
        const response = await ahAPI.getKPIs( ahAPI.COMMON_SA_TOKEN, TestData.altOrgId);
        let allQuotes =await ahAPI.getAllQuotes(ahAPI.COMMON_SA_TOKEN,TestData.altOrgId);
        expect(allQuotes.length).toBe(response.body.quotes.total);
        expect(allQuotes.filter((t)=>t.uiStatus=="Open").length).toBe(response.body.quotes.status.Open);
        expect(allQuotes.filter((t)=>t.uiStatus=="Ordered").length).toBe(response.body.quotes.status.Ordered);
        expect(allQuotes.filter((t)=>t.uiStatus=="Change Requested").length).toBe(response.body.quotes.status["Change Requested"]);
        expect(allQuotes.filter((t)=>t.uiStatus=="Lost").length).toBe(response.body.quotes.status.Lost);
    })

    test("KPI - Info - Customers", async () => {
        const response = await ahAPI.getKPIs( ahAPI.COMMON_SA_TOKEN, TestData.altOrgId);
        let allCustomers =await ahAPI.getAllCustomers(ahAPI.COMMON_SA_TOKEN,TestData.altOrgId);
        expect(allCustomers.length).toBe(response.body.customers.total);
    })
})
