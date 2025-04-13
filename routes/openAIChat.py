from flask import request
from openai import OpenAI
import json
import os
from dotenv import load_dotenv
from models.chat_history import ChatHistory

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

    data = request.get_json()
    user_id = data.get('user_id')
    user_prompt = body.get('user_prompt')

    if not user_id or not user_prompt:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing user_id or user_prompt"})
        }

    # 1. Get previous messages
    messages = ChatHistory.get_chat_history(user_id)
    conversation_history = [{"role": msg.role, "content": msg.content} for msg in reversed(messages)]

    # 2. Add user's new message
    conversation_history.append({"role": "user", "content": user_prompt})

    # 3. Call OpenAI

    # if not user_prompt:
    #     return {
    #         "statusCode": 400,
    #         "body": json.dumps({"error": "Missing user_prompt"})
    #     }
    # conversation_history.append({"role": "user", "content": user_prompt})
    chat_completion = client.chat.completions.create(
        messages=conversation_history,
        model="gpt-3.5-turbo",
        max_tokens=20
    )

    ai_response = chat_completion.choices[0].message.content

    # 4. Save both user prompt and AI reply to the DB
    ChatHistory.save_message(user_id, "user", user_prompt)
    ChatHistory.save_message(user_id, "assistant", ai_response)

    return {
        "statusCode": 200,
        "body": json.dumps({"response": ai_response})
    }
