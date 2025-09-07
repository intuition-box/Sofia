import { intuitionTestnet } from '../lib/config'

export const CURRENT_ENV = 'development'

export const DEFAULT_VERIFIER = function (): void {
  throw new Error('verify function must be implemented')
}
export const DEFAULT_LIMIT = 10

export const MIN_DEPOSIT = CURRENT_ENV === 'development' ? 0.00069 : 0.00042
// Form constants
export const MAX_NAME_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 512
export const MAX_UPLOAD_SIZE = 1024 * 1024 * 5 // 5MB
export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]
export const ACCEPTED_IMAGE_TYPES = ['jpeg', 'jpg', 'png']

export const BLOCK_EXPLORER_URL = 'https://testnet.explorer.intuition.systems'

export const IPFS_GATEWAY_URL = 'https://ipfs.io/ipfs'

export const CREATE_RESOURCE_ROUTE = '/resources/create'
export const CREATE_CLAIM_RESOURCE_ROUTE = '/resources/create-claim'
export const GET_IDENTITIES_BY_IDS_RESOURCE_ROUTE =
  '/resources/get-identities-by-ids'
export const GET_IDENTITIES_RESOURCE_ROUTE = '/resources/get-identities'
export const GET_IDENTITIES_BY_PARAM_RESOURCE_ROUTE =
  '/resources/get-identities-by-param'
export const SEARCH_IDENTITIES_RESOURCE_ROUTE = '/resources/search-identities'
export const SEARCH_IDENTITIES_BY_TAGS_RESOURCE_ROUTE =
  '/resources/search-identities-by-tags'
export const TAG_RESOURCE_ROUTE = '/resources/tag'
export const SEARCH_CLAIMS_BY_IDS_RESOURCE_ROUTE =
  '/resources/search-claims-by-ids'
export const GET_VAULT_DETAILS_RESOURCE_ROUTE = '/resources/get-vault-details'


// SPECIAL ATOMS

export const TAG_PREDICATE_VAULT_ID_TESTNET = 3 // used in testnet tag claim as predicate
export const I_PREDICATE_VAULT_ID_TESTNET = 13
export const AM_FOLLOWING_VAULT_ID_TESTNET = 4
export const THING_VAULT_ID_TESTNET = 2

export const TAG_PREDICATE_ID_TESTNET = '6eab2a76-687e-4f23-9429-276eb14e6c6c'
export const I_PREDICATE_ID_TESTNET = '6b8c8a43-6338-4a96-a3b6-fc8cc4910600'
export const AM_FOLLOWING_ID_TESTNET = 'b369445b-2310-4a89-8335-8c5c61e1b464'
export const THING_ID_TESTNET = 'cd43092d-8698-46da-96a6-fd2b8551dde0'

export const TAG_PREDICATE_DISPLAY_NAME_TESTNET = 'has tag'
export const I_PREDICATE_DISPLAY_NAME_TESTNET = 'I'
export const AM_FOLLOWING_DISPLAY_NAME_TESTNET = 'am following'
export const THING_DISPLAY_NAME_TESTNET = 'thing'

// FEATURED LISTS

export const FEATURED_LIST_OBJECT_IDS = [33, 22]

// So generally, we consider the DSN safe to be shared publicly. Of course, you don't want to unnecessarily share the DSN for any backend projects you have, but there is no real way of hiding the DSN in the frontend (except for maybe obscuring it, but security by obscurity is no real security). https://github.com/getsentry/sentry-javascript/issues/5640#issuecomment-1229960048
export const SENTRY_DSN =
  'https://de49927453262eeb56a313be2d02c052@o4507699051560960.ingest.us.sentry.io/4507699076399104'