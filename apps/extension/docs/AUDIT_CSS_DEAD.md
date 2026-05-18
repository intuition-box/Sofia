# Sofia Extension — CSS Dead Classes Audit (filtered)

**Date:** 2026-04-29
**Method:** scan extension `*.css` selectors → grep in extension + DS `.ts`/`.tsx`. Classes with no literal hit are flagged. Whitelisted prefixes (dynamically generated via template literals) are filtered out: `avatar-, badge-, bento-, intention-pill--, item-pill--, item-tier--, podium-, position-board--, position-board__badge--, cart-drawer__item-pill--, batch-reward__item-tier--`.

**Total classes scanned:** 1510
**Dead candidates (after dynamic filter):** 420
**Filtered out as dynamic:** 32

## Files ranked by dead count

- `components/styles/Modal.css` → 85 candidates
- `components/styles/AccountTab.css` → 82 candidates
- `components/styles/CoreComponents.css` → 70 candidates
- `components/styles/CommonPage.css` → 58 candidates
- `components/styles/SettingsPage.css` → 42 candidates
- `components/styles/HomeConnectedPage.css` → 17 candidates
- `components/styles/BookmarkStyles.css` → 17 candidates
- `components/styles/ExtendedMetricsPanel.css` → 15 candidates
- `components/styles/FollowTab.css` → 8 candidates
- `components/styles/ProfileHeader.css` → 6 candidates
- `components/styles/PageBlockchainCard.css` → 4 candidates
- `components/styles/Global.css` → 4 candidates
- `components/styles/BottomNavigation.css` → 4 candidates
- `components/styles/CorePage.css` → 3 candidates
- `components/styles/CategoryStyles.css` → 3 candidates

---

## `components/styles/Modal.css` — 85 candidates

- `.amplify-btn-inline`
- `.full-width`
- `.modal-amount-input-container`
- `.modal-amount-label`
- `.modal-amount-option`
- `.modal-amount-options`
- `.modal-amount-section`
- `.modal-amount-suffix`
- `.modal-amount-value`
- `.modal-avatar`
- `.modal-avatar-placeholder`
- `.modal-btn-round`
- `.modal-change-info`
- `.modal-controls`
- `.modal-counter`
- `.modal-custom-amount`
- `.modal-custom-hint`
- `.modal-custom-input`
- `.modal-custom-label`
- `.modal-custom-label-main`
- `.modal-error-step`
- `.modal-identity-details`
- `.modal-identity-info`
- `.modal-identity-name`
- `.modal-identity-type`
- `.modal-input`
- `.modal-input-icon`
- `.modal-input-section`
- `.modal-loading-spinner`
- `.modal-market-cap`
- `.modal-market-cap-label`
- `.modal-market-cap-value`
- `.modal-preset-btn`
- `.modal-presets`
- `.modal-section`
- `.modal-success-icon`
- `.modal-success-step`
- `.modal-triplet-item`
- `.modal-trust-amount`
- `.modal-weight-option`
- `.modal-weight-option-content`
- `.modal-weight-option-description`
- `.modal-weight-option-label`
- `.modal-weight-option-title`
- `.modal-weight-options`
- `.modal-weight-radio`
- `.modal-weight-radio-custom`
- `.pp-slider-breakdown`
- `.pp-slider-breakdown-item`
- `.pp-slider-breakdown-label`
- `.pp-slider-breakdown-value`
- `.pp-slider-header`
- `.pp-slider-input`
- `.pp-slider-label`
- `.pp-slider-section`
- `.pp-slider-value`
- `.reward-claimed-actions`
- `.reward-claimed-icon`
- `.reward-claimed-text`
- `.stake-chart-container`
- `.stake-chart-no-data`
- `.stake-curve-badge`
- `.stake-curve-badge-small`
- `.stake-curve-pill`
- `.stake-curve-selection`
- `.stake-info-icon`
- `.stake-position-display`
- `.stake-position-header`
- `.stake-position-section`
- `.stake-position-tab`
- `.stake-position-tab-header`
- `.stake-position-tab-value`
- `.stake-position-tabs`
- `.stake-position-title`
- `.stake-position-value`
- `.stake-toggle-section`
- `.stake-triple-box`
- `.stake-triple-icon`
- `.stake-triple-name`
- `.stake-triple-object`
- `.stake-triple-predicate`
- `.stake-triple-subject`
- `.triplet-url-hint`
- `.weight-modal-cost-fee`
- `.weight-modal-url-hint`

## `components/styles/AccountTab.css` — 82 candidates

