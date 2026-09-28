<div align="center">

# 🎮 xChord controller

**Joue des accords avec une manette Xbox One.**
7 boutons pour les accords, le stick gauche pour les enrichir, le stick droit pour sculpter le son.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tone.js](https://img.shields.io/badge/Tone.js-000000)
![Web MIDI](https://img.shields.io/badge/Web%20MIDI-ready-4cc38a)
![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)
[![Deploy](https://github.com/moanatari/xChordController/actions/workflows/deploy.yml/badge.svg)](https://github.com/moanatari/xChordController/actions/workflows/deploy.yml)

### [▶️ Jouer en ligne](https://moanatari.github.io/xChordController/)

</div>

---

## ✨ En bref

| | |
|---|---|
| 🎹 **7 accords, zéro fausse note** | Chaque bouton joue un accord de la tonalité (I ii iii IV V vi vii°). Toutes les combinaisons sonnent juste. |
| 🕹️ **Stick gauche = harmonie** | 8 directions transforment l'accord tenu : 7e, maj7, sus4, 9, aug, maj↔min… Il y a 3 modes, du plus pop au plus jazz. |
| 🎛️ **Stick droit = effets** | Filtre, résonance, delay, reverb et chorus, réglables en direct. |
| 🔊 **Synthé intégré** | 6 sons : Saw Pad, FM E.Piano, Sine, Square Pluck, FM Bell, Triangle. |
| 🎚️ **Sortie MIDI** | Pilote ton DAW ou un synthé externe. Les notes et les effets partent en MIDI (CC). |
| 🎸 **3 façons de jouer** | Accord tenu, strum façon guitare, ou arpégiateur calé sur le tempo. |

---

## 🚀 Démarrage rapide

Rien à installer : l'app tourne directement dans le navigateur.

1. Ouvre **[moanatari.github.io/xChordController](https://moanatari.github.io/xChordController/)** dans **Chrome** ou **Edge** (nécessaires pour la Gamepad API et la Web MIDI API).
2. Branche la manette Xbox One en **USB ou en Bluetooth**, puis **appuie sur n'importe quel bouton** : le navigateur ne la détecte qu'après une première pression.
3. Clique sur **Démarrer** : les navigateurs exigent un clic avant de jouer du son.
4. Appuie sur **A**, c'est un accord de Do majeur 🎶

> [!TIP]
> Pas de manette sous la main ? Le clavier marche aussi (voir [Jouer au clavier](#jouer-au-clavier)). Les pads et les curseurs sont également cliquables à la souris.

---

## 🎮 Contrôles

### Les accords

```
         LB  ── vii°                         RB ── ii
         LT  ── Shift                        RT ── iii

                                      (Y) vi
        ┌───┐                    (X) IV     (B) V
        │ L │  stick gauche           (A) I
        └───┘  = modifier l'accord
                                     ┌───┐
          ✚  D-pad                   │ R │  stick droit
             tonalité / octave       └───┘  = effets
```

| Bouton | Accord | Exemple en Do |
|:---:|:---:|:---:|
| **A** | I | C |
| **RB** | ii | Dm |
| **RT** | iii | Em |
| **X** | IV | F |
| **B** | V | G |
| **Y** | vi | Am |
| **LB** | vii° | Bdim |

Les accords les plus utilisés (I, IV, V, vi) sont sous le pouce droit. Les autres sont sur les gâchettes et les boutons de tranche, pour rester jouables pendant qu'on manipule le stick droit.

### Stick gauche : transformer l'accord

Tiens un accord et pousse le stick : l'accord change aussitôt, sans coupure du son. Relâche et il revient à sa forme de base. **Menu** change de mode.

| | Default *(pop, rock)* | Extended *(jazz, R&B)* | Chromatic *(jazz avancé)* |
|:---:|:---:|:---:|:---:|
| ↑ | maj ↔ min | maj ↔ min | m(maj7) |
| ↗ | 7 | 9 | 13 |
| → | maj7 / m7 | add11 | 6/9 |
| ↘ | maj9 / m9 | m11 | 7alt |
| ↓ | sus4 | 7#9 | maj13 |
| ↙ | 6 / sus2 | add9 | 7b9 |
| ← | min / dim | 7sus4 | m7b5 |
| ↖ | aug | m7b5 | maj7#11 |

> [!NOTE]
> En mode **Default**, les accords majeurs et mineurs réagissent différemment. Par exemple, → donne *Cmaj7* sur le I mais *Dm7* sur le ii.
> En mode **Chromatic**, quand aucun accord n'est tenu, ← et → transposent la tonalité d'un demi-ton.

Sous la boussole, tu peux régler la **zone morte** : la partie centrale du stick qui est ignorée. Plus elle est grande, plus il faut pousser pour changer l'accord. L'option **Afficher la position du stick** dessine sur la boussole un point qui suit le stick, avec la zone morte et les limites des 8 directions. Ces réglages sont gardés d'une visite à l'autre.

### Stick droit : les effets

Le stick agit comme une **molette** : tu pousses et la valeur bouge, tu lâches et elle reste en place. Tu peux donc régler un effet puis revenir aux boutons. **R3** passe à la page suivante.

| Page | Axe X ↔ | Axe Y ↕ |
|---|---|---|
| 1 · Filtre | Cutoff | Résonance |
| 2 · Delay | Mix | Feedback |
| 3 · Ambiance | Reverb | Chorus |

### Tout le reste

| Action | Contrôle |
|---|---|
| Inversion suivante (C → C/E → C/G) | tenir un accord + **LT** |
| Verrouiller la transformation sur un accord | **L3** (stick au centre : déverrouiller) |
| Tonalité −/+ | **D-pad ← →** |
| Octave −/+ | **D-pad ↑ ↓** |
| Son précédent / suivant | **LT + D-pad ↑ ↓** |
| Tempo −/+ 5 BPM | **LT + D-pad ← →** |
| Mode de jeu : Play → Strum → Arp | **View** |
| Vitesse du strum / motif d'arpège | **LT + View** |
| Mode du stick : Default → Extended → Chromatic | **Menu** |

### Jouer au clavier

| Touche | Action |
|---|---|
| `1` … `7` | Accords I → vii° |
| `←` `↑` `→` `↓` | Stick gauche (deux flèches pour une diagonale) |
| `Espace` | LT (Shift) |
| `E` | L3 (verrouiller) |
| `A` / `D` | Tonalité −/+ |
| `W` / `S` | Octave +/− |
| `P` | Mode de jeu |
| `M` | Mode du stick |
| `F` | Page d'effets |

---

## 🎚️ Brancher sur un DAW (MIDI)

<details>
<summary><b>Configuration sous Windows avec loopMIDI</b></summary>

<br>

1. Installe [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) et crée un port virtuel (par exemple `xChord`).
2. Dans l'app, choisis ce port dans le menu **MIDI** en haut à droite. Chrome peut demander une autorisation.
3. Dans ton DAW (Ableton, Bitwig, Reaper…), active ce port comme **entrée MIDI** sur une piste d'instrument.

Les notes partent sur le **canal 1**, avec une vélocité de 100. Les effets sont envoyés en CC :

| Paramètre | CC |
|---|:---:|
| Cutoff | 74 |
| Résonance | 71 |
| Reverb | 91 |
| Chorus | 93 |
| Delay mix | 94 |
| Delay feedback | 95 |

> Sous macOS, pas besoin de loopMIDI : active le **bus IAC** dans *Configuration audio et MIDI*.

</details>

---

## 🧱 Architecture

```
src/
├─ core/        🧠 logique musicale PURE : théorie, accords, modificateurs, état (testée)
├─ input/       🎮 manette (Gamepad API), stick 8 directions, clavier, mapping des boutons
├─ audio/       🔊 synthé Tone.js, presets, chaîne d'effets, modes Play / Strum / Arp
├─ midi/        🎚️ sortie Web MIDI (notes + CC)
├─ ui/          🖥️ interface
└─ main.ts      🔌 câblage : entrée → reducer → son, MIDI et UI
```

Le flux de données est à sens unique :

1. Chaque appui ou mouvement de stick devient un **événement**.
2. Un **reducer pur** (`src/core/state.ts`) calcule le nouvel état.
3. Les changements d'état sont traduits en notes, en réglages d'effets, en messages MIDI et en rendu d'UI.

Le dossier `core/` ne dépend ni du navigateur ni de l'audio. On peut donc le tester facilement, et il servira de référence pour une future version native.

> [!TIP]
> Pour changer la disposition des boutons, modifie `src/input/mapping.ts`. Pour ajouter un son, ajoute une entrée dans `src/audio/presets.ts`.

---

## 🛠️ Développer

**Prérequis :** [Node.js](https://nodejs.org) 22 ou plus récent.

```bash
git clone https://github.com/moanatari/xChordController.git
cd xChordController
npm install
npm run dev
```

Vite affiche l'adresse du serveur de développement : ouvre-la dans Chrome ou Edge.

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run build` | Typecheck et build de production dans `dist/` |
| `npm run preview` | Sert le build de production |

---

## 🌐 Déploiement (GitHub Pages)

L'app est entièrement statique et publiée sur GitHub Pages, qui sert en HTTPS (obligatoire pour la manette et le MIDI).

À chaque push sur `main`, le workflow [`deploy.yml`](./.github/workflows/deploy.yml) lance les tests, build le projet et publie `dist/` sur [moanatari.github.io/xChordController](https://moanatari.github.io/xChordController/).

> [!NOTE]
> Sur un fork, active le déploiement dans *Settings › Pages* avec **Source : GitHub Actions**. L'app sera alors en ligne sur `https://<utilisateur>.github.io/<dépôt>/`.

---

## ❓ Dépannage

<details>
<summary><b>La manette n'est pas détectée</b></summary>

- Appuie sur un bouton **après** avoir ouvert la page : c'est une règle de sécurité des navigateurs.
- Vérifie qu'elle fonctionne sous Windows (*Paramètres › Bluetooth et appareils*).
- Utilise Chrome ou Edge. Firefox gère moins bien le mapping standard.

</details>

<details>
<summary><b>Pas de son</b></summary>

- As-tu cliqué sur **Démarrer** ?
- Vérifie le volume de l'onglet et la sortie audio du système.
- Le cutoff du filtre est peut-être tout en bas : pousse le stick droit vers la droite, page 1.

</details>

<details>
<summary><b>Le menu MIDI est vide</b></summary>

- Le port virtuel (loopMIDI) doit exister **avant** d'ouvrir la page. Sinon, recharge-la.
- Accepte la demande d'autorisation MIDI du navigateur.

</details>

---

## 🗺️ Feuille de route

- [ ] Voice leading automatique (choisir l'inversion la plus proche de l'accord précédent)
- [ ] Basse ajoutée (fondamentale ou accords slash)
- [ ] Vibrations de la manette au changement d'accord
- [ ] Presets utilisateur et layout des boutons configurable dans l'UI
- [ ] Looper, mode Drone, plus de sons
- [ ] Version native (Rust ou JUCE) pour une latence minimale et un format plugin VST/CLAP

Le plan détaillé est dans [`PLAN.md`](./PLAN.md).
