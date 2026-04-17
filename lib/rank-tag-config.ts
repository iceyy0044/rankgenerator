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
    leftUrl: "/rank-tag-tiles/lavy_bg.png",
    middleUrl: "/rank-tag-tiles/stred_bg.png",
    rightUrl: "/rank-tag-tiles/pravy_bg.png",
    tileHeight: 9,
    leftWidth: 4,
    middleWidth: 6,
    rightWidth: 4,
  },
]

export const DEFAULT_STYLE_ID = "classic"
