import { ToolCall } from "ai";
import { Tool } from "ai";

export type CustomTool = Partial<Tool> & {
  fixArgs?: (toolCall: ToolCall) => ARGS;
};
