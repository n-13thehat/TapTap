export const cn = (...arr: Array<string | null | undefined | false>) =>
  arr.filter(Boolean).join(" ");
