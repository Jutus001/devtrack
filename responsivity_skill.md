FixPro24 — /responsive Skill

IRONCLAD RULES — never break these

Desktop layout (1025px+) is NEVER touched — zero changes above this breakpoint
Zero logic removed — every function, watcher, computed, emit, prop stays identical
Zero features removed — every button, input, list, form field, section stays
Zero template reordering — components stay in the exact same order in the DOM
Only add: CSS breakpoints, mobile state variables, bottom nav bar, overlay, slide panels
Same language in = same language out. Vue stays Vue. CSS stays CSS.
Full file always — never partial, never diffs, never placeholders
If the layout structure or purpose of any section is unclear, ask before writing


FIXPRO24 CLASS NAMING CONVENTIONS
FixPro24 uses a consistent prefix system. Before writing any CSS, scan the file and identify the page prefix. NEVER use generic class names like .left-panel, .cart-panel, .scroll-area. Always read the file and use the EXACT class names.
PageRoot prefixLayoutLeft/Center panelRight panelTopbarScroll areaPOSpos-pos-layoutpos-mainpos-sidebarpos-topbarpos-rows-scrollJobsjobs-jobs-layoutjobs-sidebarjobs-detailjobs-topbarjobs-list-scrollClientsclients-clients-layoutclients-listclients-detailclients-topbarclients-scrollVehiclesveh-veh-layoutveh-listveh-detailveh-topbarveh-scrollDashboarddash-dash-layoutdash-sidebar—dash-topbardash-scroll

FIXPRO24 DARK MODE PATTERN
Dark mode is set via document.documentElement.classList.toggle('dark', isDarkMode.value) — adds dark to <html>. All dark variants in CSS must use:
css.dark .pos-topbar { ... }   /* CORRECT */
.pos-topbar.dark { ... }    /* WRONG — never do this */
Every new responsive CSS rule that introduces a background, border, color, or shadow must have a .dark variant.

FIXPRO24 ROOT STRUCTURE PATTERN
Every FixPro24 page follows this DOM shape:
.{page}-root          <- flex column, height: 100vh, overflow: hidden
  .{page}-topbar      <- flex row, height: 52px (POS) or 56px (other), flex-shrink: 0
  .{page}-layout      <- display: grid, grid-template-columns, flex: 1, min-height: 0, overflow: hidden
    .{page}-main      <- left/center content
    .{page}-sidebar   <- right panel
The root's overflow: hidden is intentional — only internal scroll areas scroll. Never remove it. On mobile, the main scroll area gets padding-bottom to clear the nav bar.

FIXPRO24 TOPBAR HEIGHTS — use these, never guess

POS page: 52px — .pos-topbar { height: 52px }
All other pages: read from the file's CSS. Default to 56px if not found.
In every mobile calc(), use the actual topbar height — never use 49px (that is a placeholder from old docs).


FIXPRO24 INFO ROW PATTERN
The POS info row structure — NOT the generic .info-item pattern:
html<button class="pos-info-btn" @click="...">
  <i class="ph ph-user"></i>
  <div class="pos-info-col">
    <span class="pos-info-label">Client</span>       <!-- hide at <=480px -->
    <span class="pos-info-value">Walk-in</span>      <!-- always visible -->
  </div>
  <div class="pos-info-ref">                         <!-- hide at <=480px -->
    <span class="pos-info-ref-name">...</span>
    <span class="pos-info-ref-phone">...</span>
  </div>
</button>
Mobile rules:

.pos-info-label -> display: none at <=480px
.pos-info-ref -> display: none at <=480px
.pos-info-row -> overflow-x: auto; -webkit-overflow-scrolling: touch at <=767px
.pos-info-btn -> min-width: 100px at <=767px, min-width: 80px at <=480px, min-width: 68px at <=380px


