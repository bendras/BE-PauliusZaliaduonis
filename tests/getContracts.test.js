const request = require("supertest");
const app = require("../src/app");

describe("/contracts", () => {
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
        expect(response.body).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('authenticated request includes contractor contracts', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "6");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([{ id: 2 }, { id: 3 }]);
    });

    test('authenticated request includes contractor contracts, but excludes terminated', async () => {
        const response = await request(app).get("/contracts").set("profile_id", "5");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });
});
