/**
 * UI/UX DESIGN IMPROVEMENTS
 * =========================
 * Detailed component specs, layouts, and interaction guidelines for new features
 */

// ============================================================================
// 1. INVOICE MANAGEMENT UI
// ============================================================================

/**
INVOICE LIST PAGE
─────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ 📄 Invoice Management                    [+ New Invoice]    │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Date Range] [Status ▼] [Customer ▼] [Search...]   │
│ Actions: [Refresh]   [Export CSV]   [Print Selected]        │
├─────────────────────────────────────────────────────────────┤
│ Invoice #  | Customer      | Amount    | Status    | Actions │
│────────────┼───────────────┼───────────┼───────────┼─────────│
│ 2026-0001  | ABC Market    | $1,250.00 | Paid ✓   | [View]  │
│ 2026-0002  | XYZ Traders   | $890.50   | Issued   | [View]  │
│ 2026-0003  | Local Shop    | $2,100.00 | Draft    | [View]  │
│ 2026-0004  | Metro Veg     | $565.25   | Cancelled| [View]  │
└─────────────────────────────────────────────────────────────┘

COMPONENT SPECS:
- Table: sortable by invoice #, customer, amount, status, date
- Status badge colors:
  * DRAFT: gray, "Draft"
  * ISSUED: blue, "Awaiting Payment"
  * PAID: green, "✓ Paid"
  * CANCELLED: red, "Cancelled"
- Actions: "View" opens detail modal (wide)
- F1/hotkey: quick filter by date range
- Bulk actions: checkbox column, action bar appears: [Mark Paid] [Export PDF] [Archive]
*/

/**
INVOICE DETAIL MODAL (wide)
────────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────────┐
│ Invoice #2026-0001                         [Print] [PDF] [X] │
├──────────────────────────────────────────────────────────────┤
│ Status: ✓ PAID    Due: 2026-02-15                            │
│ Customer: ABC Market | Phone: 555-1234 | Tax ID: 12345678    │
├──────────────────────────────────────────────────────────────┤
│ LINE ITEMS                                                   │
│ ─────────────────────────────────────────────────────────── │
│ Product         | Qty | Unit | Price  | Discount | Line Tot │
│─────────────────┼─────┼──────┼────────┼──────────┼──────────│
│ Tomatoes (Red)  │ 50  │ Box  │ $25.00 │ -$2.50   │ $1,247.50│
│ Lettuce (Fresh) │ 30  │ Crate│ $8.00  │ -       │  $240.00 │
│─────────────────┼─────┼──────┼────────┼──────────┼──────────│
│                                  Subtotal:       $1,487.50   │
│                                  Tax (8%):         $119.00   │
│                            <Discount -$10>       ($10.00)   │
│                                  TOTAL:          $1,596.50   │
│                                                               │
│ PAYMENTS RECEIVED                                            │
│ ─────────────────────────────────────────────────────────── │
│ Date       | Method | Amount   | Reference                  │
│────────────┼────────┼──────────┼──────────────────────────  │
│ 2026-02-15 | CASH   | $1,596.50| Receipt #445               │
│                            Balance Due: $0.00 ✓             │
│                                                               │
│ ACTIONS                                                      │
│ [Add Payment] [Generate PDF] [Email to Customer] [Close]    │
└──────────────────────────────────────────────────────────────┘

SPEC:
- Edit mode (for DRAFT invoices): allow line item edit, delete orphaned items
- Read-only mode (ISSUED/PAID): show audit trail link
- Quick actions: [Record Payment] fixed button at bottom
- Keyboard: ESC closes, Ctrl+P prints, Ctrl+S exports PDF
- Responsive: collapse to single column on small screens
*/

