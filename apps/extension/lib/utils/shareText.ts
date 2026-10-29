// Share-on-X copy and the og card service. Written like a person talking,
// no emoji or slogans: the tweet has to read as yours, not as an ad.

export const OG_BASE_URL =
  process.env.PLASMO_PUBLIC_OG_BASE_URL || "https://og.sofia.intuition.box"

const MAX_TITLE = 60

const shortTitle = (title: string) =>
  title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1)}…` : title

const ordinal = (n: number) => {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`
}

/** One page recommended: first in, or how early. */
export function buildPageShareText(title: string, rank: number | null) {
  const page = `"${shortTitle(title)}"`
  if (rank === 1)
    return (
      `Nobody on @0xSofia had recommended ${page} yet. Now I have. ` +
      `We'll see if I was early or just wrong.`
    )
  if (rank)
    return `${page} is worth your time. I'm the ${ordinal(rank)} person to back it on @0xSofia, still early.`
  return `${page} is worth your time. Just backed it on @0xSofia.`
}

/** Several pages published at once, `firsts` of them before anyone else. */
export function buildBatchShareText(count: number, firsts: number) {
  if (count === 1)
    return firsts
      ? `Nobody on @0xSofia had recommended this one yet. Now I have. We'll see if I was early or just wrong.`
      : `A page I'd actually recommend, now on @0xSofia.`
  if (firsts === 0)
    return `${count} pages I'd actually recommend, now on @0xSofia.`
  const firstOn = firsts === count ? "every one of them" : `${firsts} of them`
  return `Put my name on ${count} pages on @0xSofia today, first one in on ${firstOn}. Let's see who follows.`
}
