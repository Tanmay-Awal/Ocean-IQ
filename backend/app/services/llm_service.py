"""
OceanIQ LLM Service
===================
Abstracts Gemini and Groq model invocation with auto-fallback and history tracking.
"""

from __future__ import annotations

import os
import json
import logging
from datetime import datetime
from typing import Generator

# Import config values
from app.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    LLM_PRIMARY,
    LLM_FALLBACK,
    HISTORY_FILE,
    MAX_HISTORY,
)

logger = logging.getLogger(__name__)

# Configure Google Gemini
import google.generativeai as genai
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in configuration.")

# Configure Groq client if installed
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
    except ImportError:
        logger.warning("Groq SDK not installed, but GROQ_API_KEY is present.")
else:
    logger.warning("GROQ_API_KEY not found in configuration.")


class LLMService:
    @staticmethod
    def call_gemini(system_prompt: str, user_prompt: str, stream: bool = False) -> str | Generator[str, None, None]:
        """Call Google Generative AI (Gemini)."""
        if not GEMINI_API_KEY:
            raise ValueError("Gemini API key is not configured.")
        
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=system_prompt
        )
        
        if stream:
            response = model.generate_content(user_prompt, stream=True)
            def gen():
                for chunk in response:
                    yield chunk.text
            return gen()
        else:
            response = model.generate_content(user_prompt)
            return response.text

    @staticmethod
    def call_groq(system_prompt: str, user_prompt: str, stream: bool = False) -> str | Generator[str, None, None]:
        """Call Groq API (Llama)."""
        if not groq_client:
            raise ValueError("Groq client is not initialized.")
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        if stream:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                stream=True
            )
            def gen():
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            return gen()
        else:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                stream=False
            )
            return completion.choices[0].message.content

    @classmethod
    def generate_content(
        cls,
        system_prompt: str,
        user_prompt: str,
        provider: str = None,
        stream: bool = False
    ) -> str | Generator[str, None, None]:
        """
        Generate content using the primary provider and fallback if it fails.
        """
        primary = provider or LLM_PRIMARY
        fallback = LLM_FALLBACK if primary != LLM_FALLBACK else None
        
        providers_to_try = [primary]
        if fallback:
            providers_to_try.append(fallback)
            
        last_error = None
        for prov in providers_to_try:
            try:
                logger.info(f"Generating content using provider: {prov} (stream={stream})")
                if prov == "gemini":
                    return cls.call_gemini(system_prompt, user_prompt, stream=stream)
                elif prov == "groq":
                    return cls.call_groq(system_prompt, user_prompt, stream=stream)
                else:
                    raise ValueError(f"Unknown LLM provider: {prov}")
            except Exception as e:
                logger.error(f"Provider {prov} failed: {e}")
                last_error = e
                # Fallback to next provider in loop
                
        # If all providers failed, raise error
        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")

    @classmethod
    def log_interaction(cls, query: str, response: str) -> None:
        """Log user query and LLM response to history file."""
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, 'r') as f:
                    history = json.load(f)
            except Exception:
                pass
                
        history.append({
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response": response
        })
        
        # Limit history size
        history = history[-MAX_HISTORY:]
        
        try:
            with open(HISTORY_FILE, 'w') as f:
                json.dump(history, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to write chat history: {e}")
