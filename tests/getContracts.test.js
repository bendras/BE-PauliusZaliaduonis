const request = require("supertest");
const app = require("../src/app");
const seedDb = require("../scripts/seed");

describe("/contracts", () => {
    beforeAll(seedDb)

    test('unauthenticated request', async () => {
        const response = await request(app).get("/contracts");
        expect(response.statusCode).toBe(401);
    });

    test('invalid authentication request', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "0");
        expect(response.statusCode).toBe(401);
    });

    test('authenticated request includes client contracts', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "1");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            // expect.objectContaining({ id: 1 }), not included because it is terminated
            expect.objectContaining({ id: 2 }),
        ]);
    });

    test('authenticated request includes contractor contracts', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "6");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            expect.objectContaining({ id: 2 }),
            expect.objectContaining({ id: 3 }),
            expect.objectContaining({ id: 8 }),
        ]);
    });

    test('authenticated request includes contractor contracts, but excludes terminated', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "5");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            // expect.objectContaining({ id: 1 }), not included because it is terminated
        ]);
    });
});
