# DocChain - UI/UX Reference Guide

**Purpose:** This document serves as a comprehensive reference for UI/UX designers to understand page requirements, priorities, and integration points for blockchain and AI features.

**Design Philosophy:**
- **Blockchain Integration:** Subtle, trust-building indicators. Not overwhelming.
- **AI Integration:** Native and contextual. AI should feel like a helpful assistant, not a separate feature.
- **User Experience:** Clean, modern, professional. Security without complexity.

---

## Navigation Structure

```
┌─────────────────────────────────────────────────────────┐
│  Logo | Dashboard | Documents | Search | [Profile] [🔔] │
└─────────────────────────────────────────────────────────┘

Sidebar (Collapsible):
├── 📊 Dashboard
├── 📄 My Documents
├── 📤 Shared with Me
├── 🔍 Search
├── ⭐ Favorites
├── 🗑️ Trash
│
├── ─────────────
│
├── 👥 Users (Admin only)
├── 🔐 Security (Admin only)
├── ⛓️ Blockchain (Admin only)
└── ⚙️ Settings
```

---

## Page Inventory & Priority

| Page | Priority | Roles | Blockchain | AI Features |
|------|----------|-------|------------|-------------|
| Login | **P0 - MVP** | All | ✅ Security badge | ✅ Smart autofill |
| Register | **P0 - MVP** | All | ✅ Security promise | ✅ Form validation |
| Dashboard | **P0 - MVP** | All | ✅ Stats widget | ✅ Smart insights |
| Document Upload | **P0 - MVP** | Admin, Editor | ✅ Hash generation | ✅ Auto-tagging |
| Document List | **P0 - MVP** | All | ✅ Lock icons | ✅ Smart sorting |
| Document Viewer | **P0 - MVP** | All | ✅ Verification badge | ✅ AI summary |
| Document Sharing | **P0 - MVP** | Admin, Editor | ✅ Secure share | ✅ Smart suggestions |
| Search | **P0 - MVP** | All | - | ✅ AI-powered |
| Profile Settings | **P0 - MVP** | All | - | ✅ Smart defaults |
| User Management | **P1 - Phase 1** | Admin | - | ✅ Role suggestions |
| Audit Logs | **P1 - Phase 1** | Admin | ✅ Blockchain verify | ✅ Anomaly detection |
| Document Versions | **P1 - Phase 1** | All | ✅ Hash comparison | ✅ Change summary |
| Admin Dashboard | **P1 - Phase 1** | Admin | ✅ Blockchain status | ✅ Predictive alerts |
| MFA Setup | **P1 - Phase 1** | All | - | ✅ Smart setup |
| Trash/Recovery | **P2 - Future** | All | ✅ Hash preserved | - |
| Advanced Search | **P2 - Future** | All | - | ✅ NLP queries |

---

## 1. Authentication Pages

### 1.1 Login Page

**URL:** `/login`
**Access:** Public
**Priority:** **P0 - MVP**

#### Layout
```
┌──────────────────────────────────────────┐
│                                          │
│         [DocChain Logo]                  │
│   Secured by Blockchain Technology       │
│      🔒 [small blockchain badge]         │
│                                          │
│   Email:     [________________]          │
│              💡 AI suggests saved email  │
│                                          │
│   Password:  [________________] [👁]     │
│                                          │
│   [ ] Remember me    Forgot password?   │
│                                          │
│          [  Sign In  ]                   │
│                                          │
│   ─────────── or ───────────             │
│                                          │
│   [🔐 Sign in with SSO]                  │
│                                          │
│   Don't have an account? Register        │
│                                          │
└──────────────────────────────────────────┘
```

#### Key Features
- **Blockchain Badge:** Subtle security indicator (small, non-intrusive)
  - Tooltip: "Your documents are protected by enterprise blockchain"
  - Color: Soft blue glow
