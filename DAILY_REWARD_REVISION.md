# Daily Reward System Revision - Implementation Summary

## Overview
Revised the daily reward logic to show a modal only on the **first login of the day** with a fallback gift icon for claiming rewards later if the user forgets.

## Changes Made

### 1. ✅ **New Component: DailyRewardGiftIcon** 
**File:** `app/components/buttons/DailyRewardGiftIcon.tsx`

Features:
- **Icon**: Gift box (using `MaterialIcons.card-giftcard`)
- **States**:
  - **Claimable**: Red dot on upper-right corner + jumping animation (bounces up and down)
  - **Claimed**: No red dot, no animation
- **Animation**: Jumping effect (smooth bounce up and down) - 500ms up, 500ms down, continuous loop
- **Styling**: Matches NotificationsButton styling with 45x45px size and 12px border radius

### 2. ✅ **Updated HomeFeedScreen**
**File:** `app/screens/main/HomeFeedScreen.tsx`

Changes:
- Imported `DailyRewardGiftIcon` component
- Added gift icon to `headerActions` (before notification icon)
- Passes `isClaimable={dailyRewardClaimable}` and `onPress={onOpenDailyReward}`
- Updated notification badge to show only unread notification count (removed daily reward count from badge)

### 3. ✅ **Updated Button Components Index**
**File:** `app/components/buttons/index.ts`
- Exported `DailyRewardGiftIcon` for use throughout the app

### 4. ✅ **Verified Daily Reward Logic**
**File:** `app/hooks/useDailyReward.ts` (No changes needed)

Logic Flow:
1. **First login of day**: Modal shows automatically
2. **Dismiss modal**: Marked as dismissed for that UTC day, icon still shows if not claimed
3. **Click gift icon**: Opens modal again, can claim
4. **Claim reward**: Updates tokens/XP, icon stops animating, red dot disappears
5. **Next day**: Cycle repeats

## User Flow

```
App Launch (First time today)
├─ Modal shows automatically
├─ User sees Day X reward
└─ Two options:
   ├─ Claim now (modal handles it)
   └─ Dismiss (modal closes, icon shows)

If Dismissed:
├─ Icon shows with red dot + jumping
├─ User can click icon to reopen modal
└─ Can claim anytime before midnight

After Claimed:
├─ Icon shows without red dot
├─ No animation
└─ Ready for next day
```

## Header Layout

Before:
```
[Profile Avatar] LYNK [🔔 Badge]
```

After:
```
[Profile Avatar] LYNK [🎁 RedDot Jumping] [🔔 Badge]
```

## Database

**No SQL migrations required.** The following columns already exist in `profiles` table:
- ✅ `last_reward_claimed_at` - timestamp tracking
- ✅ `current_login_streak` - streak counting

## Styling Details

| Property | Value |
|----------|-------|
| **Icon Size** | 26px |
| **Container** | 45x45px, 12px radius |
| **Red Dot** | 14x14px, centered on top-right |
| **Animation** | Bounce (jumping), 1000ms cycle |
| **Gap from Notification** | 8px (inherited from headerActions) |

## Testing Checklist

- [ ] Modal shows on first app launch
- [ ] Modal doesn't show on subsequent opens same day
- [ ] Gift icon shows red dot when reward is claimable
- [ ] Gift icon jumps/bounces animation when claimable
- [ ] Clicking gift icon opens modal
- [ ] Claiming via modal removes red dot and stops animation
- [ ] Claiming via icon (if modal was skipped) works correctly
- [ ] Next day at midnight, cycle repeats
- [ ] Notification count shows correctly (separate from daily reward)
