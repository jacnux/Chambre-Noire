# Manuel utilisateur — portfolio LuminaView et règles de pages

Ce document présente le fonctionnement du portfolio LuminaView dans sa version actuelle, en intégrant le nouveau menu public, les nouveaux champs de navigation, la logique parent/enfant des pages et les règles d’édition à respecter pour obtenir un affichage cohérent.

## 1. Tableau de bord et navigation

Une fois connecté, l’utilisateur accède à son tableau de bord principal.

- **Albums** : dossiers de photos classiques, alimentés manuellement.
- **Galeries** : albums dynamiques construits à partir de tags.
- **Mes Pages** : pages du portfolio public, avec contenu éditorial et navigation.
- **Mon Blog** : articles publiés dans la rubrique blog.
- **Mon Profil** : avatar, bannière et informations publiques.
- **Commentaires** : consultation et gestion des commentaires reçus sur les photos.
- **Recherche Instantanée** : une barre de recherche en haut des listes d'albums, de galeries et de pages permet de filtrer instantanément vos contenus par nom ou partie de nom.

## 2. Gérer ses albums et galeries

### Albums classiques

Les albums classiques contiennent les photos ajoutées manuellement.

- **Créer** : cliquer sur le bouton de création.
- **Ajouter des photos** : glisser-déposer les images ou utiliser l’interface d’upload.
- **Renseigner les métadonnées** : titre, description et tags peuvent être ajoutés à chaque photo.
- **Définir la visibilité** : un album peut être public ou privé.
- **Choisir une photo de couverture** : dans l’édition de l’album, sélectionner la miniature utilisée comme visuel principal.

### Galeries virtuelles

Les galeries virtuelles permettent de créer des collections dynamiques sans dupliquer les fichiers.

1. Créer un nouvel album.
2. Activer l’option **Galerie Virtuelle**.
3. Sélectionner les tags à inclure, exclure ou laisser neutres.
4. La galerie se remplit automatiquement avec les photos correspondant aux critères définis.

## 3. Nouveau portfolio public

Le portfolio public s’organise désormais autour d’un menu principal resserré.

- **Accueil**
- **Séries**
- **Expositions**
- **Actualités** (précédemment appelé "Blog")
- **À propos**

Cette structure permet de mieux distinguer les contenus éditoriaux, les séries photographiques, les expositions et les pages de présentation.

## 4. Créer une page dans « Mes Pages »

La section **Mes Pages** permet de construire le portfolio public.

- **Créer une page** : définir un titre et un slug.
- **Ajouter des sections** :
  - **Bloc Texte** : contenu rédigé en Markdown enrichi.
  - **Bloc Galerie** : affichage d’un album ou d’une galerie.
  - **Bloc mixte texte + galerie** : texte éditorial accompagné d’images.
- **Publier** : une page publiée devient accessible publiquement.
- **Organiser la navigation** : la page peut être reliée à une rubrique, à une page parente et à un ordre d’affichage.

## 5. Champs de navigation dans l’éditeur

Chaque page peut être configurée avec plusieurs champs de navigation.

| Champ | Rôle | Effet public |
|---|---|---|
| `menuGroup` | Définit la rubrique principale de la page | Place la page dans **Séries**, **Expositions**, **Blog**, **À propos** ou hors menu |
| `parentPageId` | Définit une page parente | Permet de créer une relation parent / sous-page |
| `menuOrder` | Définit l’ordre d’affichage | Trie les pages dans la navigation |
| `showInMenu` | Active ou masque la présence dans le menu | Une page peut être publique sans apparaître dans le menu principal |

### Valeurs recommandées de `menuGroup`

- `series` : pour une série photographique ou un ensemble cohérent de travaux.
- `exhibitions` : pour une exposition, une présentation publique ou un projet pensé comme accrochage.
- `blog` : pour un article, une note, une actualité ou un texte public.
- `about` : pour une page de présentation, de démarche ou de biographie.

## 6. Règles parent / enfant dans les pages

### Principe général

Une page n’est plus seulement un contenu libre : elle peut aussi devenir un élément de navigation dans l’arborescence du portfolio.

- Une page peut être **parente** d’une ou plusieurs sous-pages.
- Une sous-page peut elle-même avoir ses propres sous-pages.
- Le système autorise donc une organisation hiérarchique, y compris des pages filles de niveau **n-2**.

### Cas du menu « Séries »

