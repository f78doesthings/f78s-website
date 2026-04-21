# [f78's website](https://www.f78.be)

The third version of my website, which isn't quite finished yet, and may therefore contain some issues. This time around
I'm using [Astro](https://astro.build), with the final site being deployed to Cloudflare Workers.

This website is loosely based on
the [official Astro blog template](https://github.com/withastro/astro/tree/main/examples/blog).

*Third time's the charm, right?*

## Browser support

This website is best experienced with a fairly recent version of a Chromium- or Firefox-based browser, or Safari. A
decently modern device is also recommended, particularly for Immersive Mode.

I only test up-to-date versions of Vivaldi (based on Chromium) on both Linux and Android, and occasionally Safari
on macOS or Firefox, so there is a chance an issue might pop up on an older browser.
However, I also mostly stick to features that
are [Baseline Widely available](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility) (which have
been supported by the major browsers for at least 2.5 years), so that shouldn't really happen.

## Improvements over the old Jekyll site

- An expanded home page
	- I will add more pages later.
- Completely revamped styling... again (this time based
  on [Modern Normalize](https://github.com/sindresorhus/modern-normalize))
- A work-in-progress animated starry background using WebGL
	- This, along with some other effects, is disabled by default on mobile browsers (for performance reasons, just to be
	  safe), or when
	  [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
	  is enabled. You can always toggle it yourself with the next thing:
- A quite in-depth preferences page for you to tweak the website to your liking
	- More settings will be added over time.
- Several modern features provided by Astro, like page transitions and responsive images
- And much more!

## Licence

The content of the website (i.e. the written text and any images I made) is available under
the [Creative Commons Attribution-ShareAlike (CC-BY-SA) 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/) -
see the [LICENSE-CONTENT](./LICENSE-CONTENT) file.

The source code (like Astro components, TypeScript files, SCSS stylesheets, etc.) instead falls under
the [ISC licence](./LICENSE).
