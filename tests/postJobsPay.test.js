const request = require("supertest");
const app = require("../src/app");
const seedDb = require("../scripts/seed");

const { sequelize } = require('../src/model')

describe("/jobs/:id/pay", () => {
    beforeAll(seedDb)

    test('unauthenticated request', async () => {
        const response = await request(app).post("/jobs/1/pay");
        expect(response.statusCode).toBe(401);
    });

    test('invalid authentication request', async () => {
        const response = await request(app).post("/jobs/1/pay").set("profile_id", "0");
        expect(response.statusCode).toBe(401);
    });

    describe("authenticated request on profile_1", () => {
        const profileId = "1"
        let unpaidJob;
        let clientProfileBefore;
        let contractorProfileBefore;

        test('there are unpaid jobs', async () => {
            const unpaidJobsResponse = await request(app).get("/jobs/unpaid").set("profile_id", profileId);
            unpaidJob = unpaidJobsResponse.body[0];
            expect(unpaidJob).toBeDefined()

            const { Profile } = sequelize.models;
            clientProfileBefore = await Profile.findOne({ where: { id: profileId } });
            contractorProfileBefore = await Profile.findOne({ where: { id: unpaidJob.Contract.ContractorId } });
        });

        test('sufficient funds', async () => {
            const response = await request(app).post(`/jobs/${unpaidJob.id}/pay`).set("profile_id", profileId);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ "id": "2", "paid": true });
        });

        test('already paid', async () => {
            const response = await request(app).post(`/jobs/${unpaidJob.id}/pay`).set("profile_id", profileId);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ message: "Job has been paid already" });
        });

        test('funds transfered from client', async () => {
            const { Profile } = sequelize.models;
            const clientProfile = await Profile.findOne({ where: { id: profileId } });

            expect(clientProfile.balance).toEqual(clientProfileBefore.balance - unpaidJob.price)
        });

        test('funds transfered to contractor', async () => {
            const { Profile } = sequelize.models;
            const contractorProfile = await Profile.findOne({ where: { id: unpaidJob.Contract.ContractorId } });

            expect(contractorProfile.balance).toEqual(contractorProfileBefore.balance + unpaidJob.price)
        });
    });

    describe("authenticated request on profile_4", () => {
        const profileId = "4"
        let unpaidJob;

        test('there are unpaid jobs', async () => {
            const unpaidJobsResponse = await request(app).get("/jobs/unpaid").set("profile_id", profileId);
            unpaidJob = unpaidJobsResponse.body[0];
            expect(unpaidJob).toBeDefined()
        });

        test('insufficient funds', async () => {
            const unpaidJobsResponse = await request(app).get("/jobs/unpaid").set("profile_id", profileId);
            const unpaidJob = unpaidJobsResponse.body[0];
            expect(unpaidJob).toBeDefined()

            const response = await request(app).post(`/jobs/${unpaidJob.id}/pay`).set("profile_id", profileId);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ message: "Insufficient funds" });
        });

    });
});
