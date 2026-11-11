import os

# 測試一律使用暫代解讀，不呼叫 Claude API。
os.environ["USE_MOCK_LLM"] = "true"
