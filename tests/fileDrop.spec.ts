import joplin from "api";
import { onFileDrop, initializeFileDrop } from "../src/index";
import { Logger } from "../src/logger";
import * as folders from "../src/utils/folders";


describe("onFileDrop", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test("creates a resource and note for dropped files", async () => {
        const file = { name: "test.txt" } as any;
        const selectedFolderMock = jest.fn().mockResolvedValue({ id: "folder1" });
        (joplin as any).workspace = { selectedFolder: selectedFolderMock } as any;
        const postMock = jest.spyOn(joplin.data, "post").mockImplementation(async (path: string[], data: any) => {
            if (path[0] === "resources") {
                return { id: "res1" };
            }
            if (path[0] === "notes") {
                return { id: "note1" };
            }
            return {};
        });

        await onFileDrop({ files: [file] });

        expect(selectedFolderMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledTimes(2);
        expect(postMock).toHaveBeenCalledWith(["resources"], file);
        expect(postMock).toHaveBeenCalledWith(["notes"], {
            title: "test.txt",
            body: "[](:/res1)",
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
