const request = require("supertest");
const app = require("../src/app");
const seedDb = require("../scripts/seed");

describe("/jobs/unpaid", () => {
    beforeAll(seedDb)

    test('unauthenticated request', async () => {
        const response = await request(app).get("/jobs/unpaid");
        expect(response.statusCode).toBe(401);
    });

    test('invalid authentication request', async () => {
        const response = await request(app).get("/jobs/unpaid").set("profile_id", "0");
        expect(response.statusCode).toBe(401);
    });

    describe("authenticated request", () => {

        test('includes client jobs', async () => {
            const response = await request(app).get("/jobs/unpaid").set("profile_id", "1");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([
                expect.objectContaining({
                    description: 'work',
                    price: 201,
                    ContractId: 2,
                })
            ]);
        });

        test('includes contractor jobs', async () => {
            const response = await request(app).get("/jobs/unpaid").set("profile_id", "6");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([
                expect.objectContaining({
                    description: 'work',
                    price: 201,
                    ContractId: 2,
                }),
                expect.objectContaining({
                    description: 'work',
                    price: 202,
                    ContractId: 3,
                }),
            ]);
        });

        test('excludes terminated', async () => {
            const response = await request(app).get("/jobs/unpaid").set("profile_id", "5");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
});
