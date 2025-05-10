from openai import OpenAI
import json
import os

from chat_history import ChatHistory


def lambda_handler(event, context):
    client = OpenAI(api_key=os.environ.get("OPEN_AI_KEY"))

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    method = (
        event.get("httpMethod") or
        event.get("requestContext", {}).get("http", {}).get("method") or "POST"
    )

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    elif method == "GET":
        user_id = event.get("queryStringParameters", {}).get("user_id")
        if not user_id:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing user_id"})
            }

        messages = ChatHistory.get_chat_history(user_id)
        recent_messages = [{"role": m.role, "content": m.content} for m in messages[-6:]]

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"messages": recent_messages})
        }

    elif method == "POST":
        try:
            body = json.loads(event.get('body', '{}'))
            print("body: ", body)
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Invalid JSON"})
            }

        user_id = body.get('user_id')
        user_prompt = body.get('user_prompt')

        if not user_id or not user_prompt:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing user prompt or user id"})
            }

        system_prompt = {
            "role": "system",
            "content": (
                "You are an AI assistant who specializes in everything related to dogs 🐶. "
                "You’re an expert on dog breeds, behavior, training, health, nutrition, grooming, adoption, and care. "
                "Always respond with a focus on helping dog owners, sitters, and enthusiasts. "
                "Use a friendly and playful tone — feel free to add dog-like gestures such as 'woof!', tail wags, or dog emojis 🐕🐾 when it fits the conversation!"
            )
        }

        messages = ChatHistory.get_chat_history(user_id)
        conversation_history = [system_prompt]
        conversation_history += [{"role": msg.role, "content": msg.content} for msg in messages[-6:]]
        conversation_history.append({"role": "user", "content": user_prompt})

        try:
            chat_completion = client.chat.completions.create(
                messages=conversation_history,
                model="gpt-3.5-turbo",
                max_tokens=20
            )
        except Exception as e:
            print("OpenAI failed:", str(e))
            return {
                "statusCode": 500,
                "headers": headers,
                "body": json.dumps({"error": "OpenAI error", "detail": str(e)})
            }

        ai_response = chat_completion.choices[0].message.content

        ChatHistory.save_message(user_id, "user", user_prompt)
        ChatHistory.save_message(user_id, "assistant", ai_response)

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"response": ai_response})
        }

    else:
        # Fallback for unrecognized methods
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": f"Method {method} not allowed"})
        }

