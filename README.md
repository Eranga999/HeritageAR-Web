# HeritageAR research website

A single-page static site for the HeritageAR final-year research project (Faculty of Computing, SLIIT). It is plain HTML, CSS and JavaScript. There is no build step, no framework and no server.

## Open it

Double-click `index.html`. The site works straight from the file system (`file://`) and on any static host. The only external request is Google Fonts; without a connection the system font is used instead.

## Folder layout

```
index.html            the page (all six sections and static prose)
css/styles.css        all styles
js/main.js            all behaviour
js/architecture.js    the "How we work together" diagram and member tabs
data/site-data.js     ALL editable content (people, milestones, documents, stats...)
assets/logo.svg       logo with wordmark
favicon.svg           browser tab icon
assets/images/        app screenshots and photos
assets/team/          team photos
assets/docs/          PDF and PPTX files
```

## Fill in the placeholders

Open `data/site-data.js` in any text editor. The comment block at the top lists every field that still needs a value. Search the file for `PLACEHOLDER` to find each one.

Rules:

- `""` (empty text) or `null` means "not provided yet". The site shows a neutral "To be added", "Date TBA" or "Marks TBA" label. Do not type made-up values.
- Keep the quotes and commas. If the page suddenly looks empty, a comma or quote is probably missing. Press F12 and look at the Console tab for the line number.

What to fill in:

| Field | Example |
| --- | --- |
| `people.supervisors[0]` and `[1]`: `name`, `title`, `email` | `"Senior Lecturer"` |
| `people.members[i].component` | `"On-device RAG assistant"` |
| `milestones[i].date` | `"2026-03-12"` (always `YYYY-MM-DD`) |
| `milestones[i].marks` | `6` (a number, no quotes) |
| `documents.documents[i].url`, `documents.presentations[i].url` | `"assets/docs/charter.pdf"` |
| `contact.responseTime` | `"Within 2 working days"` |
| `stats` | re-check the three numbers against the final paper |
| `collaboration.members[i]`: `nodeIds`, `hint`, `description` | `nodeIds: ["recognition"]` (see below) |

Milestone status (Completed, Upcoming, Pending) is worked out from today's date, so it updates by itself. The summary cards, progress bar and table update from the same data.

Prose in the Domain section (literature review, research gap, problem, objectives, methodology) is written directly in `index.html` so search engines and readers without JavaScript can see it. Technology tiles are rendered from `domain.technologies` in the data file.

## "How we work together" diagram

The isometric architecture diagram under About Us is drawn by `js/architecture.js` from the `collaboration` block in `data/site-data.js`.

- **Assign components:** each entry in `collaboration.members` matches a person in `people.members` (same order). Put the ids of the parts that person builds in `nodeIds`, for example `nodeIds: ["recognition"]`. Also fill in `hint` (one line under their name on the tab) and `description` (two or three plain sentences). While `nodeIds` is `[]`, the tab shows "To be added" and nothing lights up. The site never guesses an assignment.
- **Node ids:** `core`, `sensors`, `recognition`, `assistant`, `overlay`, `navigation`, `translator`, `map`, `alerts`.
- **Receives from / Hands over to / Works together with** are worked out from `collaboration.links`, so they update by themselves when you assign nodes or add links.
- **Moving or adding parts:** each node has `x`, `y` (position on the floor grid, the App core is at 0, 0), a `shape` (stack, dome, rack, panel, pedestal, signpost, board, crate, warning) and a `label` offset. Links run along the grid lines; use `route: "yx"` to turn the corner the other way, and `draw: false` for a link that would sit exactly on top of other lines.

## Add photos

1. Put square photos (at least 480 x 480 px, JPG) in `assets/team/`, for example `assets/team/member-1.jpg`.
2. Set the matching `photo` field in `data/site-data.js`: `photo: "assets/team/member-1.jpg"`.

Until a photo is set, or if the file cannot be loaded, the card shows the person's initials. To change the initials, add `initials: "KG"` to that person.

## Add app screenshots

Put the files in `assets/images/` and set the paths in the `images` block of the data file:

| Slot | Suggested file | Shape |
| --- | --- | --- |
| `screenMap` | `screen-map.png` | hero left phone: offline map, 1170 x 2532 |
| `screenDetect` | `screen-detect.png` | hero centre phone: landmark detection, 1170 x 2532 |
| `screenTranslate` | `screen-translate.png` | hero right phone: signboard translation, 1170 x 2532 |
| `translatorScreen` | `translator-screen.png` | 3:2, optional, shown in the "Plus" strip |

While a slot is empty the built-in illustration is shown. The three hero phones show a drawn interface with the caption "Illustrative interface..."; the caption disappears once all three screenshots load. Keep each image under 300 KB. Compress images before adding them (for example with squoosh.app) to keep the page fast.

For link previews on social media, add `assets/images/sigiriya-hero.jpg` (1200 x 630) and, once the site is published, change the `og:image` tag in `index.html` to the full URL.

## Add documents and slides

Either:

- copy the file into `assets/docs/` and set `url: "assets/docs/final-report.pdf"`. Local files get both an Open and a Download button; or
- paste a Google Drive or OneDrive share link as the `url`. Make sure the link is set to "Anyone with the link can view".

Documents with an empty `url` show a disabled "Coming soon" button. A milestone's "View document" link points to the document with the same id as its `docId`.

## Deploy to GitHub Pages

1. Create a new repository on GitHub and upload the contents of this folder (so `index.html` is at the top level).
   With Git:
   ```
   git init
   git add .
   git commit -m "HeritageAR website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
2. On GitHub open Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", branch `main`, folder `/ (root)`, and save.
3. After a minute the site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.
4. Optional: in `index.html`, uncomment the `<link rel="canonical">` tag and put that address in it.

All paths are relative, so the site also works on Netlify, Cloudflare Pages or any other static host. Drag the folder onto the host's upload page.

## Contact form email

The contact form (name, email, organisation, topic, message and attachments) is sent by [FormSubmit](https://formsubmit.co), a free email sending service for static sites. Pressing **Submit** emails the message, with the files attached, to erangaharsha739@gmail.com. There is no account to create and no code to deploy, but two one-time steps are needed:

1. **Activate the form.** Publish the site (for example on GitHub Pages) and send one test message from it. FormSubmit emails erangaharsha739@gmail.com an **Activate Form** link. Click it. Until then the form shows a message saying it needs activation, and nothing is delivered. Messages cannot be sent from a copy opened by double-clicking `index.html` (`file://`); use the published site.
2. **Hide the address (recommended).** The activation email also contains a random alias string. In `data/site-data.js`, replace `erangaharsha739@gmail.com` in `formEndpoint` with that string, for example `"https://formsubmit.co/ajax/1a2b3c4d5e..."`. This keeps the address out of the page code and away from spam bots.

- Each message arrives from FormSubmit with the subject "[Topic] HeritageAR website message", the fields in a table and the files attached. Reply goes straight to the visitor.
- Limits: up to 5 files, 10 MB in total (FormSubmit's limit); PDF, Word, PowerPoint, Excel, images, text, CSV or ZIP. The limits are at the top of `js/main.js`.
- To send to a different inbox, change the email (or alias) at the end of `formEndpoint` and activate again.
- A hidden `_honey` field catches simple spam bots; FormSubmit drops their submissions.

## Notes

- No analytics or tracking scripts are included.
- Animations are turned off for visitors who ask their device to reduce motion.
