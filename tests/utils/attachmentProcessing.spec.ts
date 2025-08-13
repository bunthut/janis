import joplin from "api";
import * as fs from "fs";
import { processAttachment } from "@templates/utils/attachmentProcessing";

jest.mock("pdf-parse", () => {
    return jest.fn(async () => ({ text: "First sentence. Second sentence. Third sentence." }));
}, { virtual: true });

const pdfParse = require("pdf-parse");

describe("processAttachment PDF handling", () => {
    test("reads PDF asynchronously and updates note body", async () => {
        const resourceId = "res1";
        const noteId = "note1";

        const readFileSpy = jest.spyOn(fs.promises, "readFile").mockResolvedValue(Buffer.from("PDF"));

        jest.spyOn(joplin.data, "get").mockImplementation(async (path: string[]) => {
            if (path[0] === "resources") {
                return { id: resourceId, mime: "application/pdf" };
            }
            if (path[0] === "notes") {
                return { id: noteId, body: "Original body" };
            }
            return null;
        });

        jest.spyOn(joplin.data, "resourcePath").mockResolvedValue("/path/to/resource");
        const putSpy = jest.spyOn(joplin.data, "put").mockResolvedValue({});

        await processAttachment(resourceId, noteId);

        expect(readFileSpy).toHaveBeenCalledWith("/path/to/resource");
        expect(pdfParse).toHaveBeenCalled();
        expect(putSpy).toHaveBeenCalledWith(["notes", noteId], null, {
            body: "First sentence. Second sentence.\n\nOriginal body",
        });
    });
});
