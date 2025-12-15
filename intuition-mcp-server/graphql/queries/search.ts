import { gql } from 'graphql-request';

export const SEARCH_ATOMS = gql`
  query SearchAtoms($likeStr: String!) {
    atoms(
      where: {
        _or: [
          { data: { _ilike: $likeStr } }
          { value: { text_object: { data: { _ilike: $likeStr } } } }
          { value: { thing: { url: { _ilike: $likeStr } } } }
          { value: { thing: { name: { _ilike: $likeStr } } } }
          { value: { thing: { description: { _ilike: $likeStr } } } }
          { value: { person: { url: { _ilike: $likeStr } } } }
          { value: { person: { name: { _ilike: $likeStr } } } }
          { value: { person: { description: { _ilike: $likeStr } } } }
          { value: { organization: { url: { _ilike: $likeStr } } } }
          { value: { organization: { name: { _ilike: $likeStr } } } }
          { value: { organization: { description: { _ilike: $likeStr } } } }
        ]
      }
      order_by: { term: { triple: { term: { total_market_cap: desc } } } }
    ) {
      term_id
      image
      type
      label
      created_at
      creator {
        id
        label
        image
        cached_image {
          safe
          url
        }
      }
      value {
        account {
          id
          label
        }
        person {
          name
          description
          email
          url
          identifier
        }
        thing {
          url
          name
          description
        }
        organization {
          name
          email
          description
          url
        }
      }
      term {
        total_assets
        total_market_cap
        vaults(where: { curve_id: { _eq: "1" } }) {
          curve_id
          term_id
          position_count
          current_share_price
          total_shares
          total_assets
          market_cap
        }
      }
      as_subject_triples {
        term_id
        object {
          term_id
          label
          image
          type
        }
        predicate {
          term_id
          label
          image
          type
        }
        counter_term {
          total_market_cap
          total_assets
          vaults(where: { curve_id: { _eq: "1" } }) {
            curve_id
            term_id
            position_count
            current_share_price
            total_shares
            total_assets
            market_cap
          }
        }
        term {
          total_market_cap
          total_assets
          vaults(where: { curve_id: { _eq: "1" } }) {
            curve_id
            term_id
            position_count
            current_share_price
            total_shares
            total_assets
            market_cap
          }
        }
      }
    }
  }
`;

export const SEARCH_LISTS = gql`
  query SearchLists($str: String!) {
    predicate_objects(
      where: {
        predicate: { type: { _eq: Keywords } }
        object: { label: { _ilike: $str } }
      }
      order_by: [{ triple_count: desc }]
      limit: 20
    ) {
      triple_count
      object {
        term_id
        label
        image
        value {
          thing {
            description
          }
        }
        cached_image {
          safe
          url
        }
        term {
          vaults(where: { curve_id: { _eq: "1" } }) {
            total_shares
            position_count
          }
        }
        as_object_triples_aggregate {
          aggregate {
            count
          }
        }
        as_object_triples(
          limit: 6
          order_by: { term: { total_market_cap: desc } }
        ) {
          subject {
            term_id
            label
            image
          }
        }
      }
      predicate {
        term_id
        label
      }
    }
  }
`;