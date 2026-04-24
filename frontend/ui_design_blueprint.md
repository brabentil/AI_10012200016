# 🎨 Academic City RAG Chatbot — UI Design Blueprint

## 1. Exam Requirements Analysis

From the exam paper (CS4241), the UI **must** support these features:

| Feature | Exam Reference | Priority |
|:---|:---|:---|
| **Query input** | Part D, Final Deliverables | 🔴 Critical |
| **Display retrieved chunks** | Part D, Final Deliverables | 🔴 Critical |
| **Show similarity scores** | Part D | 🔴 Critical |
| **Show final response** | Part D, Final Deliverables | 🔴 Critical |
| **Display final prompt sent to LLM** | Part D | 🟡 High |
| **Pipeline stage logging** | Part D | 🟡 High |
| **Adversarial query testing** | Part E | 🟢 Nice |
| **RAG vs Pure LLM comparison** | Part E | 🟢 Nice |

### Backend API Response Shape (from `main.py`)
```json
{
  "run_id": "...",
  "query": "...",
  "retrieved_documents": [...],
  "context_selection": {...},
  "final_prompt_sent_to_llm": "...",
  "response": "...",
  "stage_times": {...},
  "run_log_path": "..."
}
```

---

## 2. Design Philosophy

### Theme: **"Ghana Civic Premium" — Black Star Dark Mode**

A premium dark interface rooted in **Ghanaian national identity**. The near-black background represents the **Black Star** — Ghana's symbol of freedom and African emancipation. Accent colors are desaturated, dark-mode-friendly renditions of the **Ghana national flag** (Red, Gold, Green). Surface elements use **"Transparent Ballot Box Glass"** — a glassmorphism metaphor inspired by Ghana's Electoral Commission, conveying transparency and civic trust.

### Core Principles
- **Civic authority**: The UI should feel like an official government/university portal
- **Focus-oriented**: Chat is the hero — everything else is secondary
- **Progressive disclosure**: Chunks, scores, and pipeline logs revealed on demand
- **Micro-animations**: Subtle feedback for every interaction
- **Mobile-native**: Feels like a native phone app on mobile, expands gracefully on desktop

### UI Motifs
- **Black Star Motif**: A large, subtle, low-opacity (`0.03–0.05`) five-pointed star watermark on the page background or app header, evoking the Black Star of Africa
- **Transparent Ballot Box Glass**: All glassmorphism cards use frosted transparency as a metaphor for electoral/civic transparency — clear governance through clear data

---

## 3. Color Palette

### Black Star Backgrounds

| Token | Hex | Usage |
|:---|:---|:---|
| `--bg-deep` | `#0B0F1A` | Page background — "Black Star" near-black |
| `--bg-surface` | `#111827` | Card/panel backgrounds |
| `--bg-elevated` | `#1E293B` | Elevated surfaces, hover states |
| `--bg-glass` | `rgba(30, 41, 59, 0.55)` | Transparent Ballot Box Glass panels |
| `--border-subtle` | `rgba(148, 163, 184, 0.12)` | Subtle borders |
| `--border-glass` | `rgba(252, 209, 22, 0.08)` | Gold-tinted glass card borders |

### Ghana National Accents

| Token | Hex | Origin | Usage |
|:---|:---|:---|:---|
| `--ghana-gold` | `#FCD116` | 🇬🇭 Flag Gold | **Primary accent** — buttons, focus rings, hero gradient, active states |
| `--ghana-gold-muted` | `#D4A017` | Desaturated gold | Hover states, secondary gold uses |
| `--ghana-red` | `#CE1126` | 🇬🇭 Flag Red | Critical highlights, low similarity scores, errors, warnings |
| `--ghana-red-muted` | `#A30E1F` | Desaturated red | Hover/pressed states for destructive actions |
| `--ghana-green` | `#006B3F` | 🇬🇭 Flag Green | Success states, high similarity scores, positive feedback |
| `--ghana-green-bright` | `#00895A` | Brightened green | Text-on-dark legibility variant |
| `--accent-star` | `#F1F5F9` | Black Star (inverted) | Star watermark, premium icon highlights |

### Text Colors

| Token | Hex | Usage |
|:---|:---|:---|
| `--text-primary` | `#F1F5F9` | Primary text (off-white) |
| `--text-secondary` | `#94A3B8` | Secondary text, labels |
| `--text-muted` | `#64748B` | Muted text, timestamps |
| `--text-gold` | `#FCD116` | Links, interactive text, active nav items |

