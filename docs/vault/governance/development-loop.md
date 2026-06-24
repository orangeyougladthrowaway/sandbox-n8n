# Development loop (GUI ↔ JSON ↔ lib)

#n8n #governance

1. Edit `lib/` in Cursor → `.\scripts\run.ps1 test`
2. Edit workflow JSON in Cursor → `.\scripts\run.ps1 import-workflows` (or manual import)
3. Edit canvas in n8n GUI → export JSON → commit to `workflows/`
4. Never commit GUI-only state without export

## Local demo stack

```powershell
# Terminal 1
.\scripts\run.ps1 mock-api

# Terminal 2
.\scripts\run.ps1 n8n
```

See [[guides/native-runtime]].
