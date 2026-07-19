# ELEVATE CREATIVE — Design System (design.md)

מסמך העיצוב של האתר: הטוקנים, השפה הוויזואלית, הקומפוננטות והמוֹשן.
מתאר את מה שקיים **בפועל** בקוד (`index.html`, `src/styles/main.css`, `src/main.js`
והמודולים), ומשמש כמקור אמת אחד למי שממשיך לעצב או לפתח.

> להשלמה: `SPEC.md` מתאר את הסיפור וההחלטות. **`design.md` (המסמך הזה)** מתאר את
> מערכת העיצוב עצמה — הצבעים, הטיפוגרפיה, המרווחים, הקומפוננטות וההתנהגות.

- **מותג:** Elevate Creative — סוכנות דיגיטל וקריאייטיב, בניית אתרי פרימיום.
- **שפה:** עברית, **RTL** מלא + מצב **אנגלית / LTR** מלא (מתג HE·EN).
- **אופי:** מינימליזם פרימיום, כהה־חם, טיפוגרפיה ענקית, "חץ חי" מרכזי, אפקטי blend.
- **השראה:** off-brand.com — מותאם לזהות ולוגו של Elevate (החץ הכחול).

---

## 1. עקרונות עיצוב

1. **פחות זה יותר.** שדה צבע מינימלי, הרבה אוויר, איפוק. הצבע מגיע מהחץ ומהגרדיאנטים.
2. **טיפוגרפיה כגיבורה.** כותרות ענק במשקל בינוני (500), לא Bold כבד.
3. **אלמנט חי אחד.** החץ הכחול נודד דרך הסקשנים, נושם, נשען אחרי העכבר.
4. **הצבע מגיע מהאור.** גרדיאנטים נוזליים, glow, aura per-scene — לא משטחי צבע מלאים.
5. **קריא בכל מצב.** שני נושאים (כהה/בהיר) + ניגודיות גבוהה, ואפקט ה־blend שומר על קריאוּת.
6. **תנועה שמשרתת.** כל אנימציה מכבדת `prefers-reduced-motion` וניתנת לכיבוי ידני.
7. **RTL ראשון.** לוגיקת פריסה בנויה RTL, ומתהפכת נקי ל־LTR דרך logical properties.

---

## 2. טוקני צבע (CSS Custom Properties)

כל הצבעים מוגדרים כמשתני CSS על `:root` ומתחלפים לפי הנושא. **אלו מקור האמת** —
אין להזין ערכי צבע קשיחים בקומפוננטות חדשות אלא להשתמש במשתנים.

### מצב כהה (ברירת מחדל · `data-theme="dark"`)

| טוקן | ערך | שימוש |
|---|---|---|
| `--bg` | `#161616` | רקע ראשי |
| `--ink` | `#d9d7d1` | טקסט ראשי (לבן־חם עמום) |
| `--ink-dim` | `rgba(217,215,209,.5)` | טקסט משני / תוויות |
| `--cream` | `#eae6dd` | אקסנט / כפתורים / ידית מתג |
| `--blend-ink` | `#dcdcdc` | דיו הכותרות עם `mix-blend` (ראה §6) |
| `--blue` | `#0088ff` | **צבע המותג** — חץ, קישורים, אקסנטים, פוקוס |
| `--line` | `rgba(234,230,221,.14)` | קווים, גבולות, מפרידים |
| `--takeover-ink` | `#f1efe9` | טקסט מעל גרדיאנט ה־takeover התחתון |
| `--takeover-dim` | `rgba(241,239,233,.6)` | טקסט משני מעל ה־takeover |
| `--takeover-line` | `rgba(241,239,233,.2)` | קווים מעל ה־takeover |

### מצב בהיר (`data-theme="light"`)

