import requests

BASE_URL = "http://localhost:3000"
# BASE_URL = "http://localhost:3000"  # descomente para testar local
API_KEY = "a6dfd636847b87863710226b857c03edc95a4a090132f438"

HEADERS = {
    "x-api-key": API_KEY
}

print(f"Usando API Key: {API_KEY}\n")

def test_endpoint(name, func):
    try:
        result, expected = func()
        if result == expected:
            print(f"✓ {name}: OK")
            return True
        else:
            print(f"✗ {name}: ERROR - Esperado: {expected}, Recebido: {result}")
            return False
    except Exception as e:
        print(f"✗ {name}: ERROR - {str(e)}")
        return False

print("Testando todos os endpoints da API...\n")

results = []


# 1. GET /hash
def test_hash():
    resp = requests.get(
        f"{BASE_URL}/hash",
        params={"text": "hello", "algorithm": "sha256"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("hash") == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", True
results.append(test_endpoint("GET /hash", test_hash))


# 2. POST /compare
def test_compare():
    resp = requests.post(
        f"{BASE_URL}/compare",
        json={
            "text": "hello",
            "hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
            "algorithm": "sha256"
        },
        headers=HEADERS
    )
    data = resp.json()
    return data.get("match") == True, True
results.append(test_endpoint("POST /compare", test_compare))


# 3. POST /base64/encode
def test_base64_encode():
    resp = requests.post(
        f"{BASE_URL}/base64/encode",
        json={"text": "Hello, World!"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("encoded") == "SGVsbG8sIFdvcmxkIQ==", True
results.append(test_endpoint("POST /base64/encode", test_base64_encode))


# 4. POST /base64/decode
def test_base64_decode():
    resp = requests.post(
        f"{BASE_URL}/base64/decode",
        json={"base64": "SGVsbG8sIFdvcmxkIQ=="},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("decoded") == "Hello, World!", True
results.append(test_endpoint("POST /base64/decode", test_base64_decode))


# 5. POST /cpf
def test_cpf():
    resp = requests.post(
        f"{BASE_URL}/cpf",
        json={"cpf": "12345678909"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("valid") == True and data.get("formatted") == "123.456.789-09", True
results.append(test_endpoint("POST /cpf", test_cpf))


# 6. POST /cep
def test_cep():
    resp = requests.post(
        f"{BASE_URL}/cep",
        json={"cep": "01311000"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("valido") == True and data.get("cep_formatado") == "01311-000", True
results.append(test_endpoint("POST /cep", test_cep))


# 7. POST /hex/encode
def test_hex_encode():
    resp = requests.post(
        f"{BASE_URL}/hex/encode",
        json={"text": "hello"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("encoded") == "68656c6c6f", True
results.append(test_endpoint("POST /hex/encode", test_hex_encode))


# 8. POST /hex/decode
def test_hex_decode():
    resp = requests.post(
        f"{BASE_URL}/hex/decode",
        json={"hex": "68656c6c6f"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("decoded") == "hello", True
results.append(test_endpoint("POST /hex/decode", test_hex_decode))


# 9. GET /timestamp
def test_timestamp():
    resp = requests.get(
        f"{BASE_URL}/timestamp",
        params={"ts": "1732102110"},
        headers=HEADERS
    )
    data = resp.json()
    return data.get("input") == "1732102110" and "iso" in data and "locale" in data, True
results.append(test_endpoint("GET /timestamp", test_timestamp))


# 10. GET /lastfm/:username
def test_lastfm():
    resp = requests.get(
        f"{BASE_URL}/lastfm/testuser",
        headers=HEADERS
    )
    return resp.status_code in [200, 400], True
results.append(test_endpoint("GET /lastfm/:username", test_lastfm))


# 11. GET /valor/:moeda
def test_valor():
    resp = requests.get(
        f"{BASE_URL}/valor/USD",
        headers=HEADERS
    )
    data = resp.json()
    return data.get("moeda") == "USD" and isinstance(data.get("valor"), (int, float)), True
results.append(test_endpoint("GET /valor/:moeda", test_valor))


print(f"\n{'='*50}")
print(f"Resumo: {sum(results)}/{len(results)} endpoints funcionando corretamente")
print(f"{'='*50}")
