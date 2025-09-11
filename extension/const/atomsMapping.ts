// Mapping of existing on-chain atoms with their IPFS URIs

// IPFS URI of manually created "User" atom
export const USER_ATOM_IPFS_URI = "ipfs://bafkreiarxi6whglrjisihmsn4tl2kx5f3zhe7sgq67c6rfw6ru4ijnqzh4"

export const PREDICATES_MAPPING: Record<string, string> = {
  "have visited": "ipfs://bafkreiaa6ljkzil66lnidqxayzsxp4r5aelajwmdf2q2qd7orpijqcuyn4",
  "love": "ipfs://bafkreih22bageqksejd3zlqokyziivikuo66i2gbtvpzcsl6a2agw6sq2a",
  "like": "ipfs://bafkreiejbzildzqu2y3zt32cyztldpma63qtkx67v6fetltohoni3lsvtq",
  "trust" : "ipfs://bafkreicdwhpwnhjgfvqulxab3zmdncbnnldgowpd5bbwrtnyfuw2ttsujq",
  "are interested by": "ipfs://bafkreigo6qefg3ssfgitcn7k3dnghcoy6yajlg7bmcbnuqnlfjdjkhe23y",
}

// Helper function to get IPFS URI of a predicate
export const getPredicateIpfsUri = (predicateName: string): string | null => {
  const normalizedName = predicateName.toLowerCase().trim()
  return PREDICATES_MAPPING[normalizedName] || null
}

// Helper function to check if a predicate exists
export const predicateExists = (predicateName: string): boolean => {
  return getPredicateIpfsUri(predicateName) !== null
}

// List of available predicates
export const getAvailablePredicates = (): string[] => {
  return Object.keys(PREDICATES_MAPPING)
}

// TODO: Replace IPFS URIs with real URIs of your manually created atoms