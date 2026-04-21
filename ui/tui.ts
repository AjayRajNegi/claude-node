import chalk, { type ChalkInstance } from "chalk";
import { Command } from "commander";

type ThemeKey =
  // General
  | "info"
  | "warning"
  | "error"
  | "success"
  | "dim"
  | "muted"
  | "border"
  | "highlight"
  // Roles
  | "user"
  | "assistant"
  // Tools
  | "tool"
  | "tool.read"
  | "tool.write"
  | "tool.shell"
  | "tool.network"
  | "tool.memory"
  | "tool.mcp"
  // Code
  | "code";

const AGENT_THEME: Record<ThemeKey, ChalkInstance> = {
  info: chalk.cyan,
  warning: chalk.yellow,
  error: chalk.redBright.bold,
  success: chalk.green,
  dim: chalk.dim,
  muted: chalk.hex("#808080"),
  border: chalk.hex("#5c5c5c"),
  highlight: chalk.cyanBright.bold,
  user: chalk.blueBright.bold,
  assistant: chalk.whiteBright,
  tool: chalk.magentaBright.bold,
  "tool.read": chalk.cyan,
  "tool.write": chalk.yellow,
  "tool.shell": chalk.magenta,
  "tool.network": chalk.blueBright,
  "tool.memory": chalk.green,
  "tool.mcp": chalk.cyanBright,
  code: chalk.white,
};

let _console: ReturnType<typeof createConsole> | null = null;

function createConsole() {
  function print(
    text = "",
    opts: { end?: string; style?: ThemeKey } = {},
  ): void {
    const { end = "\n", style } = opts;
    const styled = style ? AGENT_THEME[style](text) : text;
    process.stdout.write(styled + end);
  }

  function rule(title = "", style: ThemeKey = "assistant"): void {
    const cols = process.stdout.columns ?? 80;
    const styledTitle = ` ${AGENT_THEME[style](title)} `;
    const titleLen = title.length + 2;
    const dashLen = Math.max(0, cols - titleLen);
    const left = "─".repeat(Math.floor(dashLen / 2));
    const right = "─".repeat(Math.ceil(dashLen / 2));
    process.stdout.write(
      AGENT_THEME.border(left) + styledTitle + AGENT_THEME.border(right) + "\n",
    );
  }

  return { print, rule };
}

function getConsole(): ReturnType<typeof createConsole> {
  if (_console == null) {
    _console = createConsole();
  }
  return _console;
}

type TUIState = { assistantStreamOpen: boolean };

function createTUI(consoleInstance?: ReturnType<typeof createConsole>) {
  const con = consoleInstance ?? getConsole();
  const state: TUIState = { assistantStreamOpen: false };

  function beginAssistant(): void {
    con.print();
    con.rule("Assistant", "assistant");
    state.assistantStreamOpen = true;
  }

  function endAssistant(): void {
    if (state.assistantStreamOpen) {
      con.print();
    }
    state.assistantStreamOpen = false;
  }

  function streamAssistantDelta(content: string): void {
    con.print(content, { end: "" });
  }

  return { beginAssistant, endAssistant, streamAssistantDelta };
}

// const program = new Command();
// program.name("agent-tui").description("Agent terminal UI").version("1.0.0");
// program.parse(process.argv);

export { createConsole, getConsole, createTUI, AGENT_THEME };
export type { ThemeKey };
