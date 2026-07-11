export type MissionChecklistItem = { title: string; completed: boolean };

export function withoutTaskLines(markdown: string) {
  return markdown.split(/\r?\n/).filter((line) => !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)).join("\n").trim();
}

export function withChecklist(markdown: string, checklist: MissionChecklistItem[]) {
  return [
    withoutTaskLines(markdown),
    checklist.map((item) => `- [${item.completed ? "x" : " "}] ${item.title}`).join("\n"),
  ].filter(Boolean).join("\n");
}
