# Dictionnaires de langue

- `fr.json` est la langue de référence éditoriale.
- `en.json` doit conserver exactement les mêmes clés.
- Les identifiants de formulaire (`booking`, `event`, etc.) sont stables : seuls leurs libellés sont traduits.
- Les données techniques de médias restent dans `../config/site.json`; les titres, types et descriptions sont traduits ici.

Les deux dictionnaires actifs sont vérifiés par la CI. Lors de l’ajout du chinois simplifié, créer `zh-Hans.json`, puis l’activer en même temps dans le runtime, le générateur de routes et le validateur.
