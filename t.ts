import { program } from "commander";

program.argument("<prompt>");
program.parse(process.argv);

const prompt = program.processedArgs[0];
main(prompt);

function main(prompt: string) {
  console.log("hello", prompt);
}