- `.account-date`
- `.account-details`
- `.account-header`
- `.account-id`
- `.account-interests`
- `.account-meta`
- `.account-subscriptions`
- `.account-tags`
- `.account-type`
- `.claim-xp-button`
- `.connect-button-text`
- `.discord-icon`
- `.discovery-section-title`
- `.interest-item`
- `.interest-more`
- `.interests-label`
- `.interests-list`
- `.platform-icon`
- `.platform-icons-container`
- `.quest-action-btn`
- `.quest-badge-name`
- `.quest-details`
- `.quest-item`
- `.quest-progress`
- `.quest-progress-text`
- `.quest-status`
- `.quest-title`
- `.quests-empty`
- `.quests-loading`
- `.quests-section`
- `.reroll-points-btn`
- `.search-error`
- `.search-icon`
- `.search-input-container`
- `.search-loading`
- `.search-logo`
- `.search-no-results`
- `.search-result-item`
- `.section-separator`
- `.social-link-button`
- `.spotify-icon`
- `.stat-icon`
- `.stat-icons-with-value`
- `.stat-sublabel`
- `.streak-bubble`
- `.streak-card`
- `.streak-card-bar`
- `.streak-card-bar-fill`
- `.streak-card-claim`
- `.streak-card-img`
- `.streak-card-info`
- `.streak-card-progress`
- `.streak-card-title`
- `.streak-section`
- `.streak-section-grid`
- `.streak-section-title`
- `.streak-vault-badge`
- `.streak-vault-card`
- `.streak-vault-header-top`
- `.streak-vault-icon`
- `.streak-vault-label`
- `.streak-vault-participants`
- `.streak-vault-stat`
- `.streak-vault-stats`
- `.streak-vault-title`
- `.streak-vault-title-row`
- `.streak-vault-value`
- `.streak-week-bubbles`
- `.subscription-item`
- `.subscription-more`
- `.subscriptions-label`
- `.subscriptions-list`
- `.tag-item`
- `.tag-more`
- `.tags-label`
- `.tags-list`
- `.twitch-icon`
- `.twitter-icon`
- `.xp-signals-count`
- `.xp-signals-label`
- `.xp-signals-value`
- `.youtube-icon`

## `components/styles/CoreComponents.css` — 70 candidates

- `.add-to-signals`
- `.analysis-header`
- `.analysis-meta`
- `.analysis-session-content`
- `.analysis-themes`
- `.analysis-time`
- `.available-triplets-section`
- `.batch-actions`
- `.bg-gray-600`
- `.bookmark-header-flex`
- `.border-blue`
- `.border-default`
- `.chart-curve-selector`
- `.chart-section-expanded`
- `.cursor-default`
- `.cursor-pointer`
- `.curve-selector-btn`
- `.echo-card`
- `.echo-checkbox`
- `.echo-header`
- `.entering`
- `.flex-center-start`
- `.flex-pointer-full`
- `.flex-space-between`
- `.margin-right-12`
- `.margin-right-8`
- `.margin-top-conditional`
- `.margin-top-none`
- `.portal-fallback-link`
- `.position-relative`
- `.processing-message`
- `.recommendation-card`
- `.recommendation-category`
- `.recommendation-reason`
- `.recommendations-grid`
- `.recommendations-section`
- `.recommendations-title`
- `.select-all-checkbox`
- `.select-all-label`
- `.selection-info`
- `.selection-panel`
- `.session-arrow`
- `.session-checkbox`
- `.session-expand-content`
- `.signals-search-input-container`
- `.sort-controls`
- `.sort-dropdown`
- `.sort-dropdown-arrow`
- `.sort-dropdown-menu`
- `.sort-dropdown-option`
- `.sort-dropdown-trigger`
- `.sort-select`
- `.suggestion-link`
- `.suggestions-list`
- `.themes-count`
- `.triplet-actions-container`
- `.triplet-card-pointer`
- `.triplet-detail-actions`
- `.triplet-detail-description`
- `.triplet-detail-name`
- `.triplet-detail-section`
- `.triplet-detail-timestamp`
- `.triplet-detail-title`
- `.triplet-detail-url`
- `.triplet-favicon`
- `.triplet-favicon-positioned`
- `.triplet-favicon-small`
- `.triplet-header`
- `.triplet-text-container`
- `.triplet-url-link`

## `components/styles/CommonPage.css` — 58 candidates

- `.amplify-btn`
- `.amplify-btn-inline`
- `.amplify-error`
- `.amplify-error-inline`
- `.amplify-header`
- `.amplify-section`
- `.amplify-success`
- `.amplify-success-inline`
- `.amplify-title`
- `.amplify-triple`
- `.border-blue`
- `.btn-cost`
- `.btn-icon`
- `.btn-text`
- `.can-afford`
- `.cannot-afford`
- `.cert-btn`
- `.cert-label`
- `.cert-option`
- `.cert-selector`
- `.cr-chip`
- `.current-predicate`
- `.dismiss-btn-small`
- `.group-detail-level`
- `.group-gold-balance`
- `.groups-count`
- `.groups-gold-badge`
- `.groups-header`
- `.groups-title`
- `.identity-content`
- `.identity-hero-section`
- `.identity-object`
- `.identity-predicate`
- `.identity-subject`
- `.identity-triple`
- `.intention-label`
- `.level-10`
- `.level-2`
- `.level-3`
- `.level-4`
- `.level-5`
- `.level-6`
- `.level-7`
- `.level-8`
- `.level-9`
- `.level-up-btn`
- `.level-up-integrated-content`
- `.menu-dots-btn`
- `.predicate-label`
- `.predicate-text`
- `.search-button`
- `.search-input-container`
- `.search-logo`
- `.success-content`
- `.success-predicate`
- `.tx-link-inline`
- `.xp-hint`
- `.xp-needed`