### Gradient Accents

```css
/* Hero gradient — Ghana tricolour sweep for header/branding areas */
--gradient-brand: linear-gradient(135deg, #CE1126 0%, #FCD116 50%, #006B3F 100%);

/* Subtle background glow — warm gold radiance from top */
--gradient-glow: radial-gradient(ellipse at top, rgba(252, 209, 22, 0.10), transparent 60%);

/* RAG similarity score bar — maps Red→Gold→Green (bad→ok→good) */
--gradient-score: linear-gradient(90deg, #CE1126, #FCD116, #006B3F);

/* Gold shimmer for premium elements */
--gradient-gold-shimmer: linear-gradient(90deg, #D4A017, #FCD116, #D4A017);
```

---

## 4. Typography

| Element | Font | Weight | Size (Desktop) | Size (Mobile) | Notes |
|:---|:---|:---|:---|:---|:---|
| App title | **Inter** | 800 | 24px | 20px | `letter-spacing: 0.08em; text-transform: uppercase;` — authoritative portal feel |
| Section headers | **Inter** | 700 | 18px | 16px | |
| Body text | **Inter** | 400 | 15px | 14px | |
| Chat messages | **Inter** | 400 | 15px | 14px | |
| Code/prompt | **JetBrains Mono** | 400 | 13px | 12px | |
| Badges/labels | **Inter** | 600 | 11px | 10px | |
| Timestamps | **Inter** | 400 | 12px | 11px | |

> [!TIP]
> Use Google Fonts: `Inter` for all UI text, `JetBrains Mono` for code/prompt display. The app title uses heavier tracking (`0.08em`) and uppercase to evoke an official government/university portal.

---

## 5. Responsive Layout Strategy

### Breakpoints

| Name | Width | Layout |
|:---|:---|:---|
| **Mobile** | `< 640px` | Single column, phone-app layout |
| **Tablet** | `640px – 1024px` | Single column, wider cards |
| **Desktop** | `> 1024px` | Two-panel split layout |

---

### Desktop Layout (> 1024px)

```
┌──────────────────────────────────────────────────────────┐
│  ★ GHANA CIVIC RAG | ACITY      ⚙️ Settings             │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│    💬 CHAT PANEL       │    📋 INSPECTION PANEL          │
│                        │                                 │
│  ┌──────────────────┐  │  ┌───────────────────────────┐  │
│  │ User message     │  │  │ 📄 Retrieved Chunks       │  │
│  └──────────────────┘  │  │  ├─ Chunk 1  [0.92] 🟢    │  │
│  ┌──────────────────┐  │  │  ├─ Chunk 2  [0.85] 🟢    │  │
│  │ 🤖 AI Response   │  │  │  └─ Chunk 3  [0.41] 🔴    │  │
│  │ with citations   │  │  ├───────────────────────────┤  │
│  └──────────────────┘  │  │ 📝 Prompt Sent to LLM     │  │
│                        │  │  (collapsible code block)  │  │
│                        │  ├───────────────────────────┤  │
│                        │  │ ⏱️ Pipeline Timing         │  │
│  ┌──────────────────┐  │  │  Retrieval: 120ms         │  │
│  │ 💬 Type message  │  │  │  Context:   45ms          │  │
│  └──────────────────┘  │  │  LLM:       890ms         │  │
│                        │  └───────────────────────────┘  │
└────────────────────────┴─────────────────────────────────┘
```

**Desktop behavior:**
- Chat panel takes **55%** width, inspection panel takes **45%**
- Both panels scroll independently
- Inspection panel updates in real-time as each response arrives

---

### Mobile Layout (< 640px)

