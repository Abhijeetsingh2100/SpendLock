import type { ImageSourcePropType } from "react-native";

import { icons } from "@/constants/icons";

type IconResolution = {
  icon: ImageSourcePropType;
  iconGlyph?: string;
};

const brandIconKeywords: { keywords: string[]; icon: ImageSourcePropType }[] = [
  { keywords: ["adobe", "creative cloud"], icon: icons.adobe },
  { keywords: ["canva"], icon: icons.canva },
  { keywords: ["claude", "anthropic"], icon: icons.claude },
  { keywords: ["dropbox"], icon: icons.dropbox },
  { keywords: ["figma"], icon: icons.figma },
  { keywords: ["github", "git hub"], icon: icons.github },
  { keywords: ["medium"], icon: icons.medium },
  { keywords: ["netflix"], icon: icons.netflix },
  { keywords: ["notion"], icon: icons.notion },
  { keywords: ["openai", "chatgpt", "chat gpt"], icon: icons.openai },
  { keywords: ["spotify"], icon: icons.spotify },
];

const categoryGlyphs: Record<string, string> = {
  Entertainment: "movie-open-outline",
  "AI Tools": "robot-outline",
  "Developer Tools": "code-tags",
  Design: "palette-outline",
  Productivity: "checkbox-marked-circle-outline",
  Cloud: "cloud-outline",
  Music: "music-note-outline",
  Other: "wallet-outline",
};

export const resolveSubscriptionIcon = (name: string, category?: string): IconResolution => {
  const normalizedName = name.trim().toLowerCase();
  const brandMatch = brandIconKeywords.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  if (brandMatch) {
    return { icon: brandMatch.icon };
  }

  return {
    icon: icons.wallet,
    iconGlyph: categoryGlyphs[category ?? "Other"] ?? categoryGlyphs.Other,
  };
};
