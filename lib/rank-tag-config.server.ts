import { RankTagStyle } from "@/lib/rank-tag-config";

// This config uses local file paths for server-side rendering.
// Make sure your image files are located in the 'public/rank-tag-tiles/' directory.

export const RANK_TAG_STYLES_SERVER: RankTagStyle[] = [
      {
        id: "rounded",
        name: "Rounded Corners",
        description: "",
        leftUrl: "rank-tag-tiles/lavy_bg.png",
        middleUrl: "rank-tag-tiles/stred_bg.png",
        rightUrl: "rank-tag-tiles/pravy_bg.png",
        tileHeight: 12,
        leftWidth: 7,
        middleWidth: 6,
        rightWidth: 8,
      },
      {
        id: "squared",
        name: "Squared",
        description: "",
        leftUrl: "rank-tag-tiles/sq_lavy_bg.png",
        middleUrl: "rank-tag-tiles/sq_stred_bg.png",
        rightUrl: "rank-tag-tiles/sq_pravy_bg.png",
        tileHeight: 12,
        leftWidth: 7,
        middleWidth: 6,
        rightWidth: 8,
      },
      {
        id: "extra-rounded",
        name: "Extra Rounded",
        description: "",
        leftUrl: "rank-tag-tiles/rd_lavy_bg.png",
        middleUrl: "rank-tag-tiles/rd_stred_bg.png",
        rightUrl: "rank-tag-tiles/rd_pravy_bg.png",
        tileHeight: 12,
        leftWidth: 7,
        middleWidth: 6,
        rightWidth: 8,
      },
      {
        id: "medieval",
        name: "Medieval",
        description: "",
        leftUrl: "rank-tag-tiles/sg_lavy_bg.png",
        middleUrl: "rank-tag-tiles/sg_stred_bg.png",
        rightUrl: "rank-tag-tiles/sg_pravy_bg.png",
        tileHeight: 12,
        leftWidth: 8,
        middleWidth: 6,
        rightWidth: 9,
      }
];