```
┌─────────────────────────┐
│ ★ GH CIVIC RAG  ⚙️  📋  │  ← Compact header
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ User message      │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🤖 AI Response    │  │
│  │ with inline       │  │
│  │ source badges     │  │
│  │                   │  │
│  │ ▼ View Sources (3)│  │  ← Expandable accordion
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 💬 Type message   │  │  ← Fixed bottom input
│  │         📎  ➤     │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Mobile behavior:**
- **Full-screen chat** — no side panel
- Retrieved chunks & pipeline info are in **expandable accordions** under each response
- Input bar is **fixed to bottom** (like iMessage/WhatsApp)
- Header is **compact** with icon-only buttons
- **Bottom sheet** slides up for settings/pipeline details on tap
- Swipe gestures for navigation (future enhancement)

---

## 6. Component Architecture

### Reusable Components

```
components/
├── layout/
│   ├── AppShell.js          # Root layout with responsive detection
│   ├── CivicHeader.js       # "Ghana Civic RAG | ACity" header with Black Star motif
│   ├── SplitPane.js         # Desktop two-panel layout
│   ├── BottomSheet.js       # Mobile slide-up panel
│   └── BlackStarBg.js       # SVG star watermark renderer (opacity 0.03–0.05)
│
├── chat/
│   ├── ChatContainer.js     # Scrollable message list
│   ├── MessageBubble.js     # Individual message (user/bot) — gold/glass themed
│   ├── ChatInput.js         # Input bar with gold focus ring
│   ├── TypingIndicator.js   # Animated "thinking" dots (gold pulse)
│   └── WelcomeScreen.js     # Hero with Black Star + Ghana tricolour gradient
│
├── rag/
│   ├── SourceCard.js        # Retrieved chunk card — "Ballot Box Glass" style
│   ├── SourceList.js        # List of source cards with R/G/G score mapping
│   ├── SimilarityBadge.js   # Ghana-flag-coded score badge (Red/Gold/Green)
│   ├── PromptViewer.js      # Code block for final prompt
│   ├── PipelineTimeline.js  # Stage timing with gold timeline dots
│   ├── SourceAccordion.js   # Mobile-only expandable sources
│   └── DatasetTag.js        # Tag showing source dataset (Election / Budget)
│
├── ui/
│   ├── BallotGlassCard.js   # "Transparent Ballot Box Glass" card component
│   ├── Badge.js             # Label badge (Ghana-colour variants)
│   ├── GoldButton.js        # Primary button with gold gradient
│   ├── IconButton.js        # Icon-only button
│   ├── ScoreBar.js          # Red→Gold→Green animated progress bar
│   ├── CodeBlock.js         # Syntax-highlighted code display
│   ├── Accordion.js         # Expandable content section
│   ├── Tooltip.js           # Hover tooltip
│   └── Skeleton.js          # Loading skeleton (gold shimmer sweep)
│
└── settings/
    ├── SettingsPanel.js      # Configuration sidebar/modal
    ├── SliderInput.js        # Range slider (top_k, alpha) — gold track
    └── ModelSelector.js      # LLM model dropdown
