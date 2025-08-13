import joplin from "api";
import { performAction, TemplateAction } from "../src/actions";
import { NewNote } from "../src/parser";

describe("performAction with no selected folder", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    const baseTemplate: NewNote = {
        title: "test",
        body: "body",
        tags: [],
        folder: null,
        todo_due: null,
    };

    test("shows message when creating note without selected folder", async () => {
        const selectedFolderMock = jest.fn().mockResolvedValue(null);
        (joplin as unknown as { workspace: { selectedFolder: jest.Mock } }).workspace = { selectedFolder: selectedFolderMock };
        const showMessageMock = jest.spyOn(joplin.views.dialogs, "showMessageBox").mockResolvedValue(0);
        const postMock = jest.spyOn(joplin.data, "post");

        await performAction(TemplateAction.NewNote, baseTemplate);

        expect(showMessageMock).toHaveBeenCalled();
        expect(postMock).not.toHaveBeenCalled();
    });

    test("shows message when creating todo without selected folder", async () => {
        const selectedFolderMock = jest.fn().mockResolvedValue(null);
        (joplin as unknown as { workspace: { selectedFolder: jest.Mock } }).workspace = { selectedFolder: selectedFolderMock };
        const showMessageMock = jest.spyOn(joplin.views.dialogs, "showMessageBox").mockResolvedValue(0);
        const postMock = jest.spyOn(joplin.data, "post");

        await performAction(TemplateAction.NewTodo, baseTemplate);

        expect(showMessageMock).toHaveBeenCalled();
        expect(postMock).not.toHaveBeenCalled();
    });
});
