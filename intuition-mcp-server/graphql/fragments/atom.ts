import { gql } from 'graphql-request';

export const AtomValue = gql`
  fragment AtomValue on atom_values {
    person {
      name
      image
      description
      url
    }
    thing {
      name
      image
      description
      url
    }
    organization {
      name
      image
      description
      url
    }
    account {
      id
      label
      image
    }
  }
`;