## `components/styles/SettingsPage.css` — 42 candidates

- `.bio-actions`
- `.bio-display`
- `.bio-edit`
- `.bio-section`
- `.bio-text`
- `.bio-textarea`
- `.cancel-button`
- `.disconnect-icon-button`
- `.edit-button`
- `.photo-input`
- `.photo-upload-button`
- `.profile-image`
- `.profile-photo`
- `.profile-photo-container`
- `.profile-placeholder`
- `.save-button`
- `.session-wallet-container`
- `.session-wallet-description`
- `.session-wallet-item`
- `.session-wallet-title`
- `.settings-item-title`
- `.settings-section-title`
- `.settings-subtext`
- `.wallet-action-button`
- `.wallet-action-buttons-container`
- `.wallet-active-indicator`
- `.wallet-address-text`
- `.wallet-balance-text`
- `.wallet-button-background`
- `.wallet-button-content`
- `.wallet-destroy-button`
- `.wallet-details`
- `.wallet-label`
- `.wallet-refill-container`
- `.wallet-refill-input`
- `.wallet-refill-input-container`
- `.wallet-refresh-button`
- `.wallet-status`
- `.wallet-status-header`
- `.wallet-warning-box`
- `.wallet-warning-icon`
- `.wallet-warning-text`

## `components/styles/HomeConnectedPage.css` — 17 candidates

- `.blockchain-card-header`
- `.current-url-display`
- `.favorites-empty-text`
- `.favorites-section`
- `.floating-button`
- `.floating-button-check`
- `.floating-buttons`
- `.floating-icon`
- `.home-analyzing`
- `.menu-open`
- `.more-triplets`
- `.pulse-animation-section`
- `.subsection-title`
- `.toggle-icon`
- `.triplet-count`
- `.triplet-stats`
- `.triplets-summary`

## `components/styles/BookmarkStyles.css` — 17 candidates

- `.bookmark-action-button`
- `.bookmark-favicon-item`
- `.bookmark-favicon-label`
- `.bookmark-header-title`
- `.bookmark-list-card`
- `.bookmark-list-title`
- `.bookmark-modal-close`
- `.bookmark-nav-action-button`
- `.bookmark-nav-button`
- `.bookmark-nav-list-item`
- `.bookmark-nav-wrapper`
- `.bookmark-search-input`
- `.bookmark-text`
- `.bookmark-triplet-card`
- `.bookmark-triplet-details`
- `.bookmark-triplets-list`
- `.bookmark-url-preview`

## `components/styles/ExtendedMetricsPanel.css` — 15 candidates

- `.accordion-content`
- `.atom-item`
- `.atom-label`
- `.atom-text`
- `.atom-type`
- `.atoms-list`
- `.atoms-section`
- `.collapsible-lists-section`
- `.collapsible-toggle`
- `.intention-label`
- `.portal-link`
- `.signals-section`
- `.signals-section-title`
- `.sort-toggle`
- `.toggle-arrow`

## `components/styles/FollowTab.css` — 8 candidates

- `.account-link`
- `.explorer-info`
- `.filter-buttons`
- `.follow-tab`
- `.follow-title`
- `.search-sort-container`
- `.sort-select`
- `.trustactive`

## `components/styles/ProfileHeader.css` — 6 candidates

- `.interest-share-btn`
- `.interest-share-icon`
- `.streak-count`
- `.streak-flame`
- `.streak-indicator`
- `.streak-label`

## `components/styles/PageBlockchainCard.css` — 4 candidates

- `.distrust-btn`
- `.trust-btn`
- `.trust-buttons-row`
- `.trust-error`

## `components/styles/Global.css` — 4 candidates

- `.form-actions`
- `.full-width`
- `.home-icon`
- `.pg-btn--primary`

## `components/styles/BottomNavigation.css` — 4 candidates

- `.bottom-nav`
- `.nav-button`
- `.nav-icon`
- `.nav-text`

## `components/styles/CorePage.css` — 3 candidates

- `.pulse-active`
- `.reveal-interest-btn`
- `.reveal-interest-cta`

## `components/styles/CategoryStyles.css` — 3 candidates

- `.categories-section`
- `.cmp-search-input`
- `.section-count`

## `components/styles/HomePage.css` — 2 candidates

- `.terms-checkbox`
- `.terms-section`

## `components/styles/CircleFeedTab.css` — 2 candidates

- `.fc-pos`
- `.vf-chip-dot`

## `components/styles/BatchRewardModal.css` — 1 candidates

- `.pd-share-btn`

## `components/styles/ProfilePage.css` — 1 candidates

- `.page-header`

## `components/styles/PagePositionBoard.css` — 1 candidates

- `.position-board__empty`

## `components/styles/AccountStats.css` — 1 candidates

- `.account-stats-loading-text`

## `components/styles/PageBlockchainHeader.css` — 1 candidates

- `.discovery-badge-img`

## `components/styles/IntentionBubbleSelector.css` — 1 candidates

- `.intention-label`

## `components/styles/DebateTab.css` — 1 candidates

- `.fc-pos`

