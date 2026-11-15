import { describe, expect, it } from "vitest";
import { filterUsers } from "@/lib/user-search";

const users = [
  { name: "José Mamani", email: "jose@jl.bo" },
  { name: "Raul Quispe", email: "raul@jl.bo" },
  { name: "Fabia Choque", email: "fabia@otra.bo" },
];

describe("filterUsers", () => {
  it("keeps everyone for an empty query", () => {
    expect(filterUsers(users, "  ")).toEqual(users);
  });

  it("matches name or email, ignoring case and accents, every word in any order", () => {
    expect(filterUsers(users, "JOSE").map((u) => u.name)).toEqual(["José Mamani"]);
    expect(filterUsers(users, "otra.bo").map((u) => u.name)).toEqual(["Fabia Choque"]);
    expect(filterUsers(users, "quispe raul").map((u) => u.name)).toEqual(["Raul Quispe"]);
    expect(filterUsers(users, "raul fabia")).toEqual([]);
  });
});
