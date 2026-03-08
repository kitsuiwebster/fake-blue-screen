# Security User Stories - Projet Fil Rouge

**Date de création :** 5 janvier 2026  
**Matière :** Fil Rouge  
**Projet :** Simulateur d'écrans d'erreur (Mode immersif & Upload)

---

## 1. Mode Plein Écran Immersif
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-001** | En tant que système, je veux valider et assainir la touche **"Q"** utilisée pour sortir du mode plein écran. | Prévenir l'injection de commandes clavier malveillantes qui pourraient compromettre la session utilisateur. |
| **SUS-002** | En tant que système, je veux implémenter des contrôles pour limiter les transitions entre modes d'affichage. | Empêcher les attaques de type **Clickjacking** exploitant les changements rapides d'interface. |

---

## 2. Design Responsive & Adaptation Mobile
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-003** | En tant que système, je veux appliquer des politiques **CSP (Content Security Policy)** strictes adaptées à chaque type d'appareil. | Protéger contre les attaques XSS quelle que soit la plateforme. |
| **SUS-004** | En tant que système, je veux vérifier les en-têtes **User-Agent** mais pas en dépendre uniquement pour détecter le type d'appareil. | Prévenir le contournement des contrôles de sécurité par usurpation d'identité de navigateur. |

---

## 3. Partage d'URLs pour Intégration
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-005** | En tant que système, je veux que les liens de partage n'acceptent que les paramètres connus (`screen` ou `image`). Tout autre paramètre est ignoré. | Empêcher qu'un attaquant injecte du contenu malveillant via l'URL. |
| **SUS-006** | En tant que système, je veux vérifier le contenu des paramètres d'URL et bloquer tout ce qui ne correspond pas au format attendu. | Empêcher les tentatives d'injection via les paramètres de l'URL. |
| **SUS-007** | En tant que système, je veux ignorer sans message d'erreur tout paramètre d'URL inconnu ou dont la valeur dépasse la taille autorisée. | Éviter de donner des informations à un attaquant qui testerait les limites du système. |

---

## 4. Upload d'Images Personnalisées
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-008** | En tant que système, je veux valider le **type MIME** et le contenu réel des fichiers (pas seulement l'extension). | Bloquer les fichiers malveillants déguisés en images. |
| **SUS-009** | En tant que système, je veux re-encoder chaque image reçue pour neutraliser tout contenu malveillant et supprimer automatiquement les métadonnées **EXIF**. | Empêcher l'injection de code caché dans une image et éviter la fuite de données personnelles comme la géolocalisation. |
| **SUS-010** | En tant que système, je veux refuser tout fichier de plus de **10 Mo** et bloquer les uploads si le disque du serveur est plein. | Éviter qu'un attaquant sature le stockage du serveur en envoyant des fichiers en masse. |
| **SUS-011** | En tant que système, je veux stocker les images hors du *webroot* avec des noms aléatoires. | Empêcher l'exécution de scripts malveillants et l'accès direct non autorisé. |

---

## 5. Interface Moderne & Galerie Visuelle
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-012** | En tant que système, je veux isoler les contenus utilisateurs dans la galerie via des **iframes sandbox** ou domaines dédiés. | Prévenir les attaques XSS entre aperçus d'écrans d'erreur. |
| **SUS-013** | En tant que système, je veux que la personne qui souhaite supprimer une image qui n'est pas la sienne, réussise un CAPTCHA décourageant et difficile. | Décourager n'importe qui de supprimer une image qu'il n'a pas mise en ligne. |
| **SUS-014** | En tant que système, je veux limiter la fréquence des requêtes de génération d'aperçus. | Protéger contre les attaques par déni de service visant les ressources de traitement d'images. |

---

## 6. Sécurité Transversale
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-015** | En tant que système, je veux implémenter une **journalisation (logging)** complète des actions sensibles. | Permettre l'audit de sécurité et la détection d'activités suspectes. |
| **SUS-016** | En tant que système, je veux que toutes les communications soient chiffrées via **TLS** et que le site ne soit accessible qu'en HTTPS. | Protéger les données échangées entre l'utilisateur et le serveur contre toute interception. |