/**
PAYMENT MODAL (pop-over)
───────────────────────────────────────
┌──────────────────────────────────────┐
│ Record Payment                    [X] │
├──────────────────────────────────────┤
│                                      │
│ Invoice Total: $1,596.50             │
│ Already Paid: $0.00                  │
│ Balance Due: $1,596.50               │
│                                      │
│ Amount Paid *          [⏺ $1,596.50] │
│                  (auto-filled, editable for partial) │
│                                      │
│ Payment Method *       [CASH ▼]      │
│   Options: Cash, Check, Transfer,    │
│   Credit Card, Bank Transfer         │
│                                      │
│ Paid Date *            [2026-02-15]  │
│                                      │
│ Reference/Notes        [Receipt #...] │
│                                      │
│ [Cancel]                      [Save] │
└──────────────────────────────────────┘

SPEC:
- Amount field: validator (≤ balance due for full payment), tooltip on focus
- Date picker: inline calendar or native date input
- On save: show success toast, reload invoice detail
- Accessibility: Tab order, ARIA labels, screen reader support
*/

// ============================================================================
// 2. CUSTOMER MANAGEMENT UI
// ============================================================================

/**
CUSTOMER LIST WITH MERGE ACTION
────────────────────────────────────────────────
┌─────────────────────────────────────────────┐
│ 👥 Customers                  [+ New]       │
├─────────────────────────────────────────────┤
│ [Search...] [Status ▼] [Type ▼] [Reset]    │
├─────────────────────────────────────────────┤
│ Name  │ Phone   │ Type      │ S. │ Actions │
│───────┼─────────┼───────────┼───┼─────────│
│ ABC   │ 555-1234 │ Permanent │ ✓ │ [Edit]  │
│ Market │         │           │   │ [Sales] │
│       │         │           │   │ [Merge] │
│───────┼─────────┼───────────┼───┼─────────│
│ XYZ   │ 555-5678 │ Temporary │ ⚠ │ [Edit]  │
│ Traders│        │           │   │ [Sales] │
│       │         │           │   │ [Merge] │
│───────┼─────────┼───────────┼───┼─────────│
└─────────────────────────────────────────────┘

MERGE BUTTON:
- Yellow/amber text link: "Merge"
- Tooltip: "Consolidate this customer with another"
- Icon: GitMerge or Users from lucide-react
- Action: Opens MergeModal
*/

/**
MERGE MODAL (pop-over)
──────────────────────────────────────
┌──────────────────────────────────────┐
│ Merge Customer                   [X] │
├──────────────────────────────────────┤
│                                      │
│ ⚠ Source Customer (to merge):       │
│   ▢ XYZ Traders (Temporary)          │
│   📊 5 sales | 2 invoices            │
│                                      │
│ Target Customer *                    │
│   [Select target...▼]                │
│   - ABC Market                       │
│   - Local Shop                       │
│   - [+ Create New]                   │
│                                      │
│ Preview: 5 sales + 2 invoices will  │
│ be moved from "XYZ Traders" to      │
│ target customer                     │
│                                      │
│ [Cancel]              [Merge] (disabled until target selected) │
└──────────────────────────────────────┘

SPEC:
- Source customer: highlighted in amber/warning color; shows count of affected records
- Target dropdown: filter to active customers + "Create New" option
- Confirmation text changes color on valid selection (red → green)
- On merge: close modal, show toast, refresh list + show source as merged (gray, "Merged" badge)
- Audit trail: ability to click source customer → view merge history
*/

// ============================================================================
// 3. FAST SALE ENTRY UI (NEW)
// ============================================================================

