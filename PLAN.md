# xChord controller : synthé d'accords piloté par une manette Xbox One

## Le projet

Une app web qui transforme une manette Xbox One en instrument d'accords :

- **7 boutons** jouent les 7 accords diatoniques de la tonalité (I ii iii IV V vi vii°). Toutes les combinaisons sonnent juste.
- **Le stick gauche** modifie l'accord tenu dans 8 directions (7e, sus4, maj↔min, aug…). Il y a 3 modes : Default, Extended et Chromatic.
- **Le stick droit** pilote les effets : filtre, delay, reverb, chorus.
- Le son vient d'un **synthé intégré** (Tone.js). Il part aussi en **MIDI** (Web MIDI) vers un DAW ou un synthé externe.

### Lancer

```bash
npm install
npm run dev      # puis ouvrir http://localhost:5173 dans Chrome ou Edge
npm test         # tests unitaires du cœur musical
npm run build    # build de production dans dist/
```

1. Branchez la manette en USB ou en Bluetooth, puis appuyez sur un bouton pour que le navigateur la détecte.
2. Cliquez sur **Démarrer** : le navigateur exige un clic avant de jouer du son.
3. Pour le MIDI sous Windows, installez [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html), créez un port, puis choisissez-le dans le menu MIDI de l'app et comme entrée dans le DAW.

## Stack

| Élément | Choix |
|---|---|
| Build | Vite + TypeScript, sans framework UI |
| Audio | Tone.js, contexte `latencyHint: "interactive"`. Les notes jouées en direct passent par `Tone.immediate()` |
| Manette | Gamepad API, lue une fois par frame dans `requestAnimationFrame` (mapping « standard » de Chrome/Edge) |
| MIDI | Web MIDI API |
| Tests | Vitest |

## Architecture

Le principe : **`src/core/` est pur**. Il ne dépend ni du navigateur ni de Tone.js et ne contient que des fonctions et des tables de données. Il sert de spécification pour un futur portage natif (voir la V3).

Le flux fonctionne ainsi :

1. Les entrées (manette ou clavier) produisent des `InputEvent` abstraits.
2. `reduce(state, event)` calcule le nouvel état.
3. `main.ts` compare l'ancien et le nouvel état, puis en déduit les effets : notes, paramètres d'effets, CC MIDI et rendu de l'UI.

```
src/
  main.ts              câblage : dispatch → reduce → effets audio/MIDI, boucle rAF
  core/                PUR, testé
    theory.ts          notes, gamme majeure, qualités des triades diatoniques
    modifiers.ts       formes d'accords + tables 3 modes × 8 directions
    chord.ts           buildChord() → notes MIDI + nom (« Am7 », « C/E ») ; diffNotes()
    arp.ts             ordre des notes de l'arpège (up, down, updown, random)
    state.ts           état de l'instrument, événements, reducer, accord actif
  input/
    stick.ts           quantification en 8 directions, avec hystérésis d'amplitude et d'angle
    mapping.ts         boutons Xbox → actions (layout modifiable ici)
    gamepad.ts         polling, fronts d'appui, gâchettes analogiques, déconnexion propre
    keyboard.ts        fallback clavier
  audio/
    fx.ts              Filtre LP → Chorus → Delay (calé sur le tempo) → Reverb → Limiter
    presets.ts         Saw Pad, FM E.Piano, Sine, Square Pluck, FM Bell, Triangle
    engine.ts          PolySynth + interface NoteSink (commune au synthé et au MIDI)
    playModes.ts       Performer : Play (tenu), Strum, Arp ; mise à jour des notes par différence
  midi/midiOut.ts      notes sur le canal 1 + CC des effets, horodatés sur l'horloge audio
  ui/view.ts, style.css
tests/                 core/chord, core/state, input/stick
```

## Contrôles

### Manette

| Contrôle | Fonction |
|---|---|
| **A / RB / RT / X / B / Y / LB** | accords I / ii / iii / IV / V / vi / vii°. I, IV, V et vi sont sous le pouce droit |
| **Stick gauche** | modifie l'accord tenu. Relâcher revient à l'accord de base |
| **L3** | verrouille la modification en cours sur cet accord. L3 avec le stick au centre déverrouille |
| Accord tenu + **LT** | inversion suivante (fondamentale → 1re → 2e) |
| **D-pad ← →** | tonalité −/+ 1 demi-ton |
| **D-pad ↑ ↓** | octave (de −1 à +2) |
| **LT + D-pad ↑ ↓** | preset de son |
| **LT + D-pad ← →** | BPM ±5 (de 40 à 300) |
| **View** | mode de jeu : Play → Strum → Arp |
| **LT + View** | vitesse du strum (40/80/120 ms) ou motif de l'arpège |
| **Menu** | mode du joystick : Default → Extended → Chromatic |
| **Stick droit** | effets de la page courante (X / Y) |
| **R3** | page d'effets suivante |

**Stick droit en mode « latch »** : le pouce droit ne peut pas être à la fois sur le stick droit et sur A/B/X/Y. Le stick droit agit donc en *vitesse* : on pousse et la valeur bouge, on lâche et elle reste en place. La réponse est quadratique, ce qui donne plus de finesse près du centre.