- **AI Features:**
  - Smart email autofill (remembers user's email)
  - Password strength indicator
  - Typing pattern recognition for security
- **Animations:** Smooth fade-in, subtle parallax on background
- **Error Handling:** Inline validation with helpful messages

#### Blockchain Integration
- Small "Secured by Blockchain" text below logo
- Animated blockchain icon (subtle pulse)
- Trust badge in footer

#### AI Integration
- Email field: Auto-suggests previously used emails
- Password field: Real-time strength feedback
- Failed login: AI detects patterns and suggests password reset

---

### 1.2 Registration Page

**URL:** `/register`
**Access:** Public
**Priority:** **P0 - MVP**

#### Layout
```
┌──────────────────────────────────────────┐
│                                          │
│     Create Your Secure Account           │
│                                          │
│   Full Name:  [________________]         │
│               💡 "John Doe"              │
│                                          │
│   Email:      [________________]         │
│               ✅ Available               │
│                                          │
│   Password:   [________________]         │
│   [████████░░] Strong                    │
│   ✅ 8+ chars  ✅ Number  ✅ Symbol      │
│                                          │
│   [ ] I agree to Terms & Conditions      │
│   [ ] Enable blockchain protection       │
│       (Recommended for security)         │
│                                          │
│          [  Create Account  ]            │
│                                          │
│   Already have an account? Sign in       │
│                                          │
└──────────────────────────────────────────┘
```

#### Key Features
- **AI-Powered Form:**
  - Name field: Suggests proper capitalization
  - Email: Real-time availability check
  - Password: AI-generated strong password suggestions
  - Phone: Auto-formats as user types
- **Blockchain Option:**
  - Pre-checked "Enable blockchain protection"
  - Brief explanation: "All your documents will be cryptographically secured"
  - Visual indicator showing what's protected

#### AI Features
- **Smart Validation:**
  - Real-time email format and availability check
  - Password strength AI (not just length, but patterns)
  - Suggests corrections: "Did you mean john@gmail.com?"
- **Form Assistance:**
  - Auto-capitalizes names
  - Detects and prevents common typos
  - Phone number auto-formatting

---

### 1.3 Two-Factor Authentication (MFA)

**URL:** `/mfa/setup` or `/mfa/verify`
**Access:** Authenticated users
**Priority:** **P1 - Phase 1**

#### Layout (Setup)
```
┌──────────────────────────────────────────┐
│                                          │
│   Enhance Your Security with MFA         │
│   🔐 Extra layer of blockchain security  │
│                                          │
│   Step 1: Scan QR Code                   │
│   ┌────────────┐                         ���
│   │  [QR Code] │                         │
│   │            │                         │
│   └────────────┘                         │
│                                          │
│   Or enter manually:                     │
│   ABCD-EFGH-IJKL-MNOP                    │
│   [📋 Copy]                              │
│                                          │
│   Step 2: Enter 6-digit code             │
│   [_] [_] [_] [_] [_] [_]                │
│                                          │
│          [  Verify & Enable  ]           │
│                                          │
└──────────────────────────────────────────┘
```

#### AI Features
- Auto-detects when user opens authenticator app
- Suggests timing: "Best time to set this up: Now (takes 2 min)"
- Smart code detection (auto-fills when user copies code)

---

## 2. Dashboard Pages

### 2.1 User Dashboard (All Roles)

**URL:** `/dashboard`
**Access:** All authenticated users
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Good morning, John! 👋                                     │
│  💡 AI Insight: 3 documents need your attention              │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Documents  │ │ Shared w/ Me │ │  Protected   │
│      24      │ │      12      │ │  ⛓️ 24/24   │
│   +3 today   │ │   2 unread   │ │   100%       │
└──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Recent Activity                          [Filter ▾]  [AI 🤖] │
├─────────────────────────────────────────────────────────────┤
│  ⛓️ Contract_2025.pdf                              2h ago   │
│     Uploaded and secured on blockchain              [View]  │
│                                                              │
│  📝 Meeting_Notes.docx shared with Editor          4h ago   │
│     Sarah Johnson • Permission: Edit                [Open]  │
│                                                              │
│  🔐 Q4_Report.xlsx - Version 3 secured            Yesterday │
│     Blockchain hash: abc123...                      [View]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI Suggestions                                           │
├─────────────────────────────────────────────────────────────┤
│  • Review "Q4_Report.xlsx" - Deadline approaching (2 days)  │
│  • 5 documents missing tags - Let AI auto-tag them          │
│  • Consider sharing "Policy_2025" with Legal team           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Quick Actions                                               │
├─────────────────────────────────────────────────────────────┤
│  [📤 Upload Document]  [🔍 Search]  [👥 Share]  [⭐ View Favorites] │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Integration:**
- **Protection Counter:** Shows X/Y documents protected with blockchain
  - Green = 100% protected
  - Yellow = 50-99% protected
  - Red = <50% protected
- **Blockchain Badge:** Small lock icon next to protected documents
- **Trust Indicator:** "All uploads automatically secured" banner

**AI Integration:**
- **Personalized Greeting:** Time-aware, context-aware
- **AI Insights Widget:**
  - Documents needing attention
  - Deadline reminders
  - Unusual activity detection
  - Storage optimization suggestions
- **Smart Activity Feed:**
  - Prioritizes important activities
  - Groups similar actions
  - Highlights security events
- **AI Suggestions Panel:**
  - Task recommendations
  - Collaboration suggestions
  - Automation opportunities
  - Security recommendations

**Role-Based Views:**
- **Viewer:** Focus on shared documents, read-only stats
- **Editor:** Upload quick actions prominent
- **Admin:** Additional system stats, user activity summary

---

### 2.2 Admin Dashboard

**URL:** `/admin/dashboard`
**Access:** Admin only
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  System Overview                          Last updated: Now  │
└─────────────────────────────────────────────────────────────┘

┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐
│  Users  │ │   Docs  │ │ Storage  │ │  Blockchain  │
│   156   │ │  2,847  │ │  45.2GB  │ │  ⛓️ Synced  │
│  +12/mo │ │ +89/week│ │  /100GB  │ │  ✅ Healthy  │
└─────────┘ └─────────┘ └──────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⛓️ Blockchain Status                   [View Details]      │
├─────────────────────────────────────────────────────────────┤
│  Status: ✅ Connected to Hyperledger Fabric                 │
│  Network: Production • Nodes: 4/4 Active                    │
│  Last Hash: abc123def456... (2 minutes ago)                 │
│  Transaction Success Rate: 99.98%                           │
│                                                              │
│  [████████████████░░] 2,847/3,000 docs hashed (95%)         │
│                                                              │
│  �� AI Alert: No anomalies detected in blockchain activity  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🤖 AI-Powered Insights                                      │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ User "john@company.com" - Unusual upload volume today   │
│     📊 Normal: 5 docs/day • Today: 47 docs                  │
│     [Review Activity] [Flag User] [Ignore]                  │
│                                                              │
│  ✅ System performance optimal - No action needed           │
│                                                              │
│  💡 Storage optimization: Archive 234 old documents?        │
│     Estimated savings: 5.2GB                                │
│     [Review Suggestions] [Auto-Archive]                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Recent Admin Activity                                       │
├─────────────────────────────────────────────────────────────┤
│  👤 New user registered: jane@company.com           5m ago  │
│  🔐 MFA enabled for: mike@company.com              15m ago  │
│  ⛓️ 12 documents secured on blockchain             22m ago  │
│  🗑️ User "test@company.com" deleted (by Admin)     1h ago  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Monitoring:**
- **Real-time Status:** Connection health, node status
- **Hash Statistics:** Total hashed, pending, failed
- **Transaction Metrics:** Success rate, avg time, gas costs
- **Network Visualization:** Node map (optional, not P0)
- **Alert System:** Blockchain failures, delays, anomalies

**AI-Powered Admin Features:**
- **Anomaly Detection:**
  - Unusual user behavior
  - Suspicious upload patterns
  - Failed login attempts clustering
  - Permission escalation attempts
- **Predictive Maintenance:**
  - Storage capacity forecasting
  - Performance degradation warnings
  - License expiration reminders
- **Smart Recommendations:**
  - User role optimization
  - Storage cleanup suggestions
  - Security policy improvements

---

## 3. Document Management

### 3.1 Document Upload

**URL:** `/documents/upload`
**Access:** Admin, Editor
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Document                                    [✕ Close]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│        Drag & drop files here or [Browse Files]             │
│                                                              │
│        🔒 All uploads automatically secured on blockchain   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Uploading: Contract_2025.pdf                       [✕]     │
│  [████████████████░░] 85% • 2.4 MB of 2.8 MB                │
│  ⛓️ Generating blockchain hash...                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Document Details                                            │
├─────────────────────────────────────────────────────────────┤
│  Title:        [Contract_2025.pdf            ]              │
│                💡 AI suggests: "Vendor Contract 2025"       │
│                                                              │
│  Description:  [________________________    ]              │
│                [________________________    ]              │
│                💡 AI detected: Legal document, Contract     │
│                                                              │
│  Tags:         [contract] [legal] [2025] [+]               │
│                💡 Suggested: vendor, agreement, Q1         │
│                [+ Add suggested tags]                       │
│                                                              │
│  Encryption:   ☑ Enable end-to-end encryption (Recommended) │
│                                                              │
│  Blockchain:   ☑ Secure with blockchain hash (Automatic)   │
│                                                              │
│  Share with:   [Search users or teams...] 🤖              │
│                💡 AI suggests: Legal Team, Sarah Johnson   │
│                                                              │
│  Permission:   ◉ View Only  ○ Can Edit                      │
│                                                              │
│  [Cancel]                            [Upload & Secure]      │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Integration:**
- **Auto-Protection:** All uploads automatically get blockchain hash
- **Real-time Progress:**
  1. File upload progress bar
  2. "Generating hash..." with spinner
  3. "Securing on blockchain..." with animation
  4. "✅ Secured" with success animation
- **Visual Feedback:** Blockchain icon animates during hashing
- **Optional QR Code:** Download blockchain certificate (PDF)

**AI Integration:**
- **Smart Title Suggestions:**
  - Cleans up filenames: "contract_v2_final_FINAL.pdf" → "Vendor Contract 2025"
  - Removes underscores, proper capitalization
- **Content Analysis:**
  - Scans document content (if allowed)
  - Suggests description
  - Detects document type
- **Auto-Tagging:**
  - Extracts keywords from content
  - Suggests relevant tags based on:
    - Filename
    - Content analysis
    - Similar documents
    - User's past tags
- **Smart Sharing:**
  - Suggests users based on:
    - Document type
    - Past collaboration patterns
    - Team structure
    - Content relevance
- **Duplicate Detection:**
  - "⚠️ Similar document exists: contract_2024.pdf"
  - "This might be a newer version. Create version instead?"

#### User Experience
- **Drag & Drop:** Primary interaction
- **Multiple Files:** Batch upload with individual progress bars
- **Mobile Support:** Camera upload option
- **Error Handling:** Clear messages, auto-retry for network issues

---

### 3.2 Document List/Library

**URL:** `/documents`
**Access:** All roles (filtered by permission)
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  My Documents                      [Grid View] [List View]  │
│  [🔍 Search documents...] 🤖       [+ Upload] [Filter ▾]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI: Showing 24 documents. 5 need review this week.      │
│  [Show suggested order] [Show all]                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Sort by: [Recent ▾]  Filter: [All Types ▾] [All Users ▾]  │
│  ☑ Blockchain Protected   ☐ Shared   ☐ Favorites           │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  [ ]  📄  Contract_2025.pdf                    2.8 MB  Today │
│       ⛓️ Blockchain Secured • Version 2                      │
│       Tags: contract, legal, 2025                            │
│       [👁 View] [⬇ Download] [👥 Share] [•••]                │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  [ ]  📊  Q4_Report.xlsx                     5.2 MB  2d ago  │
│       ⛓️ Blockchain Secured • 3 versions                     │
│       💡 AI: Needs review (deadline in 2 days)               │
│       Tags: finance, report, q4                              │
│       [👁 View] [⬇ Download] [👥 Share] [•••]                │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  [ ]  📝  Meeting_Notes.docx                 512 KB  1w ago  │
│       ⛓️ Blockchain Secured • Shared with 3                  │
│       Tags: meeting, notes                                   │
│       [👁 View] [⬇ Download] [👥 Share] [•••]                │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Showing 1-10 of 24          [Previous] [1] [2] [3] [Next]  │
└───────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Indicators:**
- **Lock Icon:** Small ⛓️ next to secured documents
- **Badge:** "Blockchain Secured" label
- **Hover Tooltip:** Shows blockchain hash (truncated)
- **Color Coding:**
  - Green border = Secured on blockchain
  - Yellow border = Pending blockchain security
  - Red border = Failed to secure (needs attention)
- **Quick Verify:** Click lock icon to see blockchain certificate

**AI Integration:**
- **Smart Search:**
  - Natural language: "contracts from last month"
  - Semantic search: Understands intent, not just keywords
  - Typo correction: "contrackt" → "contract"
  - Suggestions: "Did you mean 'quarterly report'?"
- **Intelligent Sorting:**
  - Default: AI-prioritized (important first)
  - Options: Recent, Name, Size, Modified, Deadline
  - "Show suggested order" uses AI to prioritize by:
    - Upcoming deadlines
    - Unread shared documents
    - Recently modified by collaborators
    - Documents needing action
- **Smart Filters:**
  - AI suggests filters based on context
  - "Show me documents I need to review"
  - Saved smart filters: "Urgent", "This Week", "Shared with Me"
- **Bulk Actions with AI:**
  - Select multiple → AI suggests: "Tag all as 'Q4'?"
  - "Archive old documents" → AI suggests which ones
- **Empty State:**
  - "No documents yet. Upload your first document to get started!"
  - "💡 AI Tip: You can drag & drop files here"

#### User Experience
- **Quick Actions:** Hover reveals action buttons
- **Keyboard Shortcuts:** Arrow keys, Enter to open, Cmd+Click for multi-select
- **Mobile Responsive:** Swipe actions on mobile
- **Infinite Scroll:** Optional, or pagination

---

### 3.3 Document Viewer

**URL:** `/documents/:id`
**Access:** Based on document permissions
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Documents          Contract_2025.pdf       [✕]  │
│                                                              │
│  [⬇ Download] [👥 Share] [🖨 Print] [⭐ Favorite] [•••]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔒 Blockchain Protected                    [Verify]  [ℹ️]  │
│  Hash: abc123def456...789  ✅ Verified on blockchain        │
│  Secured: Jan 15, 2025 10:30 AM • Transaction: #TX789123   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│                          │  💡 AI Summary                   │
│                          │  ─────────────────────────────   │
│  [Document Preview]      │  This is a vendor contract for   │
│                          │  software services covering      │
│  ┌──────────────────┐    │  2025. Key points:              │
│  │                  │    │                                  │
│  │   PDF/Image      │    │  • Contract Value: $50,000      │
│  │   Rendering      │    │  • Duration: 12 months          │
│  │   Area           │    │  • Renewal: Auto-renew          │
│  │                  │    │                                  │
│  │   [Zoom tools]   │    │  [Read full summary]            │
│  │                  │    │                                  │
│  └──────────────────┘    │  ───────────────────────────    │
│                          │                                  │
│  Page 1 of 5             │  📋 Details                     │
│                          │  ─────────────────────────────   │
│  [Previous] [Next]       │  Owner: John Admin              │
│                          │  Size: 2.8 MB                   │
│                          │  Type: PDF                      │
│                          │  Created: Jan 15, 2025          │
│                          │  Modified: Jan 15, 2025         │
│                          │  Version: 2                     │
│                          │                                  │
│                          │  🏷️ Tags                        │
│                          │  contract  legal  2025  vendor  │
│                          │  [+ Add tag]                    │
│                          │                                  │
│                          │  👥 Shared with (3)             │
│                          │  Sarah J. (Edit)                │
│                          │  Mike T. (View)                 │
│                          │  Legal Team (View)              │
│                          │  [+ Share]                      │
│                          │                                  │
│                          │  📚 Versions (2)                │
│                          │  → v2 (current) ⛓️              │
│                          │    v1 (Jan 10) ⛓️               │
│                          │  [View history]                 │
└──────────────────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💬 Comments & Activity                                      │
├─────────────────────────────────────────────────────────────┤
│  Sarah Johnson • 2 hours ago                                │
│  "Please review section 3.2 regarding payment terms"        │
│  [Reply]                                                     │
│                                                              │
│  🤖 AI Activity Alert • 4 hours ago                          │
│  "Document shared with Legal Team"                          │
│                                                              │
│  ⛓️ System • Today 10:30 AM                                 │
│  "Version 2 secured on blockchain (Hash: abc123...)"        │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Verification Panel:**
- **Prominent Badge:** Top banner showing blockchain protection status
- **One-Click Verify:**
  - Checks current file hash against blockchain
  - Shows: ✅ "Document is authentic" or ⚠️ "Document has been modified"
  - Animation during verification (2-3 seconds)
- **Blockchain Details (Expandable):**
  - Full hash (with copy button)
  - Transaction ID on blockchain
  - Block number
  - Timestamp
  - Network status
  - Certificate download (PDF with QR code)
- **Visual Indicator:**
  - Green shield icon = Verified
  - Yellow warning = Pending verification
  - Red alert = Tampered/Modified

**AI Integration:**
- **Smart Document Summary:**
  - Automatically generated on first view
  - Extracts key information:
    - Document type
    - Main topics
    - Key dates and numbers
    - Action items
    - Important clauses (for contracts)
  - "Read full summary" expands to detailed analysis
  - Option to regenerate summary
- **AI-Powered Actions:**
  - "💡 Extract signatures" → Finds all signature locations
  - "💡 Find dates" → Highlights all dates mentioned
  - "💡 Compare with v1" → AI shows key changes
  - "💡 Translate" → Offers translation (future)
- **Smart Recommendations:**
  - "Similar documents you might want to see"
  - "This document is related to: Project Alpha"
  - "Suggested tags: compliance, annual-review"
- **Intelligent Comments:**
  - AI suggests: "Ask a question about this document"
  - Auto-tags team members when mentioned
  - Smart notifications for relevant users

#### User Experience
- **Responsive Viewer:** Works on all screen sizes
- **Keyboard Navigation:** Arrow keys for pages, Escape to close
- **Annotations:** Highlight, comment on specific sections (future)
- **Accessibility:** Screen reader support, keyboard-only navigation

---

### 3.4 Document Sharing

**URL:** `/documents/:id/share` or Modal
**Access:** Owner, Admin, or users with edit permission
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Share: Contract_2025.pdf                         [✕ Close] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔒 Secure Blockchain-Protected Sharing                     │
│  Recipients will see blockchain verification badge          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Share with:                                                 │
│  [Search users, teams, or email...] 🤖                      │
│                                                              │
│  💡 AI Suggestions:                                          │
│  [+ Legal Team] [+ Sarah Johnson] [+ Mike Thompson]         │
│  Based on: Document type, past collaborations               │
└─────────────────────────────────────────────────────────────┘

��─────────────────────────────────────────────────────────────┐
│  Currently shared with:                                      │
│                                                              │
│  👤 Sarah Johnson (sarah@company.com)                       │
│     Permission: [Can Edit ▾]  🔒 Blockchain verified        │
│     Shared: Jan 15, 2025                          [Remove]  │
│                                                              │
│  👥 Legal Team (5 members)                                  │
│     Permission: [Can View ▾]  🔒 Blockchain verified        │
│     Shared: Jan 15, 2025                          [Remove]  │
│                                                              │
│  💡 AI: Sarah has viewed this document 3 times              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Advanced Options                              [Expand ▾] │
│                                                              │
│  Expires:          [○ Never  ○ After 7 days  ○ Custom]     │
│  Notification:     ☑ Notify recipients via email            │
│  Download:         ☑ Allow downloads (blockchain protected) │
│  Blockchain Audit: ☑ Log all access on blockchain (Rec.)   │
│                                                              │
│  Message (optional):                                         │
│  [_____________________________________________]            │
│  💡 AI suggests: "Please review by end of week"             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Or share via link:                                          │
│  ┌────────────────────────────────────────┐                 │
│  │ https://docchain.com/s/abc123...  📋   │                 │
│  └────────────────────────────────────────┘                 │
│  🔒 Link is blockchain-protected and trackable              │
│                                                              │
│  [Cancel]                                 [Share Securely]  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Integration:**
- **Secure Sharing Message:** Emphasize that sharing maintains blockchain protection
- **Blockchain Audit Trail:**
  - Optional (but recommended): Log all shares on blockchain
  - Recipients see "Blockchain verified" badge
  - All access attempts logged
- **Tamper Detection:**
  - If someone tries to modify downloaded file, they can verify it was tampered with
  - Verification URL provided with every share

**AI Integration:**
- **Smart Recipient Suggestions:**
  - Based on document type: "Contracts usually shared with Legal"
  - Based on content: "This mentions Project Alpha, share with PM team?"
  - Based on history: "You previously shared similar docs with Sarah"
  - Based on organization: "Required reviewers: Manager + Legal"
- **Smart Permissions:**
  - AI suggests appropriate permission level
  - "Legal documents typically require view-only access"
  - "Team members usually get edit access"
- **Smart Expiration:**
  - "💡 This is a confidential document, consider 7-day expiration"
  - "💡 External shares should expire after 30 days"
- **Message Suggestions:**
  - Context-aware message templates
  - "Please review by [deadline]"
  - "This requires your approval"
  - "FYI - no action needed"

---

### 3.5 Version History

**URL:** `/documents/:id/versions`
**Access:** Based on document permissions
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Document          Version History                │
│  Contract_2025.pdf                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⛓️ All versions are blockchain-protected and verifiable    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Timeline View: [List] [Compare] [Visual Timeline]          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Version 2 (Current)                    ⛓️ Blockchain: ✅   │
│  Jan 15, 2025 10:30 AM • Uploaded by John Admin             │
│  Hash: abc123def456...789                                   │
│  Size: 2.8 MB (+200 KB from v1)                             │
│                                                              │
│  💡 AI Summary of Changes:                                   │
│  • Payment terms updated in section 3.2                     │
│  • Added termination clause in section 5                    │
│  • Minor formatting changes                                 │
│  [View AI comparison] [View full details]                   │
│                                                              │
│  [👁 View] [⬇ Download] [🔄 Restore] [⛓️ Verify]           │
├─────────────────────────────────────────────────────────────┤
│  │                                                           │
│  │ ⛓️ Blockchain audit trail maintained                     │
│  ▼                                                           │
├─────────────────────────────────────────────────────────────┤
│  Version 1                              ⛓️ Blockchain: ✅   │
│  Jan 10, 2025 3:45 PM • Uploaded by Sarah Johnson           │
│  Hash: xyz789abc012...345                                   │
│  Size: 2.6 MB                                               │
│                                                              │
│  Change notes: "Initial contract draft"                     │
│                                                              │
│  [👁 View] [⬇ Download] [🔄 Restore] [⛓️ Verify]           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔍 Compare Versions                                         │
│  [Version 1 ▾] vs [Version 2 (Current) ▾]   [Compare]      │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Integration:**
- **Every Version Protected:** Each version has unique blockchain hash
- **Hash Comparison:** Visually compare hashes to verify authenticity
- **Blockchain Timeline:** Shows when each version was secured
- **Verification:** One-click verify any version against blockchain
- **Immutable History:** Cannot delete versions (audit trail)
- **Certificate per Version:** Download blockchain certificate for any version

**AI Integration:**
- **Smart Change Detection:**
  - Automatically compares versions
  - Highlights key changes in plain language
  - "💡 Payment amount changed from $45K to $50K"
  - "💡 Deadline extended by 2 weeks"
- **Visual Diff with AI Annotation:**
  - Side-by-side comparison
  - AI highlights: "Important change", "Minor edit", "Formatting only"
  - Color coding: Red = removed, Green = added, Yellow = modified
- **Smart Restore:**
  - "⚠️ Restoring v1 will create v3 (preserves blockchain history)"
  - AI warns: "This version is older and may be outdated"
- **Version Insights:**
  - "💡 Most active period: Jan 10-15 (5 versions)"
  - "💡 Typical: 2-3 versions for this document type"

---

## 4. Search & Discovery

### 4.1 Global Search

**URL:** `/search?q=...`
**Access:** All authenticated users
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Search documents, people, tags...] 🤖      [Advanced]  │
│  💡 Try: "contracts from last month" or "PDF about project" │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Search: "contract 2025"                       12 results    │
│                                                              │
│  Filters: [All Types ▾] [All Users ▾] [Date ▾]             │
│  ☑ Blockchain Protected  ☐ My Documents  ☐ Shared          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI Insights:                                             │
│  • Found "contract" in 8 titles, 4 file contents           │
│  • Most relevant: Contract_2025.pdf (98% match)             │
│  • Also showing: Similar documents you haven't seen         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📄 Contract_2025.pdf                    ⛓️    2.8 MB Today │
│     Vendor contract for software services...                │
│     "...payment terms in 2025 will be $50,000..."           │
│     Relevance: ████████ 98%                                 │
│     [Open]                                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  📄 Agreement_2025.docx                  ⛓️    1.2 MB  2d   │
│     Service agreement with contract terms...                │
│     "...effective January 2025 for a period of..."          │
│     Relevance: ██████░░ 87%                                 │
│     [Open]                                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI Suggestions:                                          │
│  • Did you mean: "vendor contracts 2025"?                   │
│  • Related searches: agreements, legal docs, 2024 contracts │
│  • Save this search: [Save as "2025 Contracts"]            │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**AI-Powered Search:**
- **Natural Language Queries:**
  - "show me pdfs I uploaded last week"
  - "contracts that need review"
  - "documents shared with legal team"
  - "files about project alpha"
