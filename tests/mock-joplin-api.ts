export default {
    commands: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        execute: async (cmd: string, props: unknown): Promise<unknown> => { return ""; }
    },
    views: {
        dialogs: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
            showMessageBox: async (message: string): Promise<number> => { return 0; },

            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
            open: async (handle: string): Promise<unknown> => { return ""; }
        }
    },
    settings: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        globalValue: async (setting: string): Promise<string> => { return ""; },
        value: async (setting: string): Promise<string> => { return ""; }
    },
    require: (): unknown => { return ""; }
};
