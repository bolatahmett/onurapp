/**
 * PROJECT FOLDER STRUCTURE (REVISED)
 * ==================================
 * Organized by feature domain with clean separation of concerns
 * Maintains modular architecture for future web/mobile migration
 */

/**
src/
├── main/                          [Electron main process + backend logic]
│   ├── index.ts                   [App entry, window init, IPC registration]
│   ├── domain/                    [Pure domain logic & contracts]
│   │   ├── entities.ts            [Core entity types imported from @shared]
│   │   ├── repositories.ts        [Repository interfaces (abstract)]
│   │   ├── services/              [Domain services (high-level orchestration)]
│   │   │   ├── invoice.ts         [Invoice creation, payments, status updates]
│   │   │   ├── payment.ts         [Payment recording & reconciliation]
│   │   │   ├── customer.ts        [Customer CRUD, merge logic]
│   │   │   ├── sale.ts            [Sale lifecycle]
│   │   │   ├── report.ts          [Aggregation & reporting]
│   │   │   ├── stock.ts           [Stock management & alerts (optional)]
│   │   │   ├── audit.ts           [Audit logging]
│   │   │   ├── backup.ts          [DB backup/restore]
│   │   │   └── ai.ts              [AI/ML: price suggestions, insights]
│   │   └── value-objects/         [Pure value types, validators]
│   │       ├── invoice-number.ts
│   │       ├── currency.ts
│   │       └── stock-level.ts
│   ├── repositories/              [SQLite-specific implementations]
│   │   ├── base.repository.ts     [Abstract base with query helpers]
│   │   ├── invoice.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── customer.repository.ts
│   │   ├── customer-merge.repository.ts
│   │   ├── sale.repository.ts
│   │   ├── product.repository.ts
│   │   ├── stock.repository.ts
│   │   ├── audit-log.repository.ts
│   │   ├── invoice-sequence.repository.ts
│   │   └── index.ts               [Export all repositories]
│   ├── database/                  [SQLite setup & migrations]
│   │   ├── connection.ts          [DB connection, save/load]
│   │   ├── seed.ts                [Initial data (products, customers)]
│   │   └── migrations/
│   │       ├── 001_initial.ts
│   │       ├── 002_extended_invoicing.ts
│   │       ├── 003_audit_and_sequences.ts
│   │       ├── 004_enhanced_entities.ts
│   │       ├── 005_stock_management.ts   [Optional, future]
│   │       └── index.ts           [Migration runner]
│   ├── ipc/                       [IPC channel handlers (typed)]
│   │   ├── invoice.ipc.ts
│   │   ├── payment.ipc.ts
│   │   ├── customer.ipc.ts
│   │   ├── sale.ipc.ts
│   │   ├── report.ipc.ts
│   │   ├── backup.ipc.ts
│   │   ├── ai.ipc.ts              [AI/suggestions endpoint]
│   │   └── index.ts               [Register all handlers]
│   ├── services/                  [Application services (high-level)]
│   │   ├── invoice.service.ts     [Facade: orchestrates invoice flow]
│   │   ├── payment.service.ts
│   │   ├── customer.service.ts
│   │   ├── report.service.ts
│   │   ├── pdf-export.service.ts
│   │   ├── ai-insights.service.ts
│   │   └── backup.service.ts
│   └── utils/                     [Helpers, validators, formatters]
│       ├── logger.ts
│       ├── validators.ts
│       ├── formatters.ts
│       └── uuid.ts
├── preload/                       [Context bridge for IPC]
│   └── index.ts                   [Expose api.*  to renderer]
├── renderer/                      [React UI (Vite)]
│   ├── main.tsx                   [React entry]
│   ├── App.tsx                    [Root component]
│   ├── pages/                     [Page components (one per major feature)]
│   │   ├── Dashboard.tsx
│   │   ├── Sales.tsx
│   │   ├── Invoices.tsx           [Invoice list & create]
│   │   ├── Customers.tsx          [Customer list & merge]
│   │   ├── Products.tsx
│   │   ├── Trucks.tsx
│   │   ├── Reports.tsx            [Analytics & reports]
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── components/                [Reusable UI components]
│   │   ├── common/
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Card.tsx
│   │   ├── invoices/              [Invoice-specific components]
│   │   │   ├── InvoiceAdjustForm.tsx  [Edit draft invoice]
│   │   │   ├── PaymentModal.tsx       [Record payment]
│   │   │   ├── InvoicePreview.tsx     [PDF preview]
│   │   │   └── InvoiceLineItems.tsx
│   │   ├── customers/             [Customer-specific components]
│   │   │   ├── MergeModal.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerHistory.tsx
│   │   ├── sales/                 [Sales flow components]
│   │   │   ├── QuickSaleEntry.tsx     [Fast entry UI]
│   │   │   ├── SaleForm.tsx
│   │   │   └── SaleLineItems.tsx
│   │   ├── reports/               [Report components]
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── TruckDrilldown.tsx
│   │   │   ├── ProductReport.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── Footer.tsx
│   │   └── charts/                [Chart components (D3/Recharts)]
│   │       ├── BarChart.tsx
│   │       ├── LineChart.tsx
│   │       └── PieChart.tsx
│   ├── hooks/                     [Custom React hooks]
│   │   ├── useIpc.ts              [IPC call wrapper with loading/error]
│   │   ├── useNotifications.ts    [Toast/alert system]
│   │   ├── useForm.ts             [Form state management]
│   │   ├── usePagination.ts
│   │   └── useSort.ts
│   ├── store/                     [Global state (Zustand)]
│   │   ├── appStore.ts            [App-level state: locale, theme, user]
│   │   ├── dataStore.ts           [Cached data: customers, products, invoices]
│   │   └── uiStore.ts             [UI state: open modals, filters]
│   ├── utils/                     [Client-side utilities]
│   │   ├── formatters.ts          [Format dates, currency, numbers]
│   │   ├── validators.ts          [Form validation]
│   │   ├── api-client.ts          [IPC dispatcher]
│   │   └── constants.ts
│   ├── i18n/                      [Internationalization]
│   │   ├── index.ts               [i18next config]
│   │   ├── en.json
│   │   └── tr.json
│   ├── styles/                    [Global + component CSS]
│   │   ├── globals.css            [Tailwind + custom CSS vars]
│   │   ├── layout.css
│   │   ├── colors.css             [Color palette]
│   │   └── responsive.css         [Mobile-first breakpoints]
│   ├── index.html                 [HTML template]
│   └── env.d.ts                   [TypeScript env types]
├── shared/                        [Shared types & constants]
│   ├── types/
│   │   ├── entities.ts            [All DTO/entity interfaces]
│   │   ├── enums.ts               [Enum definitions]
│   │   └── ipc.ts                 [IPC method signatures]
│   └── constants.ts               [App-wide constants]
├── tests/                         [Jest + React Testing Library]
│   ├── unit/
│   │   ├── services/
│   │   │   ├── invoice.service.test.ts
│   │   │   ├── payment.service.test.ts
│   │   │   └── customer.service.test.ts
│   │   └── utils/
│   │       └── validators.test.ts
│   ├── integration/
│   │   ├── invoice-flow.test.ts     [E2E: create sale → invoice → payment]
│   │   ├── merge-customer.test.ts
│   │   └── migrations.test.ts
│   └── e2e/                       [Cypress or Playwright]
│       ├── smoke.spec.ts
│       └── invoice.spec.ts
├── docs/                          [Documentation]
│   ├── ARCHITECTURE.md            [High-level design decisions]
│   ├── API.md                     [IPC API reference]
│   ├── USER_FLOWS.ts              [Detailed user interaction flows]
│   ├── UI_UX_DESIGN.ts            [Component specs, layouts]
│   ├── MIGRATIONS.md              [DB migration guide]
│   └── BACKUP_RESTORE.md          [Backup/restore procedures]
└── scripts/                       [Utility scripts]
    ├── seed-db.ts                 [Populate test data]
    ├── export-schema.ts           [Generate DB schema docs]
    └── migrate.ts                 [Run specific migration]

ROOT FILES:
├── tsconfig.json                  [Base TS config]
├── tsconfig.main.json             [Main process TS config]
├── tsconfig.renderer.json         [Renderer TS config]
├── vite.config.ts                 [Vite bundler config]
├── tailwind.config.js             [Tailwind CSS config]
├── postcss.config.js              [PostCSS config]
├── package.json                   [Dependencies, scripts]
├── package-lock.json
├── .env                           [App settings: API keys, URLs]
├── .env.example                   [Template for .env]
├── .gitignore                     [Git ignore rules]
├── README.md                      [Project overview & setup]
└── LICENSE                        [MIT or company license]

KEY PRINCIPLES:
1. Domain-driven: Services in `domain/services/` are pure, dependency-injected
2. Repository pattern: All DB access via repository interfaces
3. IPC isolation: Renderer never touches main directly; all via IPC handlers
4. Testability: Services & repositories are unit-testable; mock-friendly
5. i18n-ready: All UI strings in i18n files; formatters handle localization
6. Error handling: Consistent error boundaries, logging, user feedback
7. Offline-first: All logic works offline; sync is optional future feature
8. Clean architecture: UI ↔ IPC ↔ Services ↔ Repositories ↔ Database
*/

export const folderStructureDocumentation = 'See detailed structure above';

