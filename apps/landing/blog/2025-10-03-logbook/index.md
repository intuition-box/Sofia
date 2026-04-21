---

slug: logbook-03-10

title: Logbook 03/10

authors: [Samuel, Maxime]

---

This week we pushed SofIA’s front-end and blockchain layers further.  
On the UI side, we continued the large CSS refactor, simplifying core pages, unifying modal styles, and ensuring a cleaner, more maintainable structure. We also introduced new interaction features such as sorting in the SignalsTab and predicate filtering in the EchoesTab, making the interface more intuitive and efficient.  

On the blockchain side, the SignalsTab now fetches and displays user positions directly from the Intuition indexer, with TRUST-based upvote badges and fallback links to Portal when needed. Pulse analysis can now be published on-chain, strengthening the connection between user insights and verifiable blockchain data.  

Finally, we consolidated our universal architecture by introducing a single constant for the universal “I” subject, reducing redundant atom creation, lowering gas costs, and unifying the knowledge graph into a consistent structure.  

All these changes improve stability, clarity, and scalability — giving users smoother interactions and developers a cleaner foundation to build on.  

<!-- truncate -->

## CSS Refactoring & Architecture
- Simplified core page and search results interface  
- Unified CSS for all modals  

## Orb tools selection  
- Enables activation of Pulse Analysis and Import Data from the homepage
- Includes placeholder button for future “Find Similar” feature  
- Automatic redirection to Pulse tab 
- Displays loading state 

## Feature Enhancements
- Added upvote modals  
- Added sorting method in SignalsTab  
- Added predicate filter in EchoesTab  
- Added on-chain publication from Pulse analysis  

## Blockchain Integration
- Connected SignalsTab to Intuition indexer  
- Fetched user triples from the universal “I” atom  
- Displayed TRUST-based upvote badges  
- Added fallback links to Portal  
- Optimized GraphQL queries  

## Universal Architecture
- Introduced a single constant for universal subject ID  
- Eliminated redundancy in atom creation  
- Reduced gas costs and ensured consistent triples  
- Unified knowledge graph with universal subjects  
- Improved performance and maintainability

 