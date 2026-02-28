# Description de l'application

**Fake Blue Screen Generator** - Une application web innovante développée en Angular qui simule des écrans d'erreur système ultra-réalistes à des fins éducatives et de démonstration.

Cette application complète propose une collection d'écrans d'erreur authentiques :
- **Windows** : BSOD classique, BSOD moderne, erreurs ACPI
- **Linux** : Kernel Panic en plusieurs variantes colorées 
- **macOS** : Kernel Panic, erreurs de démarrage, symboles d'avertissement
- **Ransomwares** : WannaCry, Petya, Retis - interfaces des menaces connues

## Fonctionnalités principales

- 🖥️ **Mode plein écran immersif** - Navigation intuitive avec sortie par touche "Q"
- 📁 **Upload d'images personnalisées** - Création d'écrans d'erreur sur mesure

- 📱 **Design responsive** avec adaptation automatique sur mobile 
- 🔗 **Partage d'URLs** pour intégration dans présentations et formations
- ⚡ **Interface moderne** avec galerie visuelle et aperçus interactifs


# Cahier des charges 

Fonctionnalités : 
- Mode plein écran Immersif 
    -  L'utilisateur doit pouvoir cliquez sur les images "Prank" et les affichers en plein écran
    -  On doit pouvoir quitter ce mode plein écran uniquement en appuyant sur la touche "Q"
    -  Les images doivent s'adapter à toutes les tailles d'écrans
    -  Les images doivent être responsives. 
    -  Sur mobile, on peut uniquement quitter le site en rechargneant la page

# Privacy By design : 

Ne pas récolter les informations des headers (Ip, Localisation) Aucune information n'est envoyé au serveur.-

# Upload d'images personnalisées :
• les users peuvent déposer/aller chercher des images personnalisées
• permet d'adapter à des contextes particuliers
• user peut upload l'image publiquement ou la garder en privé en local sur son ordi

- Sécurity by design : 
• bloquer les autres extensions de fichier que les images (png, jpg, jpeg, webp)
• filtrer par taille

- Privacy by design : 
• stockage des images
• non stockage des méta-données de l'image et de l'IP de l'utilisateur



# - 📱 **Design responsive** avec adaptation automatique sur mobile 




Information stocké des utilisateurs : 
Image uploads 



Interface moderne avec  2 galerie visuelle et aperçus interactifs :
• mettre un mode clair et sombre 
• interface sous forme de galerie public qui montrent les différentes images téléchargés et uploads par les utilisateurs. et une ou il s'agit d'image classique

Sécurity by design : 
• empêcher l'injection de contenu malveillant via les métadonnées affichées

Privacy by design : 
• ne pas afficher d'informations permettant d'identifier le contributeur d'une image publique
• permettre à l'utilisateur de retirer à tout moment une image qu'il a publiée dans la galerie publique, sans laisser de trace résiduelle
