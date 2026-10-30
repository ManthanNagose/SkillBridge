// "1 task", "3 tasks". Only for words that take a plain "s".
export function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
