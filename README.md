# Lawhi

Écouter le Coran sans musique, comprendre la traduction, connaître les heures de prière, apprendre à lire et écrire l'arabe.

Application web installable (PWA) : https://linor240.github.io/lawhi/

## Publier une nouvelle version

```powershell
.\publier.ps1 -Version 1.1.0 -Notes "Ce qui change pour l'utilisateur"
```

Le script met le même numéro dans `update.js`, `sw.js` et `version.json`, puis pousse sur GitHub.
Les téléphones vérifient 30 s après l'ouverture puis toutes les 6 h ; point rouge sur l'engrenage,
Réglages › Installer, ou installation automatique quand l'appli n'est pas utilisée.
