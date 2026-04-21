import { useState } from 'react'
import { usePrivy, useLogin, useLogout, useLinkAccount } from '@privy-io/react-auth'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAddress } from 'viem'
import { Button } from "./ui/button";
import { Search, Bell, Home, Wallet, LogOut, Sun, Moon, User, Menu, PanelRight } from "lucide-react";
import { useTheme } from '../hooks/useTheme'
import { useEnsNames } from '../hooks/useEnsNames'
import { useCart } from '../hooks/useCart'
import { useViewAs } from '../hooks/useViewAs'
import { resolveEnsToAddress } from '../services/ensService'
import type { Address } from 'viem'
import './styles/header.css'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface HeaderProps {
  onCartClick?: () => void
  onMenuClick?: () => void
  showMenu?: boolean
  compact?: boolean
  onProfileDrawerClick?: () => void
  showProfileDrawer?: boolean
}

export function Header({ onCartClick, onMenuClick, showMenu, compact, onProfileDrawerClick, showProfileDrawer }: HeaderProps) {
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout()
  const { linkWallet } = useLinkAccount({ onSuccess: () => window.location.reload() })
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const cart = useCart()
  const { setViewAs } = useViewAs()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = async () => {
    const q = searchValue.trim()
    if (!q) return

    if (isAddress(q)) {
      setViewAs(q)
      navigate('/profile')
      setSearchValue('')
    } else if (q.endsWith('.eth') || q.endsWith('.box')) {
      setSearchValue('Resolving...')
      const addr = await resolveEnsToAddress(q)
      if (addr) {
        setViewAs(addr)
        navigate('/profile')
        setSearchValue('')
      } else {
        setSearchValue(q)
      }
    }
  }

  const walletAddress = user?.wallet?.address
  const addresses = walletAddress ? [walletAddress as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const ensName = walletAddress ? getDisplay(walletAddress as Address) : ''
  const ensAvatar = walletAddress ? getAvatar(walletAddress as Address) : ''
  const displayAddress = walletAddress
    ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
    : ''

  // Resolve avatar & display name: Google profile > ENS > fallback
  const googleAccount = user?.google
  const profileAvatar = (googleAccount as any)?.profilePictureUrl || ensAvatar || ''
  const profileName = googleAccount?.name || ensName || googleAccount?.email || user?.email?.address || displayAddress || 'User'

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b" style={{ zoom: compact ? 1 : 1.25 }}>
      <div className="flex h-14 items-center justify-between px-4 w-full">
        {/* Left side - Logo and Search */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {showMenu && (
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-shrink-0">
            <Link to="/feed" className="flex items-center gap-2">
              <img src={theme === 'dark' ? '/logo.png' : '/logo_invert.png'} alt="Sofia" className="h-6 w-6" />
              <h1 className="text-xl font-bold">Sofia</h1>
            </Link>
          </div>

          {(location.pathname === '/feed' || location.pathname.startsWith('/profile')) && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search wallet or ENS..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-9 rounded-full bg-muted pl-10 pr-4 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          )}
        </div>

        {/* Right side - Navigation + Auth */}
        <nav className="flex items-center space-x-1 flex-shrink-0 ml-4">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-9 w-9 hdr-cart-btn" onClick={onCartClick}>
              <img src={theme === 'dark' ? '/logo.png' : '/logo_invert.png'} alt="Cart" className="h-5 w-5" />
            </Button>
            {cart.count > 0 && (
              <span style={{ minWidth: 16, height: 16, borderRadius: 9999, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0, padding: '0 4px', marginLeft: -6 }}>
                {cart.count}
              </span>
            )}
          </div>

          <Link to="/feed">
            <Button variant={location.pathname === '/feed' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9">
              <Home className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {showProfileDrawer && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onProfileDrawerClick}>
              <PanelRight className="h-5 w-5" />
              <span className="sr-only">Profile panel</span>
            </Button>
          )}

          {ready && !authenticated && (
            <Button size="sm" onClick={() => login()} className="ml-2">
              <Wallet className="h-4 w-4 mr-1" />
              Connect
            </Button>
          )}

          {ready && authenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`p-1 h-9 w-9 hdr-profile-btn ${location.pathname.startsWith('/profile') ? 'hdr-profile-hidden' : ''}`}>
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileName} className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="hdr-dropdown">
                {/* User info header */}
                <div className="hdr-user-info">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileName} className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="hdr-user-meta">
                    <div className="hdr-user-name">{profileName}</div>
                    {displayAddress && <div className="hdr-user-address">{displayAddress}</div>}
                  </div>
                </div>
                <div className="hdr-divider" />
                {!walletAddress && (
                  <DropdownMenuItem onClick={() => linkWallet()} className="hdr-menu-item">
                    <Wallet className="mr-2 h-4 w-4" />
                    Link Wallet
                  </DropdownMenuItem>
                )}
                <Link to="/profile">
                  <DropdownMenuItem className="hdr-menu-item">My Profile</DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => logout()} className="hdr-menu-item">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
