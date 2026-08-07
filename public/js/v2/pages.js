// The competent, boring subpages. Inheritance expressed as ordinary
// working furniture (the completionist fought v1 for these; v2 just has
// them). All copy in L7 grammar; nothing here ever reacts to anything.
const back = `<a href="/" class="btn btn-ghost back-home" data-close-space>← Back</a>`;

const PAGES = {
  '/about': `
    <h1>About Loam</h1>
    <p>Loam builds measurement software for product teams. It reads the
    signals visitors already give — attention, hesitation, return — and
    turns them into records a team can act on.</p>
    <p>The company was founded in 2021 in Portland, Oregon. It runs a small
    beta with a deliberately limited number of accounts while the
    engagement model completes its evaluation phase.</p>
    <p>Loam does not sell data. It never even collects it centrally: every
    account's records stay on the account's own infrastructure.</p>
    ${back}`,
  '/product': `
    <h1>Product</h1>
    <p>Loam is installed with one script tag. From the first pageview, it
    maintains a continuous record of how each visitor reads, pauses, and
    returns. It builds one profile per subject and refines it every
    session.</p>
    <p>Dashboards update between sessions. Loam prefers settled data to
    live noise: it reports what a visit meant, not what a cursor did.</p>
    <p>Existing customers can <a href="/app" data-nav="app">sign in</a>.</p>
    ${back}`,
  '/blog': `
    <h1>Notes</h1>
    <article class="blog-entry">
      <h2>Measuring what people almost do</h2>
      <p class="muted">March 2021</p>
      <p>Analytics counts what happened. Most of what a visitor does is
      what they almost did: the form focused and abandoned, the paragraph
      read twice, the tab kept open for days. Loam was built on the
      position that the almosts are the real record.</p>
    </article>
    <article class="blog-entry">
      <h2>Why we don't ship a live view</h2>
      <p class="muted">June 2021</p>
      <p>Watching a session live changes the watcher, not the session.
      Loam settles its records between visits. The report you read in the
      morning is calmer and more true than the feed you'd refresh at
      night.</p>
    </article>
    ${back}`,
  '/careers': `
    <h1>Careers</h1>
    <p>Open positions: 0</p>
    <p class="muted">The beta team is complete. Openings are expected after
    the current evaluation concludes.</p>
    ${back}`,
  '/privacy': `
    <h1>Privacy</h1>
    <p>Loam's records are stored on the visitor's own device, in the
    browser's standard storage. Nothing is transmitted. Nothing is sold.
    There is no server holding a copy.</p>
    <p>To be forgotten, clear this site's data in your browser settings.
    This works. It is the one operation Loam cannot undo, and it is
    honored completely.</p>
    ${back}`,
};

export function renderSubpage(path) {
  if (PAGES[path]) return PAGES[path];
  return `
    <h1>404</h1>
    <p class="muted">This page isn't here.</p>
    <p class="muted">Looking for your dashboard? <a href="/app" data-nav="app">Sign in at /app</a>.</p>
    ${back}`;
}
