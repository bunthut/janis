import { DateAndTimeUtils } from "@templates/utils/dateAndTime";
import { encode } from "html-entities";
import { CustomVariable } from "./base";

export class BooleanCustomVariable extends CustomVariable {
    static definitionName = "boolean";

    protected inputHTML(): string {
        return (
            `
            <select name="${encode(this.name)}">
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>
            `
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Old code before rule was applied
    public processInput(input: string, dateAndTimeUtils: DateAndTimeUtils): boolean {
        return input === "true";
    }
}
