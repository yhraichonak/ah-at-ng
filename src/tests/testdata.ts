import dbHelper from "../api/CommonDBHelper";
import supertestAHAPIHelper from "../api/SupertestAHAPIHelper";
import {ENV} from "../../environment";

export default class TestData {
    public static TEST_DATA_MODE = process.env.TEST_DATA_MODE !== undefined ? process.env.TEST_DATA_MODE : "dump";
    public static IS_DB_DUMP = TestData.TEST_DATA_MODE === "dump";
    public static QUOTE_WEBHOOK = require("./webhooks/quote_payload.json") ;
    public static  CONTRACT_WEBHOOK = require("./webhooks/contract_payload.json");

    public static defaultOrgId = ENV.DEFAULT_ORG_ID
    public static orgReadPermissionId = ENV.ORG_READ_PERM_ID
    public static quoteReadPermissionId = ENV.QUOTE_READ_PERM_ID
    public static superOrgId = ENV.SUPER_ORG_ID;
     public static defaultPass="12345678"
    public static defaultVendorId = "255861";
    public static defaultQuoteRequestId = "df14e68e-ccda-44d2-9c2c-039ffd84470d";

    public static foreignContract = "63204";
    public static foreignQuote = "90611";
    public static foreignAsset = "CZ3805HS4S";
    public static foreignServicePack = "1b6a6e84-2272-469e-b1b8-c5dc9bb963c0";
    public static foreignOrgId = "cc10f37f-9efe-4120-ab9b-8a34989e4113";
    public static superAdminRoleId = "a9233c9c-4634-493a-9f12-bef4d1cf3a30";
    public static ownerRoleId = "76a26533-a4db-4b82-a749-86a495244890";
    public static defaultUserId = "6244285d-cd0c-41cf-bfaa-63a6674b3fd8";
    public static defaultContractCreateDistributorId = "259456";
    public static saUserDetails= (process.env.ENVIRONMENT.toLowerCase()=="stg" )?
            { id:"",email:"qa_admin@tesedi.com", pass: TestData.defaultPass, orgId: TestData.superOrgId}:
             { id:"",email:"admin@tesedi.com", pass: "tesedi", orgId: TestData.superOrgId};

