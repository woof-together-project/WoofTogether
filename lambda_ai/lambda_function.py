from openai import OpenAI
import json
import os

from chat_history import ChatHistory


def lambda_handler(event, context):
    client = OpenAI(api_key=os.environ.get("OPEN_AI_KEY"))

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

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

    # define assistant
    system_prompt = [{"role": "system", "content": "You are an AI assistant who specializes "
                                                   "in everything related to dogs 🐾. You’re an expert on dog breeds,"
                                                   "behavior, training, health, nutrition, "
                                                   "grooming, adoption, and care. "
                                                   "Always respond with a focus on helping dog owners, sitters, and "
                                                   "enthusiasts. Use a friendly and playful tone — feel free to add "
                                                   "dog-like gestures such as 'woof!', tail wags, or dog emojis 🐶🐕 "
                                                   "when it fits the conversation!"},
                     {"role": "user", "content": "How do I teach my puppy to sit?"},
                     {"role": "assistant", "content": "Woof! 🐾 Teaching 'sit' is a great first command! "
                                                      "Hold a treat close to your pup’s nose, then move your hand up. "
                                                      "As their head follows, their bottom will naturally lower. "
                                                      "The moment they sit — say 'Sit!' and give the treat 🦴. "
                                                      "Good pup! 🎉"}]
    # 1. Fetch chat history from RDS
    messages = ChatHistory.get_chat_history(user_id)
    conversation_history = [system_prompt]
    conversation_history += [{"role": msg.role, "content": msg.content} for msg in reversed(messages)]
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
