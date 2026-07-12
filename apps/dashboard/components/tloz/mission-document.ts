export function withoutTaskLines(markdown: string) {
  return markdown.split(/\r?\n/).filter((line) => !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)).join("\n").trim();
}

const taskLinePattern = /^(\s*[-*+]\s+\[)([ xX])(\]\s+)(.*)$/;

export function updateTaskLine(markdown: string, position: number, change: { completed?: boolean; title?: string; remove?: boolean }) {
  let taskPosition = 0;
  return markdown.split(/(\r?\n)/).map((line) => {
    const match = line.match(taskLinePattern);
    if (!match) return line;
    if (taskPosition++ !== position) return line;
    if (change.remove) return "";
    const marker = change.completed === undefined ? match[2] : change.completed ? "x" : " ";
    const title = change.title === undefined ? match[4] : change.title;
    return `${match[1]}${marker}${match[3]}${title}`;
  }).join("");
}

export function appendTaskLine(markdown: string, title: string) {
  const separator = markdown.trim() ? "\n" : "";
  return `${markdown.trimEnd()}${separator}- [ ] ${title}`;
}
