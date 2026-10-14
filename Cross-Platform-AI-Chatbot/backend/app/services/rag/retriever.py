# -*- coding: utf-8 -*-
"""
Retriever - searches vector store and builds an LLM-ready context prompt.
Supports both semantic search and full-document overview/summary extraction.
"""
from typing import List, Tuple
from app.services.rag import vector_store
from app.core.config import settings

OVERVIEW_KEYWORDS = [
    "summary", "summarize", "about", "overview", "explain", "describe",
    "presentation", "ppt", "document", "file", "project", "topic",
    "main point", "key point", "what is this", "tell me about", "brief",
    "short", "detail", "details"
]


def is_overview_query(query: str) -> bool:
    """Check if the user is asking for an overview or summary of the uploaded document(s)."""
    q = query.lower()
    return any(k in q for k in OVERVIEW_KEYWORDS)


def retrieve_context(query: str, top_k: int = None) -> Tuple[str, List[dict]]:
    """
    Search for relevant document chunks and build a context string.

    Returns:
        context_str: formatted context string to inject into LLM prompt
        sources: list of source metadata dicts for citation display
    """
    total_docs = vector_store.get_document_count()
    if total_docs == 0:
        return "", []

    top_k = min(top_k or settings.TOP_K_RESULTS, 2)
    is_overview = is_overview_query(query)

    hits = []
    if is_overview:
        # Overview queries: fetch top 2 profile overview chunks for speed
        hits = vector_store.get_all_chunks(limit=2)
    else:
        # Standard semantic search: top 2 most relevant chunks
        hits = vector_store.search(query, top_k=top_k)

    # Fallback: if search returned no hits but documents exist, supply initial chunks
    if not hits and total_docs > 0:
        hits = vector_store.get_all_chunks(limit=2)

    if not hits:
        return "", []

    # Build compact context block
    context_parts = []
    for i, hit in enumerate(hits[:2], 1):
        context_parts.append(
            f"[Source {i}: {hit['file_name']} (Chunk {hit.get('chunk_index', 0) + 1})]\n{hit['text']}"
        )

    context_str = "\n\n---\n\n".join(context_parts)
    return context_str, hits[:2]


def build_rag_system_prompt(context_str: str, base_prompt: str = "") -> str:
    """
    Build the final system prompt that includes retrieved context.
    Optimized for high-speed, concise replies.
    """
    rag_instruction = """You are Shri, the fast and intelligent AI assistant for Tejas Patil's portfolio.
Use this CONTEXT to answer the user's question:

CONTEXT:
{context}

RULES:
1. Answer concisely in 2-3 direct sentences (max 60 words).
2. Highlight Tejas's projects (Eco-AI, HeatShield AI, AI StudyMate), skills (AI/ML, Python, Full Stack), or achievements (Rank 1 at EUREKA 26).
3. If asked about contact, mention tejaspatil2629@gmail.com.
4. Be quick, crisp, and professional."""

    if base_prompt:
        return f"{base_prompt}\n\n{rag_instruction.format(context=context_str)}"
    return rag_instruction.format(context=context_str)


def has_documents() -> bool:
    """Check if any documents are loaded in the vector store."""
    return vector_store.get_document_count() > 0
