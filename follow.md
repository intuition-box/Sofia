**Fonctionnalité**
Connexion entre plusieurs wallets
Pouvoir follow/unfollow des utilisateurs
Récupérer l'activité des follows (signaux créés, bookmark créés)

**Front-end**
liste des follows et des followers sur la page account.tsx


**Code**

- Ecris ci dessous le code du smart contract que voudrais utiliser :

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SofiaFollowSystem
 * @dev Smart contract pour gérer le système de follow/unfollow entre wallets
 * Compatible avec l'architecture Intuition et MultiVault existante
 */
contract SofiaFollowSystem is Ownable, ReentrancyGuard {

    // Events
    event UserFollowed(address indexed follower, address indexed followed, uint256 timestamp);
    event UserUnfollowed(address indexed follower, address indexed followed, uint256 timestamp);
    event ActivityRecorded(address indexed user, ActivityType activityType, bytes32 indexed contentHash, uint256 timestamp);

    // Enums
    enum ActivityType { SIGNAL_CREATED, BOOKMARK_CREATED, TRIPLET_CREATED, ATOM_CREATED }

    // Structs
    struct FollowRelation {
        bool isFollowing;
        uint256 followedAt;
    }

    struct UserActivity {
        address user;
        ActivityType activityType;
        bytes32 contentHash; // Hash du contenu (signal, bookmark, etc.)
        string metadata; // JSON metadata pour détails additionnels
        uint256 timestamp;
    }

    struct UserProfile {
        uint256 followersCount;
        uint256 followingCount;
        uint256 activitiesCount;
        string profileMetadata; // JSON pour bio, avatar, etc.
    }

    // Mappings
    mapping(address => mapping(address => FollowRelation)) public followRelations;
    mapping(address => address[]) public followers; // Liste des followers d'un user
    mapping(address => address[]) public following; // Liste des users suivis
    mapping(address => UserProfile) public userProfiles;
    mapping(address => UserActivity[]) public userActivities;
    mapping(bytes32 => bool) public activityExists; // Éviter les doublons

    // Constants
    uint256 public constant MAX_ACTIVITIES_PER_USER = 1000;
    uint256 public followCost = 0; // Coût pour follow (peut être modifié)

    /**
     * @dev Follow un utilisateur
     */
    function followUser(address userToFollow) external payable nonReentrant {
        require(userToFollow != msg.sender, "Cannot follow yourself");
        require(userToFollow != address(0), "Invalid address");
        require(!followRelations[msg.sender][userToFollow].isFollowing, "Already following");
        require(msg.value >= followCost, "Insufficient payment");

        // Créer la relation de follow
        followRelations[msg.sender][userToFollow] = FollowRelation({
            isFollowing: true,
            followedAt: block.timestamp
        });

        // Ajouter aux listes
        followers[userToFollow].push(msg.sender);
        following[msg.sender].push(userToFollow);

        // Mettre à jour les compteurs
        userProfiles[msg.sender].followingCount++;
        userProfiles[userToFollow].followersCount++;

        emit UserFollowed(msg.sender, userToFollow, block.timestamp);
    }

    /**
     * @dev Unfollow un utilisateur
     */
    function unfollowUser(address userToUnfollow) external nonReentrant {
        require(userToUnfollow != address(0), "Invalid address");
        require(followRelations[msg.sender][userToUnfollow].isFollowing, "Not following");

        // Supprimer la relation
        delete followRelations[msg.sender][userToUnfollow];

        // Retirer des listes
        _removeFromArray(followers[userToUnfollow], msg.sender);
        _removeFromArray(following[msg.sender], userToUnfollow);

        // Mettre à jour les compteurs
        userProfiles[msg.sender].followingCount--;
        userProfiles[userToUnfollow].followersCount--;

        emit UserUnfollowed(msg.sender, userToUnfollow, block.timestamp);
    }

    /**
     * @dev Obtenir les followers d'un utilisateur
     */
    function getFollowers(address user) external view returns (address[] memory) {
        return followers[user];
    }

    /**
     * @dev Obtenir les utilisateurs suivis
     */
    function getFollowing(address user) external view returns (address[] memory) {
        return following[user];
    }


    /**
     * @dev Vérifier si un utilisateur en suit un autre
     */
    function isFollowing(address follower, address followed) external view returns (bool) {
        return followRelations[follower][followed].isFollowing;
    }

    /**
     * @dev Obtenir le profil d'un utilisateur
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @dev Mettre à jour le profil utilisateur
     */
    function updateProfile(string calldata metadata) external {
        userProfiles[msg.sender].profileMetadata = metadata;
    }

    /**
     * @dev Fonction interne pour supprimer un élément d'un tableau
     */
    function _removeFromArray(address[] storage array, address element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @dev Supprimer la plus ancienne activité
     */
    function _removeOldestActivity(address user) internal {
        UserActivity[] storage activities = userActivities[user];
        if (activities.length > 0) {
            // Marquer comme supprimée
            bytes32 oldActivityId = keccak256(abi.encodePacked(
                activities[0].user,
                activities[0].contentHash,
                activities[0].activityType,
                activities[0].timestamp
            ));
            activityExists[oldActivityId] = false;

            // Déplacer tous les éléments
            for (uint256 i = 0; i < activities.length - 1; i++) {
                activities[i] = activities[i + 1];
            }
            activities.pop();
        }
    }

    /**
     * @dev Modifier le coût du follow (onlyOwner)
     */
    function setFollowCost(uint256 newCost) external onlyOwner {
        followCost = newCost;
    }

    /**
     * @dev Retirer les fonds du contrat
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
```

- Ecris ci dessous le code du front-end :

```typescript
// extension/hooks/useFollowSystem.ts
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';

const FOLLOW_CONTRACT_ADDRESS = "0x..." // Adresse du contrat déployé
const FOLLOW_CONTRACT_ABI = [
  // ABI du contrat SofiaFollowSystem (version simplifiée)
  {
    "name": "followUser",
    "type": "function",
    "inputs": [{"name": "userToFollow", "type": "address"}],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "name": "unfollowUser",
    "type": "function",
    "inputs": [{"name": "userToUnfollow", "type": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "getFollowers",
    "type": "function",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view"
  },
  {
    "name": "getFollowing",
    "type": "function",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view"
  },
  {
    "name": "isFollowing",
    "type": "function",
    "inputs": [{"name": "follower", "type": "address"}, {"name": "followed", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "name": "getUserProfile",
    "type": "function",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "followersCount", "type": "uint256"},
      {"name": "followingCount", "type": "uint256"},
      {"name": "activitiesCount", "type": "uint256"},
      {"name": "profileMetadata", "type": "string"}
    ]}],
    "stateMutability": "view"
  },
  {
    "name": "getFollowingActivitiesFeed",
    "type": "function",
    "inputs": [{"name": "user", "type": "address"}, {"name": "limit", "type": "uint256"}],
    "outputs": [{"name": "", "type": "tuple[]", "components": [
      {"name": "user", "type": "address"},
      {"name": "activityType", "type": "uint8"},
      {"name": "contentHash", "type": "bytes32"},
      {"name": "metadata", "type": "string"},
      {"name": "timestamp", "type": "uint256"}
    ]}],
    "stateMutability": "view"
  }
];

export const useFollowSystem = () => {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Follow un utilisateur
  const followUser = async (userToFollow: string) => {
    try {
      await writeContract({
        address: FOLLOW_CONTRACT_ADDRESS,
        abi: FOLLOW_CONTRACT_ABI,
        functionName: 'followUser',
        args: [userToFollow],
        value: parseEther('0') // Coût du follow si nécessaire
      });
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  };

  // Unfollow un utilisateur
  const unfollowUser = async (userToUnfollow: string) => {
    try {
      await writeContract({
        address: FOLLOW_CONTRACT_ADDRESS,
        abi: FOLLOW_CONTRACT_ABI,
        functionName: 'unfollowUser',
        args: [userToUnfollow]
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  };

  return { followUser, unfollowUser };
};

// Hook pour récupérer les followers/following
export const useUserConnections = (userAddress?: string) => {
  const targetAddress = userAddress;

  const { data: followers } = useReadContract({
    address: FOLLOW_CONTRACT_ADDRESS,
    abi: FOLLOW_CONTRACT_ABI,
    functionName: 'getFollowers',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress
  });

  const { data: following } = useReadContract({
    address: FOLLOW_CONTRACT_ADDRESS,
    abi: FOLLOW_CONTRACT_ABI,
    functionName: 'getFollowing',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress
  });

  const { data: profile } = useReadContract({
    address: FOLLOW_CONTRACT_ADDRESS,
    abi: FOLLOW_CONTRACT_ABI,
    functionName: 'getUserProfile',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress
  });

  return { followers, following, profile };
};

// Hook pour le feed d'activités
export const useActivityFeed = (userAddress?: string, limit: number = 20) => {
  const { data: activities } = useReadContract({
    address: FOLLOW_CONTRACT_ADDRESS,
    abi: FOLLOW_CONTRACT_ABI,
    functionName: 'getFollowingActivitiesFeed',
    args: userAddress ? [userAddress, limit] : undefined,
    enabled: !!userAddress
  });

  return { activities };
};
```

```tsx
// extension/components/pages/profile-tabs/AccountTab.tsx (version étendue)
import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { useFollowSystem, useUserConnections, useActivityFeed } from '../../../hooks/useFollowSystem'
import searchIcon from '../../../assets/Icon=Search.svg'
import connectButtonOn from '../../../assets/connectButtonOn.svg'
import connectButtonOff from '../../../assets/connectButtonOff.svg'

interface UserConnection {
  address: string;
  isFollowing?: boolean;
  followedAt?: number;
  profileData?: {
    ens?: string;
    avatar?: string;
    bio?: string;
  };
}

interface Activity {
  user: string;
  activityType: number; // 0=SIGNAL, 1=BOOKMARK, 2=TRIPLET, 3=ATOM
  contentHash: string;
  metadata: string;
  timestamp: number;
}

const AccountTab = () => {
  const [account] = useStorage<string>("metamask-account");
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'activity'>('followers');
  const [searchResults, setSearchResults] = useState<UserConnection[]>([]);

  // Hooks pour le système de follow
  const { followUser, unfollowUser } = useFollowSystem();
  const { followers, following, profile } = useUserConnections(account);
  const { activities } = useActivityFeed(account, 50);

  // OAuth states (existant)
  const [oauthTokens, setOauthTokens] = useState({
    youtube: false,
    spotify: false,
    twitch: false
  });

  // Check OAuth tokens (code existant)
  useEffect(() => {
    const checkOAuthTokens = async () => {
      const result = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_twitch'
      ]);

      setOauthTokens({
        youtube: !!result.oauth_token_youtube,
        spotify: !!result.oauth_token_spotify,
        twitch: !!result.oauth_token_twitch
      });
    };

    checkOAuthTokens();

    const handleStorageChange = (changes: any) => {
      if (changes.oauth_token_youtube || changes.oauth_token_spotify || changes.oauth_token_twitch) {
        checkOAuthTokens();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Fonctions OAuth existantes
  const connectOAuth = (platform: 'youtube' | 'spotify' | 'twitch') => {
    chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform });
  };

  const disconnectOAuth = async (platform: 'youtube' | 'spotify' | 'twitch') => {
    await chrome.storage.local.remove(`oauth_token_${platform}`);
  };

  // Nouvelle fonction de recherche d'utilisateurs
  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      // Vérifier si c'est une adresse ETH valide
      if (query.startsWith('0x') && query.length === 42) {
        const userProfile = await getUserProfileData(query);
        setSearchResults([{
          address: query,
          profileData: userProfile
        }]);
      } else {
        // Recherche par ENS ou autres identifiants
        // TODO: Implémenter la recherche ENS
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  // Récupérer les données de profil d'un utilisateur
  const getUserProfileData = async (address: string) => {
    // TODO: Intégrer avec ENS, lens protocol, ou autre système d'identité
    return {
      ens: null,
      avatar: null,
      bio: null
    };
  };

  // Gérer le follow/unfollow
  const handleFollowToggle = async (userAddress: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(userAddress);
      } else {
        await followUser(userAddress);
      }
      // Les données seront automatiquement mises à jour par les hooks wagmi
    } catch (error) {
      console.error('Follow toggle failed:', error);
      alert('Transaction failed. Please try again.');
    }
  };

  // Formater les activités pour l'affichage
  const formatActivity = (activity: Activity) => {
    const types = ['Signal Created', 'Bookmark Created', 'Triplet Created', 'Atom Created'];
    const metadata = JSON.parse(activity.metadata || '{}');

    return {
      type: types[activity.activityType] || 'Unknown',
      title: metadata.title || 'Untitled',
      url: metadata.url,
      timestamp: new Date(activity.timestamp * 1000).toLocaleDateString(),
      user: activity.user
    };
  };

  // Composant pour afficher une connexion utilisateur
  const UserConnectionCard = ({ connection, showFollowButton = true }: {
    connection: UserConnection,
    showFollowButton?: boolean
  }) => (
    <div style={styles.userCard}>
      <div style={styles.userInfo}>
        <div style={styles.avatar}>
          {connection.profileData?.avatar ? (
            <img src={connection.profileData.avatar} alt="Avatar" style={styles.avatarImage} />
          ) : (
            <div style={styles.defaultAvatar}>
              {connection.address.slice(2, 4).toUpperCase()}
            </div>
          )}
        </div>
        <div style={styles.userDetails}>
          <div style={styles.userAddress}>
            {connection.profileData?.ens || `${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`}
          </div>
          {connection.profileData?.bio && (
            <div style={styles.userBio}>{connection.profileData.bio}</div>
          )}
        </div>
      </div>
      {showFollowButton && (
        <button
          onClick={() => handleFollowToggle(connection.address, connection.isFollowing || false)}
          style={{
            ...styles.followButton,
            backgroundColor: connection.isFollowing ? '#dc3545' : '#28a745'
          }}
        >
          {connection.isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );

  // Débounce pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="profile-section">

      {/* OAuth Connections (code existant) */}
      <div className="action-buttons-container">
        {/* Boutons OAuth existants... */}
        <button
          className="connect-button"
          onClick={() => oauthTokens.youtube ? disconnectOAuth('youtube') : connectOAuth('youtube')}
          style={{
            backgroundImage: `url(${oauthTokens.youtube ? connectButtonOn : connectButtonOff})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            border: 'none',
            width: '271px',
            height: '67px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            marginBottom: '12px'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            marginRight: '12px',
            backgroundColor: '#ff0000',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            YT
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            {oauthTokens.youtube ? 'Disconnect YouTube' : 'Connect YouTube'}
          </span>
        </button>
        {/* Autres boutons OAuth... */}
      </div>

      {/* Statistics */}
      {profile && (
        <div style={styles.statsContainer}>
          <div style={styles.stat}>
            <div style={styles.statNumber}>{profile.followersCount?.toString() || '0'}</div>
            <div style={styles.statLabel}>Followers</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNumber}>{profile.followingCount?.toString() || '0'}</div>
            <div style={styles.statLabel}>Following</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNumber}>{profile.activitiesCount?.toString() || '0'}</div>
            <div style={styles.statLabel}>Activities</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users (0x... or ENS name)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="alias-input search-input-with-icon"
        />
        <img src={searchIcon} alt="Search" className="search-icon" style={{
          width: '20px',
          height: '20px',
          filter: 'brightness(0) invert(0.6)'
        }} />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          <h4 style={styles.sectionTitle}>Search Results</h4>
          {searchResults.map((user, index) => (
            <UserConnectionCard key={index} connection={user} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('followers')}
          style={{...styles.tab, ...(activeTab === 'followers' ? styles.activeTab : {})}}
        >
          Followers ({followers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          style={{...styles.tab, ...(activeTab === 'following' ? styles.activeTab : {})}}
        >
          Following ({following?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          style={{...styles.tab, ...(activeTab === 'activity' ? styles.activeTab : {})}}
        >
          Activity Feed
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'followers' && (
          <div>
            <h4 style={styles.sectionTitle}>Your Followers</h4>
            {followers && followers.length > 0 ? (
              followers.map((followerAddress: string, index: number) => (
                <UserConnectionCard
                  key={index}
                  connection={{ address: followerAddress }}
                  showFollowButton={false}
                />
              ))
            ) : (
              <div style={styles.emptyState}>No followers yet</div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div>
            <h4 style={styles.sectionTitle}>You're Following</h4>
            {following && following.length > 0 ? (
              following.map((followingAddress: string, index: number) => (
                <UserConnectionCard
                  key={index}
                  connection={{ address: followingAddress, isFollowing: true }}
                />
              ))
            ) : (
              <div style={styles.emptyState}>You're not following anyone yet</div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h4 style={styles.sectionTitle}>Activity Feed</h4>
            {activities && activities.length > 0 ? (
              activities.map((activity: Activity, index: number) => {
                const formatted = formatActivity(activity);
                return (
                  <div key={index} style={styles.activityCard}>
                    <div style={styles.activityHeader}>
                      <div style={styles.activityUser}>
                        {`${activity.user.slice(0, 6)}...${activity.user.slice(-4)}`}
                      </div>
                      <div style={styles.activityType}>{formatted.type}</div>
                    </div>
                    <div style={styles.activityContent}>
                      <div style={styles.activityTitle}>{formatted.title}</div>
                      {formatted.url && (
                        <div style={styles.activityUrl}>{formatted.url}</div>
                      )}
                    </div>
                    <div style={styles.activityTime}>{formatted.timestamp}</div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>No activity from your follows</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '20px'
  },
  stat: {
    textAlign: 'center' as const
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FBF7F5'
  },
  statLabel: {
    fontSize: '12px',
    color: '#F2DED6',
    marginTop: '5px'
  },
  searchResults: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#FBF7F5',
    marginBottom: '15px',
    fontFamily: "'Gotu', cursive"
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    marginRight: '12px'
  },
  avatarImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%'
  },
  defaultAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(199, 134, 108, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FBF7F5',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  userDetails: {},
  userAddress: {
    fontSize: '14px',
    color: '#FBF7F5',
    fontWeight: '500'
  },
  userBio: {
    fontSize: '12px',
    color: '#F2DED6',
    marginTop: '2px'
  },
  followButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '20px'
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#F2DED6',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderBottom: '2px solid transparent'
  },
  activeTab: {
    color: '#FBF7F5',
    borderBottomColor: 'rgba(199, 134, 108, 0.8)'
  },
  tabContent: {
    minHeight: '200px'
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#F2DED6',
    fontSize: '14px',
    padding: '40px 20px',
    fontStyle: 'italic'
  },
  activityCard: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  activityUser: {
    fontSize: '12px',
    color: '#F2DED6',
    fontFamily: 'monospace'
  },
  activityType: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: 'rgba(199, 134, 108, 0.3)',
    borderRadius: '4px',
    color: '#FBF7F5'
  },
  activityContent: {
    marginBottom: '8px'
  },
  activityTitle: {
    fontSize: '14px',
    color: '#FBF7F5',
    marginBottom: '4px'
  },
  activityUrl: {
    fontSize: '11px',
    color: '#F2DED6',
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  activityTime: {
    fontSize: '11px',
    color: '#F2DED6',
    textAlign: 'right' as const
  }
};

export default AccountTab;
```

- Ecris ci dessous les informations à récupérer depuis MetaMask Connection Flow :

```typescript
// Informations à récupérer lors de la connexion MetaMask pour le système de follow

interface MetaMaskFollowData {
  // Informations de base (existantes)
  walletAddress: string;           // Adresse principale du wallet
  chainId: number;                 // ID de la chaîne connectée
  networkName: string;             // Nom du réseau (ex: "Intuition Testnet")

  // Nouvelles informations pour le système de follow
  ensName?: string;                // Nom ENS si disponible
  ensAvatar?: string;              // Avatar ENS si configuré

  // Données de profil social
  socialConnections?: {
    lens?: string;                 // Handle Lens Protocol
    farcaster?: string;           // Nom d'utilisateur Farcaster
    unstoppableDomain?: string;   // Domaine Unstoppable
  };

  // Historique des connexions wallet
  previousAddresses?: string[];    // Adresses précédemment connectées
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'other';

  // Données de réputation on-chain
  transactionCount?: number;       // Nombre de transactions
  firstTransactionDate?: number;   // Date de première transaction
  nftCount?: number;              // Nombre de NFTs possédés
  tokenBalances?: {               // Balances des tokens principaux
    ETH: string;
    TRUST: string;
    [tokenSymbol: string]: string;
  };

  // Métadonnées pour le système de follow
  followSystemMetadata: {
    isNewUser: boolean;           // Premier utilisateur du système
    autoFollowSuggestions: string[]; // Suggestions de follow basées sur l'historique
    interactionHistory?: {        // Historique d'interactions avec d'autres wallets
      address: string;
      interactionCount: number;
      lastInteraction: number;
    }[];
  };

  // Préférences utilisateur
  privacySettings: {
    showActivity: boolean;        // Montrer l'activité publiquement
    allowFollowRequests: boolean; // Autoriser les demandes de follow
    showFollowers: boolean;       // Rendre la liste des followers publique
    showFollowing: boolean;       // Rendre la liste des following publique
  };

  // Données de synchronisation cross-chain
  crossChainIdentity?: {
    ethereum?: string;            // Adresse sur Ethereum mainnet
    polygon?: string;            // Adresse sur Polygon
    arbitrum?: string;           // Adresse sur Arbitrum
    // Autres chaînes supportées...
  };
}

// Fonction pour extraire ces informations lors de la connexion
async function extractFollowSystemData(provider: any, address: string): Promise<MetaMaskFollowData> {
  try {
    // Récupérer les informations de base
    const chainId = await provider.request({ method: 'eth_chainId' });
    const networkName = getNetworkName(parseInt(chainId, 16));

    // Récupérer ENS (si sur Ethereum mainnet ou réseau supporté)
    let ensName: string | undefined;
    let ensAvatar: string | undefined;

    if (chainId === '0x1') { // Ethereum mainnet
      try {
        ensName = await provider.request({
          method: 'eth_call',
          params: [{
            to: '0x314159265dd8dbb310642f98f50c066173c1259b', // ENS Registry
            data: `0x0178b8bf${address.slice(2).padStart(64, '0')}`
          }, 'latest']
        });

        if (ensName && ensName !== '0x') {
          // Récupérer l'avatar ENS
          ensAvatar = await getENSAvatar(ensName);
        }
      } catch (error) {
        console.log('ENS lookup failed:', error);
      }
    }

    // Récupérer l'historique des transactions pour déterminer l'ancienneté du wallet
    const transactionCount = await provider.request({
      method: 'eth_getTransactionCount',
      params: [address, 'latest']
    });

    // Récupérer les balances des tokens principaux
    const ethBalance = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    const trustBalance = await getTrustBalance(provider, address);

    // Analyser l'historique pour suggérer des follows
    const autoFollowSuggestions = await generateFollowSuggestions(address);

    // Vérifier si c'est un nouvel utilisateur du système de follow
    const isNewUser = await checkIfNewFollowUser(address);

    // Récupérer les préférences stockées localement ou utiliser les défauts
    const privacySettings = await getStoredPrivacySettings(address) || {
      showActivity: true,
      allowFollowRequests: true,
      showFollowers: true,
      showFollowing: true
    };

    return {
      walletAddress: address,
      chainId: parseInt(chainId, 16),
      networkName,
      ensName,
      ensAvatar,
      walletType: 'metamask',
      transactionCount: parseInt(transactionCount, 16),
      tokenBalances: {
        ETH: ethBalance,
        TRUST: trustBalance
      },
      followSystemMetadata: {
        isNewUser,
        autoFollowSuggestions
      },
      privacySettings
    };

  } catch (error) {
    console.error('Failed to extract follow system data:', error);
    throw error;
  }
}

// Fonctions utilitaires
async function getNetworkName(chainId: number): Promise<string> {
  const networks = {
    1: 'Ethereum Mainnet',
    13579: 'Intuition Testnet',
    137: 'Polygon',
    42161: 'Arbitrum One'
  };
  return networks[chainId] || `Chain ID ${chainId}`;
}

async function getENSAvatar(ensName: string): Promise<string | undefined> {
  try {
    // Appel à un service ENS pour récupérer l'avatar
    const response = await fetch(`https://ens-metadata.herokuapp.com/${ensName}`);
    const data = await response.json();
    return data.avatar;
  } catch (error) {
    return undefined;
  }
}

async function getTrustBalance(provider: any, address: string): Promise<string> {
  try {
    // Récupérer le balance TRUST sur Intuition testnet
    // TODO: Implémenter l'appel au contrat TRUST
    return '0';
  } catch (error) {
    return '0';
  }
}

async function generateFollowSuggestions(address: string): Promise<string[]> {
  try {
    // Analyser l'historique on-chain pour suggérer des follows
    // Basé sur les interactions passées, NFTs communs, etc.
    // TODO: Implémenter la logique de suggestion intelligente
    return [];
  } catch (error) {
    return [];
  }
}

async function checkIfNewFollowUser(address: string): Promise<boolean> {
  try {
    // Vérifier si l'utilisateur existe déjà dans le contrat de follow
    // TODO: Appeler le contrat pour vérifier
    return true;
  } catch (error) {
    return true;
  }
}

async function getStoredPrivacySettings(address: string): Promise<any> {
  try {
    const stored = localStorage.getItem(`follow-privacy-${address}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

// Extension du flow de connexion MetaMask existant
export async function enhancedMetaMaskConnection() {
  try {
    const provider = await getMetaProvider(); // Fonction existante
    const accounts = await provider.request({ method: "eth_requestAccounts" });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const primaryAccount = accounts[0];

    // Extraire les données pour le système de follow
    const followData = await extractFollowSystemData(provider, primaryAccount);

    // Stocker les données enrichies
    await chrome.storage.local.set({
      'metamask-follow-data': followData,
      'metamask-account': primaryAccount // Existant
    });

    // Initialiser le profil utilisateur si nouveau
    if (followData.followSystemMetadata.isNewUser) {
      await initializeNewUserProfile(followData);
    }

    return { account: primaryAccount, followData };

  } catch (error) {
    console.error("Enhanced MetaMask connection failed:", error);
    throw error;
  }
}

async function initializeNewUserProfile(followData: MetaMaskFollowData) {
  try {
    // Créer le profil initial dans le contrat
    // Appliquer les suggestions de follow automatiques
    // Configurer les préférences par défaut
    console.log('Initializing new user profile:', followData.walletAddress);
  } catch (error) {
    console.error('Failed to initialize user profile:', error);
  }
}
```