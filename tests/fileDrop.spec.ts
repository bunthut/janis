import joplin from "api";
import { onFileDrop, initializeFileDrop } from "../src/index";
import { Logger } from "../src/logger";
import * as folders from "../src/utils/folders";

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(resolve => setImmediate(resolve));
};

describe("onFileDrop", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test("creates resources and notes for all dropped files in parallel", async () => {
        const files = [{ name: "test1.txt" } as any, { name: "test2.txt" } as any];
        const selectedFolderMock = jest.fn().mockResolvedValue({ id: "folder1" });
        (joplin as any).workspace = { selectedFolder: selectedFolderMock } as any;

        const resourceResolvers: Array<() => void> = [];
        const postMock = jest.spyOn(joplin.data, "post").mockImplementation((path: string[], data: any) => {
            if (path[0] === "resources") {
                return new Promise(resolve => {
                    const index = resourceResolvers.length + 1;
                    resourceResolvers.push(() => resolve({ id: `res${index}` }));
                });
            }
            if (path[0] === "notes") {
                return Promise.resolve({ id: `note-${data.title}` });
            }
            return Promise.resolve({});
        });

        const dropPromise = onFileDrop({ files });
        let dropResolved = false;
        dropPromise.then(() => { dropResolved = true; });

        await flushPromises();
        expect(selectedFolderMock).toHaveBeenCalledTimes(1);
        expect(postMock.mock.calls.filter(call => call[0][0] === "resources").length).toBe(2);
        expect(dropResolved).toBe(false);

        for (const resolve of resourceResolvers) resolve();
        await dropPromise;

        expect(postMock.mock.calls.filter(call => call[0][0] === "notes").length).toBe(2);
        expect(postMock).toHaveBeenCalledWith(["notes"], {
            title: "test1.txt",
            body: "[](:/res1)",
            parent_id: "folder1",
        });
        expect(postMock).toHaveBeenCalledWith(["notes"], {
            title: "test2.txt",
            body: "[](:/res2)",
            parent_id: "folder1",
        });
    });

    test("prompts for notebook when none selected", async () => {
        const file = { name: "test.txt" } as any;
        const selectedFolderMock = jest.fn().mockResolvedValue(null);
        (joplin as any).workspace = { selectedFolder: selectedFolderMock } as any;
        const getUserFolderSelectionMock = jest.spyOn(folders, "getUserFolderSelection").mockResolvedValue(null);
        const postMock = jest.spyOn(joplin.data, "post");

        await onFileDrop({ files: [file] });

        expect(getUserFolderSelectionMock).toHaveBeenCalledTimes(1);
        expect(postMock).not.toHaveBeenCalled();
    });

    test("shows error and logs when creation fails", async () => {
        const file = { name: "test.txt" } as any;
        const selectedFolderMock = jest.fn().mockResolvedValue({ id: "folder1" });
        (joplin as any).workspace = { selectedFolder: selectedFolderMock } as any;
        jest.spyOn(joplin.data, "post").mockImplementation(async () => { throw new Error("fail"); });
        jest.spyOn(joplin.settings, "globalValue").mockResolvedValue("/tmp");
        const showMessageMock = jest.spyOn(joplin.views.dialogs, "showMessageBox").mockResolvedValue(0);
        const logMock = jest.spyOn(Logger.prototype, "log").mockResolvedValue();

        await onFileDrop({ files: [file] });

        expect(showMessageMock).toHaveBeenCalledTimes(1);
        expect(logMock).toHaveBeenCalledTimes(1);
    });
});

describe("initializeFileDrop", () => {
    test("subscribes to workspace.onFileDrop when available", async () => {
        const disposable = { dispose: jest.fn() } as any;
        const onFileDropMock = jest.fn().mockResolvedValue(disposable);
        (joplin as any).workspace = { onFileDrop: onFileDropMock } as any;

        const result = await initializeFileDrop();

        expect(onFileDropMock).toHaveBeenCalledWith(onFileDrop);
        expect(result).toBe(disposable);
    });

    test("shows warning when onFileDrop is unavailable", async () => {
        (joplin as any).workspace = {} as any;
        const messageMock = jest.spyOn(joplin.views.dialogs, "showMessageBox").mockResolvedValue(0);

        const result = await initializeFileDrop();

        expect(result).toBeNull();
        expect(messageMock).toHaveBeenCalled();
    });
});