| טוקן | ערך |
|---|---|
| `--bg` | `#e9e7e2` |
| `--ink` | `#1c1c1e` |
| `--ink-dim` | `rgba(28,28,30,.55)` |
| `--cream` | `#1c1c1e` *(מתהפך לכהה)* |
| `--line` | `rgba(28,28,30,.16)` |
| `--takeover-ink` | `#16161a` |
| `--takeover-dim` | `rgba(22,22,26,.62)` |
| `--takeover-line` | `rgba(22,22,26,.18)` |
| `--blue` | `#0088ff` *(זהה בשני המצבים)* |
| `--blend-ink` | `#dcdcdc` *(נשאר בהיר בשני המצבים — הכרחי ל־blend, §6)* |

### ניגודיות גבוהה (`html.a11y-contrast` — תוסף הנגישות)

מבטל את הנושא הבהיר וכובה את השכבות הדקורטיביות (`aura`, `grain`, `takeover`, `orbits`).

```
--bg:#000; --ink:#fff; --ink-dim:rgba(255,255,255,.82);
--cream:#fff; --blend-ink:#fff; --line:rgba(255,255,255,.42);
```

### צבעי אקסנט / glow (לא טוקנים — ערכים ישירים בשכבות הדקורטיביות)

| הקשר | צבעים |
|---|---|
| Glow חץ (hero) | `rgba(60,120,255,.5)` → `rgba(120,70,255,.28)` |
| מילוי החץ | radial `#2f6dff → #0a2f9e → #061d66` (+ `hue-rotate` per-scene) |
| Aura · about | סגול `rgba(120,90,255,.24)` |
| Aura · services | טורקיז `rgba(40,200,210,.20)` |
| Aura · process | ירוק `rgba(60,210,150,.20)` |
| Takeover (כהה) | `#0a1030 → #150b30 → #0a1740` + blobs כחול/סגול |
| Takeover (בהיר) | `#e2efff → #efe9ff → #fff2e2` + blobs כחול/שמנת |
| Selection | `rgba(0,136,255,.32)` על `#fff` |

---

## 3. טיפוגרפיה

### משפחות גופנים (טוקנים)

```
--f-sans: "Heebo", system-ui, sans-serif;          /* עברית + ברירת מחדל */
--f-mono: "JetBrains Mono", ui-monospace, monospace; /* תוויות מטא, מספרים */
```

- **Heebo** (Google Fonts) — כותרות + גוף. משקלים בשימוש: **300 / 400 / 500 / 600 / 700 / 800**.
  ברירת מחדל של הגוף: `font-weight: 300`, `line-height: 1.5`.
- **JetBrains Mono** — תוויות `(01) · WHO WE ARE`, מספרים, `BUILD`, altimeter. משקלים 400/500.
- **מצב אנגלית (`:root[lang="en"]`)** מחליף את ה־sans ל־**Archivo** (grotesk פרימיום)
  לטקסט לטיני: `--f-sans: "Archivo", "Heebo", system-ui, sans-serif`.
- **Stardom** (`@font-face` מקומי, `src/assets/Stardom-Regular.woff2`) — לוגו הקונספט VIGDER בלבד.

### סקאלת טיפוגרפיה (fluid · `clamp`)

כל הגדלים fluid כדי לשמור על יחס בכל מסך. הערכים המרכזיים:

| מחלקה | תפקיד | גודל | משקל | line-height | letter-spacing |
|---|---|---|---|---|---|
| `.wm .line > span` | wordmark ELEVATE (hero) | `clamp(3.2rem, 24vw, 26rem)` | 500 | 0.86 | −0.05em |
| `.big` | כותרות סקשן ענק | `clamp(2.4rem, 8vw, 8rem)` | 500 | 0.96 | −0.02em |
| `.pw` | מילות "מעבר" מעל החץ | `clamp(1.6rem, 5.5vw, 4.5rem)` | 600 | — | −0.02em |
| `.service__name` | שם שירות | `clamp(1.6rem, 4.4vw, 3.1rem)` | 500 | 1.02 | −0.02em |
| `.step__name` | שם שלב בתהליך | `clamp(1.4rem, 2.6vw, 2.2rem)` | 500 | — | −0.01em |
| `.cta-band__track span` | marquee | `clamp(1.6rem, 5vw, 4rem)` | 700 | — | −0.01em |
| `.services__intro` | אינטרו | `clamp(1.1rem, 2vw, 1.6rem)` | 500 | 1.35 | — |
| body / lead | גוף | `clamp(1rem, 1.5vw, 1.2rem)` | 300 | 1.5–1.65 | — |
| `.mono-label` | תווית מטא | `0.74rem` | — | — | 0.18em · UPPERCASE |