| Page | X | Y |
|---|---|---|
| 1 · Filtre | cutoff (CC 74) | résonance (CC 71) |
| 2 · Delay | mix (CC 94) | feedback (CC 95) |
| 3 · Reverb/Chorus | reverb (CC 91) | chorus (CC 93) |

### Clavier (pour jouer sans manette)

- `1`…`7` : accords
- Flèches : stick gauche (deux flèches pour une diagonale)
- `Espace` : LT
- `E` : L3
- `A` / `D` : tonalité
- `W` / `S` : octave
- `P` : mode de jeu
- `M` : mode du joystick
- `F` : page d'effets
- Les pads et les curseurs sont aussi cliquables à la souris.

## Modificateurs du stick gauche

Les tables sont dans `src/core/modifiers.ts`. En mode Default, les accords majeurs et mineurs ne réagissent pas pareil.

| Direction | Default (maj / min / dim) | Extended | Chromatic |
|---|---|---|---|
| ↑ | maj↔min (min / maj / maj) | maj↔min | m(maj7) |
| ↗ | 7 (dominante : dominantes secondaires) | 9 | 13 |
| → | maj7 / m7 / m7b5 | add11 | 6/9 |
| ↘ | maj9 / m9 / m9b5 | m11 | 7alt |
| ↓ | sus4 | 7#9 | maj13 |
| ↙ | 6 / sus2 / sus2 | add9 | 7b9 |
| ← | m / dim / dim7 | 7sus4 | m7b5 |
| ↖ | aug | m7b5 | maj7#11 |

En mode Chromatic, sans accord tenu, ← et → transposent la tonalité d'un demi-ton.

Voicings : le I de chaque tonalité est centré autour de C3 (les tonalités de C à F partent de C3–F3, celles de F# à B de F#2–B2). Les degrés montent ensuite depuis la tonique. Un accord inversé est nommé comme un accord slash (« C/E »).

Quand un accord est tenu et que le stick change de direction, seules les notes qui changent sont coupées ou ajoutées, donc pas de coupure audible. Un nouvel appui sur un accord le rejoue entièrement.

## Étapes

- [x] 1. Scaffold Vite + TS + Tone.js + Vitest, et cœur musical (`theory`, `modifiers`, `chord`) avec tests
- [x] 2. Entrées : manette, stick 8 directions, clavier
- [x] 3. Synthé intégré, mode Play
- [x] 4. Stick gauche : modificateurs, 3 modes, noms d'accords, mise à jour par différence
- [x] 5. Stick droit : chaîne d'effets et pages en latch
- [x] 6. Sortie MIDI : sélecteur de port, notes et CC
- [x] 7. Extras : Strum, Arp calé sur le BPM, inversions, verrouillage d'accord, presets, tonalité et octave
- [x] 8. UI : accord joué, boussole des 8 directions, pads, jauges d'effets, aide
- [ ] 9. **Test avec la vraie manette**, puis réglages : seuils du stick, vitesse des effets, layout des boutons, volumes des presets
- [x] 10. Déploiement GitHub Pages : `base: './'` dans Vite et workflow GitHub Actions (tests, build, publication de `dist/`)

### Idées pour la suite (V2)

- Voice leading automatique : choisir l'inversion la plus proche de l'accord précédent.
- Basse ajoutée : fondamentale (ROOT) ou accords slash (SLASH).
- Vibration de la manette au changement d'accord (`vibrationActuator`).
- Sauvegarde de presets utilisateur (localStorage) et layout de boutons configurable dans l'UI.
- Looper, mode Drone, mode Repeat, plus de presets de son.
- Vélocité via la pression des gâchettes analogiques.

## Vérification

- `npm test` : 19 tests sur le cœur. Ils couvrent les 7 triades, les modificateurs des 3 modes, les inversions, les registres par tonalité, la validité de toutes les combinaisons mode × direction × degré × inversion, le reducer (pile d'accords, lock, inversion, D-pad, chromatic, effets) et la quantification du stick.
- `npm run build` : le typecheck et le build passent.
- **Test manuel** :
  1. `npm run dev` puis ouvrir Chrome ou Edge avec la manette branchée et cliquer sur « Démarrer ».
  2. Vérifier les 7 accords et les 8 directions : le nom affiché doit correspondre au son.
  3. Vérifier que le stick droit fait bouger le filtre, le delay et la reverb de façon audible.
- **MIDI** : avec loopMIDI, vérifier les notes et les CC dans un DAW ou dans MIDI-OX.
- **Latence** : le polling rAF donne environ 16 ms dans le pire cas, ce qui devrait être imperceptible au jeu.

## Plus tard : V3 native (plus dédiée, plus robuste)

- `src/core` et ses tests forment la spécification à porter. Ce sont des fonctions pures et des tables de données.
- **Rust** :
  - `gilrs` pour la manette (XInput, polling à 1 kHz)
  - `midir` pour le MIDI
  - `cpal` + `fundsp` pour l'audio (latence < 5 ms)
  - éventuellement `nih-plug` pour en faire un plugin VST3/CLAP
- **JUCE/C++** si l'objectif principal est un plugin VST dans un DAW.
- Autre possibilité : écrire le core en Rust et le compiler en WASM pour le partager avec la version web.
