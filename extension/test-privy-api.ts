/**
 * Test direct API call to Intuition with Privy authentication
 */

async function testPrivyAPI() {
  console.log('🔑 Testing direct Intuition API with Privy auth...\n');

  const privyToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRmRXJNbjBYSU5qNGdWUUtmZkNqWFZydkZXTHJMZWR1aEtJVzY3Qk9EcUEifQ.eyJzaWQiOiJjbWdodmkzcTYwMGdoazUwYzBtcWIwdXVyIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NjAwNzc1MzAsImF1ZCI6ImNtMDE4NWoydzAwcWR3NzE1OXpkNTN0emQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21naHV6b3I0MDA2cWwxMGNjODN5dW02ciIsImV4cCI6MTc2MDA4MTEzMH0.Z2fw0ap6wBfhYHKzKohKmukdZ8OQCFJbNkG45NocPiCTjcTBh_1yDYutujO0FX-ivJ1oPu66dhHcGwrOuQeToQ';
  const privyIdToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRmRXJNbjBYSU5qNGdWUUtmZkNqWFZydkZXTHJMZWR1aEtJVzY3Qk9EcUEifQ.eyJjciI6IjE3NTk5MjAxMDYiLCJsaW5rZWRfYWNjb3VudHMiOiJbe1widHlwZVwiOlwid2FsbGV0XCIsXCJhZGRyZXNzXCI6XCIweGM2MzQ0NTdhRDY4YjAzN0UyRDVhQTFDMTBjMzkzMGQ3ZTRFMmQ1NTFcIixcImNoYWluX3R5cGVcIjpcImV0aGVyZXVtXCIsXCJ3YWxsZXRfY2xpZW50X3R5cGVcIjpcIm1ldGFtYXNrXCIsXCJsdlwiOjE3NTk5MjA5NjV9XSIsImlzcyI6InByaXZ5LmlvIiwiaWF0IjoxNzYwMDc4ODk4LCJhdWQiOiJjbTAxODVqMncwMHFkdzcxNTl6ZDUzdHpkIiwic3ViIjoiZGlkOnByaXZ5OmNtZ2h1em9yNDAwNnFsMTBjYzgzeXVtNnIiLCJleHAiOjE3NjAwODI0OTh9.TBS03kBrbf5sq3U2_g0XqsrrmN8gILTNpr16u64bd7vzYxgPx4DXJ8uF-qc53Cqrq22pAPa5x3ua2D4DXy-VQA';

  try {
    // Test GraphQL query to get account info with Privy auth
    const response = await fetch('https://testnet.intuition.sh/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://portal.intuition.systems',
        'Referer': 'https://portal.intuition.systems/',
        'Sec-Ch-Ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        query: `
          query GetAccountProfile($address: String!) {
            account(id: $address) {
              ...AccountMetadata
              triples_aggregate {
                aggregate {
                  count
                }
              }
              signals_aggregate {
                aggregate {
                  count
                }
              }
              atom {
                term_id
                data
                image
                label
                type
                wallet_id
                creator {
                  id
                  label
                  image
                }
                term {
                  total_market_cap
                  positions_aggregate {
                    aggregate {
                      count
                    }
                  }
                  vaults(where: {curve_id: {_eq: "1"}}, order_by: {curve_id: asc}) {
                    current_share_price
                    total_shares
                    position_count
                    market_cap
                    userPosition: positions(limit: 1, where: {account_id: {_eq: $address}}) {
                      shares
                      account_id
                    }
                  }
                }
              }
            }
          }
          
          fragment AccountMetadata on accounts {
            label
            image
            id
            atom_id
            type
          }
        `,
        variables: {
          address: '0xc634457ad68b037e2d5aa1c10c3930d7e4e2d551'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🎯 Direct API Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Direct API call failed:', error);
  }
}

testPrivyAPI();