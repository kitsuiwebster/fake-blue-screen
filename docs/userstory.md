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
| **SUS-003** | En tant que système, je veux appliquer des politiques **CSP (Content Security Policy)** strictes adaptées à chaque type d'appareil. | Protéger contre les attaques XSS quelle que soit la plateforme d'accès. |
| **SUS-004** | En tant que système, je veux valider les en-têtes **User-Agent** sans m'y fier exclusivement pour la détection d'appareil. | Prévenir le contournement des contrôles de sécurité par usurpation d'identité de navigateur. |

---

## 3. Partage d'URLs pour Intégration
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-005** | En tant que système, je veux construire les URLs de partage uniquement à partir d'une **liste blanche de paramètres autorisés** (`screen`, `image`) avec des bornes strictes. | Empêcher toute injection de contenu arbitraire via les paramètres d'URL. |
| **SUS-006** | En tant que système, je veux implémenter une validation stricte des paramètres d'URL et encoder les sorties. | Prévenir les attaques par injection d'URL et les vulnérabilités **Open Redirect**. |
| **SUS-007** | En tant que système, je veux ignorer silencieusement tout paramètre d'URL non reconnu ou hors borne, sans exposer d'erreur interne. | Protéger contre l'énumération de ressources et les tentatives d'injection via des paramètres inconnus. |

---

## 4. Upload d'Images Personnalisées
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-008** | En tant que système, je veux valider le **type MIME** et le contenu réel des fichiers (pas seulement l'extension). | Bloquer les fichiers malveillants déguisés en images. |
| **SUS-009** | En tant que système, je veux scanner les images contre les malwares et supprimer les métadonnées **EXIF**. | Protéger contre l'injection de code et la fuite d'informations géolocalisées. |
| **SUS-010** | En tant que système, je veux limiter la taille des fichiers à **10 Mo maximum** et bloquer les uploads si l'espace disque est insuffisant. | Prévenir les attaques par déni de service (**DoS**) via saturation du stockage. |
| **SUS-011** | En tant que système, je veux stocker les images hors du *webroot* avec des noms aléatoires. | Empêcher l'exécution de scripts malveillants et l'accès direct non autorisé. |

---

## 5. Interface Moderne & Galerie Visuelle
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-012** | En tant que système, je veux isoler les contenus utilisateurs dans la galerie via des **iframes sandbox** ou domaines dédiés. | Prévenir les attaques XSS entre aperçus d'écrans d'erreur. |
| **SUS-013** | En tant que système, je veux que la suppression d'une image ne soit possible qu'avec le **token cryptographique** fourni au moment de l'upload. | Garantir qu'aucun tiers ne peut supprimer une image qu'il n'a pas uploadée. |
| **SUS-014** | En tant que système, je veux limiter la fréquence des requêtes de génération d'aperçus. | Protéger contre les attaques par déni de service visant les ressources de traitement d'images. |

---

## 6. Sécurité Transversale
| ID | User Story (Système) | Objectif / Bénéfice |
| :--- | :--- | :--- |
| **SUS-015** | En tant que système, je veux implémenter une **journalisation (logging)** complète des actions sensibles. | Permettre l'audit de sécurité et la détection d'activités suspectes. |
| **SUS-016** | En tant que système, je veux chiffrer toutes les communications avec **TLS 1.3** minimum et **HSTS**. | Protéger la confidentialité et l'intégrité des données en transit. |