/**
QUICK SALE ENTRY PANEL
─────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────┐
│ ⚡ Quick Sale Entry                                        │
├──────────────────────────────────────────────────────────┤
│ Product *      [🔍 Tomatoes...         ▼]               │
│ Unit *         [Box                    ▼]               │
│ Quantity *     [50           ]                           │
│ Unit Price *   [$25.00       ]  (auto-filled from product) │
│                                                           │
│                         = TOTAL: $1,250.00              │
│                                                           │
│ Customer       [Optional / ▼ select or create temp]     │
│ Discount       [None ▼]                                 │
│                                                           │
│ [Add]    [Add & Invoice]    [Save & New]                │
│                                                           │
│ RECENT SALES (today/this session)                       │
│ ─────────────────────────────────────────────────────── │
│ Tomato        │ 50 Boxes  │ $1,250.00 │ [Remove]       │
│ Lettuce       │ 30 Crates │  $240.00  │ [Remove]       │
│ ─────────────────────────────────────────────────────── │
│                    Subtotal: $1,490.00                  │
│ [Clear All]              [Open in Invoice Editor] [✓Complete] │
└──────────────────────────────────────────────────────────┘

SPEC:
- Layout: horizontal/compact for touchscreen
- Product field: autocomplete dropdown, recently used at top
- Quantity: large input, mobile-friendly (numeric keyboard)
- Unit Price: auto-filled from product.basePrice, editable with confirmation
- Real-time total: large, prominent, green highlight
- Keyboard: Enter on quantity → focus next field; Alt+A = Add button
- Recent sales: shows all entries in current session; ability to undo
- Customer optional: if not selected, creates temporary entry
- on "Add & Invoice": auto-attach to draft invoice or create new
- Mobile: full-width single column, large touchable buttons

ACCESSIBILITY:
- Font: ≥16px on mobile
- Contrast: ≥ 4.5:1 WCAG AA
- ARIA labels: "Product autocomplete", "Quantity input (number)", etc.
- Screen reader: reads totals after entry
*/

// ============================================================================
// 4. REPORTS & ANALYTICS UI (REFINEMENT)
// ============================================================================

/**
REPORTS DASHBOARD
──────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────┐
│ 📊 Reports                           [Refresh]        │
├──────────────────────────────────────────────────────┤
│ Period: [Last 7 Days ▼] [📅 Start] to [📅 End]      │
│                                                      │
│ ┌──────────┬──────────┬──────────┬──────────┐       │
│ │ Today    │ This Week│This Month│ YTD      │       │
│ ├──────────┼──────────┼──────────┼──────────┤       │
│ │ Total $  │ 23 Sales │ 45 Trucks│ $23.5K  │       │
│ │ $5,234   │ $12,450  │Revenue   │Revenue  │       │
│ ├──────────┴──────────┴──────────┴──────────┤       │
│ │ MODE: [By Truck ▼] [By Product] [By Cust] │       │
│ │        [Period: Daily ▼] [Weekly] [Monthly] │       │
│ └─────────────────────────────────────────────┘       │
│                                                      │
│ REVENUE BY TRUCK (Last 7 Days)                      │
│                                                      │
│  $3000 ┤                                             │
│  $2500 ┤        ┌─┐                                  │
│  $2000 ┤        │ │ ┌─┐                              │
│  $1500 ┤  ┌─┐   │ │ │ │ ┌─┐                          │
│  $1000 ┤  │ │ ┌─┤ │ │ │ │ │  ┌─┐                   │
│   $500 ┤  │ │ │ │ │ │ │ │ │  │ │                   │
│      0 ┤──┴─┴─┴─┴─┴─┴─┴─┴─┴──┴─┴────────────────   │
│        Sun   Mon  Tue  Wed  Thu  Fri  Sat           │
│                                                      │
│ TOP 10 TRUCKS BY REVENUE                            │
│ Truck  │ Revenue  │ Click to Drill Down             │
│────────┼──────────┼────────────────────             │
│ TIR-01 │ $2,340   │ [View Details ▼]               │
│────────┼──────────┼────────────────────             │
│ TIR-03 │ $2,100   │ [View Details ▼]               │
│        ...                                          │
│                                                      │
│ [Export CSV]  [Export PDF]  [Print]                │
└──────────────────────────────────────────────────────┘

TRUCK DRILLDOWN MODAL
───────────────────────────────────────────────────────
┌────────────────────────────────────────────────────┐
│ TIR-01 (Dated: 2026-02-08 to 2026-02-14) [X]     │
├────────────────────────────────────────────────────┤
│ Total Revenue: $2,340                              │
│ Total Sales: 45                                    │
│ Avg per Sale: $52.00                               │
│                                                   │
│ TOP PRODUCTS (by volume)                          │
│ Product    │ Quantity │ Revenue  │ Avg Sale     │
│────────────┼──────────┼──────────┼──────────    │
│ Tomatoes   │ 200 Box  │ $1,250   │ $25/Box      │
│ Lettuce    │ 120 Crate│  $960    │ $8/Crate    │
│ ...                                              │
│                                                   │
│ TOP CUSTOMERS (by revenue)                       │
│ Customer   │ # Sales  │ Revenue                 │
│────────────┼──────────┼─────────────────        │
│ ABC Market │ 15       │ $850                    │
│ XYZ Shop   │ 10       │ $650                    │
│                                                   │
│ [Export CSV]                            [Close] │
└────────────────────────────────────────────────────┘

SPEC:
- KPI cards: top with key metrics (large, bold)
- Chart: interactive bar/line chart, hover shows exact values
- Period selector: quick links (Today, Week, Month, YTD) + custom date range
- Mode tabs: switch between Truck, Product, Customer views; state preserved
- Drill-down: click chart bar or table row → detailed modal
- Export: CSV (tab-separated, Excel-compatible) + PDF (multi-page, styled)
- Mobile: collapse chart beneath KPIs, full-width tabs
- Dark mode ready: use CSS variables for chart colors
*/

