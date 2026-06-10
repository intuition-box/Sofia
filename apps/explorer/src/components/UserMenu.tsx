/**
 * UserMenu — the connect / account control, extracted from NavSidebar so it can
 * live in the top-right TopBar (standard placement) instead of the bottom of
 * the left rail. Connect button when logged out; avatar chip + dropdown
 * (wallets, link, disconnect) when logged in.
 *
 * Reuses the `.ns-auth-*` styles from nav-sidebar-toolbar.css. The dropdown
 * opens downward/right (it sits at the top now, not the bottom).
 */
import { useNavigate } from 'react-router-dom'
import { usePrivy, useLogin, useLogout, useLinkAccount } from '@privy-io/react-auth'
import { Wallet, LogOut } from 'lucide-react'
import type { Address } from 'viem'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useEnsNames } from '../hooks/useEnsNames'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import './styles/nav-sidebar-toolbar.css'

export default function UserMenu() {
  const navigate = useNavigate()
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout({ onSuccess: () => navigate('/') })
  const { linkWallet } = useLinkAccount({
    onSuccess: () => window.location.reload(),
  })
  const address = user?.wallet?.address ?? ''
  const { addresses: linkedAddresses, primary: primaryWallet } =
    useLinkedWallets()

  const addresses: Address[] = address ? [address as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const ensName = address ? getDisplay(address as Address) : ''
  const ensAvatar = address ? getAvatar(address as Address) : ''
  const displayAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''
  const googleAccount = user?.google as
    | { name?: string; profilePictureUrl?: string; email?: string }
    | undefined
  const profileAvatar = googleAccount?.profilePictureUrl || ensAvatar || ''
  const profileName =
    googleAccount?.name ||
    ensName ||
    googleAccount?.email ||
    user?.email?.address ||
    displayAddr ||
    'User'

  if (!ready) return null

  if (!authenticated) {
    return (
      <Button size="sm" className="ns-auth-connect" onClick={() => login()}>
        <Wallet className="h-4 w-4 mr-1" />
        Connect
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ns-auth-chip" aria-label="Account menu">
          {profileAvatar ? (
            <img
              src={profileAvatar}
              alt={profileName}
              referrerPolicy="no-referrer"
              className="ns-auth-avatar"
            />
          ) : (
            <span className="ns-auth-avatar ns-auth-avatar--fallback">
              {profileName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="ns-auth-meta">
            <span className="ns-auth-name">{profileName}</span>
            {displayAddr && <span className="ns-auth-sub">{displayAddr}</span>}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="ns-auth-menu">
        <div className="ns-auth-menu-head">
          {profileAvatar ? (
            <img
              src={profileAvatar}
              alt=""
              referrerPolicy="no-referrer"
              className="ns-auth-menu-avatar"
            />
          ) : (
            <span className="ns-auth-menu-avatar ns-auth-menu-avatar--fallback">
              {profileName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="ns-auth-menu-ident">
            <span className="ns-auth-menu-name">{profileName}</span>
            {displayAddr && (
              <span className="ns-auth-menu-sub">{displayAddr}</span>
            )}
          </div>
        </div>

        {linkedAddresses.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="ns-auth-menu-label">
              Wallets
            </DropdownMenuLabel>
            {linkedAddresses.map((addr) => {
              const isPrimary =
                primaryWallet?.toLowerCase() === addr.toLowerCase()
              const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`
              return (
                <DropdownMenuItem
                  key={addr}
                  className="ns-auth-menu-wallet"
                  onSelect={(e) => e.preventDefault()}
                  title={addr}
                >
                  <span
                    className={`ns-auth-menu-dot${isPrimary ? ' is-primary' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="ns-auth-menu-wallet-addr">{short}</span>
                  {isPrimary && (
                    <span className="ns-auth-menu-wallet-tag">primary</span>
                  )}
                </DropdownMenuItem>
              )
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => linkWallet()}
          className="ns-auth-menu-action"
        >
          <Wallet className="h-4 w-4" />
          Link another wallet
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout()}
          className="ns-auth-menu-action ns-auth-menu-action--danger"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
