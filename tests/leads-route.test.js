const path = require("node:path");
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createJiti } = require("jiti");

const jiti = createJiti(__filename, {
  alias: {
    "@/*": path.join(__dirname, "../src/*"),
    "@/lib/prisma": path.join(__dirname, "./mocks/prisma"),
    "@/lib/auth-utils": path.join(__dirname, "./mocks/auth-utils"),
  },
});

const routeModule = jiti("../src/app/api/leads/[id]/route.ts");
const { GET, PATCH, PUT } = routeModule;

const authMocks = jiti("./mocks/auth-utils.ts");
const prismaMocks = jiti("./mocks/prisma.ts");

describe("lead route authorization", () => {
  beforeEach(() => {
    authMocks.__resetMockUser();
    prismaMocks.__resetLeadMocks();
  });

  it("allows admins to read any lead", async () => {
    authMocks.__setMockUser({ id: "admin-1", role: "ADMIN" });

    const findFirstCalls = [];
    prismaMocks.__setLeadMock("findFirst", async (options) => {
      findFirstCalls.push(options);
      return {
        id: "lead-1",
        ownerId: "owner-1",
        owner: {
          id: "owner-1",
          firstName: "Lead",
          lastName: "Owner",
          email: "owner@example.com",
        },
      };
    });
    prismaMocks.__setLeadMock("findUnique", async () => {
      throw new Error("findUnique should not be called");
    });

    const response = await GET(new Request("http://test"), {
      params: Promise.resolve({ id: "lead-1" }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.id, "lead-1");
    assert.deepEqual(body.owner.id, "owner-1");

    assert.deepEqual(findFirstCalls, [
      {
        where: { id: "lead-1" },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    ]);
  });

  it("scopes reads to the owner for non-admins", async () => {
    authMocks.__setMockUser({ id: "user-2", role: "USER" });

    const findFirstCalls = [];
    prismaMocks.__setLeadMock("findFirst", async (options) => {
      findFirstCalls.push(options);
      return null;
    });
    prismaMocks.__setLeadMock("findUnique", async () => ({ id: "lead-1" }));

    const response = await GET(new Request("http://test"), {
      params: Promise.resolve({ id: "lead-1" }),
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Forbidden" });

    assert.deepEqual(findFirstCalls, [
      {
        where: { id: "lead-1", ownerId: "user-2" },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    ]);
  });

  it("allows owners to update their leads", async () => {
    authMocks.__setMockUser({ id: "owner-1", role: "USER" });

    const updateManyCalls = [];
    prismaMocks.__setLeadMock("updateMany", async (options) => {
      updateManyCalls.push(options);
      return { count: 1 };
    });
    prismaMocks.__setLeadMock("findUnique", async () => ({
      id: "lead-1",
      name: "Updated Lead",
      status: "CONTACTED",
      source: "WEB",
      tags: ["vip"],
    }));

    const requestBody = {
      name: "Updated Lead",
      status: "CONTACTED",
      source: "WEB",
      tags: ["vip"],
      ownerId: "owner-1",
    };

    const response = await PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.name, "Updated Lead");

    assert.deepEqual(updateManyCalls, [
      {
        where: { id: "lead-1", ownerId: "owner-1" },
        data: {
          name: "Updated Lead",
          middleName: null,
          lastName: null,
          email: null,
          phone: null,
          designation: null,
          department: null,
          industry: null,
          country: null,
          photo: null,
          company: null,
          website: null,
          companyDescription: null,
          projectName: null,
          projectDescription: null,
          projectType: null,
          budget: null,
          projectValue: null,
          currency: null,
          timeline: null,
          status: "CONTACTED",
          source: "WEB",
          tags: ["vip"],
          notes: null,
          ownerId: "owner-1",
        },
      },
    ]);
  });

  it("allows owners to toggle isActive", async () => {
    authMocks.__setMockUser({ id: "owner-1", role: "USER" });

    const updateManyCalls = [];
    prismaMocks.__setLeadMock("updateMany", async (options) => {
      updateManyCalls.push(options);
      return { count: 1 };
    });
    prismaMocks.__setLeadMock("findUnique", async () => ({
      id: "lead-1",
      isActive: false,
    }));

    const response = await PUT(
      new Request("http://test", {
        method: "PUT",
        body: JSON.stringify({ isActive: false }),
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.isActive, false);

    assert.deepEqual(updateManyCalls, [
      {
        where: { id: "lead-1", ownerId: "owner-1" },
        data: { isActive: false },
      },
    ]);
  });

  it("blocks cross-user toggles", async () => {
    authMocks.__setMockUser({ id: "user-2", role: "USER" });

    const updateManyCalls = [];
    prismaMocks.__setLeadMock("updateMany", async (options) => {
      updateManyCalls.push(options);
      return { count: 0 };
    });
    prismaMocks.__setLeadMock("findUnique", async () => ({ id: "lead-1" }));

    const response = await PUT(
      new Request("http://test", {
        method: "PUT",
        body: JSON.stringify({ isActive: true }),
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Forbidden" });

    assert.deepEqual(updateManyCalls, [
      {
        where: { id: "lead-1", ownerId: "user-2" },
        data: { isActive: true },
      },
    ]);
  });
});
