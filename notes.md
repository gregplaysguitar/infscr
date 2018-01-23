Infinite scroll V2
==================

Requirements
------------

- Drop in solution ala original
- back button fix as painless as possible
- no dependencies (jquery free, but works optionally as a jquery plugin)
- Can't rely on custom backend implementations for back button fix


Back button ideas
-----------------

1. Save page results in cache

   - requires ajax page loading and integration with whatever ajax system
     is in use

2. Save cached content in localstorage

   - would need to avoid any prompts to the user to enable this

3. Remember container height and page number; load pages sequentially into
   container.

   - could be crazy/silly with lots of pages
   - but, probably works in all cases with no customisation

4. Remember container height and page number, and somehow remember element
   positioning, so just load in current page. Load in previous pages if the
   user scrolls up.

   - Probably can't work with layout libraries

5. Remember page number; just load that page at top of screen. Offer some
   sort of mechanism to view previous.

   - might seem a bit shonky to the user
