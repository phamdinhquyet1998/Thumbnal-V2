
export type StyleKey = 'none' | 'red' | 'yellow' | 'blue';

export interface CharStyle {
  char: string;
  style: StyleKey;
}

export interface TextSegment {
  text: string;
  styleKey: StyleKey;
}

export const DEFAULT_TEXT = `SHE HAD AN AFFAIR
WITH MY CLOSE FRIEND
IT BROKE MY HEART
I TRIED FIXING US
FOR OUR FAMILY'S FUTURE
I KEPT ON TRYING
THEN I REVEALED
I'M A MILLIONAIRE`;
