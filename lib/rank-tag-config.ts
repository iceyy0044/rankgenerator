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
    id: "rounded",
    name: "Rounded Corners",
    description: "",
    leftUrl: "https://images.guns.lol/fac07446fa95e8dcfb1c9b5c45f47f31d1724fe9/5X0zov.png",
    middleUrl: "https://images.guns.lol/fac07446fa95e8dcfb1c9b5c45f47f31d1724fe9/ndDJMU.png",
    rightUrl: "https://images.guns.lol/fac07446fa95e8dcfb1c9b5c45f47f31d1724fe9/YkATQ5.png",
    tileHeight: 12,
    leftWidth: 7,
    middleWidth: 6,
    rightWidth: 8,
  },
  {
    id: "squared",
    name: "Squared",
    description: "",
    leftUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sq_lavy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc3FfbGF2eV9iZy5wbmciLCJpYXQiOjE3NzY0NTMyNzgsImV4cCI6MTc1NDQ0NTMyNzh9.yXaZ_8Yae3oRWkKZXjTj9YYmXaNG3fwbnCCCEt_5oek",
    middleUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sq_stred_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc3Ffc3RyZWRfYmcucG5nIiwiaWF0IjoxNzc2NDUwOTgyLCJleHAiOjE3NTQ0NDUwOTgyfQ.dNbKnX35AqeyvP9n_yhR-TwWNQLXNg4BsjDu_qgfxHk",
    rightUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sq_pravy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc3FfcHJhdnlfYmcucG5nIiwiaWF0IjoxNzc2NDUwOTY3LCJleHAiOjE3NTQ0NDUwOTY3fQ.8RCH7kjeAIYWj7_6asBaREYhh7kDRgZwYyZlctUDE8U",
    tileHeight: 12,
    leftWidth: 7,
    middleWidth: 6,
    rightWidth: 8,
  },
  {
    id: "extra-rounded",
    name: "Extra Rounded",
    description: "",
    leftUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/rd_lavy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvcmRfbGF2eV9iZy5wbmciLCJpYXQiOjE3NzY0NTg2NjYsImV4cCI6MTc1NDQ0NTg2NjZ9.903Dn1FvF68GpnCMA-ogZxdr8ZnchWn07X2YVHQk5W4",
    middleUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/rd_stred_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvcmRfc3RyZWRfYmcucG5nIiwiaWF0IjoxNzc2NDU4NzAzLCJleHAiOjE3NTQ0NDU4NzAzfQ.ZTuk9R_x1tD685qUX-btWL3pDLr8nww21XQ2Di8I_jQ",
    rightUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/rd_pravy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvcmRfcHJhdnlfYmcucG5nIiwiaWF0IjoxNzc2NDU4Njg3LCJleHAiOjE3NTQ0NDU4Njg3fQ.nDYhWa8QXyhAX56HeJkLzryC58bUs9VM4h-R6yANT0s",
    tileHeight: 12,
    leftWidth: 7,
    middleWidth: 6,
    rightWidth: 8,
  },
  {
    id: "medieval",
    name: "Medieval",
    description: "",
    leftUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sg_lavy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc2dfbGF2eV9iZy5wbmciLCJpYXQiOjE3NzY0NTg1NDEsImV4cCI6MTc1NDQ0NTg1NDF9._fuLv2Mp1_8k1qGSWuf1d-jX7-F-xgQX6o6NA2thSy4",
    middleUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sg_stred_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc2dfc3RyZWRfYmcucG5nIiwiaWF0IjoxNzc2NDU4NTk4LCJleHAiOjE3NTQ0NDU4NTk4fQ.HgB559jmgGE1rx6TOEIxj6TabGFceMyRGlKNC0UG2wQ",
    rightUrl: "https://tmmijtrssqoabdbqucij.supabase.co/storage/v1/object/sign/Images/sg_pravy_bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNjg0MGY5Yi02Mjc2LTQ4MjQtOGEyOC0xODc3ZTY4NTFhNzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvc2dfcHJhdnlfYmcucG5nIiwiaWF0IjoxNzc2NDU4NTY3LCJleHAiOjE3NTQ0NDU4NTY3fQ.T26ljLcTZfOqNMVknuOjU8o0GpA_UUhZS3-eMMJT4Gg",
    tileHeight: 12,
    leftWidth: 8,
    middleWidth: 6,
    rightWidth: 9,
  },
]

export const DEFAULT_STYLE_ID = "classic"
