# Project Structure

This project has been organized into separate frontend and backend directories for better maintainability.

## Directory Structure

```
WEB-DESIGN/
├── frontend/              # Frontend application
│   ├── *.html            # HTML pages (index, login, signup, dashboard, practice, etc.)
│   ├── css/
│   │   └── main.css      # Main stylesheet
│   ├── js/               # JavaScript files
│   │   ├── auth.js
│   │   ├── auth-check.js
│   │   ├── backend-api.js
│   │   ├── backend-simulator.js
│   │   ├── dashboard.js
│   │   ├── demo.js
│   │   ├── modern-ui.js
│   │   ├── page-transitions.js
│   │   ├── practice.js
│   │   ├── supabase-config.js    # Generated from .env
│   │   ├── supabase-db.js
│   │   └── supabaseClient.js
│   ├── assets/
│   │   └── logo.svg      # Logo file
│   └── data/             # JSON data files
│       ├── data-structures.json
│       ├── neetcode-75.json
│       ├── progress.json
│       ├── sessions.json
│       └── users.json
│
├── backend/               # Backend Express API
│   ├── server.js         # Main server file
│   ├── middleware/
│   │   └── auth.js       # Authentication middleware
│   ├── routes/           # API routes
│   │   ├── execute.js
│   │   ├── progress.js
│   │   ├── questions.js
│   │   ├── sessions.js
│   │   └── stats.js
│   ├── config/
│   │   └── supabase-schema.sql
│   ├── scripts/
│   │   └── inject-env.mjs    # Script to generate supabase-config.js
│   └── BACKEND_SETUP.md
│
├── package.json          # Node.js dependencies
├── .env                  # Environment variables (not in git)
├── .gitignore
└── README_PROJECT.md     # Project documentation
```

## Paths

- **Frontend files**: All HTML, CSS, and JavaScript files are in `frontend/`
- **Backend files**: All Express server code is in `backend/`
- **Data files**: JSON data files are in `frontend/data/`
- **Assets**: Images and other assets are in `frontend/assets/`

## Running the Project

1. **Backend**: From the root directory, run:
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Frontend**: Serve the `frontend/` directory using a static file server (e.g., Live Server in VS Code, or `python -m http.server` from the `frontend/` directory)

3. **Environment Setup**: Run the inject script to generate `frontend/js/supabase-config.js`:
   ```bash
   node backend/scripts/inject-env.mjs
   ```

## Notes

- All HTML files reference scripts with `js/` prefix (e.g., `js/auth.js`)
- All HTML files reference CSS with `css/` prefix (e.g., `css/main.css`)
- Backend routes import from `./routes/` and `./middleware/` (relative to `backend/`)
- JSON data files are loaded from `data/` directory by frontend JavaScript

