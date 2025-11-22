# <img src="https://img.shields.io/badge/API-Wiredia-2563eb?style=flat" alt="Wiredia API" /> api.wiredia.dev

> Documentação rápida dos endpoints expostos pelo servidor Express (`main.ts`).  
> Todos retornam respostas em JSON e seguem o rate limit global de **100 requisições por minuto por IP**.

---

## Autenticação

Para usar a API, você precisa de uma API Key. Primeiro, registre-se e gere sua chave:

### Registro e Login

1. **Registrar**: Acesse [`https://api.wiredia.dev/registrar`](https://api.wiredia.dev/registrar)
   - Informe seu email e senha (mínimo 8 caracteres)
   - Após o registro, você será redirecionado para a página de login

2. **Login**: Acesse [`https://api.wiredia.dev/login`](https://api.wiredia.dev/login)
   - Use seu email e senha
   - Marque "Lembrar de mim" para manter a sessão ativa
   - Após o login, você será redirecionado para o painel

### Painel de Controle

No painel ([`https://api.wiredia.dev/panel`](https://api.wiredia.dev/panel)), você pode:

- **Ver estatísticas**: Suas requisições pessoais e o total de requisições da API
- **Gerar API Keys**: Clique em "Gerar API Key" para criar uma nova chave
- **Gerenciar chaves**: Visualize todas as suas API keys e quando foram criadas

### Usando a API Key

Todas as requisições aos endpoints da API precisam incluir sua API Key no header:

```python
import requests

headers = {
    "x-api-key": "sua_api_key_aqui"
}

resp = requests.get("https://api.wiredia.dev/hash", 
                    params={"text": "hello"}, 
                    headers=headers)
```

---

## Rotas disponíveis

### `GET /hash`
- **Query**: `text` (obrigatório), `algorithm` (`md5`, `sha1`, `sha256`, etc.; padrão `sha256`)
- **Resposta**: `{ algorithm, hash }`
- Calcula o hash do texto enviado.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.get("https://api.wiredia.dev/hash", 
                    params={"text": "hello", "algorithm": "sha256"},
                    headers=headers)
print(resp.json())  # {"algorithm": "sha256", "hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"}
```

### `POST /compare`
- **Body**: `{ text, hash, algorithm? }`
- **Resposta**: `{ algorithm, match }`
- Compara o hash recebido com o texto informado.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/compare", 
                     json={
                         "text": "hello",
                         "hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                         "algorithm": "sha256"
                     },
                     headers=headers)
print(resp.json())  # {"algorithm": "sha256", "match": true}
```

### `POST /base64/encode`
- **Body**: `{ text }`
- **Resposta**: `{ encoded }`
- Converte o texto para Base64.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/base64/encode", 
                     json={"text": "Hello, World!"},
                     headers=headers)
print(resp.json())  # {"encoded": "SGVsbG8sIFdvcmxkIQ=="}
```

### `POST /base64/decode`
- **Body**: `{ base64 }`
- **Resposta**: `{ decoded }`
- Decodifica uma string Base64 (erro se inválida).

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/base64/decode", 
                     json={"base64": "SGVsbG8sIFdvcmxkIQ=="},
                     headers=headers)
print(resp.json())  # {"decoded": "Hello, World!"}
```

### `POST /cpf`
- **Body**: `{ cpf }`
- **Resposta**: `{ valid, formatted }`
- Valida e formata um CPF.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/cpf", 
                     json={"cpf": "12345678909"},
                     headers=headers)
print(resp.json())  # {"valid": true, "formatted": "123.456.789-09"}
```

### `POST /cep`
- **Body**: `{ cep }`
- **Resposta**: `{ valido, cep_limpo, cep_formatado, regiao, erros }`
- Verifica estrutura do CEP, devolvendo região e versão formatada.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/cep", 
                     json={"cep": "01311000"},
                     headers=headers)
print(resp.json())  # {"valido": true, "cep_limpo": "01311000", "cep_formatado": "01311-000", "regiao": "Grande São Paulo", "erros": []}
```

### `POST /hex/encode`
- **Body**: `{ text }`
- **Resposta**: `{ encoded }`
- Converte texto para hexadecimal.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/hex/encode", 
                     json={"text": "hello"},
                     headers=headers)
print(resp.json())  # {"encoded": "68656c6c6f"}
```

### `POST /hex/decode`
- **Body**: `{ hex }`
- **Resposta**: `{ decoded }`
- Converte hexadecimal para texto (erro se inválido).

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.post("https://api.wiredia.dev/hex/decode", 
                     json={"hex": "68656c6c6f"},
                     headers=headers)
print(resp.json())  # {"decoded": "hello"}
```

### `GET /timestamp`
- **Query**: `ts` (timestamp Unix em segundos)
- **Resposta**: `{ input, iso, locale, utc }`
- Converte timestamp para ISO, horário local (pt-BR) e UTC.

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.get("https://api.wiredia.dev/timestamp", 
                    params={"ts": "1732102110"},
                    headers=headers)
print(resp.json())  # {"input": "1732102110", "iso": "2024-11-20T12:01:50.000Z", "locale": "20/11/2024 09:01:50", "utc": "Wed, 20 Nov 2024 12:01:50 GMT"}
```

### `GET /lastfm/:username`
- **Resposta**: objeto com dados da última faixa tocada (via `getLatestTrack`).

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.get("https://api.wiredia.dev/lastfm/seu_username",
                    headers=headers)
print(resp.json())  # {"artist": "...", "track": "...", "album": "...", etc.}
```

### `GET /valor/:moeda`
- **Parâmetro**: `:moeda` (ex.: `usd`, `brl`, `btc`, `eth`, etc.)
- **Resposta**: `{ moeda, valor }`
- Retorna o valor convertido para BRL (fiat ou cripto).

```python
import requests

headers = {"x-api-key": "sua_api_key_aqui"}
resp = requests.get("https://api.wiredia.dev/valor/USD", headers=headers)
print(resp.json())  # {"moeda": "USD", "valor": 5.25}

resp = requests.get("https://api.wiredia.dev/valor/BTC", headers=headers)
print(resp.json())  # {"moeda": "BTC", "valor": 350000.50}
```

---

## Logging

Cada requisição gera uma linha JSON em `logs/YYYY-MM-DD.log`, com campos como `ip`, `method`, `path`, `status`, `body`, etc.

---

## Execução
```bash
npm install
npm run start # ou npx ts-node main.ts
```


