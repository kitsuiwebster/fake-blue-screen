Backlog = Mesure de sécurité a prendre pour les fonctionnalités qui seront implémenté plus tard.

Catalogue & rendu (F1, F2, F3)

    Mettre en place une CSP stricte
    Valider et filtrer tous les paramètres de rendu (whitelist)
    S'assurer que tous les assets sont locaux (aucun chargement externe)
    Protéger contre les injections dans les messages personnalisables


Partage d'URL (F4)

    Implémenter la validation stricte des paramètres d'URL
    Limiter la taille des paramètres acceptés
    Protéger contre les injections via les query strings


Upload privé (F5)

    Valider le type et la taille des fichiers côté client
    S'assurer que rien n'est transmis au serveur


Upload public (F6)

    Valider et filtrer les fichiers côté serveur
    Re-encoder les images à la réception
    Mettre en place un rate-limiting
    Ne pas stocker les adresses IP
    Protéger contre les abus (flood, contenu malveillant)


API backend (F12)

    Valider toutes les entrées sur chaque endpoint
    Gérer proprement les erreurs sans exposer d'informations sensibles


Infrastructure (F13, F14, F15, F16)

    Configurer TLS et les headers de sécurité via le reverse proxy
    Limiter la taille des payloads acceptés
    Sécuriser les secrets (variables d'environnement, vault)
    Mettre en place des healthchecks et une journalisation minimale
    Assurer l'intégrité de la base de données et les backups