import ahAPI from "../../api/SupertestAHAPIHelper";
import TestData from "../testdata";
import supertestAHAPIHelper from "../../api/SupertestAHAPIHelper";
describe('[jest] Schemas', () =>
{
    test(`Get OpenAPI schema`, async () => {
         let TOKEN= await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
         let resp= await supertestAHAPIHelper.getUrl(TOKEN,"/schema")
         expect(resp.statusCode).toBe(200);
         expect(resp.body['openapi']).toMatch(/.*/)
         expect(JSON.stringify(Object.keys(resp.body.paths).sort())).toBe(JSON.stringify(TestData.API_ENDPOINTS.sort()));
    })

    test(`Get OpenAPI schema - endpoint`, async () => {
        let TOKEN= await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        for (let i=1;i<TestData.API_ENDPOINTS.length;i++){
            let url=TestData.API_ENDPOINTS[i]
            //console.log(`Hitting [${url}] ${i}th endpoint out of ${TestData.API_ENDPOINTS.length}`)
            let resp= await supertestAHAPIHelper.getUrl(TOKEN,`/schema${url}`)
            expect(resp.statusCode).toBe(200);
            try {
                expect(resp.body.paths[url]).not.toBe(undefined)
            }catch (e) {
                throw new Error(`Error on attempt hitting [/schema${url}]`)
            }
        }
    },60000)

    test(`Get JSON schema`, async () => {
        let TOKEN= await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        let resp= await supertestAHAPIHelper.getUrl(TOKEN,"/schema/json")
        expect(resp.statusCode).toBe(200);
        expect(JSON.stringify(Object.keys(resp.body).sort())).toBe(JSON.stringify(TestData.API_ENDPOINTS.sort()));
    })

    test(`Get JSON schema - endpoint`, async () => {
        let TOKEN= await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        for (let i=1;i<TestData.API_ENDPOINTS.length;i++){
            let url=TestData.API_ENDPOINTS[i]
            let resp= await supertestAHAPIHelper.getUrl(TOKEN,`/schema/json${url}`)
            expect(resp.statusCode).toBe(200);
            try {
                expect(resp.body['delete'] !== undefined ||resp.body['put'] !== undefined || resp.body['patch'] !== undefined || resp.body['get'] !== undefined || resp.body['post'] !== undefined).toBe(true)
            }catch (e) {
                throw new Error(`Error on attempt hitting [/schema/json${url}]`)
            }
        }
    },60000)

})