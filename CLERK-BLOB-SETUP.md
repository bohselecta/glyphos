# 🔐 Clerk Auth & Vercel Blob Storage Setup Guide

## Quick Setup (5 minutes)

### 1. Clerk Authentication Setup

#### A. Create Clerk Account
1. Go to https://clerk.com
2. Sign up / Sign in
3. Click "Add application"
4. Name it "GlyphOS" or "glyphd"
5. Choose authentication methods (Email, Google, GitHub, etc.)

#### B. Get API Keys
1. In Clerk Dashboard, go to **API Keys**
2. Copy these values:

```bash
# Copy to Vercel Environment Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

#### C. Add to Vercel
1. Go to https://vercel.com/dashboard
2. Select your GlyphOS project
3. Go to **Settings** → **Environment Variables**
4. Add both keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Available to browser)
   - `CLERK_SECRET_KEY` (Server-side only)

#### D. Configure Clerk URLs
In Clerk Dashboard → **Paths**:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in URL: `/`
- After sign-up URL: `/`

---

### 2. Vercel Blob Storage Setup

#### A. Add Blob Storage (One Click!)
1. Go to Vercel Dashboard → Your Project
2. Click **Storage** tab
3. Click **Create Database** → Choose **Blob**
4. Click **Create**
5. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your env vars!

That's it! Vercel handles the rest.

#### B. Verify Installation
Environment variable `BLOB_READ_WRITE_TOKEN` should now appear in:
- **Settings** → **Environment Variables**

---

### 3. Optional: Add KV (Redis) for Real-time

For real-time presence and session management:

1. Vercel Dashboard → **Storage** → **Create Database** → **KV**
2. Click **Create**
3. Auto-adds these env vars:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

---

## 🔧 Integration Code

### Install Clerk & Blob SDKs

```bash
npm install @clerk/nextjs @vercel/blob
```

### Update package.json

Add to dependencies:
```json
{
  "@clerk/nextjs": "^5.0.0",
  "@vercel/blob": "^0.19.0"
}
```

---

## 📝 Implementation Files to Create

### 1. Clerk Provider Wrapper (`lib/clerk-provider.ts`)

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: 'dark', // Your dark theme preference
        variables: {
          colorPrimary: '#a855f7', // Purple accent
          colorBackground: '#0f172a'
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

### 2. User Panel Component (`components/UserPanel.tsx`)

```typescript
import { UserButton, useUser } from '@clerk/nextjs'

export function UserPanel() {
  const { user, isSignedIn } = useUser()
  
  if (!isSignedIn) {
    return (
      <a href="/sign-in" className="user-btn">
        <span>Sign In</span>
      </a>
    )
  }
  
  return (
    <div className="user-panel">
      <span className="user-name">{user.firstName || 'User'}</span>
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "w-10 h-10"
          }
        }}
        afterSignOutUrl="/"
      />
    </div>
  )
}
```

### 3. Blob Storage Helper (`lib/blob-storage.ts`)

```typescript
import { put, del, list } from '@vercel/blob'

export async function uploadFile(file: File, path: string) {
  const blob = await put(path, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN
  })
  
  return blob.url
}

export async function deleteFile(url: string) {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN
  })
}

export async function listUserFiles(userId: string) {
  const { blobs } = await list({
    prefix: `users/${userId}/`,
    token: process.env.BLOB_READ_WRITE_TOKEN
  })
  
  return blobs
}
```

### 4. Collaboration with User Identity (`lib/collab-with-auth.ts`)

```typescript
import { useUser } from '@clerk/nextjs'
import { createOS } from '../sdk'

export function useCollaborativeRoom(roomId: string) {
  const { user } = useUser()
  const OS = createOS()
  
  async function joinRoom() {
    const room = await OS.rooms.join(roomId)
    
    // Set user identity in awareness
    room.awareness.setLocalState({
      userId: user?.id,
      name: user?.fullName || user?.firstName || 'Anonymous',
      email: user?.primaryEmailAddress?.emailAddress,
      avatar: user?.imageUrl,
      color: getUserColor(user?.id || 'anonymous')
    })
    
    return room
  }
  
  return { joinRoom, user }
}