**כללים:** כותרות ענק תמיד במשקל **500** (לא bold). `text-wrap: balance` על `.big`.
רוחב שורה נוח לטקסט: `max-width` של ~30–56ch על פסקאות.

---

## 4. פריסה, מרווח וגריד

### טוקני פריסה

```
--gutter: clamp(1.25rem, 4vw, 3.5rem);   /* ריפוד אופקי אחיד */
--maxw:   1600px;                         /* רוחב תוכן מקסימלי */
--ease:   cubic-bezier(0.16, 1, 0.3, 1); /* ה-easing היחיד בכל המערכת */
```

- **קונטיינר:** `.section` — `max-width: var(--maxw)`, `margin-inline: auto`, ריפוד
  `clamp(5rem,11vh,8rem) var(--gutter)`, `min-height: 100svh` (בדסקטופ; מתבטל במובייל).
- **מרווחים:** תמיד `clamp()` fluid, לא ערכים קבועים. קנה־מידה טיפוסי:
  `0.4rem → 0.8rem → 1.4rem → 2.6rem → clamp(3rem,8vw,6rem)`.
- **גריד עבודות (bento):** `repeat(2, 1fr)`, `gap: clamp(.8rem,1.4vw,1.3rem)` → עמודה אחת מתחת ל־720px.
- **גריד שירותים:** מובייל דו־שורתי (`no name` / `no desc`); ≥760px שלוש עמודות
  `4.5rem minmax(15rem,26rem) 1fr`.
- **גריד תהליך:** עמודה אחת → `repeat(4,1fr)` ב־≥760px.

### נקודות שבירה (Breakpoints)

| Breakpoint | מה משתנה |
|---|---|
| `min-width: 760px` | שירותים/תהליך עוברים לפריסה אופקית רחבה |
| `min-width: 880px` | `manifesto__foot` הופך לשתי עמודות |
| `max-width: 720px` | קישורי ניווט מוסתרים, bento לעמודה, CTA ברוחב מלא |
| `max-width: 760px` / `hover:none` | **מסלול מובייל** — ראה §9 |

### שכבות (z-index)

| שכבה | z-index |
|---|---|
| aura / takeover / ascent | `-2` |
| mark (חץ) / orbits | `-1` (רגיל) · `101` בטעינה · `6` בסקשן work |
| main | סטטי (ללא z-index — קריטי ל־blend) |
| passwords | `4` |
| nav | `30` |
| altimeter / mprogress | `30`–`34` |
| dock / a11y | `40` |
| grain | `50` |
| cursor | `80` |
| a11y-modal | `95` |
| preloader | `100` |
| skip-link | `120` |

---

## 5. האלמנט המרכזי — "החץ החי" (`.mark`)

החתימה הוויזואלית. חץ דו־מימדי (`viewBox 0 0 120 132`) עם גרדיאנט נוזלי זורם.

- **צורה:** SVG path, נחתך ל־blobs דרך `clipPath` מנורמל (`clipPathUnits="objectBoundingBox"`).
- **מילוי חי:** רקע radial כחול + 4 `.blob` מטושטשים (`blur(22px)`, `mix-blend-mode: screen`)
  שנעים באנימציות `blobA–D` (7.5s–11.5s, alternate) + `.mark__shine` לבן שעוקב אחרי העכבר.
- **התנהגות (main.js):** נשימה (scale) מתמשכת · הטיה תלת־ממדית עדינה לכיוון הסמן ·
  נדידה בגלילה בין הסקשנים · squash לפי מהירות.
