# Making the Speak Sarthi illustrations yourself

Everything needed to generate all 1,000 drawings on Higgsfield without help.
Settings, the exact prompt, the gotchas that cost credits, and what to do with
the files afterwards.

---

## 1. Settings

On Higgsfield, pick **Recraft V4.1**. Then one decision:

| | Flat illustration | Realistic photo |
|---|---|---|
| `model_type` | **`vector`** | **`standard`** |
| Cost per image | **2.5 credits** | **1.25 credits** |
| Output format | SVG (true vector) | PNG |
| 1,000 images | 2,500 credits | 1,250 credits |
| Works for abstract words | Yes | **No** — see §6 |

Both: **aspect ratio `4:3`**, **resolution `1k`**.

For `vector` only, set the colour palette so every drawing uses the app's
colours. This is the single most useful setting available — it turns palette
consistency from something you hope for into something the model is forced to do:

```
#146A62   #D98324   #0E2A33   #F2F5F4
```

For `standard` (realistic), leave the palette empty. Pinning colours on a
photograph makes it look tinted and wrong.

---

## 2. The prompt

Every prompt is **two halves: a fixed style block and a changing scene.**

The style block is identical on all 1,000 images. It is the only thing holding
a thousand separate generations together as one set — so do not improve it
partway through. A style block that changes at image 400 gives you two libraries
that do not match.

```
Flat vector illustration, thick uniform outline, flat colour fills only, no gradients, no shading, no texture, simple geometric shapes, single centred subject, plain pale background, generous margins, minimal detail, absolutely no text, no letters, no words, no numbers, no signage. Scene: <THE SCENE>
```

Replace `<THE SCENE>` with that word's scene. Example for `VRB-001 understand`:

```
... no signage. Scene: A lightbulb switching on above someone's head.
```

**For realistic instead**, swap the style block for:

```
photorealistic photograph, natural lighting, gentle shadows, shallow depth of field, clean uncluttered composition, no text, no letters, no signage. Scene: <THE SCENE>
```

---

## 3. You do not have to write 1,000 prompts

They are already written. **`prompts_1000.csv`** has one row per word:

| column | what it is |
|---|---|
| `wordId` | the filename to save as — `VRB-001` → `VRB-001.webp` |
| `word` | the English word, for your own reference |
| `partOfSpeech` | verb, adjective, preposition… |
| `needsReview` | `YES` on 21 rows — **fix these first, see §4** |
| `prompt` | copy this straight into Higgsfield |

The scenes come from the `visualAssociation` field already written for every
word in `words.json`. Nothing was invented.

To rebuild the CSV after editing any scenes:

```bash
python3 build_prompts.py app/src/main/assets/seed/words.json prompts_1000.csv
```

---

## 4. Fix these 21 words before you start

Their scene descriptions ask for **text inside the picture**, which the style
brief rules out — a screen reader cannot read baked-in words, they ignore the
learner's font-size setting, and they cannot be translated later.

If you generate these as written, the model paints words into the drawing and
the credits are wasted.

```
VRB-015 describe    VRB-043 define      VRB-045 interpret   VRB-114 read
VRB-126 memorize    PHR-024 make out    PHR-084 take back   PHR-117 fill out
PHR-131 act out     PHR-143 sign up     PHR-144 sign in     PHR-145 sign out
ADJ-141 optional    ADJ-145 remarkable  ADJ-244 awkward     ADV-007 usually
ADV-077 utterly     ADV-090 together    PRN-013 my          PRN-016 its
PRP-001 about
```

Rewrite each scene so the meaning comes through **without words**. For example:

- `VRB-043 define` — *a dictionary page with one word circled in red* → **a
  magnifying glass resting on an open book, one circled area highlighted**
- `PRP-001 about` — *a speech bubble surrounding a single topic word* → **a
  speech bubble with a small object floating at its centre**
- `PHR-143 sign up` — *a hand writing a name on a form* → **a hand holding a
  pen above a blank clipboard**

Some are borderline and fine as they are — blurred or illegible text reads as
texture rather than content. Look at each one and decide.