- **Semantic Search:**
  - Understands meaning, not just keywords
  - "agreement" also finds "contract", "MOU", etc.
  - "last month" understands dates
- **Typo Tolerance:**
  - "contrackt" → "contract"
  - "agrement" → "agreement"
  - Suggestions shown immediately
- **Content Search:**
  - Searches inside document text (PDFs, DOCX, etc.)
  - Highlights matching text snippets
  - Shows context around matches
- **Smart Filters:**
  - AI suggests relevant filters based on query
  - "contracts" → suggests "Legal" user filter
  - Auto-applies common filters
- **Search History:**
  - Recent searches saved
  - AI suggests searches based on current work
- **Relevance Ranking:**
  - AI ranks results by relevance
  - Shows match percentage
  - Considers: filename, content, tags, recency, popularity

**Blockchain Search:**
- Filter by blockchain status
- Search by blockchain hash
- Find documents by transaction ID

---

### 4.2 Advanced Search

**URL:** `/search/advanced`
**Access:** All authenticated users
**Priority:** **P2 - Future**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Advanced Search                                  [✕ Close] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Search Query:                                               │
│  [contract AND (2025 OR 2024)]                  [AI Help 🤖] │
│  💡 AI: Use quotes for exact phrases: "service agreement"   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────┐
│  Document Type:      │  Date Range:                         │
│  ☑ PDF               │  From: [Jan 1, 2025]                 │
│  ☐ Word (DOCX)       │  To:   [Today]                       │
│  ☐ Excel (XLSX)      │  💡 or: [Last 30 days ▾]            │
│  ☐ Images            │                                      │
│                      │  Size Range:                         │
│  Owner:              │  Min: [     ] MB                     │
│  [All users ▾]       │  Max: [     ] MB                     │
│                      │                                      │
│  Tags:               │  Blockchain:                         │
│  [contract, legal]   │  ◉ Protected only                    │
│  💡 +5 suggested     │  ○ All documents                     │
│                      │  ○ Unprotected only                  │
│  Status:             │                                      │
│  ☑ Active            │  Blockchain Hash:                    │
│  ☐ Archived          │  [abc123def456...]                   │
│  ☐ Deleted           │                                      │
└──────────────────────┴──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Clear All]                        [Search] [Save Filter]  │
└─────────────────────────────────────────────────────────────┘
```

#### AI Features
- **Query Builder:** AI helps construct complex queries
- **Smart Suggestions:** Suggests search parameters based on history
- **Saved Searches:** AI names them intelligently
- **Boolean Helper:** Explains AND, OR, NOT operators

---

## 5. User Management (Admin)

### 5.1 User List

**URL:** `/admin/users`
**Access:** Admin only
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Users                                      [+ Add User]     │
│  [🔍 Search users...] 🤖                    [Export]  [⚙️]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 Quick Stats                                              │
│  Total: 156  Active: 142  Inactive: 14  Admins: 3          │
│  💡 AI: 12 users haven't logged in for 30+ days            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Filter: [All Roles ▾] [All Status ▾]  Sort: [Recent ▾]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  User                     Role      Status    Last Login     │
├─────────────────────────────────────────────────────────────┤
│  👤 John Admin            ADMIN     Active    2 hours ago   │
│     john@company.com      🔐 MFA    ⛓️ 24 docs             │
│     [Edit] [Deactivate] [View Activity]                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  👤 Sarah Johnson         EDITOR    Active    Today 9:30AM  │
│     sarah@company.com     🔐 MFA    ⛓️ 18 docs             │
│     💡 AI: High activity (47 uploads today)                 │
│     [Edit] [Deactivate] [View Activity]                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  👤 Mike Thompson         VIEWER    Inactive  30 days ago   │
│     mike@company.com      ⚠️ No MFA  ⛓️ 3 docs              │
│     💡 AI: Consider removing (inactive 30+ days)            │
│     [Edit] [Activate] [Delete]                              │
└─────────────────────────────────────────────────────────────┘
```