- **Per-scene tuning:** `body[data-scene="…"]` משנה `--arrow-hue` ואת ה־glow:
  about `+28deg` (סגול), services `−24deg` (טורקיז), work `+14deg`, process `−40deg` (ירוק).
- **גודל:** `clamp(290px, 44vw, 640px)`, `aspect-ratio: 120/132`.
- **בטעינה:** מתגלה כ־outline כחול (`.mark__outline`) שהמילוי "עולה" לתוכו (clip inset).
- **בסוף:** מתפוגג לתוך ה־takeover התחתון.
- **החץ = ה־"A"** בלוגו `ELEV⌃TE`, ב־favicon (SVG inline) ובמסך הטעינה.

**מגבלה מבנית:** ה־mark יושב ב־`z-index:-1` ו־`main` חייב להישאר `position: static`
בלי `z-index`/`transform`, אחרת ה־blend לא "מגיע" לחץ. אין לשבור זאת.

---

## 6. אפקט הטקסט (`.blend`) — החתימה

הכותרות הענקיות והמילים מעל החץ משתמשות ב־**`mix-blend-mode: exclusion`** עם דיו בהיר
(`--blend-ink: #dcdcdc`) **בשני הנושאים**:

- מעל רקע **בהיר** → נרנדר **כהה** (קריא).
- מעל רקע **כהה** → נרנדר **בהיר** (קריא).
- מעל **החץ הצבעוני** → האותיות **מחליפות גוון** בעדינות.

> נבחר `exclusion` על פני `difference` — "הפרש" רך ומעומעם, בלי קרנבל צבעים משלים חד.
> ה־wordmark של ה־hero הוא היוצא מן הכלל: אותיות מלאות לבן/שחור (בלי blend).

במובייל וב־high-contrast ה־blend מכובה (`mix-blend-mode: normal`) והטקסט מקבל `--ink` מלא —
ראה §9.

---

## 7. קומפוננטות

### ניווט עליון (`.nav`)
קבוע למעלה, `flex-direction: row-reverse` (הלוגו פיזית משמאל ב־RTL). מכיל: לוגוטייפ
`ELEV⌃TE Creative` (החץ כ־A, `--blue` על `Creative`), קישורי מניפסט/עבודות, ו־CTA "צרו קשר".
במצב takeover הטקסט מתהפך ל־`--takeover-ink`.

### כפתורים
| רכיב | סגנון |
|---|---|
| `.nav__cta`, `.pill` | pill (`border-radius: 999px`), גבול `--line`, hover → מילוי `--cream` וטקסט כהה |
| `.wa-btn` | כפתור WhatsApp — גרדיאנט כחול `#1f9bff→#0a6ff0`, shimmer + pulse, צל כחול |
| `.phones__toggle` | pill מתאר כחול, נפתח לרשימת טלפונים (accordion) |
| `.textlink` | קישור טקסט עם קו תחתון, החץ `--blue`, hover מרחיב `gap` |

כל הכפתורים משתמשים ב־`--ease` וב־transition של ~0.35–0.5s.

### Dock צף (`.dock`) — ניווט סקשנים + מתגים
מעוגן פיזית לפינה תחתונה־ימנית. FAB המבורגר (54×54, `border-radius: 16px`, `backdrop-filter: blur(12px)`)
פותח פאנל זכוכית עם: ניווט ממוספר `00–05`, מתג נושא (`.theme-toggle` — track+knob),
ומתג שפה (`.lang-toggle` HE·EN).

### תוסף נגישות (`.a11y`) — FAB נוסף לצד ה־dock
פאנל עם: הגדלת/הקטנת גופן (stepper), ניגודיות גבוהה, קו תחתון לקישורים, גופן קריא (Arial),
סמן גדול, עצירת אנימציות, ו־modal הצהרת נגישות. ההעדפות נשמרות ב־`localStorage` ומוחלות
לפני הרינדור. כולל skip-link, `focus-visible` (מתאר `--blue` 2px), ו־`.sr-only` לכותרות SEO.

