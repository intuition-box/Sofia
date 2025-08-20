# SofIA UI Documentation

This document provides comprehensive UI guidelines and documentation for developers working on the SofIA browser extension.

## Project Overview

**SofIA** (Semantic Organization for Intelligence Amplification) is a multi-component AI-powered system consisting of:
- **ElizaOS Agent** (`agent/`) - AI agent specialized in semantic data structuring for web navigation
- **Browser Extension** (`extension/`) - Chrome extension for data tracking and wallet connection using Plasmo framework
- **MCP Integration** - External Intuition MCP server for blockchain/Web3 knowledge graph integration

## Design System

### Color Palette
SofIA uses a carefully crafted earth-tone color palette:

- **Primary 950**: `#372118` - Deepest brown for dark themes and high contrast elements
- **Primary 700**: `#945941` - Medium brown for secondary elements
- **Primary 500**: `#C7866C` - Main brand color for primary actions and highlights
- **Primary 200**: `#F2DED6` - Light accent for subtle backgrounds and borders
- **Primary 50**: `#FBF7F5` - Lightest tone for main backgrounds and text on dark
- **Black**: `#0E0E0E` - Pure black for text and high contrast elements

### Typography

The extension uses a three-tier typography system:

1. **Fraunces** - Used for welcome messages and special headings
2. **Gotu** - Used for section titles and important headings
3. **Montserrat** - Used for body text, buttons, and general UI elements

### Visual Effects

#### Liquid Glass Effect
All interactive components feature a signature "liquid glass" effect that provides:
- Semi-transparent backgrounds with blur
- Subtle shadows and highlights
- Smooth transitions and animations
- Modern, premium feel

#### Overlay System
Connected pages feature an 18% black overlay (`rgba(0, 0, 0, 0.18)`) to:
- Indicate connected state
- Provide visual hierarchy
- Create depth and focus

## Component Architecture

### Navigation System

The extension features a sophisticated bottom navigation with advanced animations:

#### Bottom Navigation (`BottomNavigation.tsx`)
- **Fixed positioning** at bottom of screen
- **5 navigation items**: Core, Sync, Search, Profile, Settings
- **Sliding background animation** that glides between active items
- **Hover effects** with smooth transitions
- **Active state indicators** with gradient backgrounds

#### Navigation Animation System
The navigation implements two layers of visual feedback:

1. **Active Background**: Slides to the currently selected page
2. **Hover Background**: Appears when hovering over navigation items

**CSS Classes:**
- `.nav-background` - Main sliding background for active state
- `.nav-hover-background` - Secondary background for hover effects
- `.nav-button.active` - Styling for active navigation items

**Animation Logic:**
```typescript
// Position calculation for 5 buttons with space-around distribution
left: `calc(${activeIndex * 20}% + 10% - 30px)`
```

### Button Components

All buttons follow the design system:
- **Text Color**: Primary 50 (`#FBF7F5`) for contrast
- **Background**: Liquid glass effect or solid colors from palette
- **Interactive States**: Hover, active, and disabled states
- **Consistent Sizing**: Minimum 60px width for touch targets

### Icon System

The extension uses a consistent icon system:
- **Size**: 20x20px standard size for navigation icons
- **Color Filtering**: CSS filters for consistent theming
- **Assets Location**: `assets/` directory with SVG format preferred

## Layout Structure

### Page Organization
Each page follows a consistent structure:
```
Header (optional)
├── Page Title
├── Action Buttons
Main Content Area
├── Content Sections
├── Interactive Elements
Bottom Navigation (fixed)
```

### Responsive Design
- **Mobile-first approach**
- **Fixed bottom navigation** for easy thumb navigation
- **Flexible content areas** that adapt to content length
- **Safe areas** consideration for notched devices

## State Management

### Page State
The extension tracks current page state for:
- Navigation highlighting
- Background animations
- Content rendering
- User flow management

### Animation States
- **Active**: Current selected item
- **Hover**: Mouse over state
- **Transition**: Moving between states
- **Loading**: Data fetching states

## Development Guidelines

### Component Structure
```typescript
// Standard component structure
const ComponentName = () => {
  // State management
  // Event handlers
  // Render logic
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  )
}
```

### CSS Organization
- **Component-specific styles** in dedicated CSS files
- **Global styles** for shared components
- **Color variables** using the design system palette
- **Animation timing** consistent across components

### Animation Best Practices
- **Duration**: 0.3s for main transitions, 0.2s for quick interactions
- **Easing**: `ease` for natural feel
- **Performance**: Use `transform` and `opacity` for smooth animations
- **Accessibility**: Respect user preferences for reduced motion

## Asset Management

### Logo Assets
- **Main Logo**: `all_assets/iconcolored.png`
- **Logo + Text**: Available in assets directory
- **Icon Variants**: Various sizes for different use cases

### Icon Guidelines
- **Format**: SVG preferred for scalability
- **Naming**: Descriptive names (e.g., `Icon=access-point.svg`)
- **Optimization**: Minimize file size while maintaining quality
- **Accessibility**: Include alt text and aria labels

## Accessibility

### Color Contrast
All color combinations meet WCAG AA standards:
- Primary 50 on Primary 950: High contrast ratio
- Interactive elements: Clear visual feedback
- Error states: Distinct from normal states

### Interactive Elements
- **Minimum touch targets**: 44x44px for mobile
- **Focus indicators**: Clear keyboard navigation
- **Screen reader support**: Proper ARIA labels
- **Keyboard navigation**: All interactive elements accessible

### Motion and Animations
- **Respect user preferences**: `prefers-reduced-motion` support
- **Essential animations only**: Focus on functional feedback
- **Smooth performance**: 60fps target for all animations

## Development Workflow

### Adding New Components
1. Create component file in appropriate directory
2. Add corresponding CSS file
3. Follow naming conventions
4. Include accessibility features
5. Test across different screen sizes
6. Update documentation

### Modifying Navigation
1. Update navigation structure in `BottomNavigation.tsx`
2. Adjust animation calculations for new items
3. Update routing in `RouterProvider.tsx`
4. Test animation smoothness
5. Verify accessibility

### Color System Updates
1. Update CSS custom properties
2. Test contrast ratios
3. Update component styles
4. Verify consistency across all components
5. Document changes

