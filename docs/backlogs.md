Backlog = Mesure de sécurité à prendre pour les fonctionnalités qui seront implémentées plus tard.

Catalogue & rendu

    Mettre en place une CSP stricte
    Valider et filtrer tous les paramètres de rendu
    S'assurer que tous les assets sont locaux (aucun chargement externe)


Partage d'URL

    Implémenter la validation stricte des URL
    Limiter la taille des paramètres acceptés
    Protéger contre les injections via les paramètres d'URL


Upload privé

    Valider le type et la taille des fichiers côté client
    S'assurer que rien n'est transmis au serveur


Upload public

    Valider et filtrer les fichiers côté serveur
    Re-encoder les images à la réception
    Mettre en place un rate-limiting
    Ne pas stocker les adresses IP
    Protéger contre les abus (flood, contenu malveillant)


API backend

    Valider toutes les entrées sur chaque endpoint
    Gérer proprement les erreurs sans exposer d'informations sensibles


Infrastructure

    Configurer TLS et les en-têtes de sécurité
    Limiter la taille des images acceptés
    Sécuriser les secrets (variables d'environnement, vault)
    Mettre en place des healthchecks et une journalisation minimale
    Assurer l'intégrité de la base de données et les backups