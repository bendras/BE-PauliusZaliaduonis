const request = require("supertest");
const app = require("../src/app");
const seedDb = require("../scripts/seed");

describe("/contracts/:id", () => {
    beforeAll(seedDb)

    test('unauthenticated request', async () => {
        const response = await request(app).get("/contracts/1");
        expect(response.statusCode).toBe(401);
    });

    test('invalid authentication request', async () => {
        const response = await request(app).get("/contracts/1").set("profile_id", "0");
        expect(response.statusCode).toBe(401);
    });

    test('authenticated request, unauthorised record', async () => {
        const response = await request(app).get("/contracts/6").set("profile_id", "1");
        expect(response.statusCode).toBe(403);
    });

    test('authenticated client request', async () => {
        const response = await request(app).get("/contracts/1").set("profile_id", "1");
        expect(response.statusCode).toBe(200);
    });

    test('authenticated contractor request', async () => {
        const response = await request(app).get("/contracts/1").set("profile_id", "1");
        expect(response.statusCode).toBe(200);
    });
});
