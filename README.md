<p align="center">
<img src="./public/logo_full.svg" alt="Seerr" style="margin: 20px 0;">
</p>
<p align="center">
<img src="https://github.com/binarygeek119/seerr/actions/workflows/release.yml/badge.svg" alt="Seerr Release" />
<img src="https://github.com/binarygeek119/seerr/actions/workflows/ci.yml/badge.svg" alt="Seerr CI">
</p>
<p align="center">
<a href="https://discord.gg/xmNs5ecFX"><img src="https://img.shields.io/badge/Discord-Open%20Repository's-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
<a href="https://hub.docker.com/r/seerr/seerr"><img src="https://img.shields.io/docker/pulls/seerr/seerr" alt="Docker pulls"></a>
<a href="https://translate.seerr.dev/engage/seerr/"><img src="https://translate.seerr.dev/widget/seerr/svg-badge.svg" alt="Translation status" /></a>
<a href="https://github.com/binarygeek119/seerr/blob/develop/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/binarygeek119/seerr"></a>

**Seerr** is a free and open source software application for managing requests for your media library. It integrates with the media server of your choice: [Jellyfin](https://jellyfin.org), [Plex](https://plex.tv), and [Emby](https://emby.media/). In addition, it integrates with your existing services, such as **[Sonarr](https://sonarr.tv/)**, **[Radarr](https://radarr.video/)**, **[Lidarr](https://lidarr.audio/)**, and **[Readarr](https://readarr.com/)** (or [Chaptarr](https://github.com/Chaptarr/Chaptarr) for books).

## Fork Notice

**Repository:** [github.com/binarygeek119/seerr](https://github.com/binarygeek119/seerr)

> **This repository is an unofficial, AI-assisted fork of [Seerr](https://github.com/seerr-team/seerr).**  
> Changes in this fork were developed with AI tooling and have not gone through the same review process as upstream Seerr releases. Use at your own discretion.

Report issues and contribute on this fork: **[binarygeek119/seerr](https://github.com/binarygeek119/seerr)**.

### Why this fork exists

This fork was used to add **music (Lidarr)** and **book / audiobook (Readarr & Audiobookshelf)** support before those features existed in official Seerr. That work was inspired by upstream requests such as [seerr-team/seerr#2132](https://github.com/seerr-team/seerr/issues/2132) (music) and [seerr-team/seerr#1918](https://github.com/seerr-team/seerr/issues/1918) (books).

### Maintenance plan

| Area | Status |
|------|--------|
| **3D movie support** (Radarr 3D, theatrical 3D list, UI badges) | **Actively maintained** on this fork — this is the main reason the repo stays online. |
| **Music (Lidarr)** | Added here first; **will not be maintained** on this fork once official Seerr ships it. |
| **Books / audiobooks (Readarr, Audiobookshelf)** | Added here first; **will not be maintained** on this fork once official Seerr ships it. |

Once music and book/audiobook support land in [official Seerr](https://github.com/seerr-team/seerr), use upstream for those features. Keep using **binarygeek119/seerr** if you want the **3D mod** and fork-specific fixes until or unless upstream adopts them.

For the official project, roadmap, and support, see [seerr-team/seerr](https://github.com/seerr-team/seerr).

### Support official Seerr

This fork is built on **[official Seerr](https://github.com/seerr-team/seerr)**. The maintainers and contributors upstream do the heavy lifting — please support them, not only this fork:

- ⭐ Star [seerr-team/seerr](https://github.com/seerr-team/seerr) on GitHub
- 🐛 Report core bugs and features on [upstream issues](https://github.com/seerr-team/seerr/issues) when they are not specific to this fork’s 3D mod
- 💬 Join official community: [docs.seerr.dev](https://docs.seerr.dev) and [Discord (seerr-team)](https://discord.gg/seerr)
- 💝 **Donate** via [Open Collective → Seerr](https://opencollective.com/seerr) — contributions go to the official project (see backers/sponsors at the bottom of this README)

## Current Features

- Full Jellyfin/Emby/Plex integration including authentication with user import & management.
- Support for **PostgreSQL** and **SQLite** databases.
- Supports Movies, Shows, Music, Books, and Mixed Libraries.
- Ability to change email addresses for SMTP purposes.
- Easy integration with your existing services: Sonarr, Radarr, Lidarr (music), and Readarr (ebooks and audiobooks).
- Jellyfin/Emby/Plex library scan, to keep track of the titles which are already available.
- Customizable request system, which allows users to request individual seasons or movies in a friendly, easy-to-use interface.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests!
- Granular permission system.
- Support for various notification agents.
- Mobile-friendly design, for when you need to approve requests on the go!
- Support for watchlisting & blocklisting media.

With more features on the way! Check out our [issue tracker](/../../issues) to see the features which have already been requested.

## Getting Started

Check out our documentation for instructions on how to install and run Seerr:

https://docs.seerr.dev/getting-started/

## Preview

<img src="./public/preview.jpg" alt="Seerr application preview" />

## Migrating from Overseerr/Jellyseerr to Seerr

Read our [release announcement](https://docs.seerr.dev/blog/seerr-release) to learn what Seerr means for Jellyseerr and Overseerr users.

Please follow our [migration guide](https://docs.seerr.dev/migration-guide) for detailed instructions on migrating from Overseerr or Jellyseerr.

## Support

- Check out the [Seerr Documentation](https://docs.seerr.dev) before asking for help. Your question might already be in the docs!
- You can get support on [Discord](https://discord.gg/xmNs5ecFX).
- **Bug reports & features:** [GitHub Issues](/../../issues/new/choose) (use the templates).
- **Help & setup questions:** [Discord](https://discord.gg/xmNs5ecFX) (do not open an issue for general support).

## API Documentation

You can access the API documentation from your local Seerr install at http://localhost:5055/api-docs

## Community

For **this fork**, chat on [Open Repository's Discord](https://discord.gg/xmNs5ecFX). For **official Seerr**, use [discord.gg/seerr](https://discord.gg/seerr).

Our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all Seerr community channels.

## Contributing

You can help improve Seerr too! Check out our [Contribution Guide](./CONTRIBUTING.md) to get started.

## Support official Seerr (donations)

The badges below support the **official** [Seerr](https://github.com/seerr-team/seerr) maintainers via [Open Collective](https://opencollective.com/seerr), not this fork.

## Contributors ✨

[![Contributors](https://opencollective.com/seerr/contributors.svg?width=890)](https://opencollective.com/seerr/#backers)

[![Become a Backer](https://opencollective.com/seerr/backers.svg)](https://opencollective.com/seerr/#backers)
[![Become a Sponsor](https://opencollective.com/seerr/sponsors.svg)](https://opencollective.com/seerr/#sponsors)