#### AI Features
- **Activity Anomalies:** Detects unusual behavior patterns
- **Security Recommendations:**
  - "⚠️ 14 users without MFA enabled"
  - "💡 Consider requiring MFA for all users"
- **Role Suggestions:**
  - "💡 Sarah's activity suggests Editor role might be more appropriate"
- **Inactive User Detection:**
  - Flags users inactive 30+ days
  - Suggests deactivation or removal
- **Bulk Operations with AI:**
  - "Enable MFA for all Editors"
  - "Deactivate all inactive users"

---

### 5.2 Add/Edit User

**URL:** `/admin/users/new` or `/admin/users/:id/edit`
**Access:** Admin only
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Add New User                                     [✕ Close] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Full Name:    [________________________]                   │
│                💡 AI: Capitalize properly                    │
│                                                              │
│  Email:        [________________________]                   │
│                ✅ Available                                  │
│                                                              │
│  Role:         ◉ Viewer  ○ Editor  ○ Admin                  │
│                💡 AI recommends: Viewer (safest for new users)│
│                                                              │
│  Initial Team: [Select team...] 🤖                          │
│                💡 Suggested: Marketing (based on email)     │
│                                                              │
│  ☑ Send welcome email with setup instructions              │
│  ☑ Require MFA setup on first login (Recommended)          │
│  ☐ Grant temporary admin access (expires in 24h)           │
│                                                              │
│  [Cancel]                                     [Create User] │
└─────────────────────────────────────────────────────────────┘
```

#### AI Features
- **Smart Role Assignment:** Suggests role based on email domain, department
- **Team Detection:** Suggests team based on email, name patterns
- **Email Validation:** Real-time checks for company domain, typos
- **Security Recommendations:** Always suggests MFA

---

## 6. Settings & Profile

### 6.1 User Profile

**URL:** `/profile` or `/settings/profile`
**Access:** Own profile
**Priority:** **P0 - MVP**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  My Profile                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Profile Photo]                                             │
│  [Change Photo] [Remove]                                     │
│                                                              │
│  Full Name:    [John Admin________________]                 │
│  Email:        john@company.com (verified ✅)               │
│  Role:         Admin                                         │
│  Member since: Jan 1, 2024                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔐 Security                                                 │
│  ─────────────────────────────────────────────────────────  │
│  Two-Factor Authentication (MFA):  ✅ Enabled               │
│  [Disable MFA] [Change Method]                              │
│                                                              │
│  Password:  ••••••••                                         │
│  Last changed: 30 days ago                                   │
│  💡 AI: Consider changing password (30+ days old)           │
│  [Change Password]                                           │
│                                                              │
│  Active Sessions: 2                                          │
│  • Chrome on Mac (current)                                   │
│  • Mobile App on iPhone (2 hours ago)                       │
│  [View All Sessions] [Sign Out All]                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⛓️ Blockchain Activity                                      │
│  ─────────────────────────────────────────────────────────  │
│  Your Documents Protected: 24/24 (100%)                     │
│  Total Blockchain Transactions: 47                           │
│  Last Activity: 2 hours ago                                  │
│  [View Blockchain Certificate]                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔔 Notifications                                            │
│  ─────────────────────────────────────────────────────────  │
│  Email Notifications:                                        │
│  ☑ Document shared with me                                  │
│  ☑ Comment on my document                                   │
│  ☑ Blockchain security alerts                               │
│  ☐ Weekly activity summary                                  │
│  ☐ AI insights and suggestions                              │
│                                                              │
│  Push Notifications:                                         │
│  ☑ Important security alerts only                           │
│  ☐ All notifications                                        │
│  💡 AI: You typically respond to alerts within 5 minutes    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Save Changes]                                [Delete Account]│
└─────────────────────────────────────────────────────────────┘
```

