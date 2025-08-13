import joplin from "api";
import { importTemplateFromFile } from "../src/index";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { TemplatesSourceSetting } from "../src/settings";
import { TemplatesSource } from "../src/settings/templatesSource";
import * as tags from "../src/utils/tags";

describe("importTemplateFromFile command", () => {
    beforeEach(() => {
        (joplin as any).require = require;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("converts selected file into a template note", async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tmpl-"));
        const file = path.join(dir, "note.md");
        await fs.writeFile(file, "Title\nBody");

        const showOpenDialogMock = jest.fn().mockResolvedValue({ canceled: false, filePaths: [file] });
        (joplin as any).require = (module: string) => {
            if (module === "electron") {
                return { remote: { dialog: { showOpenDialog: showOpenDialogMock } } };
            }
            return require(module);
        };

        jest.spyOn(TemplatesSourceSetting, "get").mockResolvedValue(TemplatesSource.Tag);
        const postMock = jest.spyOn(joplin.data, "post").mockResolvedValue({ id: "note1" } as any);
        const getTagMock = jest.spyOn(tags, "getAnyTagWithTitle").mockResolvedValue({ id: "tag1", title: "template" });
        const applyTagMock = jest.spyOn(tags, "applyTagToNote").mockResolvedValue();

        await importTemplateFromFile();

        expect(postMock).toHaveBeenCalledWith(["notes"], null, { title: "Title", body: "Body" });
        expect(getTagMock).toHaveBeenCalledWith("template");
        expect(applyTagMock).toHaveBeenCalledWith("tag1", "note1");
    });
});
