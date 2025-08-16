import joplin from "api";
import { MenuItemLocation, Disposable } from "api/types";
import { Parser } from "./parser";
import { DateAndTimeUtils } from "./utils/dateAndTime";
import { getFolderFromId, getSelectedFolder, getUserFolderSelection, Folder } from "./utils/folders";
import { getUserDefaultTemplateTypeSelection, setDefaultTemplate } from "./utils/defaultTemplates";
import { getTemplateFromId, getUserTemplateSelection, Note } from "./utils/templates";
import { setDefaultTemplatesView, DefaultTemplatesDisplayData, NotebookDefaultTemplatesDisplayData } from "./views/defaultTemplates";
import { TemplateAction, performAction } from "./actions";
import { loadLegacyTemplates } from "./legacyTemplates";
import open from "open";
import { Logger } from "./logger";
import { PromiseGroup, NamedPromiseGroup } from "./utils/promises";
import { PluginSettingsRegistry, DefaultNoteTemplateIdSetting, DefaultTodoTemplateIdSetting, DefaultTemplatesConfigSetting, TemplatesSourceSetting } from "./settings";
import { LocaleGlobalSetting, DateFormatGlobalSetting, TimeFormatGlobalSetting, ProfileDirGlobalSetting } from "./settings/global";
import { DefaultTemplatesConfig } from "./settings/defaultTemplatesConfig";
import templatesImportModule from "./importModule";
import { setTimelineView, TimelineNote } from "./views/timeline";
import { processAttachment } from "./utils/attachmentProcessing";
import { TemplatesSource } from "./settings/templatesSource";
import { applyTagToNote, getAnyTagWithTitle } from "./utils/tags";

export const onFileDrop = async (event: { files: any[] } | null) => {
    try {
        if (!event || !event.files) return;

        let folder = await joplin.workspace.selectedFolder();
        if (!folder) {
            const selected = await getUserFolderSelection();
            if (!selected) return;
            folder = JSON.parse(selected);
        }

        const promises: Promise<void>[] = [];

        for (const file of event.files) {
            const promise = (async () => {
                const resource: any = await joplin.data.post(["resources"], file);
                const note = {
                    title: file.name || "Dropped file",
                    body: `[](:/${resource.id})`,
                    parent_id: folder.id,
                };
                await joplin.data.post(["notes"], note);
            })();
            promises.push(promise);
        }

        await Promise.all(promises);
    } catch (error) {
        await joplin.views.dialogs.showMessageBox(`There was an error creating notes from dropped files.\n\n${error}`);
        const profileDir = await ProfileDirGlobalSetting.get();
        const logger = new Logger(profileDir);
        await logger.log(`onFileDrop error: ${error}`);
    }
};

export const initializeFileDrop = async (): Promise<Disposable | null> => {
    if (joplin.workspace && joplin.workspace.onFileDrop) {
        return await joplin.workspace.onFileDrop(onFileDrop);
    }
    await joplin.views.dialogs.showMessageBox("File drop is not supported in this version of Joplin.");
    return null;
};

export const importTemplateFromFile = async (): Promise<void> => {
    const electron = joplin.require("electron");
    const fs = joplin.require("fs-extra");
    const path = joplin.require("path");

    const { canceled, filePaths } = await electron.remote.dialog.showOpenDialog({
        properties: ["openFile"],
    });

    if (canceled || !filePaths || filePaths.length === 0) return;

    try {
        const filePath = filePaths[0];
        const raw = await fs.readFile(filePath, "utf8");
        const firstLineIndex = raw.indexOf("\n");
        const title = firstLineIndex >= 0
            ? raw.slice(0, firstLineIndex).trim() || path.basename(filePath, path.extname(filePath))
            : path.basename(filePath, path.extname(filePath));
        const body = firstLineIndex >= 0 ? raw.slice(firstLineIndex + 1) : raw;

        const note: any = await joplin.data.post(["notes"], null, { title, body });

        if (await TemplatesSourceSetting.get() === TemplatesSource.Tag) {
            const tagId = (await getAnyTagWithTitle("template")).id;
            await applyTagToNote(tagId, note.id);
        }
    } catch (error) {
        await joplin.views.dialogs.showMessageBox(`Failed to import template: ${error}`);
    }
};

