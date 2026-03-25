import ahAPI from "../api/SupertestAHAPIHelper";
import TestData from "./testdata";
const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
let VIEWER_TOKEN='';
afterEach(async () => {await ahAPI.clearCommonSession();})
beforeEach(async () => {await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);})
beforeAll(async () => {
    VIEWER_TOKEN= await ahAPI.getUserToken(TestData.defaultViewerUser);
})

let testProductSku=TestData.defaultSPQuoteAsset.sku
describe('[jest] Products', () => {

    test("Products", async () => {
        const response = await ahAPI.getProducts( ahAPI.COMMON_TOKEN, TestData.defaultVendorId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/products'})
    })

    test("Product info", async () => {
        let product=TestData.defaultProductDetails
        const response = await ahAPI.getProducts( ahAPI.COMMON_TOKEN, TestData.defaultVendorId,TestData.defaultOrgId,true);
        let target_product=response.body.find(n=>n["productId"].toString()===product["productId"]);
        expect(target_product.vendorId).toEqual(product["vendorId"]);
        expect(target_product.sku).toEqual(product["sku"]);
        expect(target_product.productId).toEqual(product["productId"]);
        expect(target_product.description).toEqual(product["description"]);
    })

    test("Products - Unauthorized", async () => {
        const response = await ahAPI.getProducts("blah",TestData.defaultVendorId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Products - non-existing Vendor", async () => {
        const response = await ahAPI.getProducts(ahAPI.COMMON_TOKEN,TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.body).toStrictEqual([]);
    })

    test("Products - invalid orgId", async () => {
        const response = await ahAPI.getProducts(ahAPI.COMMON_TOKEN,TestData.defaultVendorId,"blah");
        expect(response.statusCode).toBe(400);
    })

    test("Products - Lack permission", async () => {
        const response = await ahAPI.getProducts((await ahAPI.getUserToken(TestData.defaultViewerUser)),
                                                    TestData.nonExisingId,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Linked Products", async () => {
        const response = await ahAPI.getLinkedProducts( ahAPI.COMMON_TOKEN, TestData.defaultVendorId,testProductSku,TestData.defaultOrgId);
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSchema( {$ref: 'schema#/definitions/products'})
    })

    test("Linked Product - info", async () => {
        let sgDetails=TestData.sgAltDetails
        const response = await ahAPI.getLinkedProducts( ahAPI.COMMON_TOKEN, TestData.defaultVendorId,testProductSku,TestData.defaultOrgId);
        let target_product=response.body.find(n=>n["sku"].toString()===sgDetails.sgSKU);
        expect(target_product.sku).toEqual(sgDetails.sgSKU);
        expect(target_product.description).toEqual(sgDetails.sgName);
        expect(target_product.price).toEqual(sgDetails.sgPrice.toString());
        expect(target_product.currency).toEqual(sgDetails.sgCurrency);
        expect(target_product.yearsCovered).toEqual(sgDetails.sgYears);
    })

    test("Linked Products - Unauthorized", async () => {
        const response = await ahAPI.getLinkedProducts("blah",TestData.defaultVendorId,testProductSku,TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Linked Products - non-existing Vendor", async () => {
        const response = await ahAPI.getLinkedProducts(ahAPI.COMMON_TOKEN,TestData.nonExisingId,testProductSku,TestData.defaultOrgId);
        expect(response.body).toStrictEqual([]);
    })

    test("Linked Products - non-existing product sku", async () => {
        const response = await ahAPI.getLinkedProducts(ahAPI.COMMON_TOKEN,TestData.defaultVendorId,"blah",TestData.defaultOrgId);
        expect(response.body).toStrictEqual([]);
    })

    test("Linked Products - invalid orgID", async () => {
        const response = await ahAPI.getLinkedProducts(ahAPI.COMMON_TOKEN,TestData.defaultVendorId,testProductSku,"blah");
        expect(response.statusCode).toBe(400);
    })

    test("Products - Lack permission", async () => {
        const response = await ahAPI.getLinkedProducts(VIEWER_TOKEN,TestData.defaultVendorId,testProductSku, TestData.defaultOrgId);
        expect(response.statusCode).toBe(401);
    })

    test("Linked Products - Custom Limit", async () => {
        const response = await ahAPI.getLinkedProducts(ahAPI.COMMON_TOKEN,TestData.defaultVendorId,testProductSku,TestData.defaultOrgId, 5);
        expect(response.body.length).toBe(5);
    })

    test.each([
        {url:`?productSku=${testProductSku}&limit=10`,message:"vendor: Required", description:"Missing vendorId"},
        {url:`?vendorId=${TestData.defaultVendorId}&limit=10`, message:"productSku: Required",description:"Missing productSku"},
        {url:`?vendorId=${TestData.defaultVendorId}&productSku=${testProductSku}&limit=blah`,message:"limit: Expected number, received string", description:"Invalid limit"}
    ])("Linked Products - Negative - $description", async ({url, message, description}) => {
        const response = await ahAPI.getLinkedProductsWithUrlSuffix(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,url);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain( message)
    })
})