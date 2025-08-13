import { PromiseGroup, NamedPromiseGroup } from "@templates/utils/promises";

describe("Promise groups", () => {
    test("PromiseGroup resolves promises in order", async () => {
        const group = new PromiseGroup();
        group.add(Promise.resolve(1));
        group.add(Promise.resolve(2));
        const results = await group.all();
        expect(results).toEqual([1, 2]);
    });

    test("NamedPromiseGroup resolves to object keyed by names", async () => {
        const group = new NamedPromiseGroup();
        group.add("a", Promise.resolve(1));
        group.add("b", Promise.resolve(2));
        const results = await group.all();
        expect(results).toEqual({ a: 1, b: 2 });
    });

    test("NamedPromiseGroup throws on duplicate key", () => {
        const group = new NamedPromiseGroup();
        group.add("dup", Promise.resolve(1));
        expect(() => group.add("dup", Promise.resolve(2))).toThrow();
    });
});

