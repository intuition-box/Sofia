import { gql } from 'graphql-request';
import { AccountMetadata } from '../fragments/account';
import { AtomValue } from '../fragments/atom';

export const GET_ACCOUNT_INFO = gql`
  ${AccountMetadata}
  ${AtomValue}

  query GetAccountInfo($address: String!) {
    account(id: $address) {
      ...AccountMetadata
      atoms(limit: 20) {
        term_id
        label
        data
        value {
          thing {
            description
          }
        }
        term {
          vaults(where: { curve_id: { _eq: "1" } }) {
            total_shares
            positions_aggregate(where: { account_id: { _eq: $address } }) {
              nodes {
                account {
                  id
                }
                shares
              }
            }
          }
        }
      }
      triples {
        term_id
        subject {
          term_id
          label
          value {
            thing {
              id
              image
              description
            }
            account {
              id
              label
              image
            }
            person {
              id
              image
              description
            }
            organization {
              id
              image
              description
            }
          }
        }
        predicate {
          term_id
          label
          value {
            thing {
              id
              image
              description
            }
            account {
              id
              label
              image
            }
            person {
              id
              image
              description
            }
            organization {
              id
              image
              description
            }
          }
        }
        object {
          term_id
          label
          value {
            thing {
              id
              image
              description
            }
            account {
              id
              label
              image
            }
            person {
              id
              image
              description
            }
            organization {
              id
              image
              description
            }
          }
        }
      }
      positions(
        where: { shares: { _gt: "0" } }
        limit: 50
        order_by: { shares: desc }
      ) {
        id
        shares
        term {
          vaults(where: { curve_id: { _eq: "1" } }) {
            term_id
            position_count
            total_shares
            current_share_price
          }
          atom {
            term_id
            label
            image
            value {
              ...AtomValue
            }
          }
          triple {
            term_id
            counter_term_id
            subject {
              term_id
              label
              value {
                ...AtomValue
              }
            }
            predicate {
              term_id
              label
              value {
                ...AtomValue
              }
            }
            object {
              term_id
              label
              value {
                ...AtomValue
              }
            }
            # Include support vault info
            term {
              vaults(where: { curve_id: { _eq: "1" } }) {
                term_id
                position_count
                total_shares
                current_share_price
                # Check for user's supporting position
                userPosition: positions(
                  limit: 1
                  where: { account_id: { _ilike: $address } }
                ) {
                  shares
                  account_id
                }
              }
            }
            # Include counter vault info for opposition detection
            counter_term {
              vaults(where: { curve_id: { _eq: "1" } }) {
                term_id
                position_count
                total_shares
                current_share_price
                # Check for user's opposing position
                userPosition: positions(
                  limit: 1
                  where: { account_id: { _ilike: $address } }
                ) {
                  shares
                  account_id
                }
              }
            }
          }
        }
      }
    }
  }
`;
