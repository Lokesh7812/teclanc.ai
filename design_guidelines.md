# Design Guidelines: Teclanc.AI Website Builder

## Design Approach
**System-Based Approach**: Drawing from Linear's developer-focused aesthetics and VS Code's interface patterns. This is a utility-first productivity tool where clarity, efficiency, and code preview take precedence.

## Typography
- **Primary Font**: Inter (via Google Fonts)
- **Monospace Font**: JetBrains Mono for code/prompts
- **Scale**: 
  - Hero/Headers: text-4xl (36px) font-semibold
  - Section titles: text-xl (20px) font-semibold
  - Body/Interface: text-base (16px) font-normal
  - Labels: text-sm (14px) font-medium
  - Code preview: text-sm font-mono

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-6
- Section spacing: gap-8, py-12
- Tight groupings: gap-2, gap-4
- Container max-width: max-w-7xl

## Core Layout Structure

**Two-Panel Split Interface**:
- Left Panel (40%): Input + controls
  - Large textarea for prompt input (min-h-64)
  - Generate button (prominent, full-width)
  - Generation history list below
- Right Panel (60%): Live preview
  - Full-height iframe preview with border
  - Download button floating top-right
  - Loading state overlay during generation

**Header**: 
- Logo + brand name (left)
- "New Generation" button (right)
- Fixed height h-16 with border-b

## Component Library

**Input Components**:
- Textarea: Rounded borders (rounded-lg), generous padding (p-4), monospace font, min-h-64
- Buttons: Primary (solid), Secondary (outline), rounded-lg, px-6 py-3, font-medium
- History cards: Compact list items with timestamp, truncated prompt preview, click to load

**Preview Panel**:
- Iframe: Full width/height with rounded-lg border
- Loading skeleton: Animated pulse effect during generation
- Download button: Fixed position top-4 right-4 with backdrop blur

**Status Indicators**:
- Generation progress: Linear progress bar at top of preview
- Success/error states: Toast notifications (top-right)

## Visual Hierarchy
- Clear distinction between input (left) and output (right)
- Generate button is the primary CTA - largest interactive element
- History is secondary, smaller and tucked below input
- Preview dominates right side with minimal chrome

## Responsive Behavior
- Desktop (lg+): Two-panel side-by-side
- Tablet (md): Stack vertically - input full-width, preview below
- Mobile: Single column, preview height limited to 60vh

## Animations
Minimal and purposeful:
- Button hover: Subtle scale (scale-105) and shadow transition
- Loading: Smooth pulse on skeleton, linear progress animation
- Toast notifications: Slide-in from top-right
- NO scroll animations, NO complex transitions

## Images
**No hero images needed** - this is a functional tool interface. Focus is on the code editor aesthetic and clean workspace layout.

## Key Interactions
- Auto-save prompts to history after successful generation
- Click history item to reload prompt and preview
- Clear preview button to reset workspace
- Keyboard shortcut (Ctrl/Cmd + Enter) to trigger generation