#### AI Features
- **Smart Defaults:** AI pre-selects notification preferences based on role
- **Security Insights:**
  - Password age warnings
  - Unusual login detection
  - Device recognition
- **Activity Patterns:**
  - "You typically check documents at 9 AM"
  - "Consider enabling mobile notifications"

---

## 7. Admin Pages

### 7.1 Audit Logs

**URL:** `/admin/audit`
**Access:** Admin only
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Audit Logs                              ⛓️ Blockchain Verified│
│  [🔍 Search logs...] 🤖                  [Export]  [⚙️]      │
└────────────────────────────────────────────────────────────���┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI Security Insights                           [Details] │
│  • ⚠️ 3 failed login attempts from IP 192.168.1.50 (10 min) │
│  • ✅ No anomalies detected in last 24 hours                │
│  • 📊 Unusual activity: 47 uploads by sarah@company.com     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Filter: [All Actions ▾] [All Users ▾] [Today ▾]           │
│  ☐ Security Events Only  ☐ Blockchain Events Only          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Timestamp           User          Action        Status  ⛓️  │
├─────────────────────────────────────────────────────────────┤
│  2 min ago           John Admin    LOGIN         SUCCESS  ✅ │
│  192.168.1.100 • Chrome on Mac                              │
│  [View Details]                                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  5 min ago           Sarah J.      UPLOAD        SUCCESS  ✅ │
│  Contract_2025.pdf • Blockchain: abc123def456...            │
│  [View Details] [View Blockchain]                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  10 min ago          Unknown       LOGIN         FAILED   ✅ │
│  192.168.1.50 • Invalid credentials                         │
│  💡 AI: 3rd attempt from this IP                            │
│  [Block IP] [View Details]                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Integration:**
- **Every Log on Blockchain:** All critical events stored on blockchain
- **Tamper-Proof:** Logs cannot be altered
- **Verification:** Click any log entry to verify on blockchain
- **Blockchain Badge:** ✅ next to verified entries

