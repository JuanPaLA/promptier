export function sectionTagAt(text: string, index: number): string | undefined {
  return /^<\/?[a-zA-Z][\w-]*>/.exec(text.slice(index))?.[0];
}

export function sectionTagMentions(text: string): IterableIterator<RegExpMatchArray> {
  return text.matchAll(/<\/?[a-zA-Z][\w-]*>/g);
}

export function hasUnfinishedSectionTag(text: string): boolean {
  return /<\/?[a-zA-Z][\w-]*$/.test(text);
}