function getUserColor(userId: string): string {
  // Generate consistent color from user ID
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
```

---

## 🔄 Update Your UI Components

### Replace User Button in index.html

Find this in `index.html`:
```html
<button class="user-btn" id="userBtn" title="Account">
  <span class="user-avatar">👤</span>
</button>
```

Replace with:
```html
<div id="user-panel"></div>

<script type="module">
  import { UserButton } from '@clerk/nextjs'
  
  // Mount user button
  const panel = document.getElementById('user-panel')
  if (panel) {
    // Render Clerk UserButton or sign-in link
  }
</script>
```

---

## 🧪 Testing the Integration

### 1. Test Clerk Auth
```javascript
// In browser console
const { useUser } = await import('@clerk/nextjs')
const { user, isSignedIn } = useUser()
console.log('User:', user)
console.log('Signed in:', isSignedIn)
```

### 2. Test Blob Upload
```javascript
// Upload a test file
const file = new File(['test'], 'test.txt')
const url = await uploadFile(file, 'test/test.txt')
console.log('Uploaded to:', url)
```

### 3. Test Collaborative Session
```javascript
// Join a room with user identity
const room = await OS.rooms.create({ persistent: true })
console.log('Room ID:', room.id)
console.log('Local peer:', room.localPeer)
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Clerk API keys added to Vercel env vars
- [ ] Blob storage token configured
- [ ] Clerk webhook endpoints configured (optional)
- [ ] Test sign-in flow on staging
- [ ] Test file upload/download
- [ ] Test real-time collaboration with 2+ users
- [ ] Configure Clerk production instance
- [ ] Set up custom domain in Clerk (auth.glyphd.com)

---

## 🔒 Security Notes

### Environment Variables
- ✅ `NEXT_PUBLIC_*` - Safe for browser (public keys)
- ❌ `CLERK_SECRET_KEY` - Never expose (server only)
- ❌ `BLOB_READ_WRITE_TOKEN` - Server-side only

### Clerk Configuration
- Enable 2FA for admin accounts
- Set up webhook signature verification
- Configure allowed domains in Clerk dashboard
- Use rate limiting for API endpoints

### Blob Storage
- Use signed URLs for private files
- Set appropriate access levels (public/private)
- Implement file size limits
- Add virus scanning for user uploads

---

## 📊 Usage Tracking

### Monitor Your Limits

**Clerk Free Tier:**
- 10,000 monthly active users
- Unlimited applications
- Standard authentication methods

**Vercel Blob Free Tier:**
- 500MB storage
- 5GB bandwidth/month
- Unlimited uploads

**Upgrade When:**
- Users > 10K → Clerk Pro ($25/mo)
- Storage > 500MB → Vercel Pro ($20/mo)
- Need advanced features → Custom plan

---

## 🐛 Troubleshooting

### Clerk Issues

**"Invalid publishable key"**
- Check env var name: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Verify key starts with `pk_test_` or `pk_live_`
- Rebuild after adding env vars

**Sign-in redirect loop**
- Check Clerk paths configuration
- Verify callback URLs match your domain
- Clear cookies and try again

### Blob Storage Issues

**"Unauthorized" error**
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check token hasn't expired
- Ensure using server-side API (not client)

**Upload fails**
- Check file size (max 500MB on free tier)
- Verify network connectivity
- Check Vercel storage quota

---

## 📚 Resources

- **Clerk Docs**: https://clerk.com/docs
- **Vercel Blob Docs**: https://vercel.com/docs/storage/vercel-blob
- **GlyphOS Discord**: Coming soon!

---

## 🎯 Next Steps

Once integrated:

1. **Add Profile Pages** - User settings, preferences
2. **Implement Sharing** - Share rooms via Clerk user IDs
3. **Add Notifications** - Real-time alerts for mentions
4. **Build Teams** - Clerk Organizations for team collab
5. **Add Analytics** - Track usage per user

Your federated, authenticated, blob-backed OS is ready! 🚀