// ============================================================================
// 5. STYLING & COLOR PALETTE
// ============================================================================

/**
DESIGN SYSTEM
─────────────

COLORS:
- Primary (actions): #2563eb (blue)
- Success (paid, active): #16a34a (green)
- Warning (pending, temp): #ca8a04 (amber/yellow)
- Danger (cancelled, error): #dc2626 (red)
- Neutral (background, text): #1f2937 (dark gray), #f3f4f6 (light gray)
- Info (hints, secondary): #06b6d4 (cyan)

TYPOGRAPHY:
- Headings: Inter, bold, 1.875rem (h1), 1.5rem (h2), 1.25rem (h3)
- Body: Inter, regular, 1rem (16px)
- Captions: Inter, 0.875rem (14px), gray-600
- Monospace (numbers): Roboto Mono, 1rem

SPACING:
- Grid: 0.5rem (4px) baseline
- Padding: 1rem (16px) cards/modals
- Margins: 1.5rem (24px) sections
- Gap (flex): 0.5rem (components), 1rem (sections)

BUTTONS:
- Primary: blue background, white text, rounded-md, 10px padding, hover: blue-700
- Secondary: gray background, gray-800 text, hover: gray-100
- Danger: red background, white text, hover: red-700
- Size: Normal (12px), Small (10px, dense)

FORMS:
- Input height: 40px
- Border: 1px solid #d1d5db (gray-300)
- Radius: rounded-md
- Focus: outline-blue-500 (2px blue border)
- Labels: block, bold, 0.875rem, margin-bottom 0.5rem

CARDS/MODALS:
- Background: white (light) or #1f2937 (dark mode)
- Border: 1px solid #e5e7eb (light) or #374151 (dark)
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Padding: 1.5rem
- Rounded-lg: 8px

RESPONSIVE:
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile-first: design for mobile, enhance for desktop
- Tables: stack on mobile (<768px), show horizontally on desktop
- Modals: full-screen on mobile, centered wide on desktop

DARK MODE:
- Toggle in header
- CSS variables or Tailwind dark: prefix
- Preserve brand colors, adjust backgrounds/text for contrast
*/

export const uiUxDocumentation = 'See detailed specs and layouts above';

