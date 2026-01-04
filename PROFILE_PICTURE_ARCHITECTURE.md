# Profile Picture Architecture Rules

## 🚨 CRITICAL RULES (MUST FOLLOW)

### Core Principle
**Upload APIs are NEVER fetch APIs.**

### Rule 1: No API to Fetch Profile Pictures
- There is **NO API** to fetch profile pictures
- Profile picture is returned as part of the user object (field: `profileImage`)
- The `PUT /api/users/profile-picture` API is **UPLOAD ONLY**

### Rule 2: Page Load Behavior
- **DO NOT** call the profile-picture upload API on page load
- Use already-available user data (from auth context / get-me API)
- **DO NOT** call profile-picture API on page load

### Rule 3: Rendering Logic
- If `user.profileImage` is a non-empty string:
  - Render image using that URL
- Else:
  - Render a default avatar image

### Rule 4: Upload Flow
- Only call profile-picture API when user **selects a new image**
- After successful upload:
  - Update local user state with returned `profileImage`
  - Re-render UI (no reload)

### Rule 5: Failure to Follow = Bug
Failure to follow these rules is considered a bug.

---

## Implementation Checklist

When implementing profile picture functionality:

- [ ] Use `user.profileImage` from user object (not a separate API call)
- [ ] Never call `PUT /api/users/profile-picture` on page load
- [ ] Only call upload API when user explicitly selects a new image
- [ ] Update local state after successful upload (no page reload)
- [ ] Show default avatar when `profileImage` is empty or undefined
- [ ] Use existing user data from auth context/get-me API on page load

---

## Mental Model
**Upload APIs are NEVER fetch APIs.**

---

## Implementation Files

### Utility Functions
- `src/app/types/user.ts` - `getUserProfileImage()` helper function
  - Prioritizes `profileImage` over `avatar`
  - Returns default avatar if no profile image is available
  
### API Functions
- `src/api/auth/users/uploadProfilePicture.ts` - Profile picture upload API
  - **DO NOT** call on page load
  - Only call when user selects a new image
  - Returns `profileImage` URL to update local state

### Type Definitions
- `User` interface includes `profileImage` field (primary) and `avatar` (backward compatibility)

