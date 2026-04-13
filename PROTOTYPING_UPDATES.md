# Component Prototyping & Interaction Updates

## Overview

This document outlines all the interactive state management and prototyping enhancements added to Lynk components. All components now support user interactions with state transitions between variants while maintaining complete separation from backend integration.

---

## ✅ Components Updated with Full Interactivity

### 🔘 Button Components

#### **RatingButton**

- **Enhancement**: Added press feedback state tracking
- **State Management**: Tracks internal pressing state for visual feedback
- **Interaction Pattern**: Toggle between Default/Selected/Pressed states
- **Callback**: `onPress()` - Execute action without backend integration

#### **RatingButtonRow**

- **Enhancement**: Added internal selection state management
- **State Management**: Manages Positive/Negative/None selection independently
- **Interaction Pattern**: Click either button to toggle selection; internally tracks state
- **Callback**: `onRatingChange(selection)` - Receives the rating selection
- **Backend Agnostic**: State changes trigger callback without blocking

#### **CategorySelectButton**

- **Enhancement**: Added independent selection state management with optional callback
- **State Management**: Can track its own selected state when not externally controlled
- **Interaction Pattern**: Toggles between Default/Selected/Error on press
- **Callback**: `onPress(category, isSelected)` - Passes category and selection state
- **Dual Mode**: Works standalone or controlled by parent component

---

### 🎯 Filter Components

#### **HistoryFilterPill**

- **Enhancement**: Now manages internal toggle state
- **State Management**: Converts `state` prop from required to optional; manages internally if not provided
- **Interaction Pattern**: Press to toggle between active/inactive
- **Callback**: `onPress(isActive)` - Receives toggle state
- **Usage Pattern**: Can use independently or controlled via parent

#### **ShopFilterPill**

- **Enhancement**: Now manages internal toggle state
- **State Management**: Converts `state` prop from required to optional; manages internally if not provided
- **Interaction Pattern**: Press to toggle between active/inactive
- **Callback**: `onPress(isActive)` - Receives toggle state
- **Visual Feedback**: Color and border changes on activation

#### **FilterToggle**

- **Enhancement**: Added internal toggle state management
- **State Management**: Manages selected state independently if not provided externally
- **Interaction Pattern**: Press to toggle selection with color feedback
- **Callback**: `onPress(isSelected)` - Receives selection state
- **Color Mapping**: Automatically maps labels to category colors (Favor, Study, Item)

#### **CategoryFilterBar**

- **Enhancement**: Added internal filter state management
- **State Management**: Manages which filter is active if not externally controlled
- **Interaction Pattern**: Select one filter from [Default, Favor, Study, Item]
- **Callback**: `onFilterChange(filter)` - Receives selected filter
- **Visual Feedback**: Color-coded active/inactive states

---

### 📥 Input Components

#### **DropdownSelectField**

- **Enhancement**: Full dropdown interaction state management
- **State Management**: Manages dropdown open/close state internally
- **Interaction Pattern**:
  - Press to toggle dropdown open/close
  - Visual indicator changes (chevron rotates)
  - Border and text color change on interaction
- **Callback**: `onPress(isOpen)` - Receives dropdown open state
- **State Mapping**: Converts internal open state to visual Active state

#### **TextInput**

- **Status**: ✅ Already has secure text toggle state management
- **Features**: Eye icon toggle, copy button support, error handling

#### **AuthTab**

- **Status**: ✅ Already has tab selection state with callbacks

---

### 🧭 Navigation Components

#### **BottomNavBar**

- **Enhancement**: Added internal active navigation state management
- **State Management**: Manages which nav item is active if not externally controlled
- **Interaction Pattern**: Tap nav item to activate; visual state changes
- **Callback**: `onNavChange(nav)` - Receives selected nav item
- **Nav Options**: Feed, Quests, Post, Shop, Profile
- **Flexible Usage**: Works standalone or controlled by parent navigation system

---

### 👥 Avatar & Badge Components

#### **AvatarGridItem**

- **Enhancement**: Added independent selection state management
- **State Management**: Can track selection state when not externally controlled
- **Interaction Pattern**:
  - Press to toggle selection (shows check badge)
  - Locked state prevents interaction
  - Visual feedback with border colors
- **Callback**: `onPress(isSelected)` - Receives selection state
- **States**: Default, Selected, Locked (with appropriate visual feedback)

#### **BadgeSelectorItem**

- **Enhancement**: Added internal selection state management
- **State Management**: Manages selection independently if not externally controlled
- **Interaction Pattern**:
  - Press to toggle selection
  - Disabled state prevents interaction
  - Check badge appears on selection
- **Callback**: `onPress(isSelected)` - Receives selection state
- **States**: Default, Selected, Disabled (with appropriate visuals)

---

### 📋 Row Components

#### **NotificationRow**

- **Enhancement**: Added mark-as-read interaction capability
- **State Management**: Can manage internal read state
- **Interaction Pattern**: Press to access notifications, optional mark-as-read interaction
- **Callback**:
  - `onPress()` - Navigate to notification
  - `onMarkAsRead(isRead)` - Mark notification as read/unread
- **Type Support**: 9+ notification types with color-coded icons
- **Visual Feedback**: Background color changes for Unread state

#### **ActiveQuestRow**

- **Status**: ✅ Already has good interaction handling
- **Features**: Resolve button for pending quests, press to navigate

#### **CommentRow**

- **Status**: ✅ Presentational component (no state needed)

#### **QuestHistoryCard**

- **Enhancement**: Now uses TouchableOpacity for proper interaction feedback
- **Interaction Pattern**: Press the card to navigate or view details
- **Callback**: `onPress()` - Card interaction
- **Visual Feedback**: Opacity change on press (activeOpacity: 0.7)

