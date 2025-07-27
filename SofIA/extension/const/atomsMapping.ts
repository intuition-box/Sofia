// Mapping des atoms existants on-chain avec leurs URIs IPFS

// URI IPFS de l'atom "User" créé manuellement
export const USER_ATOM_IPFS_URI = "ipfs://bafkreiarxi6whglrjisihmsn4tl2kx5f3zhe7sgq67c6rfw6ru4ijnqzh4"

// Mapping des predicates existants on-chain
export const PREDICATES_MAPPING: Record<string, string> = {
  "has visited": "ipfs://bafkreiaa6ljkzil66lnidqxayzsxp4r5aelajwmdf2q2qd7orpijqcuyn4",
  "loves": "ipfs://bafkreih22bageqksejd3zlqokyziivikuo66i2gbtvpzcsl6a2agw6sq2a",
  "likes": "ipfs://bafkreiejbzildzqu2y3zt32cyztldpma63qtkx67v6fetltohoni3lsvtq",
  "trust" : "ipfs://bafkreicdwhpwnhjgfvqulxab3zmdncbnnldgowpd5bbwrtnyfuw2ttsujq",
  "is interested by": "ipfs://bafkreigo6qefg3ssfgitcn7k3dnghcoy6yajlg7bmcbnuqnlfjdjkhe23y",
  // Ajoutez d'autres predicates ici selon vos besoins
}

// Fonction helper pour obtenir l'URI IPFS d'un predicate
export const getPredicateIpfsUri = (predicateName: string): string | null => {
  const normalizedName = predicateName.toLowerCase().trim()
  return PREDICATES_MAPPING[normalizedName] || null
}

// Fonction helper pour vérifier si un predicate existe
export const predicateExists = (predicateName: string): boolean => {
  return getPredicateIpfsUri(predicateName) !== null
}

// Liste des predicates disponibles
export const getAvailablePredicates = (): string[] => {
  return Object.keys(PREDICATES_MAPPING)
}

// TODO: Remplacez les URIs IPFS par les vrais URIs de vos atoms créés manuellement