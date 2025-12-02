**query**

    query GetEvents($limit: Int, $offset: Int, $orderBy: [events_order_by!], $where: events_bool_exp) {
  events(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
    id
    block_number
    created_at
    type
    transaction_hash
    atom_id
    triple_id
    deposit_id
    redemption_id
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
    }
    triple {
      term_id
      creator {
        label
        image
        id
        atom_id
        type
      }
      subject {
        term_id
        data
        image
        label
        type
      }
      predicate {
        term_id
        data
        image
        label
        type
      }
      object {
        term_id
        data
        image
        label
        type
      }
    }
    deposit {
      curve_id
      sender_id
      sender {
        id
        atom_id
        label
        image
      }
      shares
      assets_after_fees
    }
    redemption {
      curve_id
      sender_id
      sender {
        id
        atom_id
        label
        image
      }
      assets
      shares
    }
  }
}
    
    
**value**
{
  "limit": 20,
  "offset": 0,
  "orderBy": [
    {
      "created_at": "desc"
    }
  ],
  "where": {
    "_and": [
      {
        "type": {
          "_neq": "FeesTransfered"
        }
      },
      {
        "_not": {
          "_and": [
            {
              "type": {
                "_eq": "Deposited"
              }
            },
            {
              "deposit": {
                "assets_after_fees": {
                  "_eq": 0
                }
              }
            }
          ]
        }
      }
    ]
  }
}