Dans le menu **Séries**, chaque rubrique principale, par exemple **Photo de rue** ou **Nature morte**, fonctionne comme une **page parent**.

Cette page parent :
- présente brièvement la sous-rubrique,
- affiche la liste ou les cartes de ses pages filles,
- peut afficher un texte de présentation,
- ne doit pas être utilisée comme une page de série développée complète si elle sert avant tout de navigation.

Les pages filles de niveau 1 rattachées à cette rubrique sont les véritables pages de série développées.

Elles affichent :
- une introduction éditoriale dans l’en-tête,
- puis les blocs de contenu dans le corps de page : texte, galeries ou blocs mixtes.

### Règle d’affichage du premier bloc texte

Pour les pages de type **Séries** ou **Expositions**, le premier bloc texte est utilisé comme **introduction éditoriale** dans l’en-tête.

Conséquences :
- ce premier bloc texte apparaît dans l’en-tête,
- il n’est pas réaffiché une seconde fois dans le corps de la page,
- les autres blocs texte ajoutés ensuite s’affichent normalement sous l’en-tête.

### Règle pour les pages parent avec sous-pages

Une page qui possède des sous-pages se comporte comme une page d’index.

Elle peut afficher :
- son titre,
- son image de couverture,
- son texte d’introduction,
- la navigation vers ses pages filles.

Les autres blocs éditoriaux peuvent également être affichés si la logique de rendu les autorise, à l’exception du premier bloc texte lorsqu’il est déjà utilisé dans l’en-tête.

### Sous-pages de niveau n-2

Une page fille peut elle-même contenir des pages filles. Cela permet de créer un deuxième niveau hiérarchique.

Exemple :
- **Séries**
- **Nature morte** (page parent)
- **Fleurs fanées** (page fille niveau 1)
- **Variations noires** (page fille niveau n-2)

Cette structure permet d’organiser un travail complexe sans surcharger le menu principal.

## 7. Images de couverture et navigation secondaire

Lorsqu’une page possède des sous-pages, celles-ci peuvent apparaître dans un menu déroulant ou dans un bloc de navigation secondaire.

Pour obtenir un affichage visuel cohérent, il est recommandé de renseigner `coverImage` sur les pages utilisées dans cette navigation.

Cela permet d’afficher :
- une vignette ou image de couverture,
- le titre de la sous-page,
- son lien public.

## 8. Blog (Mise à jour v2.8.1)

La rubrique **Mon Blog** permet de rédiger et publier des articles via un espace d'écriture premium :

- **Éditeur type Notebook** : un espace de rédaction épuré, sans cadre ni distraction, semblable à une feuille blanche avec le titre d'article en très grand directement éditable.
- **Barre d'outils Markdown** : une barre d'outils flottante contenant des boutons d'insertion rapide de styles (Gras, Italique, Citation, Lien, Image, Code, Liste).
- **Insertion intelligente** : si vous sélectionnez un mot et cliquez sur **Gras** ou **Italique**, l'éditeur l'entoure automatiquement avec la syntaxe Markdown correspondante et conserve le focus au bon endroit de saisie.
- **Image de couverture & Publication** : ajoutez un visuel de couverture puis activez le bouton de publication pour diffuser l'article sur vos pages publiques.

## 9. Commentaires

### Pour les visiteurs

Sur le portfolio public ou le blog, chaque photo peut proposer un bouton **💬 Commenter**.

Le visiteur peut :
- saisir un prénom ou pseudo,
- laisser un email de contact facultatif,
- écrire un message,
- envoyer le commentaire via le formulaire.

Un message de confirmation s’affiche après l’envoi.

### Pour l’auteur

Dans le tableau de bord, l’onglet **Commentaires** regroupe les commentaires reçus.

- les commentaires sont regroupés par photo,
- un badge peut indiquer les nouveaux commentaires,
- une réponse par email est possible lorsque l’adresse du visiteur est disponible.

## 10. Partage et sécurité

- **Lien public** : chaque album peut être partagé via un lien direct.
- **Données** : les tags et photos restent associés au compte de leur propriétaire.
- **Recherche par tags** : l’utilisateur ne voit que ses propres tags.

## 11. Mise en forme Markdown dans les blocs texte

Les blocs texte supportent le **Markdown enrichi** avec HTML inline.

### Titres et listes

```markdown
# Mon titre principal
## Sous-titre

* Élément de liste
* Autre élément
```

### Images

