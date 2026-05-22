# Manuel Utilisateur (Version 2.3)

Bienvenue sur Hélioscope. Ce guide vous accompagne dans la prise en main de votre espace.

### 1. Tableau de bord & Navigation
Une fois connecté, vous accédez à votre tableau de bord central.
*   **Albums** : Vos dossiers de photos classiques (shootings clients, projets).
*   **Galeries** : Vos albums dynamiques créés automatiquement via des tags.
*   **Mes Pages** : Créez vos pages personnalisées (Bio, Tarifs, Matériel).
*   **Mon Blog** : Rédigez et publiez vos articles.
*   **Mon Profil** : Modifiez votre avatar, bannière et informations publiques.
*   **Commentaires** : Consultez et gérez les commentaires laissés par vos visiteurs sur vos photos.

### 2. Gérer ses Albums & Galeries

#### Les Albums Classiques
Ils contiennent les photos que vous uploadez manuellement.
*   **Créer** : Cliquez sur le bouton vert "+ Créer".
*   **Uploader** : Glissez-déposez vos photos. Vous pouvez ajouter un titre, une description et des **Tags** (mots-clés) à chaque image.
*   **Visibilité** : Rendez l'album public ou privé (visible uniquement via lien).
*   **Photo de couverture** : Cliquez sur "Modifier l'album" et sélectionnez la miniature souhaitée parmi vos photos.

#### Les Galeries Virtuelles (Fonctionnalité Pro)
Créez des collections dynamiques sans dupliquer les fichiers.
1.  Créez un nouvel album et cochez l'option **"Galerie Virtuelle"**.
2.  Sélectionnez vos **Tags** :
    *   Cliquez sur un tag pour l'ajouter (fond vert = inclus).
    *   Cliquez à nouveau pour l'exclure (fond rouge = exclu).
    *   Cliquez une troisième fois pour le rendre neutre.
3.  L'album se remplira automatiquement avec toutes les photos correspondant à vos critères.

### 3. Créer son Portfolio ("Mes Pages")

Cette section vous permet de créer un site vitrine personnel.

*   **Créer une page** : Donnez un titre (ex: "Mes Tarifs") et un slug (l'URL, ex: `tarifs`).
*   **Ajouter des sections** :
    *   **Bloc Texte** : Pour rédiger vos présentations en Markdown enrichi (voir section 7).
    *   **Bloc Galerie** : Sélectionnez un de vos albums ou galeries pour l'afficher.
*   **Publier** : Une fois publié, la page sera visible à l'adresse `helioscope.fr/portfolio/votre-pseudo/votre-slug`.
*   **Mettre en avant** : Sur votre profil principal, les pages publiées apparaîtront comme des onglets cliquables.

### 4. Le Blog

*   Accédez à "Mon Blog" depuis le menu.
*   Rédigez vos articles avec un titre, un contenu et une image de couverture.
*   Les articles publiés sont visibles sur votre blog personnel.

### 5. Les Commentaires

#### Pour les visiteurs — Commenter une photo

Sur votre Portfolio public ou votre Blog, chaque photo dispose d'un bouton **💬 Commenter**.

*   Cliquez sur le bouton **💬** visible sous la photo ou au survol.
*   Renseignez votre **prénom/pseudo** (obligatoire), votre **email** (facultatif, pour recevoir une réponse) et votre **message**.
*   Cliquez sur **Envoyer** — un message de confirmation s'affiche immédiatement.

> Le commentaire est transmis au photographe et soumis à validation avant publication éventuelle.

#### Pour vous — Gérer les commentaires reçus

Accédez à l'onglet **Commentaires** dans votre tableau de bord pour consulter tous les commentaires laissés par vos visiteurs.

*   Les commentaires sont **regroupés par photo** avec la vignette correspondante.
*   Un badge indique le nombre de **nouveaux commentaires** non lus sur chaque photo.
*   **Répondre par email** : si le visiteur a laissé son adresse email, un bouton ✉️ **Répondre** apparaît. Cliquez dessus, rédigez votre réponse dans la fenêtre qui s'ouvre, puis validez. Le visiteur recevra votre réponse directement dans sa boîte mail.
*   Les commentaires lus sont automatiquement marqués comme tels après l'envoi d'une réponse.

### 6. Partage & Sécurité

*   **Lien Public** : Pour chaque album, cliquez sur "Partager" pour obtenir un lien direct ou un shortcode WordPress.
*   **Données** : Vos tags et photos vous appartiennent. La recherche par tags est sécurisée : vous ne voyez que vos propres tags.

---

### 7. Mise en forme Markdown dans les blocs texte

Les blocs texte de vos pages supportent le **Markdown enrichi** avec HTML inline.

#### Titres et listes

```markdown
# Mon titre principal
## Sous-titre

* Élément de liste
* Autre élément
```

#### Images

Afficher une image seule :
```markdown
![Description](/uploads/ma-photo.jpg)
```

Afficher une image **redimensionnée** (HTML inline requis) :
```markdown
<img src="/uploads/ma-photo.jpg" alt="Description" width="300">
```

Image **cliquable** (lien vers un album) :
```markdown
[![Description](/uploads/ma-photo.jpg)](https://helioscope.fr/album/mon-album)
```

Image redimensionnée ET cliquable :
```markdown
<a href="https://helioscope.fr/album/mon-album">
  <img src="/uploads/ma-photo.jpg" alt="Description" width="300">
</a>
```

#### Liens texte

```markdown
[Voir l'album](https://helioscope.fr/album/mon-album)
```

#### Retours à la ligne

| Besoin | Syntaxe |
|--------|---------|
| Nouveau paragraphe | Laisser une ligne vide entre les blocs |
| Saut de ligne simple | Terminer la ligne par deux espaces puis Entrée |
| Saut de ligne forcé (HTML) | `<br>` dans le texte |

Exemple avec image + saut de ligne + lien :
```markdown
<img src="/uploads/expo.jpg" alt="Montage" width="200"><br>
[À la manière de](https://helioscope.fr/album/mon-album?mode=viewer)
```

#### Liste d'expositions avec vignettes

```markdown
# Mes expositions

* Montage
* <img src="/uploads/expo.jpg" alt="À la manière de" width="150"><br>[À la manière de](https://helioscope.fr/album/mon-album?mode=viewer)
* Cinq Sens. - Impressions
```

#### Texte en couleur / style avancé

Pour personnaliser la couleur du texte dans un bloc :
```html
<span style="color: white;">Mon texte en blanc</span>
<span style="color: #e8af34;">Mon texte doré</span>
```

---

### Besoin d'aide ?
Une question ? Contactez-nous via le formulaire de contact ou consultez notre FAQ.
