<p align="center">
<img src="./public/logo_full.svg" alt="Seerr" style="margin: 20px 0;">
</p>
<p align="center">
<img src="https://github.com/binarygeek119/seerr/actions/workflows/release.yml/badge.svg" alt="Seerr Release" />
<img src="https://github.com/binarygeek119/seerr/actions/workflows/ci.yml/badge.svg" alt="Seerr CI">
</p>
<p align="center">
<a href="https://discord.gg/seerr"><img src="https://img.shields.io/discord/783137440809746482" alt="Discord"></a>
<a href="https://hub.docker.com/r/seerr/seerr"><img src="https://img.shields.io/docker/pulls/seerr/seerr" alt="Docker pulls"></a>
<a href="https://translate.seerr.dev/engage/seerr/"><img src="https://translate.seerr.dev/widget/seerr/svg-badge.svg" alt="Translation status" /></a>
<a href="https://github.com/binarygeek119/seerr/blob/develop/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/binarygeek119/seerr"></a>

**Seerr** is a free and open source software application for managing requests for your media library. It integrates with the media server of your choice: [Jellyfin](https://jellyfin.org), [Plex](https://plex.tv), and [Emby](https://emby.media/). In addition, it integrates with your existing services, such as **[Sonarr](https://sonarr.tv/)**, **[Radarr](https://radarr.video/)**, **[Lidarr](https://lidarr.audio/)**, and **[Readarr](https://readarr.com/)** (or [Chaptarr](https://github.com/Chaptarr/Chaptarr) for books).

## Fork Notice

**Repository:** [github.com/binarygeek119/seerr](https://github.com/binarygeek119/seerr)

> **This repository is an unofficial, AI-assisted fork of [Seerr](https://github.com/seerr-team/seerr).**  
> Changes in this fork were developed with AI tooling and have not gone through the same review process as upstream Seerr releases. Use at your own discretion.

Report issues and contribute on this fork: **[binarygeek119/seerr](https://github.com/binarygeek119/seerr)**.

This fork adds **music (Lidarr)** and **book / audiobook (Readarr)** request support, inspired by the upstream feature requests and community work in:

- **[seerr-team/seerr#2132](https://github.com/seerr-team/seerr/issues/2132)** — feat: music support (Lidarr integration)
- **[seerr-team/seerr#1918](https://github.com/seerr-team/seerr/issues/1918)** — feat: add book support (Readarr integration)

Those issues and their related pull requests are still open upstream. This fork implements similar functionality locally for testing and personal use. For the official Seerr project, roadmap, and support, see [seerr-team/seerr](https://github.com/seerr-team/seerr).

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
- You can get support on [Discord](https://discord.gg/seerr).
- You can ask questions in the Help category of our [GitHub Discussions](/../../discussions).
- Bug reports and feature requests can be submitted via [GitHub Issues](/../../issues).

## API Documentation

You can access the API documentation from your local Seerr install at http://localhost:5055/api-docs

## Community

You can ask questions, share ideas, and more in [GitHub Discussions](/../../discussions).

If you would like to chat with other members of our growing community, [join the Seerr Discord server](https://discord.gg/seerr)!

Our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all Seerr community channels.

## Contributing

You can help improve Seerr too! Check out our [Contribution Guide](./CONTRIBUTING.md) to get started.

## Contributors ✨

[![Contributors](https://opencollective.com/seerr/contributors.svg?width=890)](https://opencollective.com/seerr/#backers)

[![Become a Backer](https://opencollective.com/seerr/backers.svg)](https://opencollective.com/seerr/#backers)
[![Become a Sponsor](https://opencollective.com/seerr/sponsors.svg)](https://opencollective.com/seerr/#sponsors)
