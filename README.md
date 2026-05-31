# [f78's website](https://www.f78.be)

The third version of my website. It isn't quite finished yet, and may therefore contain some issues.
This time around I'm using [Astro](https://astro.build), with the final site being deployed to
Cloudflare Workers _(although that's subject to change because it breaks a few parts of the
website)_.

This website is loosely based on the
[official Astro blog template](https://github.com/withastro/astro/tree/main/examples/blog).

_Third time's the charm, right?_

## Browser support

This website is best experienced with a **fairly recent version** of a browser based on **Chromium,
Firefox or Safari**. A decently modern device is also recommended, particularly for Immersive Mode.

I only test up-to-date versions of Vivaldi (based on **Chromium**) on both **Linux** and
**Android**, and occasionally Safari on macOS, as well as Firefox. (I do not yet have a way of
testing on iOS due to the official simulator taking up too much space.)

That could mean there is a chance an issue might pop up on an older browser, however I also mostly
stick to features that are
[Baseline Widely available](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility)
(which have been supported by the major browsers for at least 2.5 years), so that shouldn't really
happen.

### Media

All media files, like images, audio and videos, are compressed quite a bit in order to reduce the
size of this repository, as I don't want to deal with a CDN for now. Of course, I'll do my best to
strike a good balance between compression and quality for each file.

- **Images** are automatically optimized by Astro using various formats and sizes to save your
  bandwidth. These will have a **lower quality**, so make sure to use the image viewer to download
  them.
  - The **image viewer** always displays (and downloads) the **source image**, which is typically in
    **WebP** or **AVIF** format. As such, older browsers and applications might not load these
    properly.

- **Video** and **audio** are currently encoded as **H.264** and **AAC** respectively, using an
  **MP4** container. This is simply because better formats aren't supported very well, especially by
  Safari. I use FFmpeg to encode these, with the help of [this script](./scripts/convert.ts)
  (available through `npm run convert`).

## Improvements over the old Jekyll site

- An expanded home page
  - I will add more pages later.
- Completely revamped styling... again (this time based on
  [Modern Normalize](https://github.com/sindresorhus/modern-normalize))
- A work-in-progress animated starry background using WebGL
  - This, along with some other effects, is disabled by default on mobile browsers (for performance
    reasons, just to be safe), or when
    [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
    is enabled. You can always toggle it yourself with the next thing:
- A quite in-depth preferences page for you to tweak the website to your liking
  - More settings will be added over time.
- Several modern features provided by Astro, like page transitions and responsive images
- And much more!

## Looking to clone this repository?

There are 2 things you need to keep in mind.

- First, this repository uses
  [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/installing-git-large-file-storage)
  to store media files. Make sure to install it properly to get those media files. _(and maybe
  configure it as well? not sure)_
- Second, **submodules** are also used for things like the serif font (Edwin).
  - Haven't cloned yet? Then make sure to use `git clone --recurse-submodules`.
  - If you already cloned it and forgot about the submodules, run
    `git submodule update --init --recursive` inside the repository.

To run a local dev server, you can use `npm run dev` as you normally would with Astro. `npm start`
has also been added as an alias. These scripts have been modified to suit my use case better.

## Licence

The content of the website (i.e. the written text and most media I made) is available under the
[Creative Commons Attribution-ShareAlike (CC BY-SA) 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/)
unless stated otherwise - see the [LICENSE-CONTENT](./LICENSE-CONTENT) file.

Some less significant media is instead dedicated to the public domain. The licence of media files is
always clearly labelled, either directly below the media or in its corresponding full-screen viewer.

The source code (like Astro components, TypeScript files, SCSS stylesheets, etc.) instead fall under
the [MPL-2.0 licence](./LICENSE). Do note that the quality of this code may not be the best due to
my lack of Astro experience. You are welcome to make improvements, though.
