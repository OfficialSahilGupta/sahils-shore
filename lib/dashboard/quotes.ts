// ============================================================================
// Sahil's Shore: Weather-Free Quotes of the Day
// Thoughtfully curated calm, coastal, craftsmanship & focus quotes
// Deterministically selected per IST calendar day
// ============================================================================

import { todayIST } from "../date-utils.ts";

export interface Quote {
  text: string;
  author: string;
}

export const DAILY_QUOTES: Quote[] = [
  {
    text: "The shore is not where the ocean ends, but where your journey begins.",
    author: "Shore Philosophy",
  },
  {
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    text: "Simplicity is the prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
  },
  {
    text: "Smooth seas do not make skillful sailors.",
    author: "African Proverb",
  },
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
  },
  {
    text: "Small daily disciplines repeated consistently lead to exponential compounding.",
    author: "Robin Sharma",
  },
  {
    text: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    author: "Cal Newport",
  },
  {
    text: "First do it, then do it right, then do it better.",
    author: "Addy Osmani",
  },
  {
    text: "Mastery is not an overnight leap, but a quiet habit of continuous devotion.",
    author: "George Leonard",
  },
  {
    text: "Knowledge isn't power until it is applied and refined into wisdom.",
    author: "Dale Carnegie",
  },
  {
    text: "In the depth of patient focus, the noise of the world recedes into clarity.",
    author: "Shore Philosophy",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
  },
  {
    text: "Make each day your masterpiece, one focused hour at a time.",
    author: "John Wooden",
  },
  {
    text: "The quieter you become, the more you are able to hear.",
    author: "Rumi",
  },
  {
    text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    author: "Antoine de Saint-Exupéry",
  },
  {
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
  {
    text: "Patience and persistence have a quiet power before which obstacles steadily vanish.",
    author: "John Quincy Adams",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe.",
    author: "Abraham Lincoln",
  },
  {
    text: "Anchor your mind in the present moment. Your future is constructed right here.",
    author: "Shore Philosophy",
  },
  {
    text: "Discipline equals freedom.",
    author: "Jocko Willink",
  },
  {
    text: "Code is like humor. When you have to explain it, it’s bad.",
    author: "Cory House",
  },
  {
    text: "The tide always turns for the steady and patient observer.",
    author: "Shore Philosophy",
  },
];

/**
 * Deterministically chooses the quote of the day using an IST date string hash.
 * This guarantees stable hydration and consistency across all devices on the same day.
 */
export function getQuoteOfTheDay(dateStr: string = todayIST()): Quote {
  if (!dateStr) return DAILY_QUOTES[0];

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
