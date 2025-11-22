# api.wiredia.dev

Documentação rápida dos endpoints expostos pelo servidor Express (`main.ts`). Todos retornam respostas em JSON e seguem o rate limit global de 100 requisições por minuto por IP.

## Rotas disponíveis

### `GET /hash`
- **Query**: `text` (obrigatório), `algorithm` (`md5`, `sha1`, `sha256`, etc.; padrão `sha256`)
- **Resposta**: `{ algorithm, hash }`
- Calcula o hash do texto enviado.

```python
import requests

resp = requests.get("https://api.wiredia.dev/hash", params={"text": "hello", "algorithm": "sha256"})
print(resp.json())  # {"algorithm": "sha256", "hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"}
```

### `POST /compare`
- **Body**: `{ text, hash, algorithm? }`
- **Resposta**: `{ algorithm, match }`
- Compara o hash recebido com o texto informado.

```python
import requests

resp = requests.post("https://api.wiredia.dev/compare", json={
    "text": "hello",
    "hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    "algorithm": "sha256"
})
print(resp.json())  # {"algorithm": "sha256", "match": true}
```

### `POST /base64/encode`
- **Body**: `{ text }`
- **Resposta**: `{ encoded }`
- Converte o texto para Base64.

```python
import requests

resp = requests.post("https://api.wiredia.dev/base64/encode", json={"text": "Hello, World!"})
print(resp.json())  # {"encoded": "SGVsbG8sIFdvcmxkIQ=="}
```

### `POST /base64/decode`
- **Body**: `{ base64 }`
- **Resposta**: `{ decoded }`
- Decodifica uma string Base64 (erro se inválida).

```python
import requests

resp = requests.post("https://api.wiredia.dev/base64/decode", json={"base64": "SGVsbG8sIFdvcmxkIQ=="})
print(resp.json())  # {"decoded": "Hello, World!"}
```

### `POST /cpf`
- **Body**: `{ cpf }`
- **Resposta**: `{ valid, formatted }`
- Valida e formata um CPF.

```python
import requests

resp = requests.post("https://api.wiredia.dev/cpf", json={"cpf": "12345678909"})
print(resp.json())  # {"valid": true, "formatted": "123.456.789-09"}
```

### `POST /cep`
- **Body**: `{ cep }`
- **Resposta**: `{ valido, cep_limpo, cep_formatado, regiao, erros }`
- Verifica estrutura do CEP, devolvendo região e versão formatada.

```python
import requests

resp = requests.post("https://api.wiredia.dev/cep", json={"cep": "01311000"})
print(resp.json())  # {"valido": true, "cep_limpo": "01311000", "cep_formatado": "01311-000", "regiao": "Grande São Paulo", "erros": []}
```

### `POST /hex/encode`
- **Body**: `{ text }`
- **Resposta**: `{ encoded }`
- Converte texto para hexadecimal.

```python
import requests

resp = requests.post("https://api.wiredia.dev/hex/encode", json={"text": "hello"})
print(resp.json())  # {"encoded": "68656c6c6f"}
```

### `POST /hex/decode`
- **Body**: `{ hex }`
- **Resposta**: `{ decoded }`
- Converte hexadecimal para texto (erro se inválido).

```python
import requests

resp = requests.post("https://api.wiredia.dev/hex/decode", json={"hex": "68656c6c6f"})
print(resp.json())  # {"decoded": "hello"}
```

### `GET /timestamp`
- **Query**: `ts` (timestamp Unix em segundos)
- **Resposta**: `{ input, iso, locale, utc }`
- Converte timestamp para ISO, horário local (pt-BR) e UTC.

```python
import requests

resp = requests.get("https://api.wiredia.dev/timestamp", params={"ts": "1732102110"})
print(resp.json())  # {"input": "1732102110", "iso": "2024-11-20T12:01:50.000Z", "locale": "20/11/2024 09:01:50", "utc": "Wed, 20 Nov 2024 12:01:50 GMT"}
```

### `GET /lastfm/:username`
- **Resposta**: objeto com dados da última faixa tocada (via `getLatestTrack`).

```python
import requests

resp = requests.get("https://api.wiredia.dev/lastfm/seu_username")
print(resp.json())  # {"artist": "...", "track": "...", "album": "...", etc.}
```

### `GET /valor/:moeda`
- **Parâmetro**: `:moeda` (ex.: `usd`, `brl`, `btc`, `eth`, etc.)
- **Resposta**: `{ moeda, valor }`
- Retorna o valor convertido para BRL (fiat ou cripto).

```python
import requests

resp = requests.get("https://api.wiredia.dev/valor/USD")
print(resp.json())  # {"moeda": "USD", "valor": 5.25}

resp = requests.get("https://api.wiredia.dev/valor/BTC")
print(resp.json())  # {"moeda": "BTC", "valor": 350000.50}
```

## Logging
- Cada requisição gera uma linha JSON em `logs/YYYY-MM-DD.log`, com campos como `ip`, `method`, `path`, `status`, `body`, etc.

## Execução
```bash
npm install
npm run start # ou npx ts-node main.ts
```