### רשימת שירותים (`.service`)
שורות עם מספר mono, שם, תיאור. במצב פעיל/hover: ריפוד־התחלה גדל, "glaze" כחול (`::before`),
פס אור כחול זוהר בהתחלה (`::after`), ו־`text-shadow` כחול על השם. במובייל ה־JS מפעיל `.is-active`
על הכרטיס המרכזי (touch לא מפעיל hover).

### גריד עבודות / כרטיסים (`.tile`)
`border-radius: 20px`, `aspect-ratio: 16/11`, מדיה גרדיאנט + מסגרת "blueprint" מקווקוות.
לכל כרטיס **צבע glow חתימה** (משתנה `--glow` כ־R,G,B) שנדלק ב־hover / כשמרכזי במובייל:
- `tile--feature` (Job Power) — סגול `108,96,245`
- `tile--vg` (VIGDER) — כחול קרח `107,170,255`
- `tile--um` (UMBRAS) — ענבר `232,163,61`
- `tile--next` (הזמנה) — טורקיז `69,224,192` + טבעת פועמת
hover מרים `translateY(-6px)`, מגדיל מדיה, מסובב את ה־`+`.

### תהליך (`.step`)
4 שלבים, כל אחד עם מספר mono כחול, שם, תיאור, וקו כחול עליון (`::after`) שנמתח מ־0 ל־100%
כשנכנס לתצוגה (`.is-in`).

### רצועת CTA (`.cta-band`)
marquee אינסופי (`animation: marquee 46s linear`), משקל 700, טקסט כהה על הגרדיאנט.
במצב LTR האנימציה מתהפכת (`marqueeLtr`).

### קשר (`.contact`) + Takeover
כותרת "מוכנים לעלות שלב?", כפתור WhatsApp, רשימת טלפונים נפתחת, וקישורי footer.
יושב מעל גרדיאנט ה־**takeover** שנפתח כמעגל (`clip-path: circle()`) מהמקום שאליו יורד החץ.

### סמן מותאם (`.cursor`)
נקודה כחולה זוהרת (`--blue`) + טבעת `mix-blend-mode: difference` (מתהפכת מעל כל צבע).
ב־hover הטבעת גדלה. מכובה בנייד ובמצב reduced-motion (חוזרים לסמן OS).

### שכבות אווירה
`.aura` (tint per-scene, crossfade), `.orbits` (טבעות מסתובבות), `.grain` (רעש 4% overlay,
`mix-blend-mode: overlay`), `.altimeter` (מד גובה אנכי שעולה עם הגלילה).

---

## 8. מוֹשן ואינטראקציה

- **מנוע:** Lenis (smooth scroll) + **GSAP ScrollTrigger** לכל הכוריאוגרפיה.
- **Easing יחיד:** `--ease: cubic-bezier(0.16, 1, 0.3, 1)` — בכל ה־transitions.
- **חשיפת טקסט:** כותרות עולות ממסכה שורה־שורה; פסקאות מילה־מילה; תוויות/כרטיסים בהחלקה מדורגת.
  החשיפה **חוזרת** בגלילה מעלה/מטה.
- **Hero intro:** המילים עולות אחרי שהחץ "נורה" ומסך הטעינה מתרומם.
- **החץ:** נשימה + הטיה אחרי העכבר + נדידה בגלילה + squash לפי מהירות.
- **פרטים:** marquee רץ, טבעות מסתובבות, כפתורים מגנטיים (`data-magnetic`), shimmer על WhatsApp.
- **`prefers-reduced-motion`** ותוסף "עצור אנימציות" מכבים הכול (`html.a11y-no-motion`).

---

## 9. מסלול מובייל (Performance)

מתחת ל־760px / במכשירי מגע ה־GPU לא עומד בעומס compositing, ולכן **שומרים על המראה ומורידים את המשקל**:

