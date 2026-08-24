# Exemple de variables d’environnement

Ce fichier est un **contrat de configuration**. Il est versionné à la place d’un fichier `.env` afin de ne contenir aucun secret. Créez les valeurs réelles dans Vercel et dans votre terminal local, sans les ajouter au dépôt.

| Variable | Développement local | Vercel Preview | Vercel Production |
|---|---|---|---|
| `NEON_DATABASE_URL` | Branche Neon de développement avec SSL | Branche Neon de prévisualisation | Branche Neon de production avec SSL |
| `JWT_SECRET` | Secret aléatoire local | Secret Preview distinct | Secret Production distinct et long |
| `APP_URL` | `http://localhost:3000` | URL de Preview Vercel | Domaine public Vercel |

```dotenv
# Exemple de forme seulement — ne pas copier de mot de passe réel dans ce fichier.
NEON_DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="générer-une-valeur-aléatoire-dédiée-à-cet-environnement"
APP_URL="https://easystor.example.com"
```

Les variables commençant par `VITE_` deviennent lisibles par le navigateur. Ne donnez jamais ce préfixe à `NEON_DATABASE_URL` ou `JWT_SECRET`.