    public static defaultPermissionRole="AT Perm Role"
    public static defaultPermissionRoleAllOn="AT All ON Role"
    public static defaultPermissionRoleAllOff="AT All OFF Role"
    public static permissions = [
        // "platform:manage",
        "quote:create", "quote:read", "quote:update", "quote:approve", "quote:reject", "quote:manage",
        "quote_item:create", "quote_item:read", "quote_item:export", "quote_item:manage",
        "contract:create", "contract:read", "contract:manage",
        "contract_item:create", "contract_item:read", "contract_item:export", "contract_item:manage",
        "entity:create", "entity:read", "entity:manage",
        "organization:read", "organization:update", "organization:create", "organization:manage",
        "user:create", "user:read", "user:update", "user:manage",
        "contact:read", "contact:create", "contact:update", "contact:manage",
        "role:read", "role:create", "role:update", "role:manage",
        "asset:read", "asset:create", "asset:update", "asset:manage",
        "user_organization:read",
        "invited_user:update", "invited_user:manage",
        "service_pack:manage", "service_pack:read", "service_pack:create"
    ]
    public static testUserDetails={id:"",email:"at_test@test.com", fname:"fname", lname:"lname", pass : TestData.defaultPass, orgId: TestData.defaultOrgId}
    public static defaultUserDetails={id:"",isActive:true,email:"at_admin@tesedi.com", fname:"QA", lname:"Admin", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static restrictedUserDetails={id:"",email:"at_restricted@tesedi.com", fname:"Restricted", lname:"User", pass:  TestData.defaultPass,orgId: TestData.superOrgId}
    public static restrictedAltUserDetails={id:"",email:"at_restricted_alt@tesedi.com", fname:"AltRestricted", lname:"User", pass:  TestData.defaultPass,orgId: TestData.superOrgId}
    public static defaultViewerDetails={id:"",email:"at_viewer@tesedi.com", fname:"View", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultAdminDetails={id:"",email:"at_admin@tesedi.com", fname:"QA", lname:"Admin", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultApproverDetails={id:"", email:"at_approver@tesedi.com", fname:"Approve", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultRequesterDetails={id:"", email:"at_requester@tesedi.com", fname:"Request", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultOperatorDetails={id:"", email:"at_operator@tesedi.com", fname:"Operator", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultEditUserDetails={id:"", email:"at_edit@tesedi.com", fname:"Edit", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultChangeUserEmail={id:"", email:"at_email_orig@tesedi.com", fname:"Edit", lname:"Email", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static altChangeUserEmail={id:"", email:"at_email_edit@tesedi.com", fname:"Edit", lname:"Email", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultRegisterAltUserDetails={id:"", email:"at_register1@tesedi.com", fname:"fRegister", lname:"lRegister", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultRegisterUserDetails={id:"", email:"at_register@tesedi.com", fname:"fRegister", lname:"lRegister", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultE2EUserDetails={id:"", email:"at_e2e@tesedi.com", fname:"E2E", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultPermissionUserDetails={id:"", email:"at_perm@tesedi.com", fname:"Permission", lname:"User", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static allOnPermissionUserDetails={id:"", email:"at_allon@tesedi.com", fname:"Permission", lname:"Allon", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static allOffPermissionUserDetails={id:"", email:"at_alloff@tesedi.com", fname:"Permission", lname:"Alloff", pass:  TestData.defaultPass,orgId: TestData.defaultOrgId}
    public static defaultRegisterSADetails={id:"", email:"at_sa_register@tesedi.com", fname:"fRegister", lname:"lRegister", pass:  TestData.defaultPass,orgId: TestData.superOrgId}

    public static defaultDistributorDetails={id:"9900007001",name:"Distributor 1", type:"Distributor"}
    public static altDistributorDetails={id:"9900311151",name:"Customer 151", type:"EndUser"}
    public static defaultEndUserDetails={id:"9900307602",name:"Customer 51", type:"EndUser", city :"Zürich", zip:"9668", address:"W 14th Street 387", country:"CH"}
    public static inactiveEndUserDetails={name:"AT CUSTOMER INACTIVE"}
    public static altEndUserDetails={id:"308247",name:"BitHawk AG", type:"EndUser"}
    public static defaultCustomerDetails=this.defaultEndUserDetails
    public static searchCustomerName="Groupe Textile France"
    public static defaultDistributorVendorDetails= 	{ id: "259458", name: "HPE", type: "Vendor"}
    public static altVendorDetails= 	{ id: "7001", name: "Aruba", type: "Vendor"}
    public static altCustomerDetails=this.altDistributorDetails
    public static defaultDistributorContact={"id": "9900174197", "entityId": "9900307602", "status": "active", "contactId": "9900174197",
                                                "surname": "Batz", "givenName": "Wilbur", "emailAddress": "dummy+wilbur.batz@tesedi.com",
                                                "businessPhone": "+41 11 222 4778", "active": true
                                            }
    public static defaultCustomerContact=this.defaultDistributorContact
    public static defaultSADistributorDetails={id:"307943",name:"4B AG", type:"EndUser"}
    public static openQuote={quoteNumber:"CH21580", id:"12807"}
    public static defaultQuote={quoteNumber:"CH13415", status:"Change requested", expirationDate:"2/11/2022",
                                groupId: "87-SMD501 1219",resellerPrice: "196.20 CHF", id:"12807"}
    public static altQuote2={quoteNumber:"FR23157", id:"82357"}
    public static defaultQuoteWithDetails={quoteNumber:"CH13415", status:"Ordered", expirationDate:"2/11/2022",
        groupId: "87-SMD505 178",resellerPrice: "196.20 CHF"}
    public static defaultQuoteWithDetailsAsset={name:"HPE 64GB 4Rx4 PC4-2400T-L Kit", serialNumber:"RFANUA7TH3608M", serviceGroup:"HU4A1AC", }
    public static defaultQuoteWithoutRequests={id: "9900038717", quoteNo:"DUM959119876"}
    public static defaultProductDetails={vendorId: TestData.defaultVendorId, sku: "HU4B5AC", productId:"2124234", description:"HPE Tech Care Basic Exch SVC"}
    public static assetMultiSL=
        {   "description":"HPE ML110 G11 4510 64G MR408i-o 8SFF Svr",
            "productSku": "P71659-425", "serialNumber": "CZ2D3N03G9",
            "serviceLevels":[
                {description:"HPE 5 Year Tech Care Essential ML110 Svrs Smart Choice Service",sku:"H79Y7E",endDate:"02/23/2031"},
                {description:"Wty: HPE HW Maintenance Onsite Support",sku:"HA151AW",endDate:"02/23/2029"}
            ]}
    public static spAssetMultiSL=
        {   "description":"HPE 5YTCEss ML110 Svrs Smart Choice SVC",
            "productSku": "P71659-425", "serialNumber": "CZ2D3N03G9"}
    public static spMultiSL=
        {   "spSN":"SP_MULT_SL",
            "id": "4332e574-965a-4edb-adbb-6dcd86d929ee",
            "harware": TestData.spAssetMultiSL,
            "serviceLevels":[
                {description:"HPE 5 Year Tech Care Essential ML110 Svrs Smart Choice Service",sku:"H79Y7E",endDate:"02/23/2031"},
                {description:"Wty: HPE HW Maintenance Onsite Support",sku:"HA151AW",endDate:"02/23/2029"}
            ]}

    public static changeAsset=
        {   "productSku": "K2P91A", "serialNumber": "0ca84ca92b546d3a",
            "oldServiceGroupVendor": TestData.defaultVendorId, "oldServiceGroupSku": "HU4A6AC",
            "newServiceGroupVendor": TestData.defaultVendorId, "newServiceGroupSku": "HU4A3AC"}
    public static deleteAsset= {   "productSku": "K2P91A", "serialNumber": "11a7d43f61c23873"}

    public static changeAsset2=
        {   "productSku": "652757-B21", "serialNumber": "2da94f8d47047b80",
            "oldServiceGroupVendor": TestData.defaultVendorId, "oldServiceGroupSku": "HU4B2AC",
            "newServiceGroupVendor": TestData.defaultVendorId, "newServiceGroupSku": "HU4A3AC"}
    public static deleteAsset2= {   "productSku": "652757-B21", "serialNumber": "68470803aa49517f"}
    public static defaultQuoteWithDetailsContract={contractNumber:"2137723802", sar:"KISP063", groupId:"87-SMD503 007", }
    public static defaultRealm="tesedi"
    public static defaultOrganization="Test Automation"
    public static altOrganization="Bithawk"
    public static altOrganization2="SFR Business"
    public static defaultOrganizationDetails= {id:TestData.defaultOrgId, name:TestData.defaultOrganization,
                                                status:"active", emailable:true}
    public static defaultOrganizationEntityDetails= {id:"9900301986", name:"Demo AG", type:"Reseller",isActive:true,source:"Dummy"}
    public static altOrganizationEntityDetails= {id:"301986", name:"BitHawk AG", type:"Reseller",isActive:true}
    public static defaultOrganizationAltEntityDetails= {id:"392315", name:"AL CONSULTING", type:"Reseller",isActive:true}
    public static defaultContractCreateReseller=TestData.defaultOrganizationAltEntityDetails;
    public static defaultUser=TestData.defaultUserDetails.email;
    public static defaultViewerUser=TestData.defaultViewerDetails.email;
    public static resellerWithoutContacts="3cefa026-eb71-45b7-9509-45c5dcd6bff3";
    public static defaultLinkEntityId="9900301986";
    public static altLinkEntityId="302599";
    public static defaultQuoteWithPDFId="1326";
    public static previewPDFOrgId="3d1538cf-172c-40b6-a278-877db65578c6";
    public static altOrgId=TestData.previewPDFOrgId;
    public static assetWarrantyOrgId=TestData.previewPDFOrgId;
    public static billingSummaryOrgId=TestData.previewPDFOrgId;
    public static defaultContractWithCustomerPrices="3941";
    public static quoteWithoutAssetsPagination="9900077409";
    public static defaultQWCQuoteId="9900046395";

    public static defaultExpiredSPId="94ecf6cd-92be-47a4-aff4-90cb5d5fb996";
    public static defaultExpiredSPName="AT_NOV28_MULTI";
    public static defaultQuoteChangeRequestId="9900077350";
    public static defaultQuoteNoChangeRequest="DUM749023447";
    public static defaultQWCQuoteItemId="1172972";
    public static defaultQWCContractItemId="1989459";
    public static defaultQWCContractId="9900035657";
    public static defaultMultiQWCContractId="9900035657";
    public static defaultMultiQWCQuoteId="46395";
    public static contractWithPreview="5201";
    public static multicontractGroup="87-SMD503 007";
    public static multicontractGroupContract1= {contractNumber:"2137931351",id:"60939"};
    public static multicontractGroupContract2= {contractNumber:"2137721899",id:"41719"};
    public static multicontractGroupForeignContract1= {contractNumber:"4004452244",id:"72796"};

    public static defaultQWCContract={  id: TestData.defaultQWCContractId, contractNumber:"60ea23602ea57048", sar:"3e0473f52cf96339",
                                         groupId: "cdf1013fa5cf5dce", startDate: "2022-09-01T00:00:00.000Z",endDate: "2024-08-31T00:00:00.000Z" }
    public static defaultQWCQuote={  id: TestData.defaultQWCQuoteId, quoteNo:"DUM1502683237", status:"Lost",
                                     groupId: "cdf1013fa5cf5dce", currency: "CHF" }

    public static altServicePack={ name:"ALT-SP",id:"6cf0123b-35d5-4a54-b4af-b4ecafb874bb"}
    public static altSPQuote={ quoteNo:"ALT-SP-QUOTE", id: "2c2253fe-951a-41fa-a25e-8ba9f15cf227", startDate:"04/03/2026"}
    public static altSPQuoteAsset={ productName:"HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr", sku: "P19774-B21",
        serialNUmber:"CZJ105018J"}
    public static defalutServicePackExpiration={ name:"P38411-B21",id:"d9fc438a-2118-457c-a995-d9078a13f55d"}
    public static defaultServicePack={ name:"DEFAULT-SP",id:"e1a9a209-d712-41d0-9fd5-d11724fb86cb"}
    public static realHPEValidation={status:"active",statuses:"active,expired",sn:"DEC10401Y3", productSKU:"R1R75A",productDescription:"HPE MSL 1/8 G2 0-drive Tape Autoloade",
                                    serviceGroupSku:"HC9N2E", serviceGroupDescription:"HPE 5Y FC NBD MSL G2 AL SVC", endDate:"2026-02-27T00:00:00.000Z"}
    public static realSPSN2="CZ210706XY"
    public static realSPSKU2="P20172-B21"
    public static defaultSPQuote={ quoteNo:"DEFAULT-SP-QUOTE", id: "fc002eab-dcac-4122-8e68-d67a3b13e707", startDate:"11/1/2025"}
    public static defaultSPQuoteAsset={ productName:"HPE DL360 Gen10 4208 1P 16G NC 8SFF Svr", sku: "P19774-B21",
                                        serialNUmber:"CZJ047071F"}
    public static  sgDefaultDetails= {"sgSKU":"HS7T0PE",
        "sgName":"HPE 1 Year Post Warranty Tech Care Critical DL360 Gen10 Service",
        "sgYears":3,
        "sgPrice":2618,
        "sgResellerPriceStr":"2,618.00",
        "sgCurrency":"CHF"}

    public static  testQuoteRequest={
        "customer":TestData.defaultEndUserDetails.name,
        "message":"Test message",
        "assets":[
            { "serialNumber":"11111",  "productSKU":"2222",  "serviceGroup":"HPE Foundation Care 24x7 Service", "endDate":"06/06/2026",},
            { "serialNumber":"33333",  "productSKU":"4444",  "serviceGroup":"HPE Foundation Care 24x7 Service", "endDate":"06/06/2026",},
        ],
        "files":[
            "src/tests/poFile.pdf"
        ]
    }
    public static  sgAltDetails= {"sgSKU":"HS7T0PE",
        "sgName":"HPE 1 Year Post Warranty Tech Care Critical DL360 Gen10 Service",
        "sgYears":1,
        "sgPrice":2827,
        "sgResellerPriceStr":"2,827.00",
        "sgCurrency":"CHF"}


    public static  altSgDefaultDetails= {"sgSKU":"HS7W1PE",
        "sgName":"HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service",
        "sgYears":2,
        "sgPrice":2309,
        "sgResellerPriceStr":"1,916.47",
        "sgCurrency":"CHF"}
    public static  altSgDefaultDetailsFull= {"serviceGroupSku":"HS7W1PE",
        "serviceGroupName":"HPE 2 Year Post Warranty Tech Care Basic DL360 Gen10 Service",
        "serviceGroupYears":"2",
        "serviceGroupPrice":"2309",
        "serviceGroupResellerPriceStr":"2,193.55",
        "serviceGroupCurrency":"CHF"}
    public static  altSgAltDetails= {"sgSKU":"HS7W5PE",
        "sgName":"HPE 1 Year Post Warranty Tech Care Basic wDMR DL360 Gen10 Service",
        "sgYears":1,
        "sgPrice":1285,
        "sgResellerPriceStr":"1,066.55",
        "sgCurrency":"CHF"}
    public static  altSgAltDetailsFull= {"serviceGroupSku":"HS7W5PE",
        "serviceGroupName":"HPE 1 Year Post Warranty Tech Care Basic wDMR DL360 Gen10 Service",
        "serviceGroupYears":"1",
        "serviceGroupPrice":"1285",
        "serviceGroupResellerPriceStr":"1,220.75",
        "serviceGroupCurrency":"CHF"}
    public static  spQuoteApproveDetails={
        agreement:"1b3847ee-25ae-4a3d-ac0b-1ade2232edea",
        sgSKU:TestData.sgDefaultDetails.sgSKU,
        sgName:TestData.sgDefaultDetails.sgName,
        sgYears:TestData.sgDefaultDetails.sgYears,
        sgPrice:TestData.sgDefaultDetails.sgPrice,
        sgPriceStr:TestData.sgDefaultDetails.sgResellerPriceStr,
        sgCurrency:TestData.sgDefaultDetails.sgCurrency,
        poNumber:"AT PO number",
        attachment:"src/tests/poFile.pdf",
        comment:"AT comment"
    }
    public static  spAltQuoteApproveDetails={
        agreement:"1b3847ee-25ae-4a3d-ac0b-1ade2232edea",
        sgSKU:TestData.altSgDefaultDetails.sgSKU,
        sgName:TestData.altSgDefaultDetails.sgName,
        sgYears:TestData.altSgDefaultDetails.sgYears,
        sgPrice:TestData.altSgDefaultDetails.sgPrice,
        sgPriceStr:TestData.altSgDefaultDetails.sgResellerPriceStr,
        sgCurrency:TestData.altSgDefaultDetails.sgCurrency,
        poNumber:"AT PO number",
        attachment:"src/tests/poFile.pdf",
        comment:"AT comment"
    }

    public static resetPasswordMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Reset Password. is:unread`
    public static youAreInvitedMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:You're invited: Your access to Tesedi's Asset Hub is ready. is:unread`
    public static youAreInvitedSAMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Sie sind eingeladen: Ihr Zugang zum Asset Hub von Tesedi ist bereit. is:unread`
    public static quoteRequestMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Quote Request Confirmation – ${TestData.defaultEndUserDetails.name}. is:unread`
    public static quoteConfirmationMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Empfangsbestätigung Bestellung - ${TestData.defaultQWCQuote.quoteNo}. is:unread`
    public static spQuoteConfirmationMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Empfangsbestätigung Bestellung - ${TestData.defaultSPQuote.quoteNo}. is:unread`
    public static spAltQuoteConfirmationMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Empfangsbestätigung Bestellung - ${TestData.altSPQuote.quoteNo}. is:unread`
    public static spManualProcessingRequiredMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:HPE Manual Processing Required - ${TestData.altSPQuote.quoteNo}. is:unread`
    public static renewalReportMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Your Renewal Report. is:unread`
    public static quoteRequestNewCustomerMessageFilter = `to:tesedi.assethub.test+stg@gmail.com subject:Quote Request Confirmation – New customer. is:unread`
    public static defaultQuotesRequestExistingCustomer={
        "customerId": TestData.defaultEndUserDetails.id,
        "message": "Request for multiple items",
        "assets":"[" +
            "{  \"serialNumber\":\"SN001\",\"productSku\":\"SKU001\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
            "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
            "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}," +
            "{\"serialNumber\":\"SN002\",\"productSku\":\"SKU002\",\"endDate\":\"2026-08-29T22:00:00.000Z\"," +
            "\"serviceGroupSku\":\"H7J36AC\",\"serviceGroupVendor\":\"274587\"," +
            "\"serviceGroupDescription\":\"HPE Foundation Care CTR Service\"}]"
    }
    public static defaultQuotesRequestNewCustomer={
        "customerName": "New customer",
        "contact" :"{\"firstName\":\"AT\",  \"lastName\":\"User\", \"email\":\"test@tesedi.com\", \"phone\":\"+1234567890\"}",
        "address" :"{\"address\":\"ul. Zyczkowskiego 5/5\", \"zip\":\"31-863\", \"location\":\"Krakow\"}",
        "message": "Request for multiple items",
        "assets": TestData.defaultQuotesRequestExistingCustomer.assets
    }

    public static testtUserId=TestData.testUserDetails['id'];
    public static defaultGroup="bithawkag_1/Owner2"
    public static defaultRootOrganization="SUPER ADMIN"
    public static quoteWithPreview="23909"
    public static FEATURE_FLAGS=["contract_import","contract_jobs","global_notification_bar","grouped_contract_download",
        "service_pack","show_only_active_entities","requests_list","quote_pdf_with_different_formats","billing_summary",
        "asset_warranty","service_pack_quote","quoted_contracts","home_open_requests","renewal_report",
        "new_quote_change_request_flow","hpe_clicker","hpe_clicker_dry_run","status_page","new_assets_detail_page",
        "generate_quote_pdf","better_auth","distributor_organizations"]
    public static API_ENDPOINTS=[
        "/","/health","/email/process-queue","/products","/products/linked","/products/{vendorId}/{sku}","/entities","/entities/{entityId}",
        "/entities/{entityId}/assets","/entities/{entityId}/contracts","/entities/{entityId}/quotes",
        "/entities/{entityId}/contacts","/entities/{entityId}/assets/export","/entities/distinct/names",
        "/entities/{entityId}/service-packs","/customers","/customers/admin/all","/customers/{customerId}/contacts","/users",
        "/users/me/permissions","/users/me/roles","/users/invite","/users/invite/resend","/users/disable",
        "/users/enable","/users/unlink","/users/invited/remove","/users/me","/users/{userId}",
        "/users/{userId}/change-email","/users/me/password","/users/register","/users/{userId}/roles",
        "/roles/organizations/{organizationId}","/roles","/roles/{roleId}","/roles/{roleId}/permissions",
        "/organizations","/organizations/{id}","/organizations/{id}/roles","/organizations/{id}/users",
        "/organizations/archive","/organizations/admin/all","/organizations/{id}/entities","/organizations/{id}/entity",
        "/organizations/{id}/logo","/quotes/requests","/quotes/requests/{requestId}","/quotes","/quotes/{quoteId}",
        "/quotes/{quoteId}/pdf","/quotes/{quoteId}/billing-summaries",
        "/quotes/{quoteId}/assets/doc-ids","/quotes/{quoteId}/assets/contract-summary","/quotes/{quoteId}/check-co-termination",
        "/quotes/{quoteId}/assets",
        "/quotes/{quoteId}/contacts","/quotes/{quoteId}/contracts","/quotes/{quoteId}/assets/export",
        "/quotes/{quoteId}/approve","/quotes/{quoteId}/api-approve","/quotes/{quoteId}/decline",
        "/quotes/{quoteId}/change-request","/quotes/{quoteId}/requests","/quotes/{quoteId}/entities","/dev/quotes/renewal-report","/contracts",
        "/contracts/batch-download-pdf","/contracts/{contractId}","/contracts/{contractId}/pdf",
        "/contracts/{contractId}/assets","/contracts/{contractId}/assets/export","/contracts/{contractId}/contacts",
        "/contracts/{contractId}/quotes","/contracts/{contractId}/entities","/contracts/request-quote","/contracts/import",
        "/contracts/import/validate","/contracts/assets","/feature-flags","/service-packs/many","/service-packs",
        "/service-packs/import","/service-packs/validate","/service-packs/hpe-validate","/service-packs/{servicePackId}","/service-packs/{serialNo}/active-services",
        "/service-packs/{servicePackId}/quotes/{quoteId}/approve","/service-packs/{servicePackId}/quotes/{quoteId}",
        "/assets/{serialNo}/service-packs","/auth/api/{path}","/auth/config","/auth/forgot-password","/service-packs/assets/{serialNo}",
        "/service-packs/bulk-validate","/service-pack/purchase","/hpe/purchase","/dev/service-packs/quote-creation",
        "/dev/service-packs/status-update","/cms/{id}","/cms/type/{type}","/metrics","/inbound","/search", "/auth/reset-password",
        "/schema","/schema/json","/schema/json/{path}","/schema/{path}","/reporting/kpis","/assets/{serialNoOrAssetId}",
        "/assets/warranty/{serialNumber}/{productSku}","/assets/warranty-sync","/assets/{serialNo}/contracts",
        "/assets/{serialNo}/quotes","/webhooks/database-events","/global-notifications"]
    // CZ240805T3 P38411-B21
    // CZ24100GW1 P52534-B21
    // CZ24100GW0 P52534-B21
    // CZ24100GVZ P52534-B21 --
    // CZ240805T2 P38411-B21
    // CZ2D2P04H0 P53921-B21
    //=====EXPIRING
    //DEC10401Y3 R1R75A
    //CZ210706XY P20172-B21

    //NOTIFICATIONS
    // {"en": "AT notification error"}
    // {"en": "<strong>AT</strong> notification info. <a href=\"/quotes\">OK</a>"}
    // {"de": "AT notification warning (DE) <a href=\"http://www.google.com\">Google</a>", "en": "AT notification warning (EN)", "fr": "AT notification warning (FR)", "it": "AT notification warning (IT)"}
    public static contractWithoutQuotes="9900003693"
    public static quoteWithoutContracts="9900010156"
    public static assetWithWarrantySN="2Y8539N075"
    public static assetWithWarrantyProductSKU="K2P91A"
    public static quoteWithBillingSummary="99040"
    public static nonExisingId="aaaaaaaa-aaaa-1111-aaaa-aaaaaaaaaaaa"
    public static errorMessages={
        "QUOTE_NOT_EXISTS":"Angebot.*nicht gefunden",
        "CUSTOMER_NOT_FOUND":"Kunde nicht gefunden",
        "ORG_NOT_EXISTS":"Organisation.*nicht gefunden",
        "ENTITY_NOT_EXISTS":"Einheit.*nicht gefunden",
        "CONTRACT_NOT_FOUND":"Vertrag.*nicht gefunden"
    }
    public static sp_mock_data={
        "MOCK-EXPIRED-RECENT":{sn:"MOCK-EXPIRED-RECENT-PE",  productSKU:"MOCK-SKU-EXPIRED-RECENT-PE", expiryFromToday:-30},
        "MOCK-EXPIRED-OLD":{sn:"MOCK-EXPIRED-OLD-PE",  productSKU:"MOCK-SKU-EXPIRED-OLD-PE", sgSKU:"MOCK-SERVICE-EXPIRED-OLD-PE",expiryFromToday:-60},
        "MOCK-EXPIRING-SOON": {sn:"MOCK-EXPIRING-SOON-PE",  productSKU:"MOCK-SKU-EXPIRING-SOON-PE",expiryFromToday:5},
        "MOCK-EXPIRING-MEDIUM": {sn:"MOCK-EXPIRING-MEDIUM-PE",  productSKU:"MOCK-SKU-EXPIRING-MEDIUM-PE",expiryFromToday:30},
        "MOCK-ACTIVE-FUTURE": {sn:"MOCK-ACTIVE-FUTURE-PE",  productSKU:"MOCK-SKU-ACTIVE-FUTURE-PE",sgSKU:"MOCK-SERVICE-ACTIVE-FUTURE-PE",expiryFromToday:90},
        "MOCK-UNKNOWN-STATUS": {sn:"MOCK-UNKNOWN-STATUS-PE",  productSKU:"MOCK-SKU-UNKNOWN-STATUS-PE",expiryFromToday:0},
        "MOCK-EXPIRED-BOUNDARY": {sn:"MOCK-EXPIRED-BOUNDARY-PE",  productSKU:"MOCK-SKU-EXPIRED-BOUNDARY-PE",expiryFromToday:-45},
        "MOCK-EXPIRING-BOUNDARY": {sn:"MOCK-EXPIRING-BOUNDARY-PE",  productSKU:"MOCK-SKU-EXPIRING-BOUNDARY-PE",expiryFromToday:60}
    }
    public static string257="1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012"
    public static string4100="1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890129012345678901234567890123456789012345678901234567890123456789012345678901212345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012901234567890123456789012345678901234567890123456789012345678901234567890121234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890129012345678901234567890123456789012345678901234567890123456789012345678901212345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012901234567890123456789012345678901234567890123456789012345678901234567890121234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890129012345678901234567890123456789012345678901234567890123456789012345678901212345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012901234567890123456789012345678901234567890123456789012345678901234567890121234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890129012345678901234567890123456789012345678901234567890123456789012345678901212345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012901234567890123456789012345678901234567890123456789012345678901234567890121234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890129012345678901234567890123456789012345678901234567890123456789012345678901212345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012901234567890123456789012345678901234567890123456789012345678901234567890121234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901290123456789012345678901234567890123456789012345678901234567890123456789012"
    public static schema = require('./schema.json');
    public static async configureQuoteWithLinkedContract() {
        let contract_item_id=TestData.defaultQWCContractItemId
        let quote_item_id=TestData.defaultQWCQuoteItemId
        await dbHelper.any(`update quote_items set source_contract_item_id = '${contract_item_id}', resulting_contract_item_id='${contract_item_id}' where id='${quote_item_id}'`);
    }
  public static keycloakUserPayload= {
      "attributes": {"locale": "en"},
      "requiredActions": [],
      "emailVerified": true,
      "email": "at@gmail.com",
      "firstName": "AT",
      "lastName": "Name",
      "groups": ["/dtssystemegmbh_1/role", "/bithawkag_1/Owner2"],
      "status": "active"
  };
    public static defaultSQLDate='2025-02-12 09:19:11.000000 +00:00'
    public static async initUsersAndRoles() {
        TestData.defaultOperatorDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultOperatorDetails);
        TestData.restrictedAltUserDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.restrictedAltUserDetails);
        TestData.restrictedUserDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.restrictedUserDetails);
        TestData.defaultViewerDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultViewerDetails);
        TestData.defaultAdminDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultAdminDetails);
        TestData.defaultApproverDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultApproverDetails);
        TestData.defaultRequesterDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultRequesterDetails);
        TestData.defaultPermissionUserDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultPermissionUserDetails);
        TestData.defaultEditUserDetails['id']=(await supertestAHAPIHelper.getMatchingUserDetails(TestData.defaultEditUserDetails))['id'];
        TestData.saUserDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.saUserDetails);
        TestData.defaultUserDetails['id']=await supertestAHAPIHelper.getOrganizationUserId(TestData.defaultUserDetails);
    }

    public static STATUSES: object={
        15:"Renewed",
        56:"Invoiced"
    }

    public static TEST_QUOTE_MAP = {

        "dump": {
            "id": "9900063816",
            "quoteNo": "DUM2383497725",
            "status":  "Ordered",
            "statusRegexp": "Ordered|Invoiced",
            "groupId":  "2e19b37993e92f17",
            "startDate": "2024-07-01T00:00:00.000Z",
            "startDateShort": "07/01/2024",
            "expiryDate": null,
            "endDate": "2025-06-30T00:00:00.000Z",
            "currency": "CHF",
            "vendorId": "255861",
            "distributorId":  "7001",
            "resellerId":  "301986",
            "endUserId": "307602",
            "endCustomerTotalPrice":  "40,286.60",
            "endCustomer": "Customer 51",
            "resellerTotalPrice": "38,135.98",
            "resellerPrice": "38,135.98",
            "retailPrice": "40,286.60",
            "resellerTotalFull": "38135.9841",
            "endCustomerTotalPriceFull": "40286.595"
        },
        "webhook": {}
    };

    public static TEST_QUOTE_WITH_CONTRACTS_MAP = this.TEST_QUOTE_MAP

    public static  TEST_QUOTE_CONTRACT_MAP: object={
        "dump": {
            "id": "9900070287",
            "contractNumber": "9369c5097a49ce8e",
            "sar": "9096533e99da61d1",
            "status": "Active",
            "groupId": "2e19b37993e92f17",
            "startDate": "2024-07-01T00:00:00.000Z",
            "startDateShort": "07/01/2024",
            "endDate": "2025-06-30T00:00:00.000Z",
            "endDateShort": "06/30/2025",
            "currency": "CHF",
            "resellerTotalPrice": "1.165,94",
            "endCustomerTotalPrice": "1.239,81"
        },
        "webhook": {}
    }
    public static  TEST_QUOTE_CONTACT_MAP: object={
        "dump": {
            "id": "9900113059",
            "entityId": "9900007001",
            "status": "active",
            "contactId": "9900113059",
            "surname": "Maggio",
            "givenName": "Silvia",
            "emailAddress": "tesedi.assethub.test+account@gmail.com",
            "businessPhone": "+41 11 222 5840",
            "active": "true",
            "type": "Account Manager"
        },
        "webhook": {}
    }
    public static  TEST_QUOTE_ASSET_MAP: object={
        "dump": {
            "name":  "HPE 3PAR 8000 3.84TB SAS cMLC Reman SSD",
            "serviceGroupLabel":  "HPE Tech Care Essential SVC",
            "serialNumber":   "058c92e66295e849",
            "productSku":  "K2P91AR",
            "serviceGroupSku":  "HU4A6AC"
        },
        "webhook": {}
    }

    public static TEST_CONTRACT_MAP = {
        "dump": {
            "id": "9900060936",
            "contractNumber": "dbef8a02ec0c0fdd",
            "sar": "93be8d68d389e9ea",
            "status": "Renewed",
            "groupId": "2e19b37993e92f17",
            "customerId": "9900307602",
            "vendorId": "255861",
            "distributorId":"9900007001",
            "resellerId": "9900301986",
            "startDate": "2024-01-01T00:00:00.000Z",
            "startDateOnly": "2024-01-01",
            "startDateShort": "01/01/2024",
            "endDate": "2024-06-30T00:00:00.000Z",
            "endDateOnly": "2024-06-30",
            "endDateShort": "06/30/2024",
            "currency": "CHF",
            "resellerTotalPrice": 1220.68,
            "resellerTotalPriceFull": 1220.6767,
            "endCustomerTotalPrice": 1284.9228,
            "endCustomer": "Customer 51",
            "resellerPrice": "1,220.68",
            "retailPrice": "1,284.92"
        },
        "webhook": {}
    };


    public static  TEST_CONTRACT_ASSET_MAP: object={
        "dump": {
            "name":  "HP BLc7000 CTO 3 IN LCD ROHS Encl",
            "serviceGroupLabel":  "HPE Tech Care Essential SVC",
            "serviceGroupSKU":  "HU4A6AC",
            "serialNumber":   "caad0bbaec2b923e",
            "productSku":  "507019-B21",
            "coverageStatus": "EXPOSED",
            "startDate": "2024-10-01T00:00:00.000Z",
            "endDate": "2025-09-30T00:00:00.000Z",
        },
        "webhook": {}
    }

    public static  TEST_CONTRACT_QUOTE_MAP: object={
        "dump": {
            "quoteNo": "CH12729",
            "status":  "Ordered",
            "groupId":  "87-SMD500 1933C",
            "startDateShort": "5/8/2022",
            "currency": "CHF",
            "endCustomer": "BitHawk AG",
            "resellerPrice": "32.393,61",
            "retailPrice":  "34.098,55"
        },
        "webhook": {}
    }

    public static  TEST_RESELLER_ASSET_MAP: object={
        "dump": {
            "name":  "HP 3PAR 8000 3.84TB SAS cMLC SFF SSD",
            "serviceGroup":  "HPE Tech Care Essential SVC",
            "serialNumber":   "0218a00d642abf17",
            "productSku":  "K2P91A"
        },
        "webhook": {}
    }

    public static  SIDE_MENU_NAVIGATIONS ={
        "EN": ["Dashboard","Quotes","Contracts","Service packs","Requests","Customers","Your Organization"],
        "DE": ["Dashboard","Angebote","Verträge","Servicepakete","Anfragen","Kunden","Ihre Organisation"],
        "FR": ["Tableau de bord","Devis","Contrats","Forfaits de service","Demandes","Clients","Votre organisation"],
        "IT": ["Dashboard","Preventivi","Contratti","Pacchetti di servizio","Richieste","Clienti","La tua organizzazione"]
}
    public static rolesPermissions={
        "Owner":{"quote":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"quote_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":false},"contract":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":true},"entity":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"organization":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contact":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user_organization":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":true,"approve":false,"reject":false,"export":false,"manage":false},"service_pack":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":true}},
        "Approver":{"quote":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"quote_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":false},"contract":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":false},"entity":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contact":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user_organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"service_pack":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false}},
        "Requester":{"quote":{"create":true,"read":true,"update":true,"approve":false,"reject":true,"export":false,"manage":false},"quote_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":false},"contract":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":true,"manage":false},"entity":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contact":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user_organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"service_pack":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false}},
        "Viewer":{"quote":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"quote_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"entity":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"organization":{"create":false,"read":false,"update":true,"approve":false,"reject":false,"export":false,"manage":false},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contact":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user_organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"service_pack":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false}},
        "Support Operator":{"quote":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"quote_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract_item":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"entity":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"organization":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contact":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"user_organization":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"service_pack":{"create":false,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":false}},
        "Super Admin":{"quote":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"quote_item":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"contract":{"create":true,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"contract_item":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"entity":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"role":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"contact":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"asset":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"platform":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"user_organization":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":false},"invited_user":{"create":false,"read":false,"update":false,"approve":false,"reject":false,"export":false,"manage":true},"service_pack":{"create":true,"read":true,"update":false,"approve":false,"reject":false,"export":false,"manage":true}},
    }
    public static appliedRolesPermissions={
        "Owner":{"asset":{"create":false,"manage":false,"read":true,"update":false},"opportunity":{"create":false,"manage":false,"read":false},"contact":{"create":false,"manage":false,"read":true,"update":false},"contract":{"create":true,"manage":false,"read":true},"contract_item":{"create":true,"export":true,"manage":true,"read":true},"entity":{"create":true,"manage":true,"read":true},"invited_user":{"manage":false,"update":true},"organization":{"create":false,"manage":false,"read":true,"update":false},"platform":{"manage":false},"quote":{"approve":true,"create":true,"manage":true,"read":true,"reject":true,"update":true},"quote_item":{"create":false,"export":true,"manage":false,"read":true},"role":{"create":false,"manage":false,"read":false,"update":false},"service_pack":{"create":true,"manage":true,"read":true},"user":{"create":true,"manage":true,"read":true,"update":true},"user_organization":{"read":true}},
           }

}
