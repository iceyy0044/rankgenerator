export interface RankTagStyle {
  id: string
  name: string
  description: string
  leftUrl: string
  middleUrl: string
  rightUrl: string
  /** Natural pixel height of the background images */
  tileHeight: number
  /** Natural pixel width of the left cap */
  leftWidth: number
  /** Natural pixel width of the right cap */
  rightWidth: number
  /** Natural pixel width of each middle tile */
  middleWidth: number
}

export const RANK_TAG_STYLES: RankTagStyle[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Standard gray-spectrum rank tag with left/middle/right tiles",
    leftUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lavy_bg-NVunlIDI26rqpFNALKu0HZJJ7L748a.png",
    middleUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stred_bg-iLMqqSyZYnWNZMK33AOspFk2IB5DlQ.png",
    rightUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pravy_bg-MLaSre84LdGU91h71r1DyuBCeCCZQn.png",
    tileHeight: 9,
    leftWidth: 4,
    middleWidth: 6,
    rightWidth: 4,
  },
]

export const DEFAULT_STYLE_ID = "classic"
