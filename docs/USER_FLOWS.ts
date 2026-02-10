/**
 * USER FLOWS & INTERACTION SEQUENCES
 * ===================================
 * Detailed step-by-step flows for core feature workflows
 */

// FLOW 1: Fast Sale → Invoice Creation (one-step)
// ===============================================
/*
PRECONDITION:
- User/staff at busy market terminal
- Need to record sale(s) and immediately invoice

STEPS:
1. [UI] Quick Sale Entry Panel opens
   - Product dropdown (searchable)
   - Unit type selector (PALLET, CRATE)
   - Quantity input (keyboard focus)
   - Unit Price field (auto-populated from product.basePrice)
   - Customer selector (optional, can leave as temp)
   - UI shows: real-time total = qty * unitPrice
   - Discount option (if needed)

2. [User Action] Fill fields, press "Add & Invoice"

3. [SERVICE] invoice.service.createInvoiceFromSales() called with:
   {
     customerId: (selected or generate temp),
     saleIds: [id1, id2, ...],
     dueDate: (optional)
   }

4. [TRANSACTION]:
   a. Create Sale record(s)
   b. Create Invoice (status=DRAFT)
   c. For each sale: create InvoiceLineItem mapping sale→line
   d. Update sales: sales.invoiceId = newInvoice.id
   e. Increment invoice_number_sequences
   f. Log AuditLog entries
   g. Commit TX

5. [RESPONSE] Invoice created; show confirmation with:
   - Invoice number
   - Total amount
   - Actions: [Print Preview] [Email] [Edit] [Mark Paid]

6. [OPTIONAL] User can:
   - "Add more sales to this invoice" → repeat step 1-2
   - "Close & Print" → generate PDF, send to printer
   - "Save & New Invoice" → start fresh
*/

// FLOW 2: Merge Temporary Customer
// ================================
/*
PRECONDITION:
- Admin accesses Customers page
- Multiple sales/invoices exist for temporary customer
- Goal: consolidate data to permanent customer record

STEPS:
1. [UI] Customer list shows all customers with "Merge" action
   - Click "Merge" on temporary customer

2. [UI] MergeModal opens with:
   - Source customer name (read-only, highlighted in amber)
   - Dropdown: "Select target customer" (list of active customers only)
   - Confirmation text: "X sales and Y invoices will be linked to target"

3. [User Action] Select target customer, click "Merge"

4. [SERVICE] customer.service.mergeCustomers() called with:
   {
     sourceCustomerId,
     targetCustomerId,
     mergedByUserId: (optional current user),
   }

5. [TRANSACTION]:
   a. Verify source ≠ target
   b. Lock both customer records
   c. Fetch all sales where customerId = source
   d. Fetch all invoices where customerId = source
   e. Update sales: customerId = target
   f. Update invoices: customerId = target
   g. Create CustomerMerge record
   h. Set source.isActive = false
   i. Log AuditLog: MERGE action with oldVal={source}, newVal={target}
   j. Commit TX

6. [RESPONSE] Modal closes, customer list refreshes:
   - Source customer now marked as merged (inactive, yellow badge)
   - Click source to view audit trail showing merge
   - All its sales/invoices now show under target

7. [AUDIT] next.getAuditLog('customers', sourceId) shows MERGE entry
*/

// FLOW 3: Record Payment on Invoice
// ================================
/*
PRECONDITION:
- User on Invoice Detail page
- Invoice status = "ISSUED" or "PAID" (allowed to record partial payment)
- User received payment (cash, check, transfer)

STEPS:
1. [UI] Invoice Detail shows:
   - Total amount, due date, current balance due (compute: total - sum(payments))
   - Status badge: "ISSUED"
   - Buttons: [Record Payment] [Export PDF] [Close]

2. [User Action] Click "Record Payment"

3. [UI] PaymentModal opens with:
   - Amount input (defaults to balance due, user can edit for partial)
   - Payment method dropdown: CASH, CHECK, TRANSFER, CREDIT_CARD
   - Paid date picker (defaults to today)
   - Notes field (free text: reference, check number, etc.)
   - Buttons: [Cancel] [Save]

4. [User Action] Fill in details, click "Save"

5. [SERVICE] invoice.service.recordPayment() called with:
   {
     invoiceId,
     amount,
     method,
     paidDate,
     notes,
     paidByUserId: (optional)
   }

6. [TRANSACTION]:
   a. Insert Payment record
   b. Query: balanceDue = invoice.totalAmount - sum(payments WHERE invoiceId)
   c. If balanceDue <= 0:
      - Update invoice.status = PAID
      - Set invoice.paymentReceivedDate = today
      - Mark all linked sales: INVOICED = true (idempotent)
   d. Else:
      - Partial payment recorded; invoice stays ISSUED
   e. Log AuditLog: UPDATE invoice
   f. Commit TX

7. [RESPONSE] PaymentModal closes; invoice detail reloads showing:
   - New payment in "Payments" section (table with date, method, amount)
   - Updated balance due or "PAID" badge if fully paid
   - Confirmation toast: "Payment recorded ✓"

8. [FURTHER ACTION] If fully paid:
   - Show [Print Receipt] [Email Confirmation] buttons
*/

