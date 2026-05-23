import csv
import json

CATEGORIA_FINAL = {
    'Perguntas boas': 'Boas',
    'Perguntas pra roda': 'Pra Roda',
    'Perguntas poderosas': 'Poderosas',
}

MOMENTOS = {'Chegança', 'Conexão', 'Reflexão', 'abertura'}

categorias = {
    'Boas': [],
    'Pra Roda': [],
    'Poderosas': [],
    'Especiais': [],
}

with open('assets/base.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) < 4:
            continue
        pergunta = row[1].strip()
        if not pergunta:
            continue
        obs = row[2].strip() if len(row) > 2 else ''
        tema_raw = row[3].strip() if len(row) > 3 else ''
        obs_final = row[8].strip() if len(row) > 8 else ''

        if 'repetida' in obs_final.lower():
            continue
        if not tema_raw:
            continue
        if tema_raw == 'Perguntas boas' and 'repetida' in obs.lower():
            continue

        if tema_raw in CATEGORIA_FINAL:
            chave = CATEGORIA_FINAL[tema_raw]
        else:
            chave = 'Especiais'

        categorias[chave].append(pergunta)

output = [{'tema': k, 'perguntas': v} for k, v in categorias.items() if v]

with open('data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'Total: {sum(len(t["perguntas"]) for t in output)} perguntas em {len(output)} categorias\n')
for t in output:
    print(f'  {t["tema"]}: {len(t["perguntas"])} perguntas')
