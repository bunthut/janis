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
    require: (): unknown => { return ""; },
    data: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        post: async (path: string[], query: unknown, body: unknown): Promise<unknown> => { return {}; },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        get: async (path: string[], query: unknown): Promise<unknown> => { return {}; },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        put: async (path: string[], query: unknown, body: unknown): Promise<unknown> => { return {}; },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        resourcePath: async (id: string): Promise<string> => { return ""; },
    },
    plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
        register: (_plugin: unknown): void => { return; },
    }
};
