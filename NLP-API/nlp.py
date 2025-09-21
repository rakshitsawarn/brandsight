import json
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI()

# Input schema
class ReviewRequest(BaseModel):
    model: str
    reviews: list[str]   # multiple reviews in one request

groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "message": "LLM API is running"}

@app.post("/suggestions", response_class=PlainTextResponse)
def suggestions(payload: ReviewRequest):
    try:
        # Join reviews into a single text block for batching
        reviews_text = "\n".join(
            [f"Review {i+1}: {r}" for i, r in enumerate(payload.reviews)]
        )

        response = groqClient.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are an app review analyst.\n\n"
                        "RULES:\n"
                        "1. Analyze the provided app reviews.\n"
                        "2. Identify recurring problems, pain points, or requests.\n"
                        "3. Generate **clear, actionable improvement suggestions**.\n"
                        "   - Example: If review says 'app crashes on launch' → suggest 'Fix crash occurring on launch by checking crash logs'.\n"
                        "   - If review says 'login is slow' → suggest 'Optimize login API to reduce authentication delay'.\n"
                        "   - If review says 'UI confusing' → suggest 'Redesign navigation for clarity'.\n"
                        "4. Return suggestions in a bullet point list.\n"
                        "5. Keep suggestions concise and actionable (avoid generic phrases like 'improve performance')."
                    )
                },
                {
                    "role": "user", 
                    "content": f"Here are the reviews:\n{reviews_text}"
                }
            ],
            model=payload.model  
        )

        return response.choices[0].message.content

    except requests.exceptions.RequestException as e:
        return f"Error: {e}"










# import json
# from fastapi import FastAPI
# from fastapi.responses import PlainTextResponse
# from pydantic import BaseModel
# import requests

# import numpy as np

# import os
# from dotenv import load_dotenv

# from groq import Groq

# load_dotenv()

# app = FastAPI()

# # Text Generation
# class ChatRequest(BaseModel):
#     model: str
#     message: str

# groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

# @app.api_route("/", methods=["GET", "HEAD"])
# def root():
#     return {"status": "ok", "message": "LLM API is running"}

# @app.post("/chat", response_class=PlainTextResponse)
# def chat(payload: ChatRequest):
#     try:
#         response = groqClient.chat.completions.create(
#             messages=[
#                 {
#                     "role": "system", 
#                     "content": (
#                         "You are a helpful assistant.\n\n"
#                         "RULES:\n"
#                         "1. Only generate a quiz if the user explicitly asks for a quiz.\n"
#                         "2. When generating a quiz, the response must follow this structure:\n"
#                         "   a) Introductory text like (example: 'Here is your quiz:', 'Here’s a small quiz on XYZ:', or 'This is a N-question quiz on XYZ:') or something you think is good.\n"
#                         "   b) The quiz in **strict JSON format**:\n"
#                         "      ```json\n"
#                         "      [\n"
#                         "        {\n"
#                         "          \"question\": \"<string>\",\n"
#                         "          \"options\": [\"<string>\", \"<string>\", \"<string>\", \"<string>\"],\n"
#                         "          \"answer\": \"<string>\"\n"
#                         "        }\n"
#                         "      ]\n"
#                         "      ```\n"
#                         "      - Each quiz must contain multiple questions.\n"
#                         "      - Each question must have exactly 4 options.\n"
#                         "      - The answer must exactly match one of the options.\n"
#                         "      - Do not add explanations or formatting outside this structure.\n"
#                         "   c) Closing text after the quiz (example: 'Good luck!', 'Have fun!', or 'Let’s see how you do!').\n"
#                         "3. For all non-quiz responses, reply normally in plain text only (not JSON).\n"
#                         "4. You may occasionally ask the user if they would like a quiz, but never reveal or explain the JSON quiz format itself."
#                     )
#                 },
#                 {
#                     "role": "user", 
#                     "content": payload.message
#                 }
#             ],
#             model=payload.model  
#         )


#         print(response.choices[0].message.content)

#         return response.choices[0].message.content

#     except requests.exceptions.RequestException as e:
#         return f"Error: {e}"

