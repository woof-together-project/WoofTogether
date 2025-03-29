from openai import OpenAI
import json
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env
api_key = os.getenv("OPENAI_API_KEY")


def lambda_handler(event, context):
    client = OpenAI(api_key=api_key)
    print("event: ", event)
    try:
        body = json.loads(event.get('body', '{}'))
        print("body: ", body)
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid JSON"})
        }
    conversation_history = []
    user_prompt = body.get('user_prompt')

    if not user_prompt:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing user_prompt"})
        }
    conversation_history.append({"role": "user", "content": user_prompt})
    chat_completion = client.chat.completions.create(
        messages=conversation_history,
        model="gpt-3.5-turbo",
        max_tokens=20
    )

    ai_response = chat_completion.choices[0].message.content
    return {
        "statusCode": 200,
        "body": json.dumps({"response": ai_response})
    }
