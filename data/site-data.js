/*
 * HeritageAR - site content
 * =====================================================================
 * Every piece of editable content on the website lives in this file.
 * Edit a value, save, and reload index.html. No other code change is
 * needed. Keep the commas and quotes intact.
 *
 * "" (empty text) and null mean "not provided yet". The site then shows
 * a neutral "To be added" / "TBA" label. Never put made-up values here.
 *
 * STILL TO FILL IN (search this file for "PLACEHOLDER"):
 *   1. people.supervisors[0]   Supervisor: name, title, email, photo
 *   2. people.supervisors[1]   Co-Supervisor: name, title, email, photo
 *   3. people.members[1], [2], [3]   component (each member's research component)
 *   4. people.members[*].photo  e.g. "assets/team/member-1.jpg"
 *   5. milestones[*].date       "YYYY-MM-DD", e.g. "2026-03-12"
 *   6. milestones[*].marks      a number, e.g. 6
 *   7. documents.*[*].url       "assets/docs/charter.pdf", or a Google Drive / OneDrive link
 *   8. contact.responseTime     e.g. "Within 2 working days"
 *   8b. contact.formEndpoint    swap the email for the FormSubmit alias after activation (README, "Contact form email")
 *   9. images.*                 app screenshots and photos (leave "" to keep the illustrations)
 *  10. stats                    re-verify against the final paper before submission
 *  11. social, and linkedin / github per person (optional, icons appear only when set)
 *  12. index.html <head>        og:image file and the commented canonical URL
 */
