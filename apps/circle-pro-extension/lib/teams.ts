// Teams the user can file a link under. Mocked for the PoC — later this is the
// set of teams the signed-in user actually belongs to, fetched from the backend.
export interface Team {
  id: string
  label: string
}

export const TEAMS: Team[] = [
  { id: "eng", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "web3", label: "Web3" },
  { id: "finance", label: "Finance" },
  { id: "marketing", label: "Marketing" },
  { id: "research", label: "Research" },
  { id: "ops", label: "Ops" }
]