**AI Features:**
- **Anomaly Detection:**
  - Unusual login patterns
  - Suspicious download volumes
  - Failed login clustering
  - Permission escalation attempts
  - Off-hours activity
- **Smart Alerts:**
  - Real-time notifications for critical events
  - Predictive: "This pattern often precedes security breach"
- **Activity Correlation:**
  - Links related events
  - "User X logged in, then downloaded 50 files (unusual)"
- **Natural Language Search:**
  - "show me failed logins today"
  - "who accessed contract_2025.pdf?"

---

### 7.2 Blockchain Dashboard

**URL:** `/admin/blockchain`
**Access:** Admin only
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ⛓️ Blockchain Dashboard                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Network Status: ✅ Connected to Hyperledger Fabric         │
│  Last synchronized: 30 seconds ago                [Refresh] │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Documents   │  Transactions│   Success    │  Avg Time    │
│  Secured     │  Today       │   Rate       │  per Hash    │
│              │              │              │              │
│    2,847     │     89       │   99.98%     │   1.2 sec    │
│  ⛓️ +12      │  [View]      │  ✅ Healthy  │  🔥 Fast     │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  💡 AI Insights                                              │
│  ─────────────────────────────────────────────────────────  │
│  • ✅ Blockchain performance optimal                         │
│  • 📊 Transaction volume up 15% this week (normal trend)    │
│  • ⚠️ 2 pending transactions (>5 min) - investigating...    │
│  • 💡 Suggest: Schedule maintenance window for network upgrade│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Recent Blockchain Transactions                              │
│  ─────────────────────────────────────────────────────────  │
│  Hash: abc123def456...789                     ✅ 2 min ago  │
│  Document: Contract_2025.pdf                                 │
│  Transaction ID: #TX789123                                   │
│  Block: #456789 • Network: Production                       │
│  [View Certificate] [Verify]                                │
│                                                              │
│  Hash: xyz789abc012...345                     ✅ 5 min ago  │
│  Document: Q4_Report.xlsx                                    │
│  Transaction ID: #TX789122                                   │
│  Block: #456788 • Network: Production                       │
│  [View Certificate] [Verify]                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Blockchain Network Map                                      │
│  ─────────────────────────────────────────────────────────  │
│         [Visual representation of nodes]                     │
│         • Node 1: ✅ Active (US-East)                        │
│         • Node 2: ✅ Active (US-West)                        │
│         • Node 3: ✅ Active (EU)                             │
│         • Node 4: ✅ Active (Asia)                           │
│  [View Network Details]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Failed Transactions (2)                                     │
│  ─────────────────────────────────────────────────────────  │
│  ⚠️ Meeting_Notes.docx • Failed to secure                    │
│     Error: Network timeout • 10 min ago                     │
│     💡 AI: Will auto-retry in 5 minutes                      │
│     [Retry Now] [View Details]                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Blockchain Visibility:**
- **Real-time Status:** Live connection to blockchain network
- **Transaction Monitoring:** All blockchain operations visible
- **Performance Metrics:** Speed, success rate, network health
- **Network Visualization:** Shows blockchain nodes and their status
- **Certificate Management:** Download blockchain certificates

**AI Features:**
- **Performance Optimization:**
  - Predicts network slowdowns
  - Suggests optimal times for maintenance
  - Detects bottlenecks
- **Anomaly Detection:**
  - Failed transactions patterns
  - Unusual transaction volumes
  - Network issues prediction
- **Cost Optimization:**
  - Transaction cost analysis (if applicable)
  - Suggests batch processing opportunities

**Marketing Value:**
- This dashboard proves blockchain is real and working
- Screenshots can be used for sales/marketing
- Live demo for prospects
- Shows technical sophistication

---

## 8. Utility Pages

### 8.1 Notifications Center

**URL:** `/notifications`
**Access:** All authenticated users
**Priority:** **P1 - Phase 1**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Notifications                          [Mark All Read]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Filter: [All ▾] [Unread ▾] [Security ▾] [Blockchain ▾]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔐 Security Alert                              ⚠️  2h ago   │
│  Failed login attempt from new location                     │
│  IP: 192.168.1.50 • Location: Unknown                       │
│  [Review] [Block IP] [Mark Safe]                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ⛓️ Blockchain Secured                          ✅  3h ago   │
│  Contract_2025.pdf secured on blockchain                    │
│  Hash: abc123def456...789                                   │
│  [View Document] [View Certificate]                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  👥 Shared with You                             📄  5h ago   │
│  Sarah Johnson shared "Q4_Report.xlsx"                      │
│  Permission: Can Edit                                        │
│  [Open Document] [Thank]                                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  💡 AI Suggestion                               🤖  Today    │
│  5 documents missing tags - Let AI auto-tag them            │
│  [Auto-Tag Now] [Review] [Dismiss]                          │
└─────────────────────────────────────────────────────────────┘
```

#### AI Features
- **Smart Grouping:** Groups related notifications
- **Priority Sorting:** Important notifications first
- **Smart Actions:** Context-aware quick actions
- **Noise Reduction:** Hides low-priority notifications

---

### 8.2 Trash / Deleted Items

**URL:** `/trash`
**Access:** All users (own deletions), Admin (all)
**Priority:** **P2 - Future**

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Trash                                   [Empty Trash]       │
│  Items are permanently deleted after 30 days                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⛓️ Note: Blockchain hashes are preserved for audit trail   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Old_Contract.pdf                        ⛓️   Deleted 2d ago│
│  Deleted by: John Admin                                      │
│  Blockchain Hash: abc123... (preserved)                      │
│  [Restore] [Delete Forever] [View Hash]                     │
│                                                              │
│  💡 AI: This is related to "Contract_2025.pdf" (active)     │
└─────────────────────────────────────────────────────────────┘
```

