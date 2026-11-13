# Marketing Walkthrough Video Plan: Edu-Business Operations CRM

## Goal
Build and render a single, high-impact marketing walkthrough video (1080p 16:9) using Remotion that systematically demonstrates all 10 core features of the Edu-Business Operations CRM with kinetic typography, feature badges, and smooth transitions.

## Tasks
- [x] Task 1: Unify storyboard and screen timing into a single marketing manifest in `video/src/marketing-screens.json` → Verify: 10 features mapped with hook intro & outro CTA.
- [ ] Task 2: Build enhanced marketing motion components (`MarketingOverlay.tsx`, `FeatureCallout.tsx`, `IntroOutroCard.tsx`) in `video/src/components/` → Verify: Clean TypeScript compilation.
- [ ] Task 3: Assemble `MarketingWalkthroughComposition.tsx` in `video/src/` sequencing Intro → 10 Feature Slides → Outro CTA → Verify: Registered in `video/src/Root.tsx`.
- [ ] Task 4: Render test keyframe still image to verify visual hierarchy → Verify: PNG generated in `output/marketing-preview.png`.
- [ ] Task 5: Render final production video with Remotion CLI → Verify: `output/marketing-walkthrough.mp4` generated in 1080p.

## Done When
- [ ] Single unified marketing walkthrough MP4 rendered to `output/marketing-walkthrough.mp4`.
- [ ] All 10 features showcased with animated value props and how-it-works callouts.
- [ ] Video previewable in Remotion Studio via `npm run dev`.
