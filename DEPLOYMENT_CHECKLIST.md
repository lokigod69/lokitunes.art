# Deployment Checklist

Use this checklist to deploy Loki Tunes to production.

## Pre-Deployment

### Supabase Setup
- [ ] Create Supabase project
- [ ] Run `supabase-schema.sql` in SQL Editor
- [ ] Create `covers` storage bucket (public)
- [ ] Create `audio` storage bucket (public)
- [ ] Verify RLS policies are enabled
- [ ] Test database connection locally

### Content Upload
- [ ] Upload album cover images to `covers` bucket
- [ ] Upload audio files to `audio` bucket
- [ ] Insert album data into `albums` table
- [ ] Insert songs into `songs` table
- [ ] Insert versions into `song_versions` table
- [ ] Verify all URLs are publicly accessible
- [ ] Test audio playback from Supabase URLs

### Local Testing
- [ ] Create `.env.local` with Supabase credentials
- [ ] Run `pnpm install`
- [ ] Run `pnpm dev`
- [ ] Test orb field loads correctly
- [ ] Test clicking orbs navigates to albums
- [ ] Test audio playback works
- [ ] Test waveform visualization loads
- [ ] Test mini-player appears when playing
- [ ] Test keyboard shortcuts (spacebar)
- [ ] Test volume control and persistence
- [ ] Test on mobile viewport
- [ ] Test reduced motion fallback
- [ ] Test 404 page
- [ ] Test donate page
- [ ] Check browser console for errors

## Deployment to Vercel

### Repository Setup
- [ ] Initialize git repository (if not already done)
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Loki Tunes MVP"
  ```
- [ ] Create GitHub repository
- [ ] Push code to GitHub
  ```bash
  git remote add origin https://github.com/yourusername/lokitunes.git
  git push -u origin main
  ```

### Vercel Configuration
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Configure project:
  - Framework Preset: Next.js
  - Root Directory: `./` (default)
  - Build Command: `pnpm build` (default)
  - Output Directory: `.next` (default)
- [ ] Add Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (~2-3 minutes)

### Post-Deployment Testing
- [ ] Visit deployed URL
- [ ] Test orb field renders
- [ ] Test album navigation
- [ ] Test audio playback
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Check Vercel deployment logs for errors
- [ ] Verify all images load
- [ ] Verify all audio files stream correctly

## Domain Configuration (Optional)

### Custom Domain
- [ ] Go to Vercel project settings
- [ ] Click "Domains"
- [ ] Add your custom domain
- [ ] Update DNS records as instructed
- [ ] Wait for SSL certificate (automatic)
- [ ] Test custom domain works

## Performance Optimization

### Initial Optimizations
- [ ] Enable Vercel Analytics (optional)
- [ ] Check Lighthouse scores
- [ ] Optimize images if needed
- [ ] Consider audio file compression (future)

### Monitoring
- [ ] Set up error tracking (Sentry, optional)
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase usage metrics
- [ ] Monitor storage usage

## Security Checklist

- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Confirm no API keys in source code
- [ ] Verify Supabase RLS policies are active
- [ ] Test that private albums are not accessible
- [ ] Ensure storage buckets have correct permissions

## Documentation Updates

- [ ] Update README with production URL
- [ ] Document any deployment-specific configurations
- [ ] Add screenshots to README (optional)
- [ ] Create user guide if needed

## Post-Launch

### Immediate
- [ ] Share with test users
- [ ] Gather initial feedback
- [ ] Monitor for errors
- [ ] Check performance metrics

### Week 1
- [ ] Review analytics
- [ ] Address any critical bugs
- [ ] Plan first iteration improvements
- [ ] Consider adding more content

### Ongoing
- [ ] Regular content updates
- [ ] Monitor Supabase storage usage
- [ ] Plan Phase 2 features
- [ ] Engage with users

## Rollback Plan

If deployment fails or has critical issues:

1. **Immediate**: Revert to previous Vercel deployment
   - Go to Vercel dashboard
   - Find previous working deployment
   - Click "Promote to Production"

2. **Database**: Supabase has automatic backups
   - Go to Supabase Dashboard > Database > Backups
   - Restore from backup if needed

3. **Code**: Revert git commit
   ```bash
   git revert HEAD
   git push
   ```

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Check browser console and Vercel logs

## Success Criteria

Deployment is successful when:
- ✅ All orbs render correctly
- ✅ Audio playback works smoothly
- ✅ No console errors
- ✅ Mobile experience is functional
- ✅ Accessibility features work
- ✅ Performance is acceptable (< 3s load time)

---

**Ready to deploy?** Start with the Supabase Setup section and work through each checklist item.
