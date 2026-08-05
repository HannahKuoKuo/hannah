# Hannah (Pei-Ju) Kuo — Portfolio

A one-page portfolio site — content, social media, and marketing career highlights — built as a static HTML/CSS/JS site with no build step.

## View locally

Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```
index.html            # the entire site
assets/docs/           # downloadable resume & full case study deck (PDF)
```

## Deploy (GitHub Pages)

1. Repo Settings → Pages → Source: deploy from branch (e.g. `main`), folder `/ (root)`.
2. The site publishes at `https://<username>.github.io/<repo>/`.

## Updating content

All copy, work history, and case-study numbers live directly in `index.html` — search for the relevant section (`<!-- HERO -->`, `<!-- EXPERIENCE -->`, `<!-- SELECTED WORK -->`, etc.) and edit in place. Swap the files in `assets/docs/` to update the downloadable resume/portfolio.