#### Blockchain Integration
- **Hash Preservation:** Even deleted items maintain blockchain record
- **Audit Trail:** Deletion is logged on blockchain
- **Verification:** Can verify deleted files were authentic

---

## 9. Mobile Considerations

### 9.1 Responsive Design Priorities

**All pages must be mobile-responsive** with these adaptations:

#### Mobile Navigation
```
┌────────────────────┐
│ [☰] DocChain  [🔔] │
└────────────────────┘

Hamburger menu expands to:
├── 📊 Dashboard
├── 📄 Documents
├── 🔍 Search
├── 👤 Profile
└── ⚙️ Settings
```

#### Mobile Upload
- **Camera Access:** "Take Photo" option alongside file browser
- **Bottom Sheet:** Upload form slides up from bottom
- **Simplified Form:** Essential fields only, expandable advanced options

#### Mobile Document Viewer
- **Swipe Navigation:** Swipe between pages
- **Pinch to Zoom:** Native gesture support
- **Quick Actions:** Bottom toolbar with View, Share, Download

#### Mobile Blockchain Verification
- **QR Code Scanner:** Scan blockchain certificate QR codes
- **Simplified Badge:** Smaller but prominent blockchain indicators
- **One-Tap Verify:** Large verify button

---

## 10. Design System Guidelines

### 10.1 Blockchain Design Elements