```

---

## 7. Key Component Designs

### 7.1 — Ballot Box Glass Card (Foundation Component)

```css
.ballot-glass {
  background: rgba(30, 41, 59, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(252, 209, 22, 0.08);  /* gold-tinted border */
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ballot-glass:hover {
  border-color: rgba(252, 209, 22, 0.18);      /* gold glow on hover */
  box-shadow: 0 8px 32px rgba(252, 209, 22, 0.08);
}
```

### 7.2 — Message Bubble

```css
/* User message — warm gold gradient */
.msg-user {
  background: linear-gradient(135deg, #D4A017, #FCD116);
  border-radius: 20px 20px 4px 20px;
  color: #0B0F1A;       /* dark text on gold */
  font-weight: 500;
  max-width: 75%;
  align-self: flex-end;
}

/* Bot message — Ballot Box Glass */
.msg-bot {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(252, 209, 22, 0.06);
  border-radius: 20px 20px 20px 4px;
  color: var(--text-primary);
  max-width: 85%;
  align-self: flex-start;
}
```

### 7.3 — Similarity Score Badge (Ghana Flag Spectrum)

```css
.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

/* Ghana Green — high confidence */
.score-high   { background: rgba(0, 107, 63, 0.18); color: #00895A; }   /* >= 0.75 */
/* Ghana Gold — moderate confidence */
.score-medium { background: rgba(252, 209, 22, 0.15); color: #FCD116; }  /* 0.5–0.75 */
/* Ghana Red — low confidence */
.score-low    { background: rgba(206, 17, 38, 0.15); color: #CE1126; }   /* < 0.5 */
```

### 7.4 — Pipeline Timeline

```css
.timeline-stage {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-left: 2px solid var(--ghana-gold);
  position: relative;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ghana-gold);
  box-shadow: 0 0 8px rgba(252, 209, 22, 0.4);
  position: absolute;
  left: -6px;
}
```

---

## 8. Micro-Animations

| Animation | Trigger | Duration | Effect |
|:---|:---|:---|:---|
| **Message slide-in** | New message | 300ms | `translateY(16px) → 0` with fade |
| **Typing dots** | Waiting for response | Loop | 3 dots bouncing sequentially |
| **Score badge pulse** | Score loads | 500ms | Subtle scale `1 → 1.05 → 1` |
| **Accordion expand** | User tap/click | 250ms | Height transition + rotate chevron |
| **Glass card hover glow** | Mouse hover | 300ms | Border color shift + shadow bloom |
| **Send button pulse** | On input focus | 200ms | Scale up + accent glow |
| **Skeleton shimmer** | Loading state | Loop | Gradient sweep left-to-right |
| **Bottom sheet slide** | Mobile tap | 350ms | `translateY(100%) → 0` with backdrop fade |

---

## 9. Mobile-Specific Features

### Phone App Feel
- **Safe area insets**: Respect `env(safe-area-inset-*)` for notched phones
- **Fixed bottom input**: Always visible, never scrolls away
- **Haptic-style feedback**: Quick scale animations on button taps
- **Pull-to-refresh**: Optional for chat history refresh
- **Bottom sheet pattern**: Settings and pipeline details slide up from bottom
- **Edge-to-edge design**: Content extends to screen edges with proper padding
- **Touch targets**: Minimum 44×44px for all interactive elements

### Viewport Management
```css
/* Prevent iOS viewport issues */
html {
  height: -webkit-fill-available;
}
body {
  min-height: 100vh;
  min-height: -webkit-fill-available;
}
```

---

## 10. Technology Recommendation

Given the exam requirements and project structure:

| Aspect | Recommendation | Reason |
|:---|:---|:---|
| **Framework** | Vanilla HTML/CSS/JS | Exam says "Simple UI" — no build step needed |
| **Alternative** | Vite (vanilla mode) | Hot reload for development, zero-config |
| **Fonts** | Google Fonts (Inter + JetBrains Mono) | Free, fast CDN |
| **Icons** | Lucide Icons (CDN) | Lightweight, beautiful SVG icons |
| **Markdown** | `marked.js` (CDN) | Render LLM responses with formatting |
| **Syntax highlighting** | `highlight.js` (CDN) | For prompt/code display |
| **Animations** | CSS transitions + `@keyframes` | No library needed |

> [!IMPORTANT]
> The exam explicitly mentions **Streamlit / Next.js / Flask** as UI options. Since the backend is already FastAPI, a **standalone HTML/CSS/JS frontend** served separately (or even as static files) keeps things simple while looking premium. No framework overhead.

---

## 11. Implementation Approach

### Phase 1: Foundation
1. Create `index.html` with semantic structure
2. Create `styles.css` with full design system (CSS custom properties)
3. Create `app.js` with core chat logic

### Phase 2: Components
4. Build chat interface (input, messages, typing indicator)
5. Build RAG inspection panel (source cards, scores, prompt viewer)
6. Build responsive shell (split pane / single column detection)

### Phase 3: Polish
7. Add glassmorphism effects and animations
8. Implement mobile bottom sheet and accordions
9. Add settings panel (top_k, model selection, etc.)
10. Final responsive testing across breakpoints

---

## 12. Design Decision Summary

> [!NOTE]
> **Why this design works for the exam:**
> - ✅ Shows **query input** prominently
> - ✅ Displays **retrieved chunks** with similarity scores visually
> - ✅ Shows the **final prompt sent to LLM** in a code viewer
> - ✅ Displays the **AI response** beautifully with markdown rendering
> - ✅ Shows **pipeline stage timing** (logging at each stage)
> - ✅ Responsive for all devices
> - ✅ Premium look demonstrates design effort
> - ✅ No heavy frameworks = easy deployment

---

## Open Questions for You

1. **Do you want me to proceed with building this UI now?**
2. **Do you want a welcome/landing screen** with the Black Star hero, or jump straight into the chat?
3. **Should settings (top_k, model, alpha) be in a sidebar, modal, or within the header?**
4. **Preferred app title?** — `GHANA CIVIC RAG | ACITY` vs `ELECTORAL & ECONOMIC EXPLORER` vs something else?
5. **Do you want a light mode toggle**, or dark-only?
