---
sidebar_position: 2
title: Social Verification Issues
description: OAuth and social platform verification limitations
---

# Social Verification Issues

Sofia is in alpha and some issues are known. Here's how to work around them.

## YouTube Verification

**Problem**: Youtube verification may fail or not work properly.

**Cause**: This is often because your email address hasn't been registered with the core team. Social OAuth requires backend configuration for each user.

**Solution**: Contact the core team and provide your email address. They need to perform a manual configuration on their end to enable your social verifications.

---

## Spotify Verification

**Problem**: Spotify verification is currently unreliable or unavailable.

**Cause**: This is a Spotify API limitation. Spotify has strict OAuth policies that limit which users can authenticate with third-party apps in development mode.

**Status**: The core team is actively working on a solution. In the meantime, you can still achieve [Golden Profile](../social/verification.md#golden-profile) by verifying the other 4 platforms once this limitation is resolved.

---

## Twitter/X Verification

**Problem**: Twitter/X verification is not available to all users.

**Cause**: The Twitter/X API has strict rate limits and access restrictions. During the alpha phase, the number of users who can authenticate is limited by the API tier.

**Status**: There is no workaround at this time. This limitation will be resolved as the project scales beyond alpha.

---

:::note Alpha Software
These issues are being actively tracked and fixed. If you encounter other bugs, please report them to the core team on the dedicated Discord Channel. Never contact the core team in DM.
:::