const documentationUrl = "https://github.com/joplin/janis#readme";

joplin.plugins.register({
    onStart: async function() {
        // Register setting section
        await PluginSettingsRegistry.registerSettings();


        // Global variables
        const joplinGlobalApis = new NamedPromiseGroup();

        joplinGlobalApis.add("dialogViewHandle", joplin.views.dialogs.create("dialog"));
        joplinGlobalApis.add("timelineViewHandle", joplin.views.dialogs.create("timeline"));
        joplinGlobalApis.add("userLocale", LocaleGlobalSetting.get());
        joplinGlobalApis.add("userDateFormat", DateFormatGlobalSetting.get());
        joplinGlobalApis.add("userTimeFormat", TimeFormatGlobalSetting.get());
        joplinGlobalApis.add("profileDir", ProfileDirGlobalSetting.get());

        const {
            dialogViewHandle,
            timelineViewHandle,
            userLocale,
            userDateFormat,
            userTimeFormat,
            profileDir,
        } = await joplinGlobalApis.all();

        const dateAndTimeUtils = new DateAndTimeUtils(userLocale, userDateFormat, userTimeFormat);
        const logger = new Logger(profileDir);
        const parser = new Parser(dateAndTimeUtils, dialogViewHandle, logger);

        await joplin.interop.registerImportModule(templatesImportModule);


        // Asynchronously load legacy templates
        loadLegacyTemplates(dateAndTimeUtils, profileDir);


        // Utility Functions
        const performActionWithParsedTemplate = async (action: TemplateAction, template: Note | null) => {
            const parsedTemplate = await parser.parseTemplate(template);
            if (parsedTemplate) {
                await performAction(action, parsedTemplate);
            }
        }

        const getTemplateAndPerformAction = async (action: TemplateAction) => {
            const template: Note = JSON.parse(await getUserTemplateSelection() || "null");
            await performActionWithParsedTemplate(action, template);
        }

        const getNotebookDefaultTemplatesDisplayData = async (settings: DefaultTemplatesConfig): Promise<NotebookDefaultTemplatesDisplayData[]> => {
            const getDisplayDataForNotebook = async (notebookId: string, defaultTemplateNoteId: string | null, defaultTemplateTodoId: string | null): Promise<NotebookDefaultTemplatesDisplayData | null> => {
                const promiseGroup = new NamedPromiseGroup();
                promiseGroup.add("notebook", getFolderFromId(notebookId));
                promiseGroup.add("noteTemplate", getTemplateFromId(defaultTemplateNoteId));
                promiseGroup.add("todoTemplate", getTemplateFromId(defaultTemplateTodoId));
                const { notebook, noteTemplate, todoTemplate } = await promiseGroup.all();

                if (notebook === null || (noteTemplate === null && todoTemplate === null)) {
                    // Async remove of the obsolete config
                    DefaultTemplatesConfigSetting.clearDefaultTemplates(notebookId);
                    return null;
                }
                return {
                    notebookTitle: notebook.title,
                    defaultNoteTemplateTitle: noteTemplate ? noteTemplate.title : null,
                    defaultTodoTemplateTitle: todoTemplate ? todoTemplate.title : null
                };
            }

            const notebookDisplayDataPromiseGroup = new PromiseGroup();
            for (const [notebookId, defaultTemplates] of Object.entries(settings)) {
                notebookDisplayDataPromiseGroup.add(getDisplayDataForNotebook(
                    notebookId, defaultTemplates.defaultNoteTemplateId, defaultTemplates.defaultTodoTemplateId));
            }
            return (await notebookDisplayDataPromiseGroup.all()).filter(x => x !== null);
        }


        // File drop handling
        let fileDropListener: Disposable | null = null;

        // Enable file drop by default so that dropped files create new notes automatically
        fileDropListener = await initializeFileDrop();

        // Register all commands
        const joplinCommands = new PromiseGroup();

        joplinCommands.add(joplin.commands.register({
            name: "createNoteFromTemplate",
            label: "Create note from template",
            execute: async () => {
                await getTemplateAndPerformAction(TemplateAction.NewNote);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "createTodoFromTemplate",
            label: "Create to-do from template",
            execute: async () => {
                await getTemplateAndPerformAction(TemplateAction.NewTodo);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "insertTemplate",
            label: "Insert template",
            execute: async () => {
                await getTemplateAndPerformAction(TemplateAction.InsertText);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "showDefaultTemplates",
            label: "Show default templates",
            execute: async () => {
                const noteTemplate = await getTemplateFromId(await DefaultNoteTemplateIdSetting.get());
                const todoTemplate = await getTemplateFromId(await DefaultTodoTemplateIdSetting.get());
                const defaultTemplatesConfig = await DefaultTemplatesConfigSetting.get();

                const globalDefaultTemplates: DefaultTemplatesDisplayData = {
                    defaultNoteTemplateTitle: noteTemplate ? noteTemplate.title : null,
                    defaultTodoTemplateTitle: todoTemplate ? todoTemplate.title : null
                };
                const notebookDisplayData = await getNotebookDefaultTemplatesDisplayData(defaultTemplatesConfig);

                await setDefaultTemplatesView(dialogViewHandle, globalDefaultTemplates, notebookDisplayData);
                await joplin.views.dialogs.open(dialogViewHandle);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "setDefaultTemplate",
            label: "Set default template",
            execute: async () => {
                const templateId = await getUserTemplateSelection("id");
                if (templateId === null) return;

                const defaultType = await getUserDefaultTemplateTypeSelection();
                if (defaultType === null) return;

                await setDefaultTemplate(null, templateId, defaultType);
                await joplin.views.dialogs.showMessageBox("Default template set successfully!");
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "setDefaultTemplateForNotebook",
            label: "Set default template for notebook",
            execute: async () => {
                const folder: Folder | null = JSON.parse(await getUserFolderSelection() || "null");
                if (folder === null) return;

                const templateId = await getUserTemplateSelection("id", `Default template for "${folder.title}":`);
                if (templateId === null) return;

                const defaultType = await getUserDefaultTemplateTypeSelection();
                if (defaultType === null) return;

                await setDefaultTemplate(folder.id, templateId, defaultType);
                await joplin.views.dialogs.showMessageBox(`Default template set for "${folder.title}" successfully!`);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "clearDefaultTemplatesForNotebook",
            label: "Clear default templates for notebook",
            execute: async () => {
                const folder: Folder | null = JSON.parse(await getUserFolderSelection() || "null");
                if (folder === null) return;

                await DefaultTemplatesConfigSetting.clearDefaultTemplates(folder.id);
                await joplin.views.dialogs.showMessageBox(`Default templates for "${folder.title}" cleared successfully!`);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "createNoteFromDefaultTemplate",
            label: "Create note from default template",
            execute: async () => {
                let defaultTemplate: Note | null = null;

                const defaultTemplatesConfig = await DefaultTemplatesConfigSetting.get();
                const currentFolderId = await getSelectedFolder();
                if (currentFolderId === null) {
                    await joplin.views.dialogs.showMessageBox("Please select a notebook to use default templates.");
                    return;
                }

                if (currentFolderId in defaultTemplatesConfig) {
                    defaultTemplate = await getTemplateFromId(defaultTemplatesConfig[currentFolderId].defaultNoteTemplateId);
                }

                if (defaultTemplate === null) {
                    defaultTemplate = await getTemplateFromId(await DefaultNoteTemplateIdSetting.get());
                }

                if (defaultTemplate) {
                    return await performActionWithParsedTemplate(TemplateAction.NewNote, defaultTemplate);
                }
                await joplin.views.dialogs.showMessageBox("No default note template is set.");
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "createTodoFromDefaultTemplate",
            label: "Create to-do from default template",
            execute: async () => {
                let defaultTemplate: Note | null = null;

                const defaultTemplatesConfig = await DefaultTemplatesConfigSetting.get();
                const currentFolderId = await getSelectedFolder();
                if (currentFolderId === null) {
                    await joplin.views.dialogs.showMessageBox("Please select a notebook to use default templates.");
                    return;
                }

                if (currentFolderId in defaultTemplatesConfig) {
                    defaultTemplate = await getTemplateFromId(defaultTemplatesConfig[currentFolderId].defaultTodoTemplateId);
                }

                if (defaultTemplate === null) {
                    defaultTemplate = await getTemplateFromId(await DefaultTodoTemplateIdSetting.get());
                }

                if (defaultTemplate) {
                    return await performActionWithParsedTemplate(TemplateAction.NewTodo, defaultTemplate);
                }
                await joplin.views.dialogs.showMessageBox("No default to-do template is set.");
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "importTemplateFromFile",
            label: "Import template from file",
            execute: importTemplateFromFile,
        }));

        joplinCommands.add(joplin.commands.register({
            name: "showTimeline",
            label: "Show timeline",
            execute: async () => {
                const response: { items: TimelineNote[] } = await joplin.data.get([
                    "notes",
                ], {
                    fields: ["id", "title", "created_time"],
                    order_by: "created_time",
                    order_dir: "ASC",
                }) as { items: TimelineNote[] };
                await setTimelineView(timelineViewHandle, response.items);
                await joplin.views.dialogs.open(timelineViewHandle);
            },
        }));

        joplinCommands.add(joplin.commands.register({
            name: "showPluginDocumentation",
            label: "Help",
            execute: async () => {
                open(documentationUrl);
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "copyFolderID",
            label: "Copy notebook ID",
            execute: async (folderId: string) => {
                if (typeof folderId === "undefined") {
                    const selectedFolder = await joplin.workspace.selectedFolder();
                    folderId = selectedFolder.id;
                }
                await joplin.clipboard.writeText(folderId);

                await joplin.commands.execute("editor.focus");
            }
        }));

        joplinCommands.add(joplin.commands.register({
            name: "toggleFileDrop",
            label: "Toggle file drop",
            execute: async () => {
                if (fileDropListener) {
                    await fileDropListener.dispose();
                    fileDropListener = null;
                    await joplin.views.dialogs.showMessageBox("File drop disabled");
                } else {
                    fileDropListener = await initializeFileDrop();
                    if (fileDropListener) {
                        await joplin.views.dialogs.showMessageBox("File drop enabled");
                    }
                }
            }
        }));


        // Attachment processing for dropped resources
        const processedResources = new Set<string>();
        await joplin.workspace.onNoteChange(async ({ id, event }) => {
            if (event === 1 || event === 2) {
                const note: any = await joplin.data.get(["notes", id], { fields: ["body"] });
                const resourceRegex = /\(:\/([0-9a-fA-F]{32})\)/g;
                let match: RegExpExecArray | null;
                while ((match = resourceRegex.exec(note.body)) !== null) {
                    const resourceId = match[1];
                    if (!processedResources.has(resourceId)) {
                        await processAttachment(resourceId, id);
                        processedResources.add(resourceId);
                    }
                }
            }
        });


        // Create templates menu
        await joplin.views.menus.create("templates", "Templates", [
            {
                commandName: "createNoteFromTemplate",
                accelerator: "Alt+Ctrl+Shift+N"
            },
            {
                commandName: "createNoteFromDefaultTemplate",
                accelerator: "Alt+Shift+N"
            },
            {
                commandName: "createTodoFromTemplate",
                accelerator: "Alt+Ctrl+Shift+T"
            },
            {
                commandName: "createTodoFromDefaultTemplate",
                accelerator: "Alt+Shift+T"
            },
            {
                commandName: "insertTemplate",
                accelerator: "Alt+Ctrl+I"
            },
            {
                commandName: "showTimeline"
            },
            {
                commandName: "toggleFileDrop",
            },
            {
                label: "Default templates",
                submenu: [
                    {
                        commandName: "showDefaultTemplates"
                    },
                    {
                        commandName: "setDefaultTemplate"
                    },
                    {
                        commandName: "setDefaultTemplateForNotebook"
                    },
                    {
                        commandName: "clearDefaultTemplatesForNotebook"
                    },
                ]
            },
            {
                commandName: "showPluginDocumentation"
            }
        ]);

        await joplin.views.menus.create("importTemplates", "Import", [
            {
                commandName: "importTemplateFromFile",
            },
        ], MenuItemLocation.Tools);

        await joplin.views.menuItems.create(
            "showTimelineView",
            "showTimeline",
            MenuItemLocation.View
        );

        await joplinCommands.all();


        // Folder context menu
        await joplin.views.menuItems.create("templates_folderid", "copyFolderID", MenuItemLocation.FolderContextMenu);
    },
});