**Visual Language:**
- **Color:** Soft blue (#4A90E2) for blockchain elements
- **Icon:** ⛓️ or 🔒 depending on context
- **Animation:** Subtle pulse on blockchain badges (1.5s interval)
- **Badge Style:** Rounded rectangle, soft shadow, icon + text

**Blockchain Badge Variants:**
```
✅ Protected     - Green, document is secured
⏳ Securing...   - Yellow, in progress
⚠️ Failed        - Red, needs attention
🔍 Verify        - Blue, click to verify
```

**Toast Notifications:**
```
┌─────────────────────────────────────┐
│ ⛓️ Document secured on blockchain   │
│    Contract_2025.pdf                │
│    [View Certificate]         [✕]  │
└─────────────────────────────────────┘
```

### 10.2 AI Design Elements

**Visual Language:**
- **Color:** Purple accent (#7C3AED) for AI features
- **Icon:** 🤖, 💡, or ✨ depending on context
- **Animation:** Gentle fade-in for suggestions
- **Tone:** Helpful, not intrusive

**AI Suggestion Styles:**
```
┌─────────────────────────────────────┐
│ 💡 AI Suggestion                    │
│ Let me auto-tag these documents     │
│ [Yes, go ahead] [No thanks]        │
└─────────────────────────────────────┘
```

**AI Input Enhancement:**
```
Input Field:  [____________] 🤖
              💡 Suggested: "Contract"
```

### 10.3 Color Palette

**Primary Colors:**
- Primary Blue: #4A90E2 (blockchain, links)
- Success Green: #10B981 (verified, success)
- Warning Yellow: #F59E0B (pending, warnings)
- Error Red: #EF4444 (failed, errors)
- AI Purple: #7C3AED (AI features)

**Neutral Colors:**
- Background: #FFFFFF (light mode) / #1F2937 (dark mode)
- Surface: #F9FAFB / #374151
- Border: #E5E7EB / #4B5563
- Text Primary: #111827 / #F9FAFB
- Text Secondary: #6B7280 / #9CA3AF

### 10.4 Typography

**Font Family:**
- Primary: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI"
- Monospace: "SF Mono", Monaco, "Courier New" (for hashes, codes)

**Type Scale:**
- H1: 36px / 600 weight
- H2: 30px / 600 weight
- H3: 24px / 600 weight
- Body: 16px / 400 weight
- Small: 14px / 400 weight
- Tiny: 12px / 400 weight

### 10.5 Spacing System

**8px Base Unit:**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### 10.6 Component Library

**Buttons:**
```
[Primary Button]     - Blue, for main actions
[Secondary Button]   - Gray, for secondary actions
[Danger Button]      - Red, for destructive actions
[Ghost Button]       - Transparent, for tertiary actions

[⛓️ Blockchain CTA]  - Special style with blockchain icon
```

**Cards:**
```
┌─────────────────────────┐
│ [Card Header]           │
├─────────────────────────┤
│ Card content goes here  │
│                         │
│ [Action] [Action]       │
└─────────────────────────┘

Shadow: 0 1px 3px rgba(0,0,0,0.1)
Border Radius: 8px
```

**Badges:**
```
[Active]     - Green background
[Pending]    - Yellow background
[Inactive]   - Gray background
[⛓️ Protected] - Blue background with icon
```

---

## 11. Empty States

### 11.1 No Documents

```
┌─────────────────────────────────────┐
│                                     │
│         [Empty Box Illustration]    │
│                                     │
│      No documents yet               │
│                                     │
│   Upload your first document to     │
│   get started with blockchain       │
│   protection                        │
│                                     │
│   [📤 Upload Document]              │
│                                     │
│   💡 AI Tip: You can drag & drop   │
│   files anywhere on this page       │
└─────────────────────────────────────┘
```

### 11.2 No Search Results

```
┌─────────────────────────────────────┐
│                                     │
│       [Magnifying Glass Illus.]     │
│                                     │
│   No documents found for            │
│   "your search query"               │
│                                     │
│   💡 AI Suggestions:                │
│   • Try different keywords          │
│   • Check for typos                 │
│   • Use fewer filters               │
│                                     │
│   [Clear Filters] [Search Again]   │
└─────────────────────────────────────┘
```

---

## 12. Loading States

### 12.1 Document Upload Progress

```
┌─────────────────────────────────────┐
│  Uploading Contract_2025.pdf        │
│  [████████████████░░] 85%           │
│  2.4 MB of 2.8 MB                   │
│                                     │
│  ⛓️ Generating blockchain hash...   │
│  [Animated spinner]                 │
└─────────────────────────────────────┘
```

### 12.2 Blockchain Verification

```
┌─────────────────────────────────────┐
│  ⛓️ Verifying on blockchain...      │
│  [Animated blockchain icon]         │
│                                     │
│  This usually takes 2-3 seconds     │
└─────────────────────────────────────┘
```

### 12.3 AI Processing

```
┌────────────────────��────────────────┐
│  🤖 AI is analyzing document...     │
│  [Animated thinking dots]           │
│                                     │
│  Extracting tags and suggestions    │
└─────────────────────────────────────┘
```

---

## 13. Error States

### 13.1 Upload Failed

```
┌─────────────────────────────────────┐
│  ⚠️ Upload Failed                   │
│                                     │
│  Contract_2025.pdf could not be     │
│  uploaded                           │
│                                     │
│  Error: Network connection lost     │
│                                     │
│  [Try Again] [Cancel]               │
│                                     │
│  💡 AI: Your file is saved locally │
│  and will auto-retry when online    │
└─────────────────────────────────────┘
```

### 13.2 Blockchain Security Failed

```
┌─────────────────────────────────────┐
│  ⚠️ Blockchain Security Failed      │
│                                     │
│  Document uploaded successfully     │
│  but blockchain protection failed   │
│                                     │
│  Your document is saved securely,   │
│  but blockchain hash is pending     │
│                                     │
│  [Retry Blockchain] [Continue]     │
│                                     │
│  💡 We'll automatically retry in    │
│  the background                     │
└─────────────────────────────────────┘
```

### 13.3 Permission Denied

```
┌─────────────────────────────────────┐
│  🔒 Permission Denied               │
│                                     │
│  You don't have permission to       │
│  access this document               │
│                                     │
│  [Request Access] [Back]            │
│                                     │
│  💡 AI: Try contacting the owner:  │
│  john@company.com                   │
└─────────────────────────────────────┘
```

---

## 14. Accessibility Requirements

### 14.1 WCAG 2.1 AA Compliance

**Required Features:**
- ✅ Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- ✅ Screen reader support (ARIA labels, semantic HTML)
- ✅ Color contrast ratios ≥ 4.5:1 for text
- ✅ Focus indicators (visible focus rings)
- ✅ Alt text for all images and icons
- ✅ Descriptive link text (not "click here")
- ✅ Form labels and error messages
- ✅ Skip navigation links
- ✅ Resizable text (up to 200%)

### 14.2 Blockchain Accessibility

**Challenge:** Making blockchain features understandable
**Solution:**
- Simple language: "Protected" instead of "Hashed"
- Tooltips: Explain blockchain terms on hover
- Help icons: ? icon for more information
- Plain English: Avoid technical jargon

### 14.3 AI Accessibility

**Challenge:** AI suggestions can be intrusive
**Solution:**
- Dismissible: All AI suggestions can be hidden
- Keyboard accessible: Tab to AI suggestions
- Screen reader friendly: Clear labels for AI features
- Optional: AI can be disabled in settings

---

## 15. Performance Targets

### 15.1 Page Load Times

- **Dashboard:** < 1.5 seconds
- **Document List:** < 2 seconds
- **Document Viewer:** < 2 seconds (+ file loading)
- **Search Results:** < 1 second

### 15.2 Interaction Responsiveness

- **Button clicks:** Immediate feedback (< 100ms)
- **Form inputs:** Real-time validation (< 200ms)
- **AI suggestions:** < 1 second
- **Blockchain verification:** 2-5 seconds (with loading indicator)

### 15.3 Upload Performance

- **Small files (<10MB):** < 5 seconds total
- **Large files (>100MB):** Progress indicator, resumable uploads
- **Blockchain hashing:** Concurrent with upload, < 3 seconds

---

## 16. Browser & Device Support

### 16.1 Desktop Browsers
- ✅ Chrome 90+ (primary)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 16.2 Mobile Browsers
- ✅ iOS Safari 14+
- ✅ Chrome Mobile (Android)
- ✅ Samsung Internet

### 16.3 Screen Sizes
- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px - 1920px
- **Large Desktop:** 1921px+

---

## 17. Future Enhancements (Post-Phase 1)

### 17.1 Advanced Features
- **Collaborative Editing:** Real-time document editing
- **Document Templates:** AI-generated document templates
- **Advanced OCR:** Extract text from scanned documents
- **E-Signatures:** Digital signature integration
- **Workflow Automation:** Approval workflows with blockchain audit
- **API Access:** Developer API for integrations
- **White-labeling:** Custom branding for enterprise clients

### 17.2 AI Enhancements
- **Document Q&A:** Ask questions about document content
- **Smart Summarization:** Multi-document summaries
- **Predictive Analytics:** Usage patterns, predictions
- **Auto-categorization:** Folder organization suggestions
- **Language Translation:** Real-time document translation
- **Sentiment Analysis:** Contract risk analysis

### 17.3 Blockchain Enhancements
- **Multi-Chain Support:** Support multiple blockchain networks
- **NFT Certificates:** Documents as NFTs
- **Smart Contracts:** Automated workflows via smart contracts
- **Public Verification:** Public URL for blockchain verification
- **Blockchain Explorer:** Dedicated blockchain transaction viewer

---

## 18. Marketing & Demo Considerations

### 18.1 Demo Account Setup

**Pre-loaded data for demos:**
- 20-30 sample documents (various types)
- All documents blockchain-protected
- Sample users with different roles
- Recent activity in audit logs
- AI suggestions visible
- Blockchain dashboard showing healthy metrics

### 18.2 Screenshot-Ready Pages

**Best pages for marketing:**
1. **Dashboard** - Shows overview of features
2. **Document Upload** - Shows blockchain integration
3. **Blockchain Dashboard** - Proves blockchain is real
4. **Document Viewer** - Shows verification badge
5. **Audit Logs** - Shows security features

### 18.3 Key Selling Points to Highlight

**Blockchain:**
- "Every document automatically secured on blockchain"
- "Tamper-proof audit trail"
- "Verify authenticity with one click"
- "Enterprise-grade Hyperledger Fabric"

**AI:**
- "AI-powered document management"
- "Smart search that understands natural language"
- "Automatic tagging and organization"
- "Intelligent security alerts"

**Security:**
- "Military-grade encryption"
- "Two-factor authentication"
- "Role-based access control"
- "Complete audit trail"

---

## 19. Priority Summary for Designers

### Phase 0 - MVP (Week 1-4)
**Must Have:**
1. Login/Register
2. Dashboard (basic)
3. Document Upload with blockchain indicator
4. Document List with blockchain badges
5. Document Viewer with verification
6. Basic Search
7. Profile Settings

### Phase 1 - Launch (Week 5-8)
**Should Have:**
1. Admin Dashboard with blockchain monitoring
2. User Management
3. Audit Logs
4. Document Sharing
5. Version History
6. AI-powered search
7. Notifications

### Phase 2 - Enhancement (Post-Launch)
**Nice to Have:**
1. Advanced Search
2. Collaborative Editing
3. Workflow Automation
4. Mobile Apps (native)
5. API Documentation UI
6. Public Blockchain Verification

---

## 20. Design Deliverables Checklist

**For Each Page:**
- [ ] Desktop design (1920x1080)
- [ ] Tablet design (768x1024)
- [ ] Mobile design (375x667)
- [ ] Hover states for interactive elements
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Success states
- [ ] Blockchain indicators (where applicable)
- [ ] AI suggestion components (where applicable)
- [ ] Accessibility notes
- [ ] Animation specifications

**Design System:**
- [ ] Color palette with hex codes
- [ ] Typography scale with line heights
- [ ] Spacing system
- [ ] Component library (buttons, cards, forms, etc.)
- [ ] Icon set (including blockchain and AI icons)
- [ ] Illustration style guide
- [ ] Animation guidelines
- [ ] Dark mode variants (optional for Phase 1)

**Prototypes:**
- [ ] Interactive prototype for user testing
- [ ] Micro-interactions and animations
- [ ] Navigation flow
- [ ] Key user journeys (upload, share, verify)

---

## Final Notes for UI/UX Team

**Key Principles:**

1. **Blockchain Should Feel Natural**
   - Don't overwhelm users with blockchain terminology
   - Use simple language: "Protected" not "Hashed"
   - Visual indicators should be subtle but confidence-building
   - Make verification easy and rewarding

2. **AI Should Feel Helpful, Not Intrusive**
   - Suggestions should be contextual and dismissible
   - Never force AI features on users
   - Provide value without explanation (it just works)
   - Learn from user behavior and improve suggestions

3. **Security Should Feel Empowering, Not Scary**
   - Use positive language: "Protected" not "Secured against threats"
   - Show what IS protected, not what COULD go wrong
   - Make complex security features simple to use
   - Build confidence through transparency

4. **Design for Trust**
   - Professional, modern aesthetic
   - Consistent design language
   - No dark patterns or manipulative UI
   - Clear, honest communication
   - Reliable performance

**Questions to Ask During Design:**
- Does this build trust?
- Is the blockchain value visible but not overwhelming?
- Does AI actually help here, or is it gimmicky?
- Can my grandmother use this feature?
- Would I trust this interface with sensitive documents?

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** After user testing / Before development kickoff