- ללא `grain`, `orbits`, `mark__shine`; ה־blobs עם blur קל בלי `screen`.
- `mix-blend-mode: normal` — כותרות מקבלות `--ink` מלא (קריא, לא מחושב כל פריים).
- ללא `backdrop-filter` — פאנלים מלאים אטומים.
- ללא smooth-scroll hijack וללא עבודת חץ מונחית־גלילה.
- מוסיפים: פס התקדמות עליון (`.mprogress`) ונקודות סקשן (`.mdots`) במקום ה־altimeter.

---

## 10. RTL / LTR ונושאים

- **RTL (ברירת מחדל):** `<html lang="he" dir="rtl">`. הפריסה בנויה עם **logical properties**
  (`inset-inline`, `padding-inline`, `margin-inline`) כדי שההיפוך יהיה נקי.
- **LTR (אנגלית):** `:root[lang="en"][dir="ltr"]` — הלוגו חוזר שמאלה, ה־sans הופך ל־Archivo,
  ה־marquee וכיווני החצים מתהפכים. הבחירה נשמרת (`localStorage: elevate-lang`).
- **מתג נושא:** נשמר ב־`localStorage: elevate-theme`; סקריפט inline ב־`<head>` מחיל את הנושא,
  השפה והגדרות הנגישות **לפני הרינדור הראשון** → אין הבהוב.
- **Takeover:** בתחתית ה־UI מתהפך (`body.is-takeover`) לטקסט מותאם לגרדיאנט הבהיר.

---

## 11. נגישות (מובנֶה)

- Skip-link, `focus-visible` גלוי (`outline: 2px var(--blue)`), כותרות `.sr-only` ל־SEO/מסך.
- תוסף נגישות מלא (§7) עם 6 הגדרות שנשמרות ומוחלות לפני הרינדור.
- `prefers-reduced-motion` מכובד לאורך כל המערכת.
- ניגודיות גבוהה מבטלת שכבות דקורטיביות ומעלה את הטקסט ל־`#fff` על `#000`.
- הצהרת נגישות ב־modal + מסמכים משפטיים ב־footer.

---

## 12. סטאק טכני

- **Build:** Vite · **JS:** Vanilla ES modules (בלי framework).
- **תלויות בשימוש בפועל:** `gsap` (+ ScrollTrigger), `lenis`.
- **אפקטים:** SVG + CSS + `clip-path` + `mix-blend` + Canvas 2D (`ascent` — אבק עולה).
- הערה: `three` ו־`hls.js` קיימים ב־`package.json` אך **אינם מיובאים** בקוד הנוכחי
  (האפקטים עברו ל־2D/CSS). מועמדים להסרה בניקוי תלויות.

```
index.html            — מבנה, meta/SEO, JSON-LD, preloader, mark, clipPath, boot-script
src/main.js           — תזמור: חץ, גלילה, סמן, נושא, שפה, takeover, אנימציות
src/styles/main.css   — כל העיצוב + שני הנושאים + high-contrast + מובייל
src/modules/          — smoothScroll · cursor · a11y · ascent · i18n
src/assets/           — Stardom (גופן) · jobpower-logo.png
```

---

## 13. תוכן ופרטים (מקור אמת)

- **מייסדים:** אוראל (Orel) ואגם (Agam).
- **טלפונים:** אוראל `054-667-9080` · אגם `054-390-4753`.
- **WhatsApp:** `wa.me/972555191163`.
- **דומיין:** https://elevatecreative.co.il
- **סקשנים:** Hero → מניפסט/אודות (01) → שירותים (02) → עבודות (03) → תהליך (04) → קשר (05) → footer.
- **עבודות:** Job Power (לקוח חי) · VIGDER, UMBRAS (קונספט) · כרטיס "העסק הבא" (הזמנה).

---

*המסמך מתאר את מערכת העיצוב הקיימת ומתעדכן ככל שהמערכת מתפתחת.*
