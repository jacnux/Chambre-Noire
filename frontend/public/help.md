# Manuel Utilisateur — Chambre Noire

Ce document présente le fonctionnement de **Chambre Noire**, outil de gestion de matériel photo, de suivi de pellicules, et de publication de carnets de routes techniques et artistiques.

---

## 1. Tableau de Bord et Navigation

Une fois connecté, vous accédez à votre tableau de bord principal :

*   **Albums** : Vos galeries de clichés classiques (argentiques ou numériques).
*   **Galeries** : Vos albums virtuels et dynamiques basés sur des tags.
*   **Carnet de route** : La gestion de vos sorties photo et de vos projets techniques.
*   **Matériel (Gear)** : L'inventaire de vos boîtiers et objectifs.
*   **Pellicules (Films)** : Le suivi de vos rouleaux de films et de vos plans-films.
*   **Mon Profil** : Personnalisation de votre avatar, de votre image de couverture et de l'introduction de votre carnet de routes public.

---

## 2. Gérer son Matériel et ses Pellicules

Pour documenter vos prises de vue, vous devez d'abord renseigner votre matériel et vos pellicules.

### Inventaire du Matériel (Gear)
1. Allez dans **Matériel** puis cliquez sur **Ajouter un matériel**.
2. Renseignez le type (Boîtier ou Objectif), la marque, le modèle, le format supporté (135, 120, plan-film 4x5, etc.) et le numéro de série facultatif.
3. Ce matériel sera disponible pour être associé en un clic à vos photos ou rouleaux.

### Suivi des Pellicules (Films)
1. Allez dans **Pellicules** puis cliquez sur **Ajouter un film**.
2. Renseignez la marque (ex: *Kodak*), le modèle (ex: *Tri-X 400*), la sensibilité nominale (ex: *400*), la sensibilité exposée/utilisée (ex: *800* si vous poussez le film) et le format (135, 120, plan-film).
3. **Chimie par défaut** : Vous pouvez renseigner le révélateur et le fixateur par défaut pour ce rouleau (nom du produit, dilution et temps). Ces informations seront héritées automatiquement pour chaque photo liée à ce rouleau.

---

## 3. Le Carnet de Route et les Projets

Un **projet** correspond à une série, une sortie photo ou une thématique artistique.

1. Créez un projet dans **Carnet de route** avec un titre, une description (Markdown supporté) et le statut de publication.
2. Associez vos photos au projet.
3. Chaque photo du projet peut disposer de ses propres réglages de prise de vue et de laboratoire, ou hériter directement de la pellicule associée.

---

## 4. Renseigner les paramètres d'une Photo

Dans un album ou un projet, vous pouvez éditer les métadonnées de chaque cliché :

### Prise de vue
*   **Boîtier & Objectif** : À sélectionner parmi votre matériel enregistré.
*   **Exposition** : Ouverture (ex: *f/8*), Vitesse (ex: *1/125*), Sensibilité spécifique (ex: *400*), Focale utilisée, type de filtre physique (ND, filtre couleur) et présence du parasoleil.
*   *Note* : Si la sensibilité de la photo est laissée vide, elle affichera automatiquement la sensibilité nominale ou exposée du film lié.

### Chimie & Labo (Argentique uniquement)
*   **Pellicule** : Sélectionnez le rouleau ou plan-film associé.
*   **Révélateur & Fixateur** : Renseignez le révélateur (produit, dilution, temps, température, agitation, push/pull) et le fixateur (produit, dilution, temps de fixage).
*   *Note* : Ces champs se pré-remplissent automatiquement à partir des réglages par défaut de la pellicule sélectionnée pour vous éviter des saisies répétitives.

---

## 5. Intégrer son Carnet de Route (Embed)

Chambre Noire propose des adresses épurées, sans barre de navigation ni menus, parfaites pour être intégrées (via iframe) sur un autre site (WordPress, blog, portfolio personnel) :

*   **Carnet de routes complet** : `http://localhost:8081/embed/carnet-de-routes`
*   **Projet spécifique** : `http://localhost:8081/embed/project/:slug` (remplacez `:slug` par le slug du projet, ex: `voyageurs`).

---

## 6. Syntaxe Markdown acceptée dans les descriptions

Les descriptions de profils, de projets et d'intentions de prise de vue acceptent le format Markdown enrichi :

### Titres, listes et gras
```markdown
# Titre principal
## Sous-titre

**Texte important en gras**
*   Élément de liste 1
*   Élément de liste 2
```

### Images et liens
```markdown
# Image simple insérée
![Légende](/uploads/nom-du-fichier.jpg)

# Lien vers un site externe
[Visiter mon site web](https://mon-portfolio.com)
```
