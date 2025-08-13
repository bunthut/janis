import joplin from "api";
import { onFileDrop, initializeFileDrop } from "../src/index";

describe("onFileDrop", () => {
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