---

### 🎴 Card Components

#### **QuestCard**

- **Status**: ✅ Already uses Pressable for interactions
- **Features**: Category badges, reward display, poster info

#### **PostCard**

- **Status**: ✅ Already uses Pressable for interactions
- **Features**: Rich post metadata, interaction handling

#### **ShopItemCard**

- **Status**: ✅ Already has full state management
- **Features**: Item variants (Locked, Owned, Affordable, NotAffordable, Equipped)

---

## 🏗️ State Management Architecture

### Two-Mode Pattern (Dual Control)

Most updated components now support two usage modes:

**1. Uncontrolled Mode (Standalone)**

```tsx
// Component manages its own state
<FilterToggle
  label="Favor"
  onPress={(isSelected) => {
    /* handle selection */
  }}
/>
```

**2. Controlled Mode (Parent Managed)**

```tsx
// Parent manages state via props
const [selected, setSelected] = useState(false);
<FilterToggle
  label="Favor"
  selected={selected}
  onPress={(isSelected) => setSelected(isSelected)}
/>;
```

### Key Pattern

```typescript
const [internalState, setInternalState] = useState(defaultValue);
const displayState =
  externalState !== undefined ? externalState : internalState;

const handleAction = () => {
  const newState = !displayState;
  if (externalState === undefined) {
    setInternalState(newState);
  }
  onCallback?.(newState);
};
```

---

## 🔌 Backend Integration Points

### Callback Architecture

All components delegate actual backend operations to parent/consumer code:

```typescript
// Component only manages local state and calls callbacks
onPress?: (value) => void  // No backend logic
onStateChange?: (newState) => void  // Clean data flow
```

### Consumer Responsibility

```tsx
// Parent/Screen handles backend operations
<Component
  onPress={(category) => {
    // Update UI state
    setSelectedCategory(category);
    // Then call your backend service
    await updateUserPreference(category);
  }}
/>
```

---

## 📊 Interaction Types Added

| Interaction Type        | Components                                                  | Pattern                                      |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| **Toggle/Toggle Group** | FilterPill, FilterToggle, ShopFilterPill, HistoryFilterPill | Press to toggle between two states           |
| **Selection**           | AvatarGridItem, BadgeSelectorItem, CategorySelectButton     | Select one from group; visual feedback       |
| **Navigation**          | BottomNavBar, NavItem                                       | Switch between options; one active at a time |
| **Dropdown**            | DropdownSelectField                                         | Expand/collapse menu on press                |
| **Rating**              | RatingButton, RatingButtonRow                               | Select up/down with visual feedback          |
| **Open/Close**          | NotificationRow                                             | Mark as read/unread                          |
| **Card Interaction**    | QuestHistoryCard, PostCard, QuestCard                       | Tap to navigate/interact                     |

---

## ✨ Visual Feedback Features

All interactive components include:

- ✅ Border color changes on selection/activation
- ✅ Background color transitions
- ✅ Icon/text color adjustments
- ✅ Opacity changes on press (`activeOpacity: 0.7`)
- ✅ Badge indicators (checkmarks for selection)
- ✅ Disabled state visuals (when applicable)

---

## 🚫 Backend Separation

**None of these changes impact backend integration:**

- ✅ All state is local only
- ✅ All API calls remain in parent/screen components
- ✅ Components are pure in terms of data flow
- ✅ Ready for Redux/Context integration
- ✅ No hardcoded backend calls

---

## 🧪 Testing Recommendations

For each enhanced component, test:

1. **Standalone Mode**: Component manages state independently
2. **Controlled Mode**: Parent controls state via props
3. **Visual States**: All visual variants display correctly
4. **Callbacks**: Callbacks fire with correct data
5. **Interaction Flow**: Press/tap actions trigger appropriate state changes
6. **Disabled States**: Disabled components don't respond to interaction

---

## 📝 Component Checklist

- [x] HistoryFilterPill - Toggle state + callback
- [x] ShopFilterPill - Toggle state + callback
- [x] FilterToggle - Toggle state + callback
- [x] CategoryFilterBar - Selection state + callback
- [x] BottomNavBar - Navigation state + callback
- [x] DropdownSelectField - Dropdown state + callback
- [x] AvatarGridItem - Selection state + callback
- [x] RatingButtonRow - Selection state + callback
- [x] CategorySelectButton - Selection state + callback
- [x] BadgeSelectorItem - Selection state + callback
- [x] NotificationRow - Mark-as-read callback
- [x] QuestHistoryCard - Made interactive with TouchableOpacity
- [x] RatingButton - Press feedback state

---

## 🎯 Next Steps

1. **Integration**: Connect callbacks to your backend services in screen/context components
2. **Form Handling**: Use selected states in form submissions
3. **State Management**: Consider Redux/Context for global state if needed
4. **Testing**: Test interaction flows end-to-end
5. **Animation**: Add Animated or Reanimated for enhanced visual feedback

---

## 📚 Usage Example

```tsx
import { FilterToggle, HistoryFilterRow, BottomNavBar } from "./components";

function MyScreen() {
  const [activeNav, setActiveNav] = useState("Feed");
  const [filters, setFilters] = useState({
    all: false,
    posted: false,
    accepted: false,
  });

  const handleNavChange = async (nav) => {
    setActiveNav(nav);
    // Navigation happens here, backend integration at screen level
  };

  return (
    <>
      <HistoryFilterRow
        onFilterChange={async (filter) => {
          // Handle filter application with backend
          const results = await fetchFilteredQuests(filter);
          updateDisplay(results);
        }}
      />

      <BottomNavBar active={activeNav} onNavChange={handleNavChange} />
    </>
  );
}
```

---

**All components are now ready for integration with your backend services!**
