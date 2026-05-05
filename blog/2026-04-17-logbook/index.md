---
slug: logbook-17-04
title: Logbook 17/04
authors: [Samuel, Maxime]
---

Real reputation scoring went live this week: users now get a score that reflects
their actual activity on connected platforms, not just a count of how many they
connected.

<!-- truncate -->

## From counter to real reputation

Until this week, the reputation score was effectively a counter. Connect a platform,
get ten points, repeat. A developer with five years of commits had the same number
as someone who had just created a GitHub account. That undermined the whole premise
of building reputation from real behavior.

This week we replaced that counter with a system that actually reads what each user
does. When someone connects GitHub, we now look at their streak, how active their
repositories are, how much recognition their work has received, and how long they
have been contributing. The same principle applies across every supported platform,
each with its own signals that matter for that domain.

## Secure storage on trusted hardware

To fetch those metrics over time, we need to keep the user's authorization tokens
somewhere safe. We chose to store them inside a trusted execution environment, which
means the server itself cannot read the data in memory. Every token is additionally
encrypted at the application level before it ever touches the disk. Two layers, so
even a full compromise of the infrastructure would not expose user tokens.

The tokens never travel through the frontend, never sit in a log file, and are only
ever used to ask each platform for fresh metrics when a user views their profile.

## Platform connections, end to end

Making the platform connect buttons actually work required building the full
authorization flow ourselves. The user clicks connect, a popup opens to the platform,
they authorize, the popup closes, and their token is exchanged and stored — all
without any secret leaving our servers.

We now support GitHub, Spotify, Discord, Twitch, and YouTube. Each one has its quirks
around how tokens are exchanged and what permissions are needed, and each one now has
dedicated handling so the metrics we care about actually come back.

## A fairer scoring formula

The old formula had a subtle exploit: a user with a high general trust score but zero
real platform signals could reach a perfect score simply through the trust boost. We
reordered the calculation so that the trust boost is applied before the anti-fraud
penalty, not after, closing that loophole. A user who hasn't connected any platform
can no longer reach a meaningful score purely through reputation halo.

We also introduced a gentle bonus for users with two connected platforms, which sat
awkwardly between the penalty for having only one source and the bonus for having
three or more. And the scoring now warns loudly when a new metric comes in without a
defined mapping, so nothing silently disappears.

## The one critical fix

By far the most important thing we found and fixed this week: the frontend was
marking platforms as connected without actually sending the token to the backend for
storage. Users saw a green checkmark, but nothing was happening under the hood. Their
score stayed at zero and no one could figure out why.

Two small changes on the frontend — actually calling the storage step, and wrapping
the payload in the envelope the workflow engine expects — turned the whole system
from silently broken to working end to end. The first real user who connected GitHub
afterwards saw their score jump to one hundred out of one hundred immediately.

## Cleaning up after EthCC

EthCC was a conference we were integrating with for visibility and a scoring bonus.
The event is now over, so we removed everything tied to it: the dedicated card, the
countdown in the sidebar, the bonus path in the scoring, the types, the styles, the
feature mention on the landing page. The product is noticeably simpler.

## Deployments

Three production deployments on Phala Cloud this week, each one a step forward:
first the signal fetching backbone, then the authorization routes, then richer
metrics and validation. We also fixed a production environment variable issue that
was making the frontend silently fall back to trying to reach a local backend that
didn't exist in users' browsers.

## Where it stands

A user who connects an active GitHub account today sees a meaningful tech and dev
score almost immediately. That was the goal for the week, and it works. The next
step is explaining that score to users — breaking down which platforms contributed
what, which multipliers applied, and what they could do to grow it further.
Transparency of the calculation is what turns a number into trust.
