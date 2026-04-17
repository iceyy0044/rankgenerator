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
    leftUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/lavy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvbGF2eV9iZy5wbmciLCJpYXQiOjE3NzY0MjgyMjMsImV4cCI6MTc1NDQ0MjgyMjN9.iyQ7-wH71KHoPpVE7NdMp67YpOdYqwXNJUCC1XvT-og",
    middleUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/stred_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc3RyZWRfYmcucG5nIiwiaWF0IjoxNzc2NDI4MjY2LCJleHAiOjE3NTQ0NDI4MjY2fQ.u_JfCEW9eVSSGuqXQ1BK6P8WEbfzwSjt10PHRvTbbqY",
    rightUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/pravy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvcHJhdnlfYmcucG5nIiwiaWF0IjoxNzc2NDI4MjUyLCJleHAiOjE3NTQ0NDI4MjUyfQ.iZL4zSOudwj_Xqex8QdGEwBczH6OsnnuitahWmGb_hk",
    tileHeight: 9,
    leftWidth: 4,
    middleWidth: 6,
    rightWidth: 8,
  },
]

export const DEFAULT_STYLE_ID = "classic"