// FLOW 4: Generate & Export PDF Invoice
// ====================================
/*
PRECONDITION:
- User on Invoice Detail page
- Invoice has line items and is in ISSUED or paid state

STEPS:
1. [UI] Invoice Detail shows [Export PDF] button

2. [User Action] Click "Export PDF"

3. [SERVICE] pdf-export.service.generateInvoicePdf(invoiceId) called:
   - Fetch invoice with line items
   - Fetch customer snapshot
   - Fetch all payments
   - Fetch company metadata (settings)

4. [PDF LAYOUT]:
   - Header: Company logo/name, "INVOICE" title, invoice number, date
   - Customer details: Name, address, tax ID
   - Line items table:
     | Product | Qty | Unit | Unit Price | Discount | Line Total |
   - Subtotal, tax (if any), discounts, total
   - Payment terms, notes
   - Divider
   - Payments table (if any): Date, Method, Amount
   - Outstanding balance (if partial)
   - Footer: Terms, contact info, QR code (optional: link to online receipt)

5. [OUTPUT]:
   - File saved to: ~/Desktop/Invoice_[NUMBER]_[DATE].pdf
   - or displayed in preview modal before download

6. [RESPONSE]:
   - Success toast: "Invoice exported ✓"
   - Browser/system file dialog to save/open
*/

// FLOW 5: Daily/Weekly/Monthly Reports
// ===================================
/*
PRECONDITION:
- User on Reports page
- Need insight into sales, revenue trends, per-truck/product/customer breakdowns

STEPS:
1. [UI] Reports Dashboard:
   - Top: KPI cards (Today: total sales $, count)
   - Date range filters: Start date, End date
   - Period selector: Daily, Weekly, Monthly
   - Breakdown selector: By Truck, By Product, By Customer (tabs/buttons)
   - Action buttons: [Refresh] [Export CSV] [Export PDF]

2. [User Action] Set date range (e.g., last 30 days), select "By Truck"

3. [SERVICE] report.service.getTruckSummary({ startDate, endDate }) called:
   - Query sales + invoices grouped by truck
   - Aggregate: total sales count, total revenue, avg price/sale
   - Return: [{ truckId, plateNumber, totalSales, totalRevenue, saleCount }, ...]

4. [UI RENDER]:
   - Bar chart: X=truck, Y=revenue (color by status/status)
   - Table below: Truck, Total Sales, Revenue, Sale Count, Actions
   - Drill-down action: Click truck row → open TruckDrilldown modal showing:
     * Per-product breakdown for that truck
     * Sales timeline (sparkline)
     * Top customers (by volume/value)

5. [User Action] Click truck row → TruckDrilldown modal opens with detailed breakdown

6. [User Action] Click "Export CSV" or "Export PDF"

7. [SERVICE] report.service.exportReport(format, data)
   - If CSV: generate tab-separated table, download as .csv
   - If PDF: render multi-page report with charts, export

8. [RESPONSE] File downloaded; confirmation toast
*/

// FLOW 6: Stock Alert (Background/Triggered)
// ==========================================
/*
PRECONDITION:
- Product has stockLevel and threshold set in DB
- System runs daily or on sale trigger
- Goal: notify if stock falls below threshold

STEPS:
1. [TRIGGER] On sale creation or admin adjustment:
   - Update products.stockLevel (optional field)
   - Check: if stockLevel < threshold, queue alert

2. [SERVICE] stock.service.checkThresholds() runs:
   - Query: products WHERE stockLevel < threshold AND isActive
   - For each match: create/append to dashboard alerts

3. [UI] Dashboard shows "⚠️ Stock Alert" card:
   - List of products below threshold
   - Click to view detailed stock history (transactions)
   - Action: [Quick Restock] (opens form to log adjustment)

4. [FUTURE] If cloud-sync enabled:
   - Send SMS/Email to admin (optional)
*/

// FLOW 7: AI-Assisted Price Suggestion
// ===================================
/*
PRECONDITION:
- Product has historical price data (sales records)
- User editing product or entering quick sale
- Goal: surface price recommendation (non-blocking)

STEPS:
1. [SERVICE] AI check triggered on:
   - Product edit page load
   - Quick sale quick-entry product selection

2. [AI SERVICE] ai.service.suggestPrice(productId, period='last30days') called:
   - Query: sales WHERE productId, last 30 days
   - Compute: avg, min, max, trend (rising/falling)
   - Return: { suggestedPrice, trend, rationale, confidence }

3. [UI] Display suggestion as subtle hint:
   - Next to price field: "⚡ Avg recent price: $X" (in lighter color)
   - Or as inline suggestion: "Price trending up (+5% vs month ago)"
   - Non-blocking; user can override

4. [TRACKING] Log price change in audit if user modifies product.basePrice
*/

export const userFlowsDocumentation = 'See steps above';

