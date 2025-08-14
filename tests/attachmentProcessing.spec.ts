// Tests for attachment processing: image thumbnails and PDF extraction

describe("processAttachment", () => {
    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("creates thumbnail for image attachments", async () => {
        jest.doMock("sharp", () => {
            const resize = jest.fn().mockReturnThis();
            const toBuffer = jest.fn().mockResolvedValue(Buffer.from("thumb"));
            return jest.fn(() => ({ resize, toBuffer }));
        }, { virtual: true });

        const joplin = (await import("api")).default as any;
        const processAttachment = (await import("../src/utils/attachmentProcessing")).default;

        const getMock = jest.fn().mockResolvedValue({ id: "res1", mime: "image/png" });
        const resourcePathMock = jest.fn().mockResolvedValue("/path/res1.png");
        const postMock = jest.fn().mockResolvedValueOnce({ id: "thumb_res1" });
        postMock.mockResolvedValueOnce({});

        joplin.data.get = getMock;
        joplin.data.resourcePath = resourcePathMock;
        joplin.data.post = postMock;

        await processAttachment("res1", "note1");

        expect(resourcePathMock).toHaveBeenCalledWith("res1");
        expect(postMock).toHaveBeenNthCalledWith(1, ["resources"], null, {
            data: Buffer.from("thumb"),
            filename: "thumb_res1.png",
            mime: "image/png",
        });
        expect(postMock).toHaveBeenNthCalledWith(2, ["notes", "note1", "resources"], null, { id: "thumb_res1" });
    });

    test("skips thumbnail generation when sharp is missing", async () => {
        jest.doMock("sharp", () => { throw new Error("module not found"); }, { virtual: true });

        const joplin = (await import("api")).default as any;
        const processAttachment = (await import("../src/utils/attachmentProcessing")).default;

        const getMock = jest.fn().mockResolvedValue({ id: "res1", mime: "image/png" });
        const postMock = jest.fn();
        joplin.data.get = getMock;
        joplin.data.post = postMock;

        const warnMock = jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

        await processAttachment("res1", "note1");

        expect(warnMock).toHaveBeenCalledWith("sharp module not available. Skipping thumbnail generation.");
        expect(postMock).not.toHaveBeenCalled();
    });

    test("extracts text from PDF attachments", async () => {
        const readFileMock = jest.fn().mockResolvedValue(Buffer.from("pdfdata"));
        jest.doMock("fs", () => ({ promises: { readFile: readFileMock } }));
        jest.doMock("pdf-parse", () => jest.fn().mockResolvedValue({ text: "First sentence. Second sentence. Third sentence." }), { virtual: true });

        const joplin = (await import("api")).default as any;
        const processAttachment = (await import("../src/utils/attachmentProcessing")).default;

        const getMock = jest.fn()
            .mockResolvedValueOnce({ id: "res1", mime: "application/pdf" })
            .mockResolvedValueOnce({ id: "note1", body: "existing body" });
        const resourcePathMock = jest.fn().mockResolvedValue("/path/res1.pdf");
        const putMock = jest.fn();

        joplin.data.get = getMock;
        joplin.data.resourcePath = resourcePathMock;
        joplin.data.put = putMock;

        await processAttachment("res1", "note1");

        expect(readFileMock).toHaveBeenCalledWith("/path/res1.pdf");
        expect(putMock).toHaveBeenCalledWith(["notes", "note1"], null, { body: "First sentence. Second sentence.\n\nexisting body" });
    });

    test("skips PDF text extraction when pdf-parse is missing", async () => {
        jest.doMock("pdf-parse", () => { throw new Error("module not found"); }, { virtual: true });

        const joplin = (await import("api")).default as any;
        const processAttachment = (await import("../src/utils/attachmentProcessing")).default;

        const getMock = jest.fn().mockResolvedValue({ id: "res1", mime: "application/pdf" });
        const putMock = jest.fn();

        joplin.data.get = getMock;
        joplin.data.put = putMock;

        const warnMock = jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

        await processAttachment("res1", "note1");

        expect(warnMock).toHaveBeenCalledWith("pdf-parse module not available. Skipping PDF text extraction.");
        expect(putMock).not.toHaveBeenCalled();
    });
});

