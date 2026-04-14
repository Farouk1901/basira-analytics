# STTS — Advanced Statistical Processing Tool
# أداة المعالجة الإحصائية المتقدمة

A modern, bilingual (Arabic/English) web tool for professional statistical analysis of Likert scale questionnaires. Built with vanilla HTML/CSS/JavaScript — no frameworks, no build tools, no dependencies.

> **[🔗 Live Demo](https://yourusername.github.io/STTS/)** ← Update this link after deploying to GitHub Pages.

## Features

| Feature | Description |
|---|---|
| 🌍 **Bilingual** | Full Arabic & English support with instant language switching |
| 🌙 **Dark/Light Mode** | Premium theme toggle with persistent preference |
| 📊 **Likert Scale Analysis** | Binary (2), Ternary (3), and Five-point (5) scales |
| ⚖️ **Custom Weights** | Adjustable weights for positive/negative scale directions |
| 📈 **Statistical Indicators** | Weighted Mean, Std. Deviation, Variance (N or N-1), CV%, Median |
| 📋 **Results Table** | Interactive table with edit/delete per question + overall average |
| 🎨 **Data Visualization** | Chart.js bar charts and radar charts |
| 📝 **Auto-Generated Analysis** | Qualitative interpretation of all statistical results |
| 💾 **Local Storage** | Auto-save with schema-validated data persistence |
| 📄 **Export** | Word (.doc), CSV, JSON formats |
| 📥 **Import** | JSON file import for dataset sharing |
| 🔒 **Security** | XSS prevention, input sanitization, safe DOM manipulation |
| 📱 **Responsive** | Mobile-first design for all screen sizes |
| 🖨️ **Print Optimized** | Clean, professional print layout |

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/STTS.git
   cd STTS
   ```

2. Serve locally (any static server works):
   ```bash
   npx serve .
   ```

3. Open `http://localhost:3000` in your browser.

## Deploy to GitHub Pages

1. Push the code to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to "Deploy from a branch" → `main` → `/ (root)`.
4. Your tool will be live at `https://yourusername.github.io/STTS/`.

## Project Structure

```
STTS/
├── index.html              # Main entry point
├── css/
│   └── styles.css          # Design system (dark/light, RTL/LTR)
├── js/
│   ├── app.js              # Main application controller
│   ├── i18n.js             # Internationalization engine
│   ├── statistics.js       # Statistical computation (pure functions)
│   ├── storage.js          # Schema-validated localStorage
│   ├── charts.js           # Chart.js integration
│   ├── export.js           # Export to Word/CSV/JSON
│   └── utils.js            # Sanitization, validation, helpers
├── locales/
│   ├── ar.json             # Arabic translations
│   └── en.json             # English translations  
└── README.md
```

## Security Improvements Over Original

- **XSS Prevention**: All user input is HTML-escaped via `Utils.escapeHTML()` before DOM insertion
- **Schema Validation**: localStorage data is validated against a strict schema on load
- **Versioned Storage**: Data format is versioned (v3) to prevent stale/corrupt data issues
- **Input Constraints**: All numeric inputs are parsed safely with `Utils.safeInt()`/`Utils.safeFloat()`
- **No Global Function Exposure**: Minimal window-level function attachment

## Statistical Formulas

- **Weighted Mean**: `Σ(count_i × weight_i) / Σ(count_i)`
- **Sample Variance (N-1)**: `Σ(count_i × (weight_i - mean)²) / (N - 1)`
- **Population Variance (N)**: `Σ(count_i × (weight_i - mean)²) / N`
- **Standard Deviation**: `√(variance)`  
- **Coefficient of Variation**: `(std / mean) × 100`
- **Median**: Middle value of the expanded weighted dataset

## License

Free to use for educational and research purposes.

---

Based on the original concept by Dr. Talal Nazim Al-Zuhairy (د. طلال ناظم الزهيري).
Rebuilt with enhanced architecture, bilingual support, security, and modern design.
