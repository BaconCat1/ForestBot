export const QUOTE_SERVERS = [
  "aksh",
  "anarchynetwork",
  "andromeda",
  "barevanilla",
  "deepnilla",
  "eupvp",
  "eusurvival",
  "exiledanarchy",
  "forestbot",
  "freedomvanilla",
  "mcvpg",
  "north-american-vanilla",
  "novaanarchy",
  "p-anarchy",
  "playanarchy",
  "purityvanilla",
  "refinedvanilla",
  "simpcraft",
  "simplyanarchy",
  "simplyvanilla",
  "straightupminecraft",
  "truevanilla",
  "uneasyevent",
  "uneasyvanilla",
  "vanillaanarchy",
  "vanillasteal",
] as const;

export type QuoteServer = typeof QUOTE_SERVERS[number];

export const QUOTE_SERVER_SET: ReadonlySet<QuoteServer> = new Set(QUOTE_SERVERS);
