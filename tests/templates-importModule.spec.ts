import joplin from "api";
import templatesImportModule from "@templates/importModule";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

describe("templates import module", () => {
    beforeEach(() => {
        (joplin as any).require = require;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("imports markdown file as note", async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tmpl-"));
        const file = path.join(dir, "note.md");
        await fs.writeFile(file, "Title\nBody text");

        const postMock = jest.spyOn(joplin.data, "post").mockResolvedValue({});

        await templatesImportModule.onExec({ sourcePath: file } as any);

        expect(postMock).toHaveBeenCalledWith(["notes"], null, {
            title: "Title",
            body: "Body text",
        });
        expect(postMock).toHaveBeenCalledTimes(1);
    });

    test("imports all files in directory", async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tmpl-"));
        const fileA = path.join(dir, "a.md");
        const fileB = path.join(dir, "b.md");
        await fs.writeFile(fileA, "A\nBodyA");
        await fs.writeFile(fileB, "B\nBodyB");

        const postMock = jest.spyOn(joplin.data, "post").mockResolvedValue({});

        await templatesImportModule.onExec({ sourcePath: dir } as any);

        expect(postMock).toHaveBeenNthCalledWith(1, ["notes"], null, {
            title: "A",
            body: "BodyA",
        });
        expect(postMock).toHaveBeenNthCalledWith(2, ["notes"], null, {
            title: "B",
            body: "BodyB",
        });
        expect(postMock).toHaveBeenCalledTimes(2);
    });
});
