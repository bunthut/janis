import joplin from "api";
import { onFileDrop } from "../src/index";

describe("onFileDrop", () => {
    test("creates a resource and note for dropped files", async () => {
        const file = { name: "test.txt" } as any;
        const postMock = jest.spyOn(joplin.data, "post").mockImplementation(async (path: string[], _query: any, data: any) => {
            if (path[0] === "resources") {
                return { id: "res1" };
            }
            if (path[0] === "notes") {
                return { id: "note1" };
            }
            return {};
        });

        await onFileDrop({ files: [file] });

        expect(postMock).toHaveBeenCalledTimes(2);
        expect(postMock).toHaveBeenCalledWith(["resources"], null, file);
        expect(postMock).toHaveBeenCalledWith(["notes"], null, {
            title: "test.txt",
            body: "[](:/res1)",
        });
    });
});