---

## 5. After generating: get the files to spec

The app expects:

| | |
|---|---|
| Format | WebP |
| Size | **1200 × 900** |
| Weight | **45 KB or less** |
| Filename | `<wordId>.webp` — exact, case-sensitive |

Higgsfield gives you SVG (vector mode) at 1024 × 768, or PNG (standard mode).
Neither is what the app wants, so run the converter:

```bash
pip install pillow cairosvg
python3 to_webp.py ./downloads ./webp --map trial_map.csv
```

It rasterises to 1200 × 900, flattens onto the paper colour, then finds the
highest WebP quality that still fits 45 KB, and tells you about any file that
does not fit.

**Three things it handles that a single ImageMagick command does not:**

1. **45 KB is a result, not a setting.** Quality 80 lands anywhere between 12 KB
   and 90 KB depending on how busy the drawing is. A flat run at one quality
   silently ships some files at twice the budget.
2. **Transparent backgrounds render black** in WebP on some Android decoders.
   Left alone, a drawing that looked fine becomes a black rectangle on a
   learner's phone. The converter flattens onto `#F2F5F4` first.
3. **Renaming.** Higgsfield filenames are long hashes. `--map` takes a CSV of
   `original_name,WordId` and renames as it converts.

Then upload the folder anywhere with plain HTTPS, and point the app at it once
via `AppPreferences.setIllustrationBaseUrl(...)`. No rebuild needed.

---

## 6. Read this before choosing realistic

Realistic is **half the price** and looks good on words like *wake up*. Three
things argue against it as the house style:

**About 250 of the 1,000 words cannot be photographed.** There is no photograph
of *although*, *however*, *between*, *and*, or *I*. Pronouns, prepositions and
conjunctions are a quarter of the library. Going realistic means falling back to
illustration for all of them — a half-photo, half-drawing library, which looks
worse than either done consistently.

**Consistency gets harder, not easier.** Flat vector holds together because the
palette is a parameter and the style has few variables. Photographs drift on
lighting, room, camera angle and colour temperature all at once. A thousand of
them read as a thousand different photographers.

**File sizes roughly triple.** Flat colour and hard edges are what let a
1200 × 900 WebP land at 45 KB. A photograph carries texture everywhere and lands
nearer 80–150 KB. On budget phones and mobile data, that is a real cost to the
learner.

**A sensible middle path** if the price matters: generate the ~750 concrete
words as realistic photos and the ~250 abstract ones as flat illustrations, but
accept that the library will visibly have two styles. Or do a handful of
abstract words in realistic first and see for yourself — that is the honest test,
and it costs about 5 credits.

---

## 7. Cost, plainly

| | Credits |
|---|---|
| One flat vector image | 2.5 |
| One realistic image | 1.25 |
| All 1,000 flat vector | 2,500 |
| All 1,000 realistic | 1,250 |
| Mixed (750 photo + 250 vector) | ~1,565 |

Check your balance before a large run. Generate in batches of 10–12 and look at
each batch before starting the next — a style problem caught at image 20 costs
50 credits, and the same problem caught at image 500 costs 1,250.

---

## 8. What was already generated

Ten trial images, flat vector, 25 credits:

`VRB-001 understand` · `PHR-001 wake up` · `ADJ-001 difficult` ·
`ADV-001 always` · `NUM-001 several` · `PRN-001 I` · `PRP-014 between` ·
`PRP-041 under` · `CNJ-001 and` · `CNJ-007 although`

Plus one realistic: `PHR-001 wake up`, 1.25 credits.

Half the trial was deliberately abstract words, because a trial made only of
*drink* and *mountain* proves nothing about the hard quarter of the library.

## Files that come with this guide

| | |
|---|---|
| `prompts_1000.csv` | every word's ready prompt |
| `build_prompts.py` | rebuilds that CSV after you edit scenes |
| `to_webp.py` | Higgsfield output → app file spec |
| `trial_map.csv` | the 10 trial filenames → word IDs |
