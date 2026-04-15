# Design System — Garage SaaS

A complete reference for the visual and interactive language used across this application. Use this document to recreate the same design in any new project.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Colors](#colors)
3. [Typography](#typography)
4. [Spacing & Sizing](#spacing--sizing)
5. [Dark Mode](#dark-mode)
6. [Layout Structure](#layout-structure)
7. [Page Structure](#page-structure)
8. [Cards & Panels](#cards--panels)
9. [Buttons](#buttons)
10. [Forms & Inputs](#forms--inputs)
11. [Tables](#tables)
12. [Modals](#modals)
13. [Badges & Status Indicators](#badges--status-indicators)
14. [Navigation](#navigation)
15. [Flash Messages & Alerts](#flash-messages--alerts)
16. [Icons](#icons)
17. [Animations & Transitions](#animations--transitions)
18. [Scrollbars](#scrollbars)
19. [Responsive Design](#responsive-design)
20. [Tailwind Config](#tailwind-config)

---

## Tech Stack

| Layer | Technology |
|---|---|
| CSS Framework | TailwindCSS 3 (`darkMode: 'class'`) |
| UI Components | PrimeVue 4 (Aura theme) |
| Font | Figtree (via Tailwind `defaultTheme`) |
| Icons | FontAwesome 7 (Free + Pro) |
| Frontend | Vue 3 + Inertia.js v2 |

---

## Colors

### Primary Brand Color

```
#FDB022   — Amber/Gold (primary accent)
#E89F1C   — Amber hover state (darker)
```

Used for: active navigation, primary buttons, focus rings, active pagination, toggle switches, key highlights.

### Background Colors

| Surface | Light Mode | Dark Mode |
|---|---|---|
| Page background | `bg-gray-100` | `dark:bg-gray-900` |
| Card / Panel | `bg-white` | `dark:bg-[#2a2d35]` |
| Card header / Subpanel | `bg-gray-50` | `dark:bg-[#33363e]` |
| Alternating row (odd) | `bg-gray-50/50` | `dark:bg-[#30333b]` |
| Input background | `bg-white` | `dark:bg-[#3a3d45]` |
| Input background (small) | `bg-gray-50` | `dark:bg-gray-700` |
| Sidebar | `bg-white` | `dark:bg-gray-800` |
| Header bar | `bg-white/80` | `dark:bg-gray-800/80` |
| Overlay backdrop | `bg-gray-900/60` | same |

### Text Colors

| Role | Light Mode | Dark Mode |
|---|---|---|
| Primary / Headings | `text-gray-800` or `text-gray-900` | `dark:text-gray-100` |
| Secondary | `text-gray-700` | `dark:text-gray-300` |
| Tertiary / Descriptions | `text-gray-600` | `dark:text-gray-400` |
| Placeholder / Hint | `text-gray-500` | `dark:text-gray-400` |
| Disabled | `text-gray-400` | `dark:text-gray-500` |
| On primary (amber bg) | `text-gray-900` | `text-gray-900` |

### Border Colors

| Use | Light Mode | Dark Mode |
|---|---|---|
| Default border | `border-gray-200` | `dark:border-gray-700` |
| Subtle / sidebar | `border-gray-200` | `dark:border-white/10` |
| Dividers | `divide-gray-200` | `dark:divide-gray-700` |
| Input border | `border-gray-300` | `dark:border-gray-600` |

### Status / Semantic Colors

| Status | Light Background | Light Text | Dark Background | Dark Text |
|---|---|---|---|---|
| Success | `bg-green-50` | `text-green-800` | `dark:bg-green-900/30` | `dark:text-green-300` |
| Error / Danger | `bg-red-50` | `text-red-800` | `dark:bg-red-900/30` | `dark:text-red-300` |
| Warning | `bg-amber-50` | `text-amber-800` | `dark:bg-amber-900/20` | `dark:text-amber-300` |
| Info | `bg-blue-50` | `text-blue-800` | `dark:bg-blue-900/20` | `dark:text-blue-300` |

### Status Badge Specific Colors

| State | Classes |
|---|---|
| Active | `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` |
| Trial | `bg-blue-900/30 text-blue-400` |
| Suspended | `bg-orange-900/30 text-orange-400` |
| Expired | `bg-red-900/30 text-red-400` |
| Inactive | `bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400` |

---

## Typography

### Font Family

```css
font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
```

### Type Scale

| Use | Size | Weight | Notes |
|---|---|---|---|
| Page title (H1) | `text-2xl` | `font-semibold` | Main page headers |
| Page subtitle | `text-sm` | normal | Below H1, muted color |
| Section / Card header | `text-lg` | `font-semibold` | Inside cards |
| Modal title (large) | `text-xl` | `font-semibold` | Full-size modals |
| Modal title (small) | `text-base` or `text-lg` | `font-semibold` | Compact modals |
| Form label | `text-sm` | `font-medium` | Input labels |
| Body / Cell text | `text-sm` | `font-medium` (key) or normal | Content |
| Button text | `text-sm` | `font-semibold` | Action buttons |
| Large button | `text-[15px]` | `font-semibold` | Form submit |
| Table header | `text-xs` | `font-semibold` | `uppercase tracking-wider` |
| Badge / Pill | `text-xs` | `font-medium` | Status indicators |
| Help / Error text | `text-xs` | normal | Below inputs |
| Nav item | `text-sm` | `font-semibold` | Sidebar links |

---

## Spacing & Sizing

### Page Container

```html
<div class="mx-auto max-w-[1400px] space-y-5 px-4 sm:px-6 lg:px-8">
```

- Max width: `max-w-[1400px]` (or `max-w-7xl` = 1280px for standard pages)
- Horizontal padding: `px-4 sm:px-6 lg:px-8`
- Vertical gaps between sections: `space-y-5`

### Layout Dimensions

| Element | Size |
|---|---|
| Sidebar (expanded) | `w-44` (176px) |
| Sidebar (collapsed) | `w-20` (80px) |
| Header height | `h-16` (64px) |
| Icon-only button | `h-10 w-10` |
| Avatar badge | `h-10 w-10` or `h-12 w-12` |

### Card / Panel Spacing

| Zone | Padding |
|---|---|
| Card body | `p-4` to `p-6` |
| Card header | `px-6 py-4` or `px-6 py-5` |
| Card footer | `px-6 py-4` |
| Gaps between cards | `gap-4` or `space-y-5` |

### Form Spacing

| Zone | Value |
|---|---|
| Between form fields | `gap-5` or `space-y-5` |
| Label to input | `mb-1.5` on label |
| Form grid (2 cols) | `grid grid-cols-1 md:grid-cols-2 gap-5` |

### Input Sizes

| Variant | Height | Padding |
|---|---|---|
| Small | `h-10` | `px-3 py-2` |
| Standard | `h-11` | `px-4` |

### Button Sizes

| Variant | Height | Horizontal Padding | Font Size |
|---|---|---|---|
| Small / inline | `h-8` to `h-9` | `px-3` | `text-xs` |
| Standard | `h-10` | `px-4` | `text-sm` |
| Large / submit | `h-11` | `px-6` | `text-[15px]` |

---

## Dark Mode

### Strategy

- Tailwind class-based: `darkMode: 'class'`
- Toggle stored in `localStorage` key `'theme'`
- Applied via: `document.documentElement.classList.add('dark')`
- Dark mode suffix: all dark classes use `dark:` prefix

### Toggle Implementation

```js
// On mount
const saved = localStorage.getItem('theme');
if (saved === 'dark') document.documentElement.classList.add('dark');

// Toggle function
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

### Full Color Mapping Summary

```
Page bg:       bg-gray-100        → dark:bg-gray-900
Sidebar:       bg-white           → dark:bg-gray-800
Header:        bg-white/80        → dark:bg-gray-800/80
Card:          bg-white           → dark:bg-[#2a2d35]
Card header:   bg-gray-50         → dark:bg-[#33363e]
Input:         bg-white           → dark:bg-[#3a3d45]
Input (sm):    bg-gray-50         → dark:bg-gray-700
Text primary:  text-gray-800/900  → dark:text-gray-100
Text secondary:text-gray-700      → dark:text-gray-300
Text tertiary: text-gray-600      → dark:text-gray-400
Border:        border-gray-200    → dark:border-gray-700
Border light:  border-gray-200    → dark:border-white/10
```

---

## Layout Structure

### Tenant Layout

```
┌──────────────────────────────────────────────────────────┐
│  HEADER  (h-16, sticky, border-b-2 border-[#FDB022])     │
│  [Menu toggle]  [Page Title + Plan]  [Theme + Profile]   │
├──────────┬───────────────────────────────────────────────┤
│          │  Flash Messages (auto-dismiss, 4.5s)          │
│          │  Warning Banner (inactive subscription)       │
│ SIDEBAR  │  Temp Password Bar (if needed)                │
│ w-44/w-20│                                               │
│          │  MAIN CONTENT                                 │
│ [Logo]   │  flex-1 overflow-y-auto p-4 sm:p-6           │
│ [Nav]    │                                               │
│          │  <slot />                                     │
│ [Logout] │                                               │
└──────────┴───────────────────────────────────────────────┘
```

**Header:**
- `sticky top-0 z-30 h-16`
- `border-b-2 border-amber-400 dark:border-amber-500`
- `backdrop-blur-md`
- `bg-white/80 dark:bg-gray-800/80`

**Sidebar:**
- Fixed left side
- Expanded: `w-44`, Collapsed: `w-20`
- Active nav item: `bg-amber-400 text-gray-800`
- Hover inactive: `hover:bg-gray-100 dark:hover:bg-white/10`
- Feature-locked items: `opacity-40` + lock icon

### SuperAdmin Layout

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (h-16, bg-gray-900)                              │
│  [Logo + Title + "Super Admin"]          [User Avatar]   │
├──────────┬───────────────────────────────────────────────┤
│          │  Flash Messages                               │
│ SIDEBAR  │                                               │
│  w-52    │  MAIN CONTENT                                 │
│          │  p-6                                          │
│ [Nav]    │                                               │
│ [Logout] │  <slot />                                     │
└──────────┴───────────────────────────────────────────────┘
```

---

## Page Structure

Every page follows this three-zone structure inside the layout slot:

```html
<div class="mx-auto max-w-[1400px] space-y-5 px-4 sm:px-6 lg:px-8">

  <!-- ZONE 1: Page Header -->
  <div class="flex items-center justify-between gap-4 flex-wrap pt-4">
    <div>
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        Page Title
      </h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Optional subtitle or description
      </p>
    </div>
    <!-- Primary Action Button -->
    <button class="flex h-10 items-center gap-2 rounded-lg bg-[#FDB022] px-4
                   text-sm font-semibold text-gray-900 shadow-sm transition-all
                   hover:bg-[#E89F1C] active:scale-95">
      <i class="fas fa-plus"></i>
      Add Something
    </button>
  </div>

  <!-- ZONE 2: Filter / Search Bar -->
  <div class="rounded-lg bg-white p-4 shadow-sm dark:bg-[#2a2d35]">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search -->
      <div class="relative flex-1 max-w-xl">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          class="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4
                 text-sm text-gray-900 placeholder-gray-500
                 focus:border-[#FDB022] focus:outline-none focus:ring-2 focus:ring-[#FDB022]/20
                 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          placeholder="Search..."
        />
      </div>
      <!-- Count Badge -->
      <div class="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50
                  px-3 py-2 text-sm font-medium text-gray-700
                  dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
        <i class="fas fa-list text-[#FDB022]"></i>
        <span>Total: <strong>42</strong></span>
      </div>
    </div>
  </div>

  <!-- ZONE 3: Data (Table or Cards) -->
  <div class="rounded-lg bg-white shadow-sm overflow-hidden dark:bg-[#2a2d35]">
    <!-- Table or card list -->
  </div>

  <!-- ZONE 4: Pagination -->
  <div class="flex justify-center pb-8">
    <!-- Pagination nav -->
  </div>

</div>
```

---

## Cards & Panels

### Basic Card

```html
<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-[#2a2d35]">
  <!-- content -->
</div>
```

### Card with Header

```html
<div class="rounded-lg bg-white shadow-sm overflow-hidden dark:bg-[#2a2d35]">
  <div class="border-b border-gray-200 bg-gray-50 px-6 py-4
              dark:border-gray-700 dark:bg-[#33363e]">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Section Title
    </h3>
  </div>
  <div class="p-6">
    <!-- body content -->
  </div>
</div>
```

### Card Variants

| Variant | Classes |
|---|---|
| Default | `bg-white dark:bg-[#2a2d35] rounded-lg shadow-sm` |
| Elevated | `bg-white dark:bg-gray-800 rounded-xl shadow-lg` |
| Outlined | `border border-gray-200 dark:border-gray-700 rounded-lg` |
| Header zone | `bg-gray-50 dark:bg-[#33363e]` |
| Alt row / subpanel | `bg-gray-50/50 dark:bg-[#30333b]` |
| Info alert card | `bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800` |
| Warning card | `bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700` |
| Success card | `bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700` |
| Danger card | `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700` |

### Icon Badge (used on stat/info cards)

```html
<div class="flex h-10 w-10 items-center justify-center rounded-lg
            bg-amber-100 dark:bg-amber-900/20">
  <i class="fas fa-crown text-amber-500 dark:text-amber-400"></i>
</div>
```

---

## Buttons

### Primary Button

```html
<button class="flex h-10 items-center gap-2 rounded-lg bg-[#FDB022] px-4
               text-sm font-semibold text-gray-900 shadow-sm
               transition-all hover:bg-[#E89F1C] active:scale-95">
  <i class="fas fa-plus"></i>
  Label
</button>
```

### Secondary / Cancel Button

```html
<button class="h-11 rounded-lg border border-gray-300 bg-white px-6
               text-[15px] font-semibold text-gray-700 shadow-sm
               transition-all hover:bg-gray-50
               dark:border-gray-600 dark:bg-[#3a3d45] dark:text-gray-300 dark:hover:bg-[#2a2d35]">
  Cancel
</button>
```

### Danger / Delete Button (inline / icon)

```html
<button class="p-0 text-red-600 hover:text-red-700 transition-colors">
  <i class="fa-regular fa-trash-can text-[16px]"></i>
</button>
```

### Icon-Only Button

```html
<button class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
               text-gray-500 transition hover:bg-gray-100 hover:text-gray-800
               dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        title="Action description">
  <i class="fas fa-cog text-lg"></i>
</button>
```

### Amber Link / Edit Action

```html
<button class="p-0 text-[#FDB022] hover:text-[#E89F1C] transition-colors">
  <i class="fa-regular fa-pen-to-square text-[16px]"></i>
</button>
```

### Button States

| State | Class |
|---|---|
| Hover (primary) | `hover:bg-[#E89F1C]` |
| Active press | `active:scale-95` |
| Focus | `focus:outline-none focus:ring-2 focus:ring-[#FDB022]` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Loading | `animate-spin` on icon |

### Modal Footer Buttons (side by side)

```html
<div class="flex gap-3">
  <button class="flex-1 h-10 rounded-md border border-gray-300 bg-white text-sm font-medium
                 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600">
    Cancel
  </button>
  <button class="flex-1 h-10 rounded-md bg-[#FDB022] text-sm font-semibold text-gray-900
                 hover:bg-[#E89F1C] active:scale-95">
    Save
  </button>
</div>
```

---

## Forms & Inputs

### Text Input (Standard)

```html
<div>
  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
    Field Label
  </label>
  <input
    type="text"
    placeholder="Hint text"
    class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4
           text-[15px] text-gray-900 placeholder-gray-500
           transition-all
           focus:border-[#FDB022] focus:outline-none focus:ring-4 focus:ring-[#FDB022]/10
           dark:border-gray-600 dark:bg-[#3a3d45] dark:text-gray-100
           dark:placeholder-gray-400 dark:focus:border-[#FDB022]
           disabled:bg-gray-100 dark:disabled:bg-gray-700
           disabled:cursor-not-allowed disabled:opacity-50"
  />
</div>
```

### Small / Filter Input

```html
<input
  class="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3
         text-sm text-gray-700
         focus:border-[#FDB022] focus:outline-none focus:ring-2 focus:ring-[#FDB022]/20
         dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
/>
```

### Textarea

```html
<textarea
  rows="3"
  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3
         text-[15px] text-gray-900 placeholder-gray-500 resize-none
         focus:border-[#FDB022] focus:outline-none focus:ring-4 focus:ring-[#FDB022]/10
         dark:border-gray-600 dark:bg-[#3a3d45] dark:text-gray-100"
></textarea>
```

### Select / Dropdown

```html
<select
  class="h-10 rounded-md border border-gray-200 bg-gray-50 px-3
         text-sm text-gray-700
         focus:border-[#FDB022] focus:outline-none focus:ring-2 focus:ring-[#FDB022]/20
         dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
  <option value="">All</option>
  <option value="1">Option 1</option>
</select>
```

### Checkbox

```html
<input
  type="checkbox"
  class="w-4 h-4 text-[#FDB022] border-gray-300 rounded
         focus:ring-[#FDB022] focus:ring-2 cursor-pointer"
/>
```

### Toggle Switch

```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-11 h-6 bg-gray-200 rounded-full peer
              peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FDB022]/20
              dark:peer-focus:ring-[#FDB022]/10 dark:bg-gray-700
              peer-checked:after:translate-x-full peer-checked:after:border-white
              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
              after:bg-white after:border-gray-300 after:border after:rounded-full
              after:h-5 after:w-5 after:transition-all
              dark:border-gray-600 peer-checked:bg-[#FDB022]">
  </div>
  <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
    Option label
  </span>
</label>
```

### Form Grid Layouts

```html
<!-- Two-column grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
  <!-- fields -->
</div>

<!-- Single-column stack -->
<div class="space-y-5">
  <!-- fields -->
</div>
```

### Label with Badge

```html
<label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
  Label Text
  <span class="ml-1 inline-flex items-center rounded-full
               bg-[#FDB022]/20 px-2 py-0.5 text-xs font-medium text-[#FDB022]">
    Required
  </span>
</label>
```

### Validation Error

```html
<div class="mt-1.5 rounded-lg border border-red-200 bg-red-50 p-3
            dark:border-red-800 dark:bg-red-900/30">
  <p class="text-sm text-red-600 dark:text-red-400">
    This field is required.
  </p>
</div>
```

---

## Tables

### Full Table Structure

```html
<div class="rounded-lg bg-white shadow-sm overflow-hidden dark:bg-[#2a2d35]">
  <div class="overflow-x-auto">
    <table class="w-full text-left">

      <!-- Header -->
      <thead>
        <tr class="border-b border-gray-200 bg-gray-50
                   dark:border-gray-700 dark:bg-[#33363e]">
          <th class="px-6 py-3 text-xs font-semibold uppercase tracking-wider
                     text-gray-600 dark:text-gray-400">
            Column Header
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        <tr
          v-for="(item, index) in items"
          :key="item.id"
          :class="[
            'transition-colors',
            index % 2 === 0
              ? 'bg-white hover:bg-gray-50 dark:bg-[#2a2d35] dark:hover:bg-[#33363e]'
              : 'bg-gray-50/50 hover:bg-gray-100 dark:bg-[#30333b] dark:hover:bg-[#383b43]'
          ]"
        >
          <td class="whitespace-nowrap px-6 py-4 text-sm font-medium
                     text-gray-900 dark:text-gray-100">
            {{ item.name }}
          </td>
          <!-- Actions column -->
          <td class="whitespace-nowrap px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-3">
              <button class="p-0 text-blue-500 hover:text-blue-600 transition-colors"
                      title="View">
                <i class="fa-regular fa-eye text-[16px]"></i>
              </button>
              <button class="p-0 text-[#FDB022] hover:text-[#E89F1C] transition-colors"
                      title="Edit">
                <i class="fa-regular fa-pen-to-square text-[16px]"></i>
              </button>
              <button class="p-0 text-red-500 hover:text-red-600 transition-colors"
                      title="Delete">
                <i class="fa-regular fa-trash-can text-[16px]"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Table Cell Padding

| Zone | Padding |
|---|---|
| Header cell | `px-6 py-3` |
| Body cell | `px-6 py-4` |

### Alternating Row Colors

| Row | Light | Dark |
|---|---|---|
| Even | `bg-white hover:bg-gray-50` | `dark:bg-[#2a2d35] dark:hover:bg-[#33363e]` |
| Odd | `bg-gray-50/50 hover:bg-gray-100` | `dark:bg-[#30333b] dark:hover:bg-[#383b43]` |

### Mobile Card Fallback (for tables)

```html
<!-- Table: only on large screens -->
<div class="hidden lg:block">
  <!-- table markup -->
</div>

<!-- Card grid: only on mobile -->
<div class="grid grid-cols-1 gap-4 lg:hidden">
  <div
    v-for="item in items"
    :key="item.id"
    class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm
           dark:border-gray-700 dark:bg-[#2a2d35]"
  >
    <!-- key-value pairs or flex rows -->
  </div>
</div>
```

### Pagination

```html
<div class="flex justify-center pb-8">
  <nav class="inline-flex overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm
              dark:border-gray-700 dark:bg-[#2a2d35]">
    <button
      v-for="(link, i) in links"
      :key="i"
      :disabled="!link.url"
      class="px-4 py-2.5 text-sm font-medium transition-colors"
      :class="[
        link.active
          ? 'bg-[#FDB022] text-gray-900'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#33363e]',
        i !== links.length - 1 ? 'border-r border-gray-100 dark:border-gray-700' : '',
        !link.url ? 'cursor-not-allowed opacity-50' : '',
      ]"
      v-html="link.label"
    ></button>
  </nav>
</div>
```

---

## Modals

### Standard Modal Wrapper

```html
<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
  @click="$emit('close')"
>
  <!-- Dialog -->
  <div
    class="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden
           rounded-xl bg-white shadow-2xl dark:bg-[#2a2d35]"
    @click.stop
  >

    <!-- Sticky Header -->
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3
                border-b border-gray-200 bg-gray-50 px-6 py-4
                dark:border-gray-700 dark:bg-[#33363e]">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Modal Title
      </h2>
      <button
        @click="$emit('close')"
        class="rounded-lg p-2 text-gray-500 transition
               hover:bg-gray-200 hover:text-gray-700
               dark:text-gray-400 dark:hover:bg-gray-600"
      >
        <i class="fas fa-times text-lg"></i>
      </button>
    </div>

    <!-- Scrollable Body -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Form content or information -->
    </div>

    <!-- Sticky Footer -->
    <div class="sticky bottom-0 z-10 border-t border-gray-200 bg-gray-50 px-6 py-4
                dark:border-gray-700 dark:bg-[#33363e]">
      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 h-10 rounded-md border border-gray-300 bg-white text-sm font-medium
                 transition-all hover:bg-gray-50
                 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="submit"
          class="flex-1 h-10 rounded-md bg-[#FDB022] text-sm font-semibold text-gray-900
                 transition-all hover:bg-[#E89F1C] active:scale-95"
        >
          Save
        </button>
      </div>
    </div>

  </div>
</div>
```

### Modal Size Variants

| Variant | Max Width | Use Case |
|---|---|---|
| Small | `max-w-md` (448px) | Confirmations, simple forms |
| Standard | `max-w-2xl` or `max-w-3xl` | Most forms |
| Large | `max-w-4xl` | Complex forms, multi-step |
| Full | `max-w-6xl` | POS-style, multi-panel |

### Modal Height

- Always use `max-h-[90vh]` on the dialog container
- Body section gets `flex-1 overflow-y-auto` for scrollability
- Header and footer are `sticky top-0` / `sticky bottom-0`

### Multi-Step / Selection Modal

Modals with multiple views use an internal `step` or `view` state:

```js
const view = ref('list'); // 'list' | 'create' | 'detail'
```

Include a back button in the header when in nested view:

```html
<button
  v-if="view !== 'list'"
  @click="view = 'list'"
  class="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
>
  <i class="fas fa-arrow-left"></i>
</button>
```

---

## Badges & Status Indicators

### Pill Badge

```html
<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1
             text-xs font-semibold bg-green-100 text-green-700
             dark:bg-green-900/30 dark:text-green-400">
  <i class="fas fa-circle text-[6px]"></i>
  Active
</span>
```

### Dot Indicator Only

```html
<span class="inline-flex h-2 w-2 rounded-full bg-green-400"></span>
```

### Status Badge Colors

```
Active:    bg-green-100 text-green-700   dark:bg-green-900/30 dark:text-green-400
Trial:     bg-blue-100 text-blue-700     dark:bg-blue-900/30 dark:text-blue-400
Suspended: bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400
Expired:   bg-red-100 text-red-700       dark:bg-red-900/30 dark:text-red-400
Inactive:  bg-gray-100 text-gray-600     dark:bg-gray-700 dark:text-gray-400
```

### Counter Badge (on icon)

```html
<div class="relative inline-flex">
  <i class="fas fa-bell text-gray-500"></i>
  <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center
               rounded-full bg-[#FDB022] text-[10px] font-bold text-gray-900">
    3
  </span>
</div>
```

---

## Navigation

### Sidebar Item (Tenant)

```html
<!-- Active item -->
<a class="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1
          bg-amber-400 text-gray-800 font-semibold">
  <i class="fas fa-home w-5 text-center text-lg"></i>
  <span>Dashboard</span>
</a>

<!-- Inactive item -->
<a class="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1
          text-gray-700 dark:text-white/70 font-semibold
          hover:bg-gray-100 hover:text-gray-900
          dark:hover:bg-white/10 dark:hover:text-white
          transition-colors">
  <i class="fas fa-users w-5 text-center text-lg"></i>
  <span>Clients</span>
</a>

<!-- Locked / disabled item -->
<div class="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1
            text-gray-700 dark:text-white/70 opacity-40 cursor-not-allowed">
  <i class="fas fa-chart-bar w-5 text-center text-lg"></i>
  <span>Reports</span>
  <i class="fas fa-lock ml-auto text-xs"></i>
</div>
```

### Collapsed Sidebar Item (icon only)

```html
<a class="flex items-center justify-center rounded-lg px-2 py-3 mb-1
          hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
   title="Clients">
  <i class="fas fa-users text-xl text-gray-600 dark:text-white/70"></i>
</a>
```

---

## Flash Messages & Alerts

### Flash Message (auto-dismiss after 4.5s)

```html
<!-- Positioned inside layout, below header -->
<Transition
  enter-active-class="transition duration-300 ease-out"
  enter-from-class="translate-y-[-10px] opacity-0"
  enter-to-class="translate-y-0 opacity-100"
  leave-active-class="transition duration-200 ease-in"
  leave-from-class="translate-y-0 opacity-100"
  leave-to-class="translate-y-[-10px] opacity-0"
>
  <div v-if="flash"
       class="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border p-4"
       :class="flash.type === 'success'
         ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300'
         : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300'"
  >
    <div class="flex items-center gap-3">
      <i :class="flash.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      <p class="text-sm font-medium">{{ flash.message }}</p>
    </div>
    <button @click="flash = null" class="rounded p-1 hover:bg-black/10">
      <i class="fas fa-times text-xs"></i>
    </button>
  </div>
</Transition>
```

### Warning / Info Banners (full-width)

```html
<!-- Temporary password warning -->
<div class="bg-[#FDB022] px-4 py-2 text-center text-sm font-semibold text-gray-900">
  <i class="fas fa-exclamation-triangle mr-2"></i>
  Warning message here.
</div>

<!-- Subscription inactive -->
<div class="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
  Your subscription is inactive. Please renew to continue.
</div>
```

---

## Icons

All icons use **FontAwesome** syntax:

| Style | Prefix | Example |
|---|---|---|
| Solid | `fas` | `<i class="fas fa-check"></i>` |
| Regular (outline) | `fa-regular` or `far` | `<i class="fa-regular fa-trash-can"></i>` |
| Brands | `fab` | `<i class="fab fa-github"></i>` |

### Common Icons Used

| Action | Icon |
|---|---|
| Add / Create | `fas fa-plus` |
| Edit | `fa-regular fa-pen-to-square` |
| Delete | `fa-regular fa-trash-can` |
| View / Eye | `fa-regular fa-eye` |
| Search | `fas fa-magnifying-glass` or `fas fa-search` |
| Close / X | `fas fa-times` or `fas fa-xmark` |
| Back arrow | `fas fa-arrow-left` |
| Check / Success | `fas fa-check-circle` |
| Error | `fas fa-exclamation-circle` |
| Warning | `fas fa-exclamation-triangle` |
| Info | `fas fa-circle-info` |
| Lock | `fas fa-lock` |
| Settings | `fas fa-cog` or `fas fa-gear` |
| Menu toggle | `fas fa-bars` |
| Theme toggle | `fas fa-sun` / `fas fa-moon` |
| Crown / Plan | `fas fa-crown` |
| Dashboard | `fas fa-gauge-high` |
| Users / Clients | `fas fa-users` |
| Vehicle / Car | `fas fa-car` |
| Invoice | `fas fa-file-invoice` |
| POS / Cart | `fas fa-cart-shopping` |

---

## Animations & Transitions

### General Hover Transitions

```css
transition-all       /* all properties */
transition-colors    /* color only */
```

### Button Press Effect

```css
active:scale-95
```

### Fade + Slide (Vue Transition)

```html
<Transition
  enter-active-class="transition duration-300 ease-out"
  enter-from-class="opacity-0 translate-y-[-8px]"
  enter-to-class="opacity-100 translate-y-0"
  leave-active-class="transition duration-200 ease-in"
  leave-from-class="opacity-100 translate-y-0"
  leave-to-class="opacity-0 translate-y-[-8px]"
>
```

### Modal Open/Close

```html
<Transition
  enter-active-class="transition duration-200 ease-out"
  enter-from-class="opacity-0 scale-95"
  enter-to-class="opacity-100 scale-100"
  leave-active-class="transition duration-150 ease-in"
  leave-from-class="opacity-100 scale-100"
  leave-to-class="opacity-0 scale-95"
>
```

### Loading Spinner

```html
<i class="fas fa-spinner animate-spin"></i>
```

---

## Scrollbars

Custom scrollbar styling applied to sidebar and modal bodies:

```css
/* Light mode */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Dark mode */
.dark ::-webkit-scrollbar-track { background: #1f2937; }
.dark ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
.dark ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Prefix | Min Width |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

### Patterns

- Horizontal padding: `px-4 sm:px-6 lg:px-8`
- Form grids: `grid-cols-1 md:grid-cols-2`
- Hide table on mobile: `hidden lg:block`
- Show card grid on mobile: `grid lg:hidden`
- Modal padding: `p-4 sm:p-6`
- Flex wrap for page header: `flex-wrap`
- Sidebar collapses on mobile: toggle via JS/ref

---

## Tailwind Config

```js
// tailwind.config.js
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: 'class',
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.vue',
    './resources/js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: '#FDB022',
          hover: '#E89F1C',
        },
      },
    },
  },
  plugins: [
    // @tailwindcss/forms (optional, for base input reset)
  ],
};
```

---

## Quick Reference Cheatsheet

```
Primary color:      #FDB022
Primary hover:      #E89F1C
Font:               Figtree

Card (light):       bg-white rounded-lg shadow-sm
Card (dark):        dark:bg-[#2a2d35]
Card header (dark): dark:bg-[#33363e]
Alt row (dark):     dark:bg-[#30333b]
Input (dark):       dark:bg-[#3a3d45]
Page bg (dark):     dark:bg-gray-900

Input focus:        focus:border-[#FDB022] focus:ring-4 focus:ring-[#FDB022]/10
Primary btn:        bg-[#FDB022] hover:bg-[#E89F1C] active:scale-95 text-gray-900
Border default:     border-gray-200 dark:border-gray-700
Border input:       border-gray-300 dark:border-gray-600

Page container:     mx-auto max-w-[1400px] space-y-5 px-4 sm:px-6 lg:px-8
Section spacing:    space-y-5
Form field gap:     gap-5
Card padding:       p-4 to p-6
Header padding:     px-6 py-4
Table cell:         px-6 py-4 (body), px-6 py-3 (header)
Modal max-h:        max-h-[90vh]
Backdrop:           bg-gray-900/60 backdrop-blur-sm
```