FIXPRO24 TOPBAR ELEMENT ROLES (POS-specific)
ElementClassMobile ruleBack button text.pos-topbar-back-labeldisplay: none at <=767pxDivider.pos-topbar-dividerdisplay: none at <=767px"Sale Type:" label.pos-topbar-sale-type-labeldisplay: none at <=767pxPricing mode badge.pos-navbar-modekeep, reduce padding at <=767pxSettings icon.pos-topbar-settingskeep (already icon-only)Clear icon.pos-topbar-clearkeep (already icon-only)Continue button text.pos-topbar-continue spandisplay: none at <=380px (icon only)
For other pages: read the file, map each element to ALWAYS VISIBLE / COLLAPSE TO ICON / HIDE COMPLETELY.

FIXPRO24 POS COLUMN HANDLING
POS columns: pcol-num, pcol-name, pcol-type, pcol-price, pcol-qty, pcol-del
ColumnRule.pcol-typedisplay: none at <=767px (existing CSS at <=768px — preserve, don't duplicate).pcol-pricewidth: 68px at <=767px (existing CSS — preserve).pcol-numdisplay: none at <=480px.pos-col-headershide entirely at <=480px if all visible columns are gone

FIXPRO24 ADD-ROW BAR (.pos-add-row)
Height 42px; flex-shrink: 0. Mobile rules:
BreakpointRule<=767px.pos-add-input { font-size: 16px !important } — prevents iOS zoom<=480px.pos-add-row-icon { width: 36px }, .pos-type-btn { width: 54px }<=380px.pos-add-row-icon { width: 32px }, .pos-type-btn { width: 48px; font-size: 9px }

FIXPRO24 MECHANIC DROPDOWN (.sd-mechanic-dropdown)
Already z-index: 200 — sits above all slide panels. On mobile, set overflow: visible on .sd-field--relative so the dropdown is not clipped by the sidebar's overflow-y: auto:
css.sd-field--relative { overflow: visible; }

FIXPRO24 MODAL POINTER-EVENTS LOCK
.pos-root.modal-active already disables pointer-events on non-modal children. Do NOT add another pointer-events: none to the nav in modal-active state — use the .hide-on-modal + translateY(100%) approach on the nav bar instead.

FIXPRO24 SCROLL AREAS
AreaClassMobile ruleCart/invoice rows.pos-rows-scrollpadding-bottom: 80px !important inside <=1024px breakpoints onlyRight sidebar.pos-sidebaroverflow-y: auto; -webkit-overflow-scrolling: touch when fixedSale details.sidebar-detailspadding-bottom: 24px on mobile

FIXPRO24 SALE DETAILS FIELDS
.sd-datetime-row is grid-template-columns: 1fr 1fr. Force single column at <=480px:
css.sd-datetime-row { grid-template-columns: 1fr !important; }

PHASE 0 — DEEP ANALYSIS
Run this full analysis mentally before writing a single line of code.
A. Layout — identify column count

1 column -> main content scrollable on mobile, no panels needed
2 columns -> secondary column becomes a slide-in panel
3 columns -> left slides from left, center stays main, right slides from right
3+ columns -> group into labeled tabs

POS specifically:

pos-layout = 2-column grid: 1fr 320px
pos-main = center invoice content -> stays as main on mobile (NOT a slide panel)
pos-sidebar = right panel -> slides from right on mobile

B. Topbar — classify every element

ALWAYS VISIBLE: page title, primary CTA, back button (icon-only ok), pricing mode badge
COLLAPSE TO ICON: back button text (hide label span), continue button text at <=380px
HIDE COMPLETELY: dividers, "Sale Type:" labels, keyboard shortcut hints
OVERFLOW/SCROLL: info row chips at <=767px

C. Main Content Area
POS main area is a flex column:

.pos-info-row — fixed height info buttons
.pos-add-row — fixed height 42px input bar
.pos-col-headers — fixed column labels
.pos-rows-scroll — flex: 1, scrollable, needs padding-bottom: 80px on mobile

For other pages with tables -> convert <tr> to stacked cards (hide thead, display td as flex rows with data-label pseudo-elements).
For forms -> grid-template-columns: 1fr !important at <=767px. All inputs font-size: 16px !important.
D. Scroll Areas
Every overflow-y: auto/scroll container on mobile needs:

padding-bottom: 80px !important (60px nav + 20px buffer)
Layout height: calc(100vh - [TOPBAR_HEIGHT]px - 60px) portrait
Layout height: calc(100vh - [TOPBAR_HEIGHT]px - 10vh) landscape

POS topbar = 52px -> portrait: calc(100vh - 112px), landscape: calc(100vh - 52px - 10vh)
E. Panels — slide rules
Left panel:

position: fixed; left: 0; transform: translateX(-100%)
Opens: .mobile-visible { transform: translateX(0) }
top: 0; bottom: 60px portrait / bottom: 10vh landscape
max-width: 290px phones / max-width: 320px tablets
z-index: 85

Right panel:

position: fixed; right: 0; transform: translateX(100%)
Opens: .mobile-visible { transform: translateX(0) }
top: 0; bottom: 60px portrait / bottom: 10vh landscape
width: 100% phones / width: 50%; min-width: 320px; max-width: 420px tablets
z-index: 90
Must retain overflow-y: auto — never set overflow: hidden on a slide panel

POS specifically:

No left panel. pos-sidebar = right panel only.
Bottom nav = 2 tabs (Invoice + Details)

F. Tab Names — use REAL content, never generic names
PageLeft tabCenter tabRight tabPOS—Invoice ph-receiptDetails ph-list-dashesJobsClients ph-usersJobs ph-clipboard-textDetails ph-file-textClients—Clients ph-usersProfile ph-user-circleVehicles—Vehicles ph-carInfo ph-info
Live count on tabs: Invoice ({{ cart.length }}), Filters ({{ activeFilters }}), etc.
2-tab pages use mobile-nav-grid--2col (see CSS below).
G. Modals — layering
When any modal opens on mobile:

closeAllPanels() first
Nav gets hide-on-modal -> slides down via translateY(100%)
Modal CSS: max-height: 85vh, max-width: 96%, border-radius: 14px
Footer buttons: flex: 1 (full width)

FixPro24 modal classes: .modal-content, .modal-header, .modal-body, .modal-footer, .btn-modal, .btn-close
H. Z-Index Stack — always maintain exactly this
Modals:                  z-index 1000+
sd-mechanic-dropdown:    z-index 200   <- already correct, preserve it
Bottom nav bar:          z-index 100   <- on top of everything except modals
Right slide panel:       z-index 90
Left slide panel:        z-index 85
Mobile overlay:          z-index 80
pos-topbar:              z-index 10    <- already set, preserve it

PHASE 1 — SCRIPT ADDITIONS (Vue files only)
Add after existing state variables. Read the file first — only add what is NOT already there.
js// ============================================================================
// MOBILE RESPONSIVE STATE
// ============================================================================
// For POS (2-panel): only right panel — rename isCartVisible to isDetailsVisible
// For 3-panel pages: keep both isSidebarVisible + isCartVisible
const isSidebarVisible = ref(false)  // left panel — skip if no left panel
const isCartVisible    = ref(false)  // right panel — rename to match content
const activeNavBtn     = ref('main') // 'left' | 'main' | 'right'

// Toggle left panel — ONLY add if page has a left panel
const toggleLeftPanel = () => {
  if (isSidebarVisible.value) {
    isSidebarVisible.value = false
    activeNavBtn.value = 'main'
  } else {
    isCartVisible.value = false
    isSidebarVisible.value = true
    activeNavBtn.value = 'left'
  }
}

// Toggle right panel
const toggleRightPanel = () => {
  if (isCartVisible.value) {
    isCartVisible.value = false
    activeNavBtn.value = 'main'
  } else {
    isSidebarVisible.value = false
    isCartVisible.value = true
    activeNavBtn.value = 'right'
  }
}

// Close all panels — return to main tab
const closeAllPanels = () => {
  isSidebarVisible.value = false
  isCartVisible.value = false
  activeNavBtn.value = 'main'
}

// Close panels when resizing back to desktop
const handleResponsiveResize = () => {
  if (window.innerWidth > 1024) closeAllPanels()
}
Inside EXISTING onMounted — do NOT create a new one:
jswindow.addEventListener('resize', handleResponsiveResize)
window.addEventListener('orientationchange', closeAllPanels)
Inside EXISTING onUnmounted — do NOT create a new one:
jswindow.removeEventListener('resize', handleResponsiveResize)
window.removeEventListener('orientationchange', closeAllPanels)
Patch every modal-open function
jsconst openSomeModal = () => {
  if (window.innerWidth <= 1024) closeAllPanels()  // <- add this line
  showSomeModal.value = true
}
POS specifically — patch:

openTotalsModal
completeInspection
Any inline showClientModal=true, showVehicleModal=true, showKilometersModal=true in template -> convert to wrapper methods with the guard

Patch add-to-panel functions (goToCartOnAdd)
jsconst handleRowEnter = () => {
  // ... existing logic unchanged ...
  if (window.innerWidth <= 1024 && goToCartOnAdd.value) {
    isCartVisible.value = true
    isSidebarVisible.value = false
    activeNavBtn.value = 'right'
  }
}

PHASE 2 — TEMPLATE ADDITIONS (Vue files only)
A. Right panel :class binding
html<div class="pos-sidebar" :class="{ 'mobile-visible': isCartVisible }">
Use the exact class from the file. For POS it is pos-sidebar.
B. Left panel :class binding — ONLY if left panel exists
html<div class="pos-main" :class="{ 'mobile-visible': isSidebarVisible }">
For POS: pos-main is the CENTER content. Do NOT add mobile-visible to it.
C. Overlay — immediately before the layout div, after the topbar
html<div
  class="mobile-overlay"
  :class="{ active: isSidebarVisible || isCartVisible }"
  @click="closeAllPanels"
></div>
D. Bottom nav — immediately after the layout div, before first modal component
2-tab layout (POS — no left panel):
html<div class="mobile-nav" :class="{ 'hide-on-modal': isAnyModalOpen }">
  <div class="mobile-nav-grid mobile-nav-grid--2col">

    <button
      class="mobile-nav-btn"
      :class="{ active: activeNavBtn === 'main' }"
      @click="closeAllPanels"
    >
      <i class="ph ph-receipt"></i>
      <span>Invoice ({{ cart.length }})</span>
    </button>

    <button
      class="mobile-nav-btn"
      :class="{ active: activeNavBtn === 'right' }"
      @click="toggleRightPanel"
    >
      <i class="ph ph-list-dashes"></i>
      <span>Details</span>
    </button>

  </div>
</div>
3-tab layout (pages with left + right panels):
html<div class="mobile-nav" :class="{ 'hide-on-modal': isAnyModalOpen }">
  <div class="mobile-nav-grid">

    <button class="mobile-nav-btn" :class="{ active: activeNavBtn === 'left' }" @click="toggleLeftPanel">
      <i class="ph ph-[icon]"></i>
      <span>[Left panel name]</span>
    </button>

    <button class="mobile-nav-btn" :class="{ active: activeNavBtn === 'main' }" @click="closeAllPanels">
      <i class="ph ph-[icon]"></i>
      <span>[Main content name]</span>
    </button>

    <button class="mobile-nav-btn" :class="{ active: activeNavBtn === 'right' }" @click="toggleRightPanel">
      <i class="ph ph-[icon]"></i>
      <span>[Right panel name] ({{ count }})</span>
    </button>

  </div>
</div>
E. Header elements — CSS only, no template changes needed
All topbar element hiding is handled via CSS (see Phase 3). No template changes required.

PHASE 3 — FULL CSS BLOCK TO APPEND
Add this entire block after ALL existing CSS. Never modify existing rules. Replace placeholder class names with exact names from the file — POS names are already filled in below.
css/* ============================================================================
   SAFE AREA INSETS — iPhone notch / Dynamic Island
   ============================================================================ */
@supports (padding: max(0px)) {
  .pos-topbar {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
  .mobile-nav {
    padding-left: max(8px, env(safe-area-inset-left));
    padding-right: max(8px, env(safe-area-inset-right));
  }
}

/* ============================================================================
   MOBILE OVERLAY
   ============================================================================ */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 60px;
  background: rgba(0, 0, 0, 0.35);
  z-index: 80;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
}
.mobile-overlay.active { display: block; }

/* ============================================================================
   MOBILE NAV BAR
   ============================================================================ */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 4px;
  padding-bottom: calc(4px + env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
}
.dark .mobile-nav {
  background: #1f2937;
  border-top: 1px solid #4b5563;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
}

/* 3-column (default) */
.mobile-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

/* 2-column — pages with only main + right (e.g. POS) */
.mobile-nav-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.mobile-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: #718096;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 10px;
  min-height: 52px;
  gap: 3px;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.mobile-nav-btn:focus { outline: none; }
.mobile-nav-btn:active { transform: scale(0.93); }
.dark .mobile-nav-btn { color: #9ca3af; }
.mobile-nav-btn i { font-size: 22px; line-height: 1; }

/* Active state — FixPro24 amber brand */
.mobile-nav-btn.active { background: #fef3c7; color: #92400e; }
.mobile-nav-btn.active i { color: #f59e0b; }
.dark .mobile-nav-btn.active { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.dark .mobile-nav-btn.active i { color: #fbbf24; }

/* Nav hides when modal is open */
@media (max-width: 1024px) {
  .mobile-nav.hide-on-modal {
    transform: translateY(100%);
    transition: transform 0.25s ease;
    pointer-events: none;
  }
}

/* ============================================================================
   LARGE DESKTOP — 1200px to 1400px
   ============================================================================ */
@media (max-width: 1400px) {
  /* .pos-layout { grid-template-columns: 1fr 300px; } */
}

/* ============================================================================
   STANDARD DESKTOP — 1025px to 1200px
   ============================================================================ */
@media (max-width: 1200px) {
  /* .pos-layout { grid-template-columns: 1fr 280px; } */
}

/* ============================================================================
   LAPTOP LOW HEIGHT — 1025px+ with max-height 900px
   ============================================================================ */
@media (min-width: 1025px) and (max-height: 900px) {
  .pos-topbar { height: 46px; }
  .pos-info-btn { padding: 6px 10px; }
  .sidebar-totals { padding: 8px 14px; }
  .sidebar-details { gap: 10px; }
  .sd-field { gap: 4px; }
  .pos-row { min-height: 38px; }
  .pos-add-row { height: 38px; }
}

/* ============================================================================
   TABLET — 768px to 1024px (iPad Pro / Air portrait + landscape)
   ============================================================================ */
@media (min-width: 768px) and (max-width: 1024px) {

  .mobile-nav { display: block; }

  /* Layout collapses to single column — topbar = 52px for POS */
  .pos-layout {
    grid-template-columns: 1fr;
    height: calc(100vh - 52px - 60px);
    overflow: hidden;
  }

  .pos-main {
    border-right: none;
    height: 100%;
    overflow: hidden;
  }

  /* Scroll area clears nav bar */
  .pos-rows-scroll { padding-bottom: 80px !important; }

  /* Right panel — slide from right on tablet */
  .pos-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 60px;
    width: 50%;
    min-width: 320px;
    max-width: 420px;
    z-index: 90;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: auto;
    max-height: none;
    border-left: none;
    border-top: none;
  }
  .pos-sidebar.mobile-visible { transform: translateX(0); }
  .dark .pos-sidebar { box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5); }

  /* Info row — allow horizontal scroll */
  .pos-info-row {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .pos-info-row::-webkit-scrollbar { display: none; }
  .pos-info-btn { min-width: 110px; flex-shrink: 0; }

  /* Topbar text labels */
  .pos-topbar-back-label { display: none; }
  .pos-topbar-sale-type-label { display: none; }
  .pos-topbar-divider { display: none; }

  /* Modals */
  .modal-content { max-width: 520px; width: 90%; max-height: 72vh; border-radius: 12px; }
  .modal-footer .btn-modal { flex: 1; }

  .mobile-overlay { bottom: 60px; }
}

/* ============================================================================
   iPAD MINI PORTRAIT — 768px to 834px portrait
   ============================================================================ */
@media (min-width: 768px) and (max-width: 834px) and (orientation: portrait) {
  .pos-sidebar { width: 100%; max-width: 380px; }
}

/* ============================================================================
   MOBILE PORTRAIT — max 767px
   ============================================================================ */
@media (max-width: 767px) {

  .mobile-nav { display: block; }

  /* Topbar */
  .pos-topbar { padding: 0 10px; }
  .pos-topbar-back-label { display: none; }
  .pos-topbar-divider { display: none; }
  .pos-topbar-sale-type-label { display: none; }
  .pos-topbar-back { padding: 0 10px; gap: 0; }

  /* Layout — topbar = 52px for POS, replace on other pages */
  .pos-layout {
    grid-template-columns: 1fr;
    height: calc(100vh - 52px - 60px);
    overflow: hidden;
  }

  .pos-main {
    border-right: none;
    height: 100%;
    overflow: hidden;
  }

  /* Right sidebar — full width slide panel on phones */
  .pos-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 60px;
    width: 100%;
    z-index: 90;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: auto;
    max-height: none;
    border-left: none;
    border-top: none;
  }
  .pos-sidebar.mobile-visible { transform: translateX(0); }
  .dark .pos-sidebar { box-shadow: -4px 0 20px rgba(0, 0, 0, 0.6); }

  /* Sidebar internal padding */
  .sidebar-details { padding-bottom: 24px; }

  /* Scroll area */
  .pos-rows-scroll { padding-bottom: 80px !important; }

  /* Info row */
  .pos-info-row {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .pos-info-row::-webkit-scrollbar { display: none; }
  .pos-info-btn { min-width: 100px; flex-shrink: 0; }

  /* Prevent iOS zoom */
  .pos-add-input { font-size: 16px !important; }
  input, select, textarea { font-size: 16px !important; }

  /* Columns */
  .pcol-type { display: none; }
  .pcol-price { width: 68px; }

  /* Mechanic dropdown — prevent clipping by sidebar overflow */
  .sd-field--relative { overflow: visible; }

  /* Modals */
  .modal-content {
    width: 100%;
    max-width: 96%;
    max-height: 85vh;
    border-radius: 14px;
    margin: 0 auto;
  }
  .modal-header { padding: 16px 20px; }
  .modal-title { font-size: 17px; }
  .modal-body { padding: 18px 20px; }
  .modal-footer {
    padding: 14px 20px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
    gap: 8px;
  }
  .modal-footer .btn-modal { flex: 1; padding: 12px 16px; }
  .btn-close { width: 28px; height: 28px; font-size: 20px; }

  .mobile-nav-btn { min-height: 52px; }
  .mobile-nav-btn i { font-size: 22px; }
  .mobile-nav-grid { gap: 4px; }
  .mobile-overlay { bottom: 60px; }
}

/* ============================================================================
   MOBILE LANDSCAPE — max 1024px, max-height 500px
   ============================================================================ */
@media (max-width: 1024px) and (orientation: landscape) and (max-height: 500px) {

  .mobile-nav {
    padding: 2px 4px;
    padding-bottom: calc(2px + env(safe-area-inset-bottom));
    height: 10vh;
  }

  /* Horizontal nav in landscape */
  .mobile-nav-btn {
    flex-direction: row;
    gap: 6px;
    padding: 0 8px;
    min-height: unset;
    height: 100%;
    font-size: 11px;
  }
  .mobile-nav-btn i { font-size: 16px; margin: 0; }
  .mobile-nav-grid { align-items: center; height: 100%; }

  /* topbar = 52px for POS */
  .pos-layout { height: calc(100vh - 52px - 10vh); }

  .pos-sidebar { bottom: 10vh; width: 50%; min-width: 300px; }
  .mobile-overlay { bottom: 10vh; }

  .pos-topbar { padding: 0 10px; }
  .pos-info-btn { padding: 6px 10px; }
  .pos-info-label { display: none; }

  .modal-content { max-height: 80vh; }
}

/* ============================================================================
   MOBILE LANDSCAPE — max 1024px, 500px to 700px height
   ============================================================================ */
@media (max-width: 1024px) and (orientation: landscape) and (min-height: 501px) and (max-height: 700px) {
  .mobile-nav { height: 56px; }
  .mobile-nav-btn { flex-direction: row; gap: 6px; min-height: unset; height: 100%; font-size: 11px; }
  .mobile-nav-btn i { font-size: 18px; margin: 0; }
  /* topbar = 52px for POS */
  .pos-layout { height: calc(100vh - 52px - 56px); }
  .pos-sidebar { bottom: 56px; }
  .mobile-overlay { bottom: 56px; }
}

/* ============================================================================
   SMALL PHONES — max 480px portrait
   ============================================================================ */
@media (max-width: 480px) and (orientation: portrait) {

  .pos-info-label { display: none; }
  .pos-info-ref { display: none; }
  .pos-info-btn { min-width: 80px; }
  .pos-info-value { font-size: 12px; }

  .pcol-num { display: none; }
  .pos-add-row-icon { width: 36px; }
  .pos-type-btn { width: 54px; }

  .pos-sidebar { width: 100%; max-width: none; }

  .modal-content { max-height: 90vh; max-width: 98%; border-radius: 16px; }

  .sd-datetime-row { grid-template-columns: 1fr !important; gap: 8px; }
}

/* ============================================================================
   SAMSUNG GALAXY S / max 380px
   ============================================================================ */
@media (max-width: 380px) {
  .pos-topbar { padding: 0 8px; }
  .pos-topbar-continue span { display: none; }
  .pos-topbar-continue { padding: 0 12px; }
  .pos-topbar-continue i { font-size: 17px; }
  .mobile-nav-btn span { font-size: 9px; }
  .mobile-nav-btn i { font-size: 20px; }
  .pos-info-btn { min-width: 68px; }
  .pos-add-row-icon { width: 32px; }
  .pos-type-btn { width: 48px; font-size: 9px; }
  .modal-content { max-width: 99%; }
  .sd-datetime-row { grid-template-columns: 1fr !important; }
}

PHASE 4 — ALWAYS-VISIBLE INFORMATION RULES
Always on main screen (never behind a tab)

Page title / pricing mode badge
Primary action button (Continue, Save, Confirm, Create)
Back/nav button
Active context: client name, vehicle plate, odometer
Item count in invoice tab label
Error messages, warnings, loading spinners, real-time status

Always visible in the tab label itself

POS "Invoice" tab: Invoice ({{ cart.length }})
Filter tab: Filters ({{ activeFilters }}) if > 0
Unread tabs: show badge dot

Can go behind a tab

Totals (Parts/Labour/Total), Sale Details, Mechanic, Appointment
Supplier / Invoice number
Secondary info chips beyond the first two

Info row priority

.pos-info-btn icons — always show
.pos-info-value — always show
.pos-info-label — hide at <=480px
.pos-info-ref — hide at <=480px
At <=380px — min-width: 68px to fit all 3 buttons across


PHASE 5 — BEHAVIOR LOGIC
User ActionMobile BehaviorTaps "Invoice" tabcloseAllPanels()Taps "Details" tabtoggleRightPanel() — pos-sidebar slides inTaps overlaycloseAllPanels() immediatelyOpens any modalcloseAllPanels() first, then open modal, nav hidesModal closesreturn to main tabAdds item + goToCartOnAdd ontoggleRightPanel() — open DetailsRotates devicecloseAllPanels() (orientationchange)Resizes > 1024pxcloseAllPanels(), panels revert to gridTaps right panel -> opens sub-modalclose panel, open modal on topContinue / F9closeAllPanels() first, then open TransactionModal
Tab state machine
ActionactiveNavBtncloseAllPanels()'main'toggleRightPanel() opens'right'toggleRightPanel() closes'main'toggleLeftPanel() opens'left'toggleLeftPanel() closes'main'goToCartOnAdd redirect'right'Modal opens (nav hides)unchanged
Transition timing

Panel slides: 0.3s cubic-bezier(0.4, 0, 0.2, 1) — feels native
Nav hide on modal: 0.25s ease
Scroll to new item after redirect: 350ms setTimeout (panel finishes before scroll)
goToCartOnAdd guard: window.innerWidth <= 1024 — desktop never affected


PHASE 6 — VERIFICATION CHECKLIST
Script

 Every original function has identical body — zero changes
 Every ref(), computed(), watch(), prop, emit untouched
 No new onMounted or onUnmounted created — added to existing ones
 handleResponsiveResize + orientationchange cleanup in existing onUnmounted
 closeAllPanels() inside every modal-open function (guarded by window.innerWidth <= 1024)
 Panel variable names match template :class bindings exactly
 goToCartOnAdd logic patched into add-item function

Template

 pos-sidebar has :class="{ 'mobile-visible': isCartVisible }"
 Left panel has :class="{ 'mobile-visible': isSidebarVisible }" — only if left panel exists
 pos-main does NOT have mobile-visible binding (POS only)
 mobile-overlay placed between topbar and layout div — not inside layout
 mobile-nav placed after layout div, before first modal component
 Tab labels match ACTUAL content — no "Left", "Right", "Panel", "Sidebar"
 Live count on invoice/list tab
 hide-on-modal uses existing isAnyModalOpen computed — not duplicated
 2-tab pages use mobile-nav-grid--2col
 All icons are Phosphor (ph ph-[name])

CSS

 Zero existing rules modified — only appended
 All class names in new CSS match exactly what's in the file — no generic placeholders
 52px used for POS topbar in all calc() — not 49px
 All 11 breakpoints present: 1400, 1200, 1025+900h, 768-1024, 768-834portrait, 767, landscape<=500h, landscape501-700h, 480portrait, 380
 Safe area insets on pos-topbar and mobile-nav
 pos-rows-scroll has padding-bottom: 80px !important inside <=1024px only
 pos-sidebar on mobile has overflow-y: auto; -webkit-overflow-scrolling: touch
 sd-field--relative has overflow: visible on mobile
 sd-datetime-row forced to 1 column at <=480px and <=380px
 Right panel: width: 100% phones / width: 50%; min-width: 320px tablets
 Both panels: bottom: 60px portrait / bottom: 10vh landscape
 mobile-nav and mobile-overlay default display: none
 .dark variants on all new classes (mobile-nav, mobile-nav-btn, pos-sidebar overrides)
 Z-index stack: nav 100, right 90, left 85, overlay 80, modals 1000+, mechanic dropdown 200
 .pos-topbar-back-label, .pos-topbar-divider, .pos-topbar-sale-type-label hidden at <=767px
 .pos-info-label hidden at <=480px
 .pos-info-ref hidden at <=480px
 .pos-add-input has font-size: 16px !important at <=767px
 .pos-topbar-continue span hidden at <=380px
 overflow: hidden not set on any slide panel


OUTPUT FORMAT
## Files to change
- `[exact file path]`

---

**File: `[exact path]`**
1. Open VS Code
2. Navigate to `[path]`
3. Click the file to open it
4. Press Ctrl+A
5. Press Ctrl+V

[COMPLETE FULL FILE — no cuts, no placeholders, no TODOs]

---

Done. Added full responsiveness across 11 breakpoints — [right panel name] slides right, bottom nav with [tab names], [X] dark-mode variants.

NEVER DO THESE

Never touch any existing CSS or desktop layout rule
Never modify any class name
Never reorder template elements
Never remove features to simplify mobile
Never write // TODO or placeholder comments
Never create a second onMounted or onUnmounted
Never use generic tab names — always use real content names from the file
Never output partial files
Never use generic placeholder CSS class names — always read exact names from the file
Never set overflow: hidden on a slide panel — it must scroll internally on mobile
Never forget overflow: visible on .sd-field--relative on mobile
Never use 49px as topbar height — POS is 52px, always read the actual value
Never make pos-main a slide panel for POS — it is the center content, not a sidebar
Never write more than 1 sentence after "Done"