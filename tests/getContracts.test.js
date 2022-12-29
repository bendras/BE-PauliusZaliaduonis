const request = require("supertest");
const app = require("../app");

describe("/contracts/:id", () => {
    test('unauthenticated request', async () => {
        const response = await request(app).get("/contracts/1");
        expect(response.statusCode).toBe(401);
    });
});
