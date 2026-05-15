# 02 — Onboarding (7 steps)

**Web reference:** `src/pages/Onboarding.tsx`

## Steps (matches web exactly)

1. **Welcome** — animated logo, value props
2. **Education level** — High School / University radio
3. **Grade / Year** — picker (JSS1..SS3 / 100..600)
4. **School name** — text input (optional)
5. **Subjects of interest** — chip multi-select
6. **Study persona** — Chill / Balanced / Beast (3 cards)
7. **Daily goal** — slider (15min..180min)

## Visual

- Full-screen with safe-area padding
- Top: progress dots (7 dots, active = `bg-primary`, others `bg-muted`)
- Center: step content (`MotiView` slide+fade between steps)
- Bottom: `Back` text button + `Continue` primary button
- Each step has a hero illustration / emoji at the top — same as web

## Component pattern

```tsx
const [step, setStep] = useState(0);
const steps = [WelcomeStep, EduLevelStep, GradeStep, SchoolStep, SubjectsStep, PersonaStep, GoalStep];
const StepComp = steps[step];

<View className="flex-1 bg-background">
  <ProgressDots count={7} active={step} />
  <AnimatePresence exitBeforeEnter>
    <MotiView
      key={step}
      from={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -30 }}
      className="flex-1 px-6"
    >
      <StepComp value={data} onChange={setData} />
    </MotiView>
  </AnimatePresence>
  <Footer onBack={...} onNext={...} />
</View>
```

## Persona cards

Match the web visual: large emoji (🌱 ⚖️ 🔥), title, description, soft `bg-primary/10` when selected with `border-primary border-2 rounded-3xl`.

## Persist

On final step: update `profiles` table:
```ts
await supabase.from('profiles').update({
  grade_level, school_name, study_persona, /* daily_goal_minutes if column exists */
}).eq('user_id', user.id);
```

Then `nav.reset({ index: 0, routes: [{ name: 'MainTabs' }] })`.

## Animations

- Hero icon pulses (Moti loop)
- Continue button has subtle gradient shimmer (LinearGradient + animated x position)

## Acceptance

- [ ] All 7 steps reachable and validate
- [ ] Profile saves correctly
- [ ] User lands on Dashboard after completion
- [ ] Back button never escapes onboarding
