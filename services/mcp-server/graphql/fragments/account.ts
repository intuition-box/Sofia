import { gql } from 'graphql-request';

export const AccountMetadata = gql`
  fragment AccountMetadata on accounts {
    label
    image
    id
    atom_id
    type
  }
`;