window.SITE_DATA = {
  project: {
    name: "HeritageAR",
    fullTitle: "HeritageAR: A Fully Offline Intelligent Augmented Reality Framework for Fine-Grained Landmark Recognition, Information Augmentation, On-Device RAG Conversational Assistance, and Visual Landmark-Based Navigation",
    tagline: "Your heritage guide that works where the signal doesn't.",
    institution: "Faculty of Computing, Sri Lanka Institute of Information Technology (SLIIT), Malabe, Sri Lanka",
    fieldSite: "Sigiriya, Sri Lanka (UNESCO World Heritage Site)"
  },

  /* Image slots. Put the file in assets/images/ and write its path here.
     While a slot is "", the built-in SVG illustration is shown instead. */
  images: {
    screenMap: "",        // PLACEHOLDER "assets/images/screen-map.png" (hero left phone, app screenshot 1170 x 2532)
    screenDetect: "",     // PLACEHOLDER "assets/images/screen-detect.png" (hero centre phone, 1170 x 2532)
    screenTranslate: "",  // PLACEHOLDER "assets/images/screen-translate.png" (hero right phone, 1170 x 2532)
    translatorScreen: ""  // PLACEHOLDER "assets/images/translator-screen.png" (optional, shown in the "Plus" strip)
  },

  /* RE-VERIFY BEFORE FINAL SUBMISSION: these figures come from the current
     paper draft. The numeric part counts up on screen; the final text shown
     is exactly the value written here. */
  stats: [
    { value: "20+", caption: "network requests during operation (airplane-mode tested)" },
    { value: "3.1 MB", caption: "INT8 landmark detector, down from 11.7 MB FP32" },
    { value: "0.95", caption: "macro mAP@0.5 on the Sigiriya test split" }
  ],

  /* Icons available: scan-frame, layers, chat, route, map, translate, cpu, compass, eye, landmark */
  features: [
    { icon: "scan-frame", title: "Fine-grained recognition", text: "A quantised YOLOv8n detector tells which landmark and which sub-landmark is in view." },
    { icon: "layers", title: "AR information overlay", text: "Content is anchored to the confirmed structure and shows its confidence honestly." },
    { icon: "chat", title: "On-device RAG assistant", text: "A local language model answers questions grounded in a curated heritage knowledge base." },
    { icon: "route", title: "Landmark-based navigation", text: "Relative routes confirmed visually, so it works even when GNSS error exceeds the path length." }
  ],

  domain: {
    /* The literature review, research gap, problem, objectives and methodology
       are written directly in index.html so search engines and readers without
       JavaScript can see them. Edit that prose in index.html.

       Technology tiles are rendered from this list. Only list technologies
       actually used. "icon" is the symbol shown in the tile circle; "mono" (a short
       monogram) is shown instead when there is no icon. Tile icons available:
       smartphone, cube, scan-frame, cpu, text-scan, network, database, sparkles,
       translate, layers, map-pin, bell, code, git-branch, and the feature icons above. */
    technologies: [
      { group: "Mobile", items: [
        { name: "Flutter / Dart", role: "Cross-platform app and UI", mono: "FL", icon: "smartphone" },
        { name: "ARCore (planned spatial AR)", role: "Future anchored AR", mono: "AR", icon: "cube" }
      ] },
      { group: "Vision", items: [
        { name: "YOLOv8n (Ultralytics)", role: "Fine-grained landmark detector", mono: "YO", icon: "scan-frame" },
        { name: "TensorFlow Lite INT8", role: "On-device quantised inference", mono: "TF", icon: "cpu" },
        { name: "On-device OCR (Sinhala, Tamil, English)", role: "Signboard text recognition", mono: "OC", icon: "text-scan" }
      ] },
      { group: "Language", items: [
        { name: "Sentence embeddings (MiniLM-class)", role: "Passage and query encoding", mono: "SE", icon: "network" },
        { name: "Local vector index", role: "Similarity search, no server", mono: "VI", icon: "database" },
        { name: "Compact local LLM", role: "Grounded answers and explanations", mono: "LM", icon: "sparkles" },
        { name: "Offline translation and dictionary", role: "Signboard translation with fallback", mono: "TR", icon: "translate" }
      ] },
      { group: "Maps and Location", items: [
        { name: "GeoPackage / SQLite", role: "Bundled offline map layers", mono: "GP", icon: "layers" },
        { name: "geolocator", role: "GPS updates for geofencing", mono: "GL", icon: "map-pin" },
        { name: "flutter_local_notifications", role: "Local wildlife alerts", mono: "LN", icon: "bell" }
      ] },
      { group: "Tooling", items: [
        { name: "Python", role: "Training and data preparation", mono: "Py", icon: "code" },
        { name: "Git and GitHub", role: "Version control", mono: "Git", icon: "git-branch" }
      ] }
    ]
  },

  /* PLACEHOLDER: dates and marks must come from the module outline.
     date: "YYYY-MM-DD" or "" (shows "Date TBA")
     marks: a number or null (shows "Marks TBA")
     docId: the id of a document below, or "" for no document link.
     Status (Completed / Upcoming / Pending) is worked out from today's date. */
  milestones: [
    { id: "charter", title: "Project Charter", description: "Initial project scope and plan.", date: "", marks: null, docId: "charter" },
    { id: "proposal-presentation", title: "Project Proposal Presentation", description: "Proposal defence to the panel.", date: "", marks: null, docId: "proposal-slides" },
    { id: "proposal-report", title: "Project Proposal Report", description: "Written proposal.", date: "", marks: null, docId: "proposal" },
    { id: "progress-1", title: "Progress Presentation 1", description: "Mid-term progress review.", date: "", marks: null, docId: "progress-slides" },
    { id: "progress-2", title: "Progress Presentation 2", description: "Second progress review.", date: "", marks: null, docId: "" },
    { id: "research-paper", title: "Research Paper", description: "IEEE-format paper.", date: "", marks: null, docId: "paper" },
    { id: "final-report", title: "Final Report (Dissertation)", description: "Final written report.", date: "", marks: null, docId: "final-report" },
    { id: "final-presentation", title: "Final Presentation and Viva", description: "Final defence.", date: "", marks: null, docId: "final-slides" },
    { id: "website", title: "Project Website", description: "This website.", date: "", marks: null, docId: "" }
  ],

  /* PLACEHOLDER: url for each file. Use a relative path for files you put in
     assets/docs/ (these also get a Download link), or a Google Drive /
     OneDrive share link. An empty url shows a disabled "Coming soon" button. */
  documents: {
    documents: [
      { id: "charter", title: "Project Charter", type: "PDF", url: "", description: "Scope, objectives, timeline and team." },
      { id: "proposal", title: "Project Proposal", type: "PDF", url: "", description: "Problem, literature, methodology and plan." },
      { id: "checklists", title: "Checklists", type: "PDF", url: "", description: "Assessment and submission checklists." },
      { id: "paper", title: "Research Paper (IEEE)", type: "PDF", url: "", description: "Conference-format paper." },
      { id: "final-report", title: "Final Report", type: "PDF", url: "", description: "Complete dissertation." }
    ],
    presentations: [
      { id: "proposal-slides", title: "Proposal Presentation", type: "PPTX", url: "", description: "Slides from the proposal defence." },
      { id: "progress-slides", title: "Progress Presentation", type: "PPTX", url: "", description: "Slides from the progress review." },
      { id: "final-slides", title: "Final Presentation", type: "PPTX", url: "", description: "Slides from the final defence." }
    ]
  },

  people: {
    supervisors: [
      {
        role: "Supervisor",
        name: "Nuwan Kodagoda",
        title: "Prof.",
        department: "Faculty of Computing",
        email: "nuwan.k@sliit.lk",
        photo: "assets/team/supervisor.png",
        linkedin: "", github: ""
      },
      {
        role: "Co-Supervisor",
        name: "Thilini Jayalath",
        title: "Ms.",
        department: "Faculty of Computing",
        email: "thilini.j@sliit.lk",
        photo: "assets/team/co-supervisor.png",
        linkedin: "", github: ""
      }
    ],
    /* Display order on the site (team cards, "How we work together" tabs,
       contact list). "initials" is optional and overrides the initials shown
       when there is no photo. */
    members: [
      {
        name: "Kumara G.E.I.E.H", regNo: "IT22253644", email: "it22253644@my.sliit.lk",
        component: "Landmark and sub-landmark recognition. Additional contributions: offline map with wildlife alerts and offline AR signboard translation.",
        photo: "assets/team/member-3.png",
        linkedin: "", github: ""
      },
      {
        name: "N.S.B. Jayah", regNo: "IT22194244", email: "it22194244@my.sliit.lk",
        component: "",                  // PLACEHOLDER research component
        photo: "",                      // PLACEHOLDER "assets/team/member-1.jpg"
        linkedin: "", github: ""
      },
      {
        name: "P.A.Y.S. Perera", regNo: "IT22198686", email: "it22198686@my.sliit.lk",
        component: "",                  // PLACEHOLDER research component
        photo: "",                      // PLACEHOLDER "assets/team/member-2.jpg"
        linkedin: "", github: ""
      },
      {
        name: "P.G.G. Nuthara", regNo: "IT22516602", email: "it22516602@my.sliit.lk",
        component: "",                  // PLACEHOLDER research component
        photo: "",                      // PLACEHOLDER "assets/team/member-4.jpg"
        linkedin: "", github: ""
      }
    ]
  },

  /* "How we work together" diagram (drawn by js/architecture.js).
     nodes: the parts of the offline system.
       x, y   position on the isometric floor (the App core sits at 0, 0)
       shape  stack, dome, rack, panel, pedestal, signpost, board, crate, warning
       short  shorter title used on phones
       tech   names from the technology tiles above
       label  where the title sits: dx / dy from the object in diagram pixels
     links: data passed from one node to another. route "xy" runs along the
       x axis first, "yx" along the y axis first; via lists corner points for a
       custom path (used to run a line parallel to another). draw: false keeps a link out
       of the drawing (when it would sit on top of other lines) but still
       counts it in the "Receives from" / "Hands over to" lists.
     members: one entry per person in people.members, in the same order.
       nodeIds lists the nodes that person builds. Leave [] until confirmed:
       the site then shows "To be added" instead of guessing. */
  collaboration: {
    wholeSystem: {
      title: "One offline pipeline",
      text: "The camera and GPS feed the app core. The recognition component names the landmark, the overlay and assistant explain it from local data, navigation and the map guide the visitor, and the signboard translator and wildlife alerts keep them informed and safe. Nothing leaves the phone.",
      listTitle: "A typical visit",
      steps: [
        "Point the camera: the landmark and sub-landmark are recognised.",
        "The overlay shows its name; the assistant explains it from the local knowledge base.",
        "The map shows where you are and the next point; navigation confirms waypoints visually.",
        "Near a warning area, a local notification appears, even with the app in the background.",
        "Point at a signboard: the text is read and translated on the device."
      ]
    },
    nodes: [
      { id: "core", title: "App core", short: "App core", caption: "Runs on the phone", shape: "stack", x: 0, y: 0,
        description: "Runs every component on the phone and passes data between them. No network requests.",
        tech: ["Flutter / Dart"], label: { dx: 0, dy: -14 } },
      { id: "sensors", title: "Camera and GPS", short: "Camera, GPS", caption: "Live frames and location", shape: "pedestal", x: -6, y: 0,
        description: "Live camera frames and GPS fixes, read and processed only on the device.",
        tech: [], label: { dx: 0, dy: -14 } },
      { id: "recognition", title: "Landmark recognition", short: "Recognition", caption: "YOLOv8n INT8, on-device", shape: "dome", x: 0, y: -6,
        description: "Names the landmark and sub-landmark in view and confirms it over several frames.",
        tech: ["YOLOv8n (Ultralytics)", "TensorFlow Lite INT8"], label: { dx: 0, dy: -14 } },
      { id: "assistant", title: "RAG assistant", short: "Assistant", caption: "Local LLM and knowledge base", shape: "rack", x: -6, y: -6,
        description: "Answers questions and explains landmarks using only the local knowledge base.",
        tech: ["Sentence embeddings (MiniLM-class)", "Local vector index", "Compact local LLM"], label: { dx: 0, dy: -10 } },
      { id: "overlay", title: "AR overlay", short: "Overlay", caption: "Anchored labels", shape: "panel", x: 5, y: -6,
        description: "Shows the confirmed landmark's name and content on screen, with its confidence.",
        tech: ["Flutter / Dart"], label: { dx: 0, dy: -14 } },
      { id: "navigation", title: "Navigation", short: "Navigation", caption: "Visual waypoints", shape: "signpost", x: -6, y: 5,
        description: "Guides the visitor leg by leg along a relative route and confirms waypoints visually.",
        tech: [], label: { dx: 0, dy: -14 } },
      { id: "translator", title: "Signboard translator", short: "Translator", caption: "Sinhala, Tamil, English", shape: "board", x: 6, y: 0,
        description: "Reads signboard text with on-device OCR and translates it with a confidence score.",
        tech: ["On-device OCR (Sinhala, Tamil, English)", "Offline translation and dictionary"], label: { dx: 0, dy: 24 } },
      { id: "map", title: "Offline map", short: "Map", caption: "Bundled GeoPackage layers", shape: "crate", x: 0, y: 6,
        description: "Shows the site, the visitor's position and wildlife warning areas without a network.",
        tech: ["GeoPackage / SQLite"], label: { dx: 0, dy: 24 } },
      { id: "alerts", title: "Wildlife alerts", short: "Alerts", caption: "Background notifications", shape: "warning", x: 6, y: 5,
        description: "Sends a local notification near a wildlife warning area, even in the background.",
        tech: ["geolocator", "flutter_local_notifications"], label: { dx: 0, dy: 18 } }
    ],
    links: [
      { from: "sensors", to: "core" },
      { from: "core", to: "recognition" },
      { from: "recognition", to: "assistant" },
      { from: "recognition", to: "overlay" },
      { from: "assistant", to: "overlay", via: [[-6, -6.7], [5, -6.7]] },
      { from: "core", to: "translator" },
      { from: "core", to: "navigation", route: "yx" },
      { from: "core", to: "map" },
      { from: "navigation", to: "map", route: "yx" },
      { from: "map", to: "alerts" },
      { from: "core", to: "alerts", draw: false }
    ],
    members: [
      {
        nodeIds: ["recognition", "map", "alerts", "translator"],
        hint: "Landmark and sub-landmark recognition, with offline map, wildlife alerts and signboard translation",
        description: "I build landmark and sub-landmark recognition as my primary component. A quantised YOLOv8n detector identifies the landmark in view, while my additional contributions include the offline map, wildlife alert service and offline AR signboard translation. All of these features run on the phone."
      },
      {
        nodeIds: ["assistant"],
        hint: "On-device RAG assistant",
        description: "I build the assistant that explains landmarks and answers visitors' questions. It finds the most relevant passages in a curated heritage knowledge base stored on the phone and passes them to a compact local language model, so answers stay grounded in that text. The same pipeline handles explanations the app starts on its own and questions the visitor asks."
      },
      {
        nodeIds: ["overlay"],
        hint: "AR information overlay",
        description: "I build the AR overlay that shows information on top of the camera view. Content is anchored to the structure the recognition component has confirmed, and the overlay is honest about how sure the app is, with confirmed, tentative and no-detection states instead of hiding uncertainty."
      },
      {
        nodeIds: ["navigation"],
        hint: "Visual landmark-based navigation",
        description: "I build navigation that still works where GPS is too inaccurate for the site's short paths. A route is stored as a series of legs with lengths and turn instructions, progress is estimated from the visitor's movement, and waypoints are confirmed visually. Routes are recorded on site with an admin survey mode."
      }
    ]
  },

  contact: {
    address: "Faculty of Computing, Sri Lanka Institute of Information Technology, New Kandy Road, Malabe, Sri Lanka",
    responseTime: "",                   // PLACEHOLDER e.g. "Within 2 working days"
    /* FormSubmit (formsubmit.co) address the contact form posts to. Messages
       and attachments are emailed to the address at the end. After the first
       message is confirmed, FormSubmit sends a random alias: replace the email
       with it so the address is not visible in the page code. */
    formEndpoint: "https://formsubmit.co/ajax/erangaharsha739@gmail.com",
    /* Used for the "whole team" email link. Leave as [] to use every member's email. */
    teamEmails: [
      "it22253644@my.sliit.lk",
      "it22194244@my.sliit.lk",
      "it22198686@my.sliit.lk",
      "it22516602@my.sliit.lk"
    ]
  },

  /* Optional project-wide links shown in the footer when set. */
  social: {
    github: "",
    linkedin: ""
  }
};
