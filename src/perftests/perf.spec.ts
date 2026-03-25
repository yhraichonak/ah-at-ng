import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "../tests/testdata";
import supertestAHAPIHelper from "../api/SupertestAHAPIHelper";
import {writeFileSync} from "fs";
import request from "supertest";
const { performance } = require('perf_hooks');

describe('Performance suite', () => {
    let PERF_REPORT
    let testQuote=TestData.TEST_QUOTE_MAP["dump"]
    let testContract=TestData.TEST_CONTRACT_MAP["dump"]
    let testEntity=TestData.defaultOrgId;
    afterEach(async () => {await ahAPI.clearCommonSession();})
    beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
    beforeAll(async () => {
        PERF_REPORT=[`timeStamp,elapsed,label,responseCode,responseMessage,success,failureMessage,bytes,sentBytes,URL`]
    })
    afterAll(async () => {
        // console.info(`${"#".repeat(100)}\n${PERF_REPORT.join("\n")}\n${"#".repeat(100)}`);
        writeFileSync("jmeter.jtl",
            PERF_REPORT.join("\n"), {flag: "w"})
    })

    test.each([
        { url:`/quotes/${testQuote}`, description:`Get quote details` },
        { url:`/quotes/${TestData.quoteWithPreview}/pdf`, description:`Get quote PDF` },
        { url:`/quotes/${testQuote}/assets/export?format=csv`, description:`Export quote assets as CSV` },
        { url:`/quotes/${testQuote}/assets/export?format=xlsx`, description:`Export quote assets as Excel` },
        { url:`/quotes/`, description:`Get quotes list without params` },
        { url:`/quotes?limit=10`, description:`Get quotes list with limit=10` },
        { url:`/quotes?limit=100`, description:`Get quotes list with limit=100` },
        { url:`/quotes?limit=100&cursor=CH17361:28171`, description:`Get quotes list with cursor` },
        { url:`/quotes?limit=100&search=CH2`, description:`Get quotes list with search` },
        { url:`/quotes?limit=100&search=blahblah`, description:`Get quotes list with non-existing search` },
        { url:`/quotes?status[]=Ordered`, description:`Get quotes list with filter` },
        { url:`/quotes?status[]=Lost&status[]=Open`, description:`Get quotes list with multiple filters` },
        { url:`/quotes/${testQuote}/assets`, description:`Get quote assets list without params` },
        { url:`/quotes/${TestData.defaultQWCQuoteId}/contracts`, description:`Get quote contracts list without params` },
        { url:`/quotes/${testQuote}/assets?limit=10`, description:`Get quote assets list with limit=10` },
        { url:`/quotes/${testQuote}/assets?limit=100`, description:`Get quote assets list with limit=100` },
        { url:`/quotes/${testQuote}/assets?cursor=50`, description:`Get quote assets list with cursor` },
        { url:`/quotes/${testQuote}/assets?search=PC4-2400T`, description:`Get quote assets list with search` },
        { url:`/quotes/${testQuote}/assets?search=blahblah`, description:`Get quote assets list with non-existing search` },
        { url:`/quotes/${TestData.defaultQWCQuote}/assets?hasEndCustomerPrice=true`, description:`Get quote assets list with filter by End Customer price` },
         { url:`/contracts/${testContract}`, description:`Get contract details` },
        { url:`/contracts/${TestData.contractWithPreview}/pdf`, description:`Get contract PDF` },
        { url:`/contracts/${testContract}/assets/export?format=csv`, description:`Export contract assets as CSV` },
        { url:`/contracts/${testContract}/assets/export?format=xlsx`, description:`Export contract assets as Excel` },
        { url:`/contracts/`, description:`Get contracts list without params` },
        { url:`/contracts?limit=10`, description:`Get contracts list with limit=10` },
        { url:`/contracts?limit=100`, description:`Get contracts list with limit=100` },
        { url:`/contracts?limit=100&cursor=0057134697:9735`, description:`Get contracts list with cursor` },
        { url:`/contracts?search=1686`, description:`Get contracts list with search` },
        { url:`/contracts?search=blahblah`, description:`Get contracts list with non-existing search` },
        { url:`/contracts?status[]=Renewed`, description:`Get contracts list with filter` },
        { url:`/contracts?status[]=Renewed&status[]=Expired`, description:`Get contracts list with multiple filters` },
        { url:`/contracts/${testContract}/assets`, description:`Get contract assets list without params` },
        { url:`/contracts/${TestData.defaultQWCContractId}/quotes`, description:`Get contract quotes list without params` },
        { url:`/contracts/${testContract}/assets?limit=10`, description:`Get contract assets list with limit=10` },
        { url:`/contracts/${testContract}/assets?limit=100`, description:`Get contract assets list with limit=100` },
        { url:`/contracts/${testContract}/assets?cursor=50`, description:`Get contract assets list with cursor` },
        { url:`/contracts/${testContract}/assets?search=RWSUAJ93KHL7`, description:`Get contract assets list with search` },
        { url:`/contracts/${testContract}/assets?search=blahblah`, description:`Get contract assets list with non-existing search` },
        { url:`/contracts/${TestData.defaultContractWithCustomerPrices}/assets?hasEndCustomerPrice=true`, description:`Get contract assets list with filter filter by End Customer price` },
        { url:`/customers/${testEntity}`, description:`Get customer details` },
        { url:`/customers/`, description:`Get contracts list without params` },
        { url:`/customers?limit=10`, description:`Get contracts list with limit=10` },
        { url:`/customers?limit=100`, description:`Get contracts list with limit=100` },
        { url:`/customers?limit=20&cursor=Avesco:310462`, description:`Get customers list with cursor` },
        { url:`/customers?search=elektro`, description:`Get contracts list with search` },
        { url:`/customers?search=blahblha`, description:`Get contracts list with non-existing search` },
        { url:`/entities/${testEntity}`, description:`Get entity details` },
        { url:`/entities/${testEntity}/assets/export?format=csv`, description:`Export entity assets as CSV` },
        { url:`/entities/${testEntity}/assets/export?format=xlsx`, description:`Export entity assets as Excel` },
        { url:`/entities/`, description:`Get entities list without params` },
        { url:`/entities?limit=10`, description:`Get entities list with limit=10` },
        { url:`/entities?limit=100`, description:`Get entities list with limit=100` },
        { url:`/entities?limit=100&search=1-2-3`, description:`Get quotes list with search` },
        { url:`/entities?limit=100&search=blahblah`, description:`Get quotes list with non-existing search` },
        { url:`/entities/${testEntity}/assets`, description:`Get entity assets list without params` },
        { url:`/entities/${testEntity}/assets?limit=10`, description:`Get entity assets list with limit=10` },
        { url:`/entities/${testEntity}/assets?limit=100`, description:`Get entity assets list with limit=100` },
        { url:`/entities/${testEntity}/assets?cursor=50`, description:`Get entity assets list with cursor` },
        { url:`/entities/${testEntity}/assets?search=PC4-2400T`, description:`Get entity assets list with search` },
        { url:`/entities/${testEntity}/assets?search=blahblah`, description:`Get entity assets list with non-existing search` },
        { url:`/entities/${testEntity}/assets?hasEndCustomerPrice=true`, description:`Get quote assets list with filter by End Customer price` },
        { url:`/entities/${testEntity}/quotes`, description:`Get entity quotes list without params` },
        { url:`/entities/${testEntity}/quotes?limit=10`, description:`Get entity quotes list with limit=10` },
        { url:`/entities/${testEntity}/quotes?limit=100`, description:`Get entity quotes list with limit=100` },
        { url:`/entities/${testEntity}/quotes?cursor=CH13781:14731`, description:`Get entity quotes list with cursor` },
        { url:`/entities/${testEntity}/quotes?search=CH13`, description:`Get entity quotes list with search` },
        { url:`/entities/${testEntity}/quotes?search=blahblah`, description:`Get entity quotes list with non-existing search` },
        { url:`/entities/${testEntity}/quotes?status[]=Open&status[]=Ordered`, description:`Get entity quotes list with filter by status` },
        { url:`/entities/${testEntity}/quotes?type[]=RENEWAL`, description:`Get entity quotes list with filter by type` },
        { url:`/entities/${testEntity}/contracts`, description:`Get entity contracts list without params` },
        { url:`/entities/${testEntity}/contracts?limit=10`, description:`Get entity contracts list with limit=10` },
        { url:`/entities/${testEntity}/contracts?limit=100`, description:`Get entity contracts list with limit=100` },
        { url:`/entities/${testEntity}/contracts?cursor=0057134697:9735`, description:`Get entity contracts list with cursor` },
        { url:`/entities/${testEntity}/contracts?search=1686`, description:`Get entity contracts list with search` },
        { url:`/entities/${testEntity}/contracts?search=blahblah`, description:`Get entity contracts list with non-existing search` },
        { url:`/entities/${testEntity}/contracts?status[]=Renewed&status[]=Expired`, description:`Get entity contracts list with filter by status` },
        { url:`/entities/${testEntity}/contracts?endDateAfter=2025-05-14T20%3A00%3A00.000Z&endDateBefore=2025-12-30T20%3A00%3A00.000Z`, description:`Get entity contracts list with filter by dates` },
        { url:`/search?query=108`, description:`Search query` },
        { url:`/search?query=108&limit=10`, description:`Search query with limit 5` },
        { url:`/search?query=108&limit=100`, description:`Search query with limit 10` },
    ])
    ("Performance tests - $url", async ({url,description}) => {
        const startTime = performance.now();
        const startTimMillisec=Date.now();
        let response=null;
        let duration, error;
        try {
            response = await request( supertestAHAPIHelper.BASE_URL).get(url).timeout({
                response: 5000,  // Wait 5 seconds for the server to start sending,
                deadline: 10000, // but allow 10 seconds for the entire request to complete (including response body)
            }).set({
                "Authorization": "Bearer " + ahAPI.COMMON_TOKEN,
                "x-organization-id": TestData.defaultOrgId
            });
            expect(response.status).toBe(200);
        } catch (e) {
            error=e
        }finally {
            duration = performance.now() - startTime;
        }
        let per_report_line="";
        if (response==null) {
            per_report_line = `${startTimMillisec},${Math.round(duration)},${description},${response?.statusCode},NOK,FALSE,${error.toString()},0,0,${supertestAHAPIHelper.BASE_URL}${url}`;
            PERF_REPORT.push(per_report_line)
            throw error
        }else if (response.statusCode==200){
            per_report_line = `${startTimMillisec},${Math.round(duration)},${description},200,OK,TRUE,,0,0,${supertestAHAPIHelper.BASE_URL}${url}`;
            PERF_REPORT.push(per_report_line)
        }else{
            per_report_line = `${startTimMillisec},${Math.round(duration)},${description},${response.statusCode},NOK,FALSE,NON-200 status code returned,0,0,${supertestAHAPIHelper.BASE_URL}${url}`;
            PERF_REPORT.push(per_report_line)
            throw error
        }
    },12_000)

})