Image simple :

```markdown
![Description](/uploads/ma-photo.jpg)
```

Image redimensionnée :

```markdown
<img src="/uploads/ma-photo.jpg" alt="Description" width="300">
```

Image cliquable :

```markdown
[![Description](/uploads/ma-photo.jpg)](https://helioscope.fr/album/mon-album)
```

Image redimensionnée et cliquable :

```markdown
<a href="https://helioscope.fr/album/mon-album">
  <img src="/uploads/ma-photo.jpg" alt="Description" width="300">
</a>
```

### Liens texte

```markdown
[Voir l'album](https://helioscope.fr/album/mon-album)
```

### Retours à la ligne

| Besoin | Syntaxe |
|---|---|
| Nouveau paragraphe | Laisser une ligne vide entre les blocs |
| Saut de ligne simple | Terminer la ligne par deux espaces puis Entrée |
| Saut de ligne forcé | `<br>` |

Exemple :

```markdown
<img src="/uploads/expo.jpg" alt="Montage" width="200"><br>
[À la manière de](https://helioscope.fr/album/mon-album?mode=viewer)
```

### Liste d’expositions avec vignettes

```markdown
# Mes expositions

* Montage
* <img src="/uploads/expo.jpg" alt="À la manière de" width="150"><br>[À la manière de](https://helioscope.fr/album/mon-album?mode=viewer)
* Cinq Sens. - Impressions
```

### Couleur et style avancé

```html
<span style="color: white;">Mon texte en blanc</span>
<span style="color: #e8af34;">Mon texte doré</span>
```

## 12. Bonnes pratiques d’édition

Pour éviter les incohérences d’affichage, il est recommandé de respecter les règles suivantes.

- Utiliser le premier bloc texte comme introduction de page lorsqu’il s’agit d’une série ou d’une exposition.
- Ajouter les autres textes dans des blocs séparés si l’on souhaite du contenu sous l’en-tête.
- Utiliser `parentPageId` uniquement lorsqu’une relation hiérarchique est réellement souhaitée.
- Vérifier que `coverImage` est renseigné pour les pages qui doivent apparaître sous forme de carte ou vignette.
- Contrôler `showInMenu` pour éviter qu’une page technique ou secondaire n’apparaisse dans la navigation principale.
- Utiliser `menuOrder` pour stabiliser l’ordre d’affichage des rubriques et sous-pages.

## 13. Besoin d’aide

En cas de doute, il est conseillé de vérifier :

- la rubrique choisie dans `menuGroup`,
- la présence éventuelle d’un parent dans `parentPageId`,
- la présence d’une image de couverture,
- l’ordre des blocs dans la page,
- et la publication effective de la page.

## 14. Thèmes visuels, redirection et édition du Profil (v2.8.1)

LuminaView intègre un moteur de thèmes visuels qui adapte la navigation de vos pages publiques :

### Sélection du Thème
Dans **Mon Profil**, vous pouvez choisir en un clic entre deux directions artistiques :
- **Hélioscope (Classic)** : un thème clair et chaleureux avec menu horizontal supérieur ambré.
- **Artfolio** : un thème sombre et luxueux avec menu vertical fixe sur la gauche.

### Redirections et Passerelles
Le système gère de façon transparente et automatique les redirections croisées pour vos visiteurs :
- **Thème Classic** : l'adresse de votre portfolio est intégrée dans le site principal à l'adresse `helioscope.fr/portfolio/$(user)`. Le bouton "Actualités" du portfolio pointe vers le blog de LuminaView.
- **Thème Artfolio** : votre portfolio s'affiche de manière autonome à l'adresse `$(user).helioscope.fr`. Le bouton "Actualités" redirige vers l'adresse correspondante.

### Page Profil repensée
L'écran **Mon Profil** est organisé en deux colonnes (40/60) sur grand écran pour un confort visuel optimal :
1. **Colonne de gauche (40%)** : Regroupe l'identité visuelle (avatar et image de couverture) et le sélecteur graphique de thème. Cliquer directement sur l'emplacement de l'avatar ou sur l'image de couverture ouvre l'explorateur pour choisir un fichier.
2. **Colonne de droite (60%)** : Regroupe les formulaires de saisie de texte avec des champs très hauts (biographie sur 8 lignes, introduction de portfolio sur 4 lignes, et description des prestations/services sur 12 lignes) facilitant l'écriture et le support Markdown.

