# Qilowatt congestie-checker

Tool die checkt of een Nederlandse postcode (PC6) in een netcongestiegebied valt. De data zit client-side: de browser haalt eenmalig een compact databestand op en doet de check lokaal. Geen server, geen opgeslagen postcodes.

Zie het ontwerp en plan in de Obsidian-vault:
`Qilowatt/Website/2026-06-23-congestie-checker-design.md` en `...-plan.md`.

## Bestanden

| Bestand | Wat |
|---|---|
| `source/Postcodes congestie.xlsx` | Bron (95.679 rijen, kolommen Focusgebied + postcode) |
| `pc6.py` | PC6-encoder en het binaire bestandsformaat |
| `build_data.py` | Leest de Excel, ontdubbelt, schrijft `data/congestie.bin` |
| `test_pc6.py`, `test_build.py` | Python-tests (11 stuks) |
| `data/congestie.bin` | Gegenereerd databestand (92.361 postcodes, ~91 KB ruw, ~23 KB gezipt) |
| `decoder.js` | JS-decoder plus normaliseren/encoderen/valideren (ES-module, getest) |
| `decoder.test.mjs` | Node-tests voor `decoder.js` |
| `congestie-checker.html` | Dev-versie van de widget (module-import, lokaal databestand) |
| `embed-webflow.html` | Productie-widget met ingebakken decoder, klaar voor Webflow |

## Databestand bouwen en testen

```bash
python3 build_data.py          # genereert data/congestie.bin
python3 -m unittest            # Python-tests (en `node --test` indien Node aanwezig)
```

## Data bijwerken

1. Vervang `source/Postcodes congestie.xlsx` door de nieuwe lijst.
2. `python3 build_data.py` (regenereert `data/congestie.bin`).
3. `python3 -m unittest` (alles groen).
4. Commit, nieuwe datum-tag, push:
   `git add -A && git commit -m "data: update postcodes" && git tag JJJJ-MM-DD && git push origin main --tags`
5. Zet `DATA_VERSION` in de Webflow-embed op de nieuwe tag.

## Kaart bijwerken

`maps/congestiegebieden.svg` kleurt de congestie-PC4's oranje op een grijs Nederland (918 van 924 PC4's, de rest bestaat niet in de 2020-geometrie). Opnieuw genereren na een data-update:

1. PC4-lijst verversen: lees `source/Postcodes congestie.xlsx`, neem de eerste vier tekens per postcode, schrijf naar `data/congested_pc4.json`.
2. PC4-geometrie ophalen: `curl -sL https://cartomap.github.io/nl/wgs84/postcode4_2020.geojson -o /tmp/pc4.geojson`.
3. `python3 build_map.py` schrijft de SVG.

## Hosting (jsDelivr)

De `data/congestie.bin` wordt geserveerd via jsDelivr vanaf een publieke GitHub-repo:
`https://cdn.jsdelivr.net/gh/Mekdigital/qilowatt-congestie-checker@<tag>/data/congestie.bin`

De tag in de URL maakt elke versie onveranderlijk en cache-veilig. Updaten betekent een nieuwe tag plus `DATA_VERSION` ophogen in de embed.

## Let op

- De decoder staat op twee plekken: `decoder.js` (getest) en ingebakken in `embed-webflow.html`. Verander je de decodeer-logica, pas dan beide aan. Het algoritme is identiek.
- **Livegang pas vanaf 1 juli 2026** en na akkoord van Frank Energie over het gebruik van hun naam en de bedragen. Tot die tijd alleen op een staging-pagina.
- De voorlopige teksten en het bedrag van 50 euro per kW komen definitief uit het marketingpakket van Frank Energie.
