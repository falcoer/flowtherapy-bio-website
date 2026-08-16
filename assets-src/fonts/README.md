# Sources typographiques

Les fontes proviennent du dépôt officiel `google/fonts` et sont distribuées sous SIL Open Font License 1.1.

| Famille | Source conservée | Sortie CI |
|---|---|---|
| Bangers | `bangers/Bangers-Regular.ttf` | `bangers-regular.woff2` |
| Inter | `inter/Inter-Variable.ttf.gz` | `inter-variable.woff2` |
| Kalam | `kalam/Kalam-Regular.ttf` | `kalam-regular.woff2` |
| Kalam | `kalam/Kalam-Bold.ttf` | `kalam-bold.woff2` |

Les fichiers `OFL.txt` de chaque famille sont conservés à côté des sources et copiés dans l'artefact publié.
Le TTF variable Inter est emballé sans perte avec gzip pour son stockage Git ; le CI restitue exactement le fichier original avant conversion.