**response**
{
    "data": {
        "events": [
            {
                "id": "0xad959287c03f122682b877efa6b48bc0d69031a8d8dbec0e8e495df3be0332a1-5",
                "block_number": "134712",
                "created_at": "2025-12-02T09:44:25+00:00",
                "type": "Deposited",
                "transaction_hash": "0xad959287c03f122682b877efa6b48bc0d69031a8d8dbec0e8e495df3be0332a1",
                "atom_id": "0xc0fa7922f33a40f32b903d44931d714830b39bfd0a892f465c0f130ff48dd176",
                "triple_id": null,
                "deposit_id": "0xad959287c03f122682b877efa6b48bc0d69031a8d8dbec0e8e495df3be0332a1-5",
                "redemption_id": null,
                "atom": {
                    "term_id": "0xc0fa7922f33a40f32b903d44931d714830b39bfd0a892f465c0f130ff48dd176",
                    "data": "ipfs://bafkreiddrt7wyhuenz4zrcwarkkmnest6rgaosqxmpped2gl2i2cswm5pa",
                    "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1762652397/remix/rryrp5bmhreeqttrxdbo.jpg",
                    "label": "emoji",
                    "type": "Thing",
                    "wallet_id": "0xA44F4B7C3ee145Ea1b182C224541401d459741f0",
                    "creator": {
                        "id": "0x915Cee02bD1551C0e1555DfBa83EB0117532b49A",
                        "label": "0x915C...b49A",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": {
                    "curve_id": "1",
                    "sender_id": "0x915Cee02bD1551C0e1555DfBa83EB0117532b49A",
                    "sender": {
                        "id": "0x915Cee02bD1551C0e1555DfBa83EB0117532b49A",
                        "atom_id": "0x3f962c4d2126757e2f63a5d616ff6724bd7fad61bfef85190ede8438b86ec868",
                        "label": "0x915C...b49A",
                        "image": null
                    },
                    "shares": "39300000000000000",
                    "assets_after_fees": "39300000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x6439665e5d5aa98a4edcf5f3a55d6e16080653f0647dc3cb8625d0be1d0d4feb-4",
                "block_number": "134711",
                "created_at": "2025-12-02T09:43:54+00:00",
                "type": "Deposited",
                "transaction_hash": "0x6439665e5d5aa98a4edcf5f3a55d6e16080653f0647dc3cb8625d0be1d0d4feb",
                "atom_id": null,
                "triple_id": "0xa30f9fb5bc2362f8535bc765b731321190ccc2efe5c1e102f6ed6ff9239d0fde",
                "deposit_id": "0x6439665e5d5aa98a4edcf5f3a55d6e16080653f0647dc3cb8625d0be1d0d4feb-4",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0xa30f9fb5bc2362f8535bc765b731321190ccc2efe5c1e102f6ed6ff9239d0fde",
                    "creator": {
                        "label": "0xc634...d551",
                        "image": null,
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "atom_id": "0xd4ad09b1ac5d9b7e42a7467e1dc2879db016926820bf033294e4e1eea1e0aa17",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b",
                        "data": "I",
                        "image": null,
                        "label": "I",
                        "type": "TextObject"
                    },
                    "predicate": {
                        "term_id": "0xa90959753ff6d5fc33419910365579a1f6b8344812cf331f444718d20adb23ce",
                        "data": "ipfs://bafkreiak3mpf3cxnfxbnbtuzbuwjj3pbmgfizq4wvgqza4fbwug6v5y35y",
                        "image": "",
                        "label": "like",
                        "type": "Thing"
                    },
                    "object": {
                        "term_id": "0xc79ca6a6dc29f233cbfc6e17888500dec0ccd70ac356185236e7898aceb4f78e",
                        "data": "ipfs://bafkreieumgfsckpejmlby72rtnmofobsbozxqez2yoguw5xtc77apnstuq",
                        "image": "",
                        "label": "programming challenges",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "1",
                    "sender_id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                    "sender": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "atom_id": "0xd4ad09b1ac5d9b7e42a7467e1dc2879db016926820bf033294e4e1eea1e0aa17",
                        "label": "0xc634...d551",
                        "image": null
                    },
                    "shares": "49375000000000000",
                    "assets_after_fees": "49375000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x6439665e5d5aa98a4edcf5f3a55d6e16080653f0647dc3cb8625d0be1d0d4feb-3",
                "block_number": "134711",
                "created_at": "2025-12-02T09:43:54+00:00",
                "type": "TripleCreated",
                "transaction_hash": "0x6439665e5d5aa98a4edcf5f3a55d6e16080653f0647dc3cb8625d0be1d0d4feb",
                "atom_id": null,
                "triple_id": "0xa30f9fb5bc2362f8535bc765b731321190ccc2efe5c1e102f6ed6ff9239d0fde",
                "deposit_id": null,
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0xa30f9fb5bc2362f8535bc765b731321190ccc2efe5c1e102f6ed6ff9239d0fde",
                    "creator": {
                        "label": "0xc634...d551",
                        "image": null,
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "atom_id": "0xd4ad09b1ac5d9b7e42a7467e1dc2879db016926820bf033294e4e1eea1e0aa17",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b",
                        "data": "I",
                        "image": null,
                        "label": "I",
                        "type": "TextObject"
                    },
                    "predicate": {
                        "term_id": "0xa90959753ff6d5fc33419910365579a1f6b8344812cf331f444718d20adb23ce",
                        "data": "ipfs://bafkreiak3mpf3cxnfxbnbtuzbuwjj3pbmgfizq4wvgqza4fbwug6v5y35y",
                        "image": "",
                        "label": "like",
                        "type": "Thing"
                    },
                    "object": {
                        "term_id": "0xc79ca6a6dc29f233cbfc6e17888500dec0ccd70ac356185236e7898aceb4f78e",
                        "data": "ipfs://bafkreieumgfsckpejmlby72rtnmofobsbozxqez2yoguw5xtc77apnstuq",
                        "image": "",
                        "label": "programming challenges",
                        "type": "Thing"
                    }
                },
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0xdb892f7a548e5c6fbb97455ff50ec09c53a852e07a5d298ca0e514a4556e92c3-3",
                "block_number": "134710",
                "created_at": "2025-12-02T09:43:49+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0xdb892f7a548e5c6fbb97455ff50ec09c53a852e07a5d298ca0e514a4556e92c3",
                "atom_id": "0xc79ca6a6dc29f233cbfc6e17888500dec0ccd70ac356185236e7898aceb4f78e",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0xc79ca6a6dc29f233cbfc6e17888500dec0ccd70ac356185236e7898aceb4f78e",
                    "data": "ipfs://bafkreieumgfsckpejmlby72rtnmofobsbozxqez2yoguw5xtc77apnstuq",
                    "image": "",
                    "label": "programming challenges",
                    "type": "Thing",
                    "wallet_id": "0x0E323F34c3673703C729bD6025562DFF18C17ADF",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0xf8290762d1206f20e5ee919f6694c31dfcd655dcd242ecbba45178e4c2e68d12-3",
                "block_number": "134709",
                "created_at": "2025-12-02T09:43:45+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0xf8290762d1206f20e5ee919f6694c31dfcd655dcd242ecbba45178e4c2e68d12",
                "atom_id": "0xa90959753ff6d5fc33419910365579a1f6b8344812cf331f444718d20adb23ce",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0xa90959753ff6d5fc33419910365579a1f6b8344812cf331f444718d20adb23ce",
                    "data": "ipfs://bafkreiak3mpf3cxnfxbnbtuzbuwjj3pbmgfizq4wvgqza4fbwug6v5y35y",
                    "image": "",
                    "label": "like",
                    "type": "Thing",
                    "wallet_id": "0xED392F68FC977D88905d00F92279ee690E9d5469",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0xc5a6295eebca3d2f1f0088a6fbcaa737818f170e501210ca88a0a39601b739da-6",
                "block_number": "134708",
                "created_at": "2025-12-02T09:41:18+00:00",
                "type": "Deposited",
                "transaction_hash": "0xc5a6295eebca3d2f1f0088a6fbcaa737818f170e501210ca88a0a39601b739da",
                "atom_id": "0xc5e3b5abae4cb6628681026d3f471bd5d45a7f4a8f9a2b2696ef74830b91d55d",
                "triple_id": null,
                "deposit_id": "0xc5a6295eebca3d2f1f0088a6fbcaa737818f170e501210ca88a0a39601b739da-6",
                "redemption_id": null,
                "atom": {
                    "term_id": "0xc5e3b5abae4cb6628681026d3f471bd5d45a7f4a8f9a2b2696ef74830b91d55d",
                    "data": "ipfs://bafkreifc5wolbg2ggl3s73vg2tzyzfjml2l2jum2zluqx266vcazwxytgm",
                    "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1741629146/remix/z07sp68trpurbfb5vvlr.png",
                    "label": "Crypto CEO",
                    "type": "Thing",
                    "wallet_id": "0x087844d312a4cb78687Deaf7f1eD3eD494033055",
                    "creator": {
                        "id": "0xBb285b543C96C927FC320Fb28524899C2C90806C",
                        "label": "0xBb28...806C",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x9D9299B89C71121733d4064FdD8e5d2Fabee2419",
                    "sender": {
                        "id": "0x9D9299B89C71121733d4064FdD8e5d2Fabee2419",
                        "atom_id": "0x58ad5174d98b7acb4cd5efe4ede9bdbf5d1f921782eac3872a70b5290499fbc3",
                        "label": "0x9D92...2419",
                        "image": null
                    },
                    "shares": "32562125383260679",
                    "assets_after_fees": "97750000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x78c269f53b257955b789be76889140c3d3df86e989aea47b9da9e1723b786f42-4",
                "block_number": "134707",
                "created_at": "2025-12-02T09:33:01+00:00",
                "type": "Deposited",
                "transaction_hash": "0x78c269f53b257955b789be76889140c3d3df86e989aea47b9da9e1723b786f42",
                "atom_id": null,
                "triple_id": "0x6c43e6b003601c3b5f2ce9852b1b3aa166b1b57153ccc496cbf9d14f307bc496",
                "deposit_id": "0x78c269f53b257955b789be76889140c3d3df86e989aea47b9da9e1723b786f42-4",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0x6c43e6b003601c3b5f2ce9852b1b3aa166b1b57153ccc496cbf9d14f307bc496",
                    "creator": {
                        "label": "0x915C...b49A",
                        "image": null,
                        "id": "0x915Cee02bD1551C0e1555DfBa83EB0117532b49A",
                        "atom_id": "0x3f962c4d2126757e2f63a5d616ff6724bd7fad61bfef85190ede8438b86ec868",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b",
                        "data": "I",
                        "image": null,
                        "label": "I",
                        "type": "TextObject"
                    },
                    "predicate": {
                        "term_id": "0xffd07650dc7ab341184362461ebf52144bf8bcac5a19ef714571de15f1319260",
                        "data": "https://schema.org/FollowAction",
                        "image": null,
                        "label": "follow",
                        "type": "FollowAction"
                    },
                    "object": {
                        "term_id": "0x28fbc70ed47a15a75d202095855cd9c74b97abbf2654542978dd819a69fba823",
                        "data": "0x052ccb9a85Bb05C1C30C0538757Ae0487e21FB05",
                        "image": "https://metadata.ens.domains/mainnet/avatar/w00ds.eth",
                        "label": "w00ds.eth",
                        "type": "Account"
                    }
                },
                "deposit": {
                    "curve_id": "1",
                    "sender_id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                    "sender": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "atom_id": "0xd4ad09b1ac5d9b7e42a7467e1dc2879db016926820bf033294e4e1eea1e0aa17",
                        "label": "0xc634...d551",
                        "image": null
                    },
                    "shares": "49375000000000000",
                    "assets_after_fees": "49375000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x8be91709c94df19c0801a0ad2472cbd5172912f6fa09bfe03d7d72339ad3bc79-4",
                "block_number": "134706",
                "created_at": "2025-12-02T09:32:51+00:00",
                "type": "Deposited",
                "transaction_hash": "0x8be91709c94df19c0801a0ad2472cbd5172912f6fa09bfe03d7d72339ad3bc79",
                "atom_id": null,
                "triple_id": "0xe8122d8235a3ff34e0c0ad0bc57b75ce54845e5489f4f1b00d30f9b8b39057f4",
                "deposit_id": "0x8be91709c94df19c0801a0ad2472cbd5172912f6fa09bfe03d7d72339ad3bc79-4",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0xe8122d8235a3ff34e0c0ad0bc57b75ce54845e5489f4f1b00d30f9b8b39057f4",
                    "creator": {
                        "label": "avotointuition.eth",
                        "image": "https://metadata.ens.domains/mainnet/avatar/avotointuition.eth",
                        "id": "0xbd2DE08aF9470c87C4475117Fb912B8f1d588D9c",
                        "atom_id": "0x8bf3b3d9b0e9372e4948c0dd24163d63c55e68403b28c9f89235bea4408b31a5",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0xe189ff3ab07b27da7f032a8cb30bf5d0be45115772eb9b7c992a985fe89a4882",
                        "data": "ipfs://bafkreib22uigjgmjv4vyh3lrxudczcbkhythmncp7gdo4rhf6wa3h3idqq",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1749554134/remix/tmylvwogjw6dnecoap6d.png",
                        "label": "Blockchain Technology",
                        "type": "Thing"
                    },
                    "predicate": {
                        "term_id": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
                        "data": "https://schema.org/keywords",
                        "image": null,
                        "label": "has tag",
                        "type": "Keywords"
                    },
                    "object": {
                        "term_id": "0x6e755dc5d62a5b2e2de5dd2233f91df739e14d0c386c3deaefc92ac73751c6a3",
                        "data": "ipfs://bafkreibonv6macug5x5hngepppu6hbywrxrr3esbs6s4qmnsh7ecdaaeuy",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1762282395/remix/c3waakrrbpgrroidike8.png",
                        "label": "Interests",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x5C546E855Fb002Fd0C54d7E8d6F5Bc13D377CFe4",
                    "sender": {
                        "id": "0x5C546E855Fb002Fd0C54d7E8d6F5Bc13D377CFe4",
                        "atom_id": "0xb43a1f14967ddf15d86dc04f3e72c958fd6f2d7e57a7115bb80be7ffaea5bdf6",
                        "label": "0x5C54...CFe4",
                        "image": null
                    },
                    "shares": "752900061932252234",
                    "assets_after_fees": "9875000000000000000"
                },
                "redemption": null
            },
            {
                "id": "0xb7b444357d088726fc5521d52fdf1b249421a8f1ee0bb9756e4bcac462fa0713-6",
                "block_number": "134705",
                "created_at": "2025-12-02T09:32:21+00:00",
                "type": "Deposited",
                "transaction_hash": "0xb7b444357d088726fc5521d52fdf1b249421a8f1ee0bb9756e4bcac462fa0713",
                "atom_id": "0xe189ff3ab07b27da7f032a8cb30bf5d0be45115772eb9b7c992a985fe89a4882",
                "triple_id": null,
                "deposit_id": "0xb7b444357d088726fc5521d52fdf1b249421a8f1ee0bb9756e4bcac462fa0713-6",
                "redemption_id": null,
                "atom": {
                    "term_id": "0xe189ff3ab07b27da7f032a8cb30bf5d0be45115772eb9b7c992a985fe89a4882",
                    "data": "ipfs://bafkreib22uigjgmjv4vyh3lrxudczcbkhythmncp7gdo4rhf6wa3h3idqq",
                    "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1749554134/remix/tmylvwogjw6dnecoap6d.png",
                    "label": "Blockchain Technology",
                    "type": "Thing",
                    "wallet_id": "0x3f5719481DB411525EBC4725AF7dB511F7433b19",
                    "creator": {
                        "id": "0xBb285b543C96C927FC320Fb28524899C2C90806C",
                        "label": "0xBb28...806C",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x5C546E855Fb002Fd0C54d7E8d6F5Bc13D377CFe4",
                    "sender": {
                        "id": "0x5C546E855Fb002Fd0C54d7E8d6F5Bc13D377CFe4",
                        "atom_id": "0xb43a1f14967ddf15d86dc04f3e72c958fd6f2d7e57a7115bb80be7ffaea5bdf6",
                        "label": "0x5C54...CFe4",
                        "image": null
                    },
                    "shares": "74974663396487854",
                    "assets_after_fees": "977500000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x43081d4e1d022394fe5f3dc3bce97c6271f674ffa0554c55b551eac52e0bde39-3",
                "block_number": "134702",
                "created_at": "2025-12-02T09:22:44+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0x43081d4e1d022394fe5f3dc3bce97c6271f674ffa0554c55b551eac52e0bde39",
                "atom_id": "0x5ab2ebd9bb554a67b6cc5b466894c82f47eb1c7b2638674d496163b6fa38ca74",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0x5ab2ebd9bb554a67b6cc5b466894c82f47eb1c7b2638674d496163b6fa38ca74",
                    "data": "ipfs://bafkreifqjry3racmgbt5an3tt2vdbvx6cym3nwo5evexvjcdscwxbizgtq",
                    "image": "",
                    "label": "programming languages",
                    "type": "Thing",
                    "wallet_id": "0x0607Df0110d459a4f7A60706ABfF5462e358ce71",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0x11becfdade32402ad5e31ea8a1c2621a2677bea8c91763dc54cb8f17655f7cdd-3",
                "block_number": "134701",
                "created_at": "2025-12-02T09:22:39+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0x11becfdade32402ad5e31ea8a1c2621a2677bea8c91763dc54cb8f17655f7cdd",
                "atom_id": "0x50257bbfdec7aa0ffc058fa33faf5be5b4e77cb03225fc4bc041bb066467b164",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0x50257bbfdec7aa0ffc058fa33faf5be5b4e77cb03225fc4bc041bb066467b164",
                    "data": "ipfs://bafkreierdwmecyr2srldbcwcjgxkumzcfrhurp5h7yaxg42hciaiavrnpe",
                    "image": "",
                    "label": "work with",
                    "type": "Thing",
                    "wallet_id": "0x6551Ea5eA9ADf6aA8D56C2010819Fe481381195F",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0x04c1ea676ebfe3982a33be310c86866a51ff84d37745643d3359024c6c9ac8a9-5",
                "block_number": "134698",
                "created_at": "2025-12-02T09:20:07+00:00",
                "type": "Deposited",
                "transaction_hash": "0x04c1ea676ebfe3982a33be310c86866a51ff84d37745643d3359024c6c9ac8a9",
                "atom_id": "0x7f1a427d4c30ff700dcf3785f776a0409b2f129089771feeeb9fc2e73ea24a46",
                "triple_id": null,
                "deposit_id": "0x04c1ea676ebfe3982a33be310c86866a51ff84d37745643d3359024c6c9ac8a9-5",
                "redemption_id": null,
                "atom": {
                    "term_id": "0x7f1a427d4c30ff700dcf3785f776a0409b2f129089771feeeb9fc2e73ea24a46",
                    "data": "0x077b59a3751Cd6682534C8203aAb29113876af01",
                    "image": null,
                    "label": "passive-records.box",
                    "type": "Account",
                    "wallet_id": "0x9Cd8aD56AEA06832E93C0e400af8671259862e97",
                    "creator": {
                        "id": "0x077b59a3751Cd6682534C8203aAb29113876af01",
                        "label": "passive-records.box",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x1f36ea4169cf7Cb67d25cAb6A576AfC1faccFA15",
                    "sender": {
                        "id": "0x1f36ea4169cf7Cb67d25cAb6A576AfC1faccFA15",
                        "atom_id": "0x3598af8a148e818c93678b118d4ecc24af1962804c2ed7098d921a8413295e25",
                        "label": "0x1f36...FA15",
                        "image": null
                    },
                    "shares": "1013402881706062814",
                    "assets_after_fees": "3094875000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x528f4a77970cd704788993a0478f5abb89f4801d40f1da886f129f3ac891f316-3",
                "block_number": "134697",
                "created_at": "2025-12-02T09:13:01+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0x528f4a77970cd704788993a0478f5abb89f4801d40f1da886f129f3ac891f316",
                "atom_id": "0x6df105a44b1ea3856a336bdbfcda65868f7da9bae884d24b159d94743da2baa0",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0x6df105a44b1ea3856a336bdbfcda65868f7da9bae884d24b159d94743da2baa0",
                    "data": "ipfs://bafkreieqcjktqsuebi5hsybqkza3ndy26denieakek6ws6aeov4ba6ia6u",
                    "image": "",
                    "label": "Sofia Chronicles",
                    "type": "Thing",
                    "wallet_id": "0x1C71727BD7DE6dB9Ec9226769f112332Ff9d8Fe9",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0x5ec3ea720f91ad93f6387141ecb39f21440b57a64725f9b672c9d297b30761b9-3",
                "block_number": "134696",
                "created_at": "2025-12-02T09:12:56+00:00",
                "type": "AtomCreated",
                "transaction_hash": "0x5ec3ea720f91ad93f6387141ecb39f21440b57a64725f9b672c9d297b30761b9",
                "atom_id": "0xca3c67d26f1e88e379a9c1b93237fee7ebdd147a2100ea6a375a4ebae785fd44",
                "triple_id": null,
                "deposit_id": null,
                "redemption_id": null,
                "atom": {
                    "term_id": "0xca3c67d26f1e88e379a9c1b93237fee7ebdd147a2100ea6a375a4ebae785fd44",
                    "data": "ipfs://bafkreib7jenkvg76mn4l4pprzezzbqe27tvilarceefocbkt3cvpnoufyi",
                    "image": "",
                    "label": "have visited",
                    "type": "Thing",
                    "wallet_id": "0x1A0c7568445f8a9931e69Ca76928f07c828847D7",
                    "creator": {
                        "id": "0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551",
                        "label": "0xc634...d551",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0x37fd8114e467b3c0af5bab06a3a62dd67437879b9015c3b80645708301b3b468-4",
                "block_number": "134691",
                "created_at": "2025-12-02T08:06:18+00:00",
                "type": "Deposited",
                "transaction_hash": "0x37fd8114e467b3c0af5bab06a3a62dd67437879b9015c3b80645708301b3b468",
                "atom_id": null,
                "triple_id": "0x02ef0ddbe0ebb39b82f4fe0509fabb0c892abfd1d4aafeb9fbaae104b8442768",
                "deposit_id": "0x37fd8114e467b3c0af5bab06a3a62dd67437879b9015c3b80645708301b3b468-4",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0x02ef0ddbe0ebb39b82f4fe0509fabb0c892abfd1d4aafeb9fbaae104b8442768",
                    "creator": {
                        "label": "0x5202...8970",
                        "image": null,
                        "id": "0x5202D58bE22d7b0E94f2b7Bac9918eC859D88970",
                        "atom_id": "0x2f2db22bdb1e361ff759e7327a2cc9bb6b86ddeceb65ddd713c10a35c7fc60da",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x3c6ac443f1c44cf4482f0623925c7b9f010fb3913441f53c3f00e4be473ea807",
                        "data": "ipfs://bafkreiastyvbvekcngfas5jy4gkx7xpecggrfahmslvklmj25rafdkjjca",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1764661153/remix/bboh4ysowbibbewdmq9t.jpg",
                        "label": "Robin Quivers",
                        "type": "Thing"
                    },
                    "predicate": {
                        "term_id": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
                        "data": "https://schema.org/keywords",
                        "image": null,
                        "label": "has tag",
                        "type": "Keywords"
                    },
                    "object": {
                        "term_id": "0x49f2126e2963a3f1f79c4711ec0f4fc3cad40d1b117bdd8e0ecdfe992aaac0b5",
                        "data": "ipfs://bafkreia524l5s6x5y53wrfcpe37kppxptrmjxkhoikyedepfhllpldzzpq",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1764229372/remix/bm1k4vdl8tggcbbdynlh.png",
                        "label": "Radio",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "1",
                    "sender_id": "0x5202D58bE22d7b0E94f2b7Bac9918eC859D88970",
                    "sender": {
                        "id": "0x5202D58bE22d7b0E94f2b7Bac9918eC859D88970",
                        "atom_id": "0x2f2db22bdb1e361ff759e7327a2cc9bb6b86ddeceb65ddd713c10a35c7fc60da",
                        "label": "0x5202...8970",
                        "image": null
                    },
                    "shares": "9875000000000000",
                    "assets_after_fees": "9875000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x37fd8114e467b3c0af5bab06a3a62dd67437879b9015c3b80645708301b3b468-3",
                "block_number": "134691",
                "created_at": "2025-12-02T08:06:18+00:00",
                "type": "TripleCreated",
                "transaction_hash": "0x37fd8114e467b3c0af5bab06a3a62dd67437879b9015c3b80645708301b3b468",
                "atom_id": null,
                "triple_id": "0x02ef0ddbe0ebb39b82f4fe0509fabb0c892abfd1d4aafeb9fbaae104b8442768",
                "deposit_id": null,
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0x02ef0ddbe0ebb39b82f4fe0509fabb0c892abfd1d4aafeb9fbaae104b8442768",
                    "creator": {
                        "label": "0x5202...8970",
                        "image": null,
                        "id": "0x5202D58bE22d7b0E94f2b7Bac9918eC859D88970",
                        "atom_id": "0x2f2db22bdb1e361ff759e7327a2cc9bb6b86ddeceb65ddd713c10a35c7fc60da",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x3c6ac443f1c44cf4482f0623925c7b9f010fb3913441f53c3f00e4be473ea807",
                        "data": "ipfs://bafkreiastyvbvekcngfas5jy4gkx7xpecggrfahmslvklmj25rafdkjjca",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1764661153/remix/bboh4ysowbibbewdmq9t.jpg",
                        "label": "Robin Quivers",
                        "type": "Thing"
                    },
                    "predicate": {
                        "term_id": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
                        "data": "https://schema.org/keywords",
                        "image": null,
                        "label": "has tag",
                        "type": "Keywords"
                    },
                    "object": {
                        "term_id": "0x49f2126e2963a3f1f79c4711ec0f4fc3cad40d1b117bdd8e0ecdfe992aaac0b5",
                        "data": "ipfs://bafkreia524l5s6x5y53wrfcpe37kppxptrmjxkhoikyedepfhllpldzzpq",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1764229372/remix/bm1k4vdl8tggcbbdynlh.png",
                        "label": "Radio",
                        "type": "Thing"
                    }
                },
                "deposit": null,
                "redemption": null
            },
            {
                "id": "0x73043aad190d5888360bdfda48ce963aade17156d68d8b897851f3cfdb8050d3-7",
                "block_number": "134687",
                "created_at": "2025-12-02T07:53:56+00:00",
                "type": "Deposited",
                "transaction_hash": "0x73043aad190d5888360bdfda48ce963aade17156d68d8b897851f3cfdb8050d3",
                "atom_id": null,
                "triple_id": "0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf",
                "deposit_id": "0x73043aad190d5888360bdfda48ce963aade17156d68d8b897851f3cfdb8050d3-7",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf",
                    "creator": {
                        "label": "0xf500...6a19",
                        "image": null,
                        "id": "0xf5004d3895b96c4371BB5773732c13ADCB746a19",
                        "atom_id": "0xabe767daf4614afa601a3ddd0dbf803c9cb29ca4ba4c92cd82fcb62d5520982c",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x906527aae4af914b1ac01ff9adfdda5dafde3b5e21f84045e0660b0a15c07769",
                        "data": "0x88D0aF73508452c1a453356b3Fac26525aEc23A2",
                        "image": "https://metadata.ens.domains/mainnet/avatar/intuitionbilly.eth",
                        "label": "intuitionbilly.eth",
                        "type": "Account"
                    },
                    "predicate": {
                        "term_id": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
                        "data": "https://schema.org/keywords",
                        "image": null,
                        "label": "has tag",
                        "type": "Keywords"
                    },
                    "object": {
                        "term_id": "0xbd7134ca88504895d99a0696a5d5ce5adb439c0d74330a1f59d232c5c5b07a77",
                        "data": "ipfs://bafkreibay77nv5irdxkqf4ugmvfcn2ehtyoxfecpv7envmwp5rmhp5rbke",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1763922992/remix/nrkp3d9m2mt7xsgrob1m.jpg",
                        "label": "Good Person Verification",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                    "sender": {
                        "id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                        "atom_id": "0xc1f88b8dc4b9dc981a6caa0d0199eb611bac47cf399c814e4ba5e4e87a940386",
                        "label": "0x96EA...A006",
                        "image": null
                    },
                    "shares": "47932129563345556",
                    "assets_after_fees": "978500000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x7b1bc30fbaadfd1bfe69a6e546d5e76e090529fc9beaf37cd22ccb4c5a0f2298-8",
                "block_number": "134686",
                "created_at": "2025-12-02T07:50:43+00:00",
                "type": "Deposited",
                "transaction_hash": "0x7b1bc30fbaadfd1bfe69a6e546d5e76e090529fc9beaf37cd22ccb4c5a0f2298",
                "atom_id": null,
                "triple_id": "0xa1739235f5a8362b15268eab46484abdd7660a1e2a6a5d7deacbed9d4c055e68",
                "deposit_id": "0x7b1bc30fbaadfd1bfe69a6e546d5e76e090529fc9beaf37cd22ccb4c5a0f2298-8",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0xa1739235f5a8362b15268eab46484abdd7660a1e2a6a5d7deacbed9d4c055e68",
                    "creator": {
                        "label": "calebnftgod.eth",
                        "image": "https://metadata.ens.domains/mainnet/avatar/calebnftgod.eth",
                        "id": "0x95eadCb87383B1203B0321b9F0F6914c63fA07b6",
                        "atom_id": "0x4bb56d6110e24f62cce53778f8cafefecd835f0123924f7f63b7c39afb83572a",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0x1642f012b2e52b91782938e0b686dcadbe984500ed9bcbce34b5d88d007ff565",
                        "data": "ipfs://bafkreifjgrnnafbtdot3ohn3jvxvfvcmox74kumbjckrgmncxfuzfhu3nu",
                        "image": "",
                        "label": "The ticker ",
                        "type": "Thing"
                    },
                    "predicate": {
                        "term_id": "0xdd4320a03fcd85ed6ac29f3171208f05418324d6943f1fac5d3c23cc1ce10eb3",
                        "data": "ipfs://QmXz2TVv3eLRhUSyai9Cy8RnuvvMuYn8fpJ9RZChmA8NEt",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1724341734/remix/cxyva63ffw8nteuhukfj.png",
                        "label": "is",
                        "type": "Thing"
                    },
                    "object": {
                        "term_id": "0x53fc9bb27b5c56794482aca43cc4ad58d66d65e6e93f256c896300f5e645d5da",
                        "data": "ipfs://bafkreihaevfaffhs7oc4zwncwc7svofzotwkfz2pyfqjbxotih7yxbvheq",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1746725687/remix/cdbojtvujtm6zrnlx9ju.png",
                        "label": "$TRUST",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                    "sender": {
                        "id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                        "atom_id": "0xc1f88b8dc4b9dc981a6caa0d0199eb611bac47cf399c814e4ba5e4e87a940386",
                        "label": "0x96EA...A006",
                        "image": null
                    },
                    "shares": "2450595358519143",
                    "assets_after_fees": "194700000000000000"
                },
                "redemption": null
            },
            {
                "id": "0x6821b5c9f23ed52a26f0c2c1f4e745ab983cc3ece7d828babd617b1d05fcdf38-5",
                "block_number": "134685",
                "created_at": "2025-12-02T07:49:11+00:00",
                "type": "Deposited",
                "transaction_hash": "0x6821b5c9f23ed52a26f0c2c1f4e745ab983cc3ece7d828babd617b1d05fcdf38",
                "atom_id": null,
                "triple_id": "0x10b131faca108dfce0939fafab2683c90d25b539c874871a17e666528ae4f9fc",
                "deposit_id": "0x6821b5c9f23ed52a26f0c2c1f4e745ab983cc3ece7d828babd617b1d05fcdf38-5",
                "redemption_id": null,
                "atom": null,
                "triple": {
                    "term_id": "0x10b131faca108dfce0939fafab2683c90d25b539c874871a17e666528ae4f9fc",
                    "creator": {
                        "label": "0x85d0...3baE",
                        "image": null,
                        "id": "0x85d0e8E5Cacac81905F3590Ded3AA97B244d3baE",
                        "atom_id": "0x546afaf7c60718865fc09d881a068c4d3cc27c846abf13dc67a68c6439fc5cc8",
                        "type": "Default"
                    },
                    "subject": {
                        "term_id": "0xe6b64d96db6c4c7d050afd9d74a57ad15f079ca8c43883016c05f3c2b2968f25",
                        "data": "ipfs://bafkreigblr3itdxu35sexshubo5hm24ivh22yjittvub4zfygknrdok24q",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1762370293/remix/gtj2zwu6esvejd9kcqcb.png",
                        "label": "IntuRank",
                        "type": "Thing"
                    },
                    "predicate": {
                        "term_id": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
                        "data": "https://schema.org/keywords",
                        "image": null,
                        "label": "has tag",
                        "type": "Keywords"
                    },
                    "object": {
                        "term_id": "0xb57be6ff391550db8e4e1b05d4217ed1b92d9a2f468ed213d235cfcb2ac28b79",
                        "data": "ipfs://bafkreia3uf7b53yf4s52gpql7tf2jzwbsadt4zmuhrk6q2xynoxiv2ofwy",
                        "image": "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1763131191/remix/ipupzia7snaqosstbzha.png",
                        "label": "Built on Intuition",
                        "type": "Thing"
                    }
                },
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                    "sender": {
                        "id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                        "atom_id": "0xc1f88b8dc4b9dc981a6caa0d0199eb611bac47cf399c814e4ba5e4e87a940386",
                        "label": "0x96EA...A006",
                        "image": null
                    },
                    "shares": "88061887685517904",
                    "assets_after_fees": "294750000000000000"
                },
                "redemption": null
            },
            {
                "id": "0xc4ba88a6a09f9d7669f2f4158b43aea864183ff0a5099bab94e66d286fbb47a8-5",
                "block_number": "134684",
                "created_at": "2025-12-02T07:48:19+00:00",
                "type": "Deposited",
                "transaction_hash": "0xc4ba88a6a09f9d7669f2f4158b43aea864183ff0a5099bab94e66d286fbb47a8",
                "atom_id": "0x67db42e558c2e971778239184ac3bda5f4751247558e6e5331de315aaddafad5",
                "triple_id": null,
                "deposit_id": "0xc4ba88a6a09f9d7669f2f4158b43aea864183ff0a5099bab94e66d286fbb47a8-5",
                "redemption_id": null,
                "atom": {
                    "term_id": "0x67db42e558c2e971778239184ac3bda5f4751247558e6e5331de315aaddafad5",
                    "data": "0xedd8cd4A9607E5f620bd6A8b061eA139ba6EDF68",
                    "image": null,
                    "label": "0xedd8...DF68",
                    "type": "Account",
                    "wallet_id": "0x7123F2845685BF04F9b935322FcF068956FAA37e",
                    "creator": {
                        "id": "0xedd8cd4A9607E5f620bd6A8b061eA139ba6EDF68",
                        "label": "0xedd8...DF68",
                        "image": null
                    }
                },
                "triple": null,
                "deposit": {
                    "curve_id": "2",
                    "sender_id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                    "sender": {
                        "id": "0x96EA93793E49fC3Fd2628F7b6EF83B7464a1A006",
                        "atom_id": "0xc1f88b8dc4b9dc981a6caa0d0199eb611bac47cf399c814e4ba5e4e87a940386",
                        "label": "0x96EA...A006",
                        "image": null
                    },
                    "shares": "64727380887339232",
                    "assets_after_fees": "196500000000000000"
                },
                "redemption": null
            }
        ]
    }
}
