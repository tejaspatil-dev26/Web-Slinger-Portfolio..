import logging
import re
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai.base import BaseAIProvider
from app.services.ai.factory import get_ai_provider
from app.core.config import settings
from app.services.rag import retriever

logger = logging.getLogger(__name__)

router = APIRouter()

# Fast-path cache for instant response to common portfolio chips and questions (<10ms)
FAST_ANSWERS = {
    "about": (
        "Tejas Sharad Patil is an AI/ML Engineer, Software Developer, and Problem Solver from Mumbai. "
        "He specializes in designing intelligent systems, modern web architectures, and full-stack applications, "
        "and secured **Rank 1 at EUREKA 26** for his technical innovations."
    ),
    "projects": (
        "Tejas has built several standout projects:\n"
        "• **Eco-AI**: AI-powered sustainability and energy monitoring system.\n"
        "• **AI StudyMate**: Intelligent academic assistant powered by RAG document retrieval.\n"
        "• **HeatShield AI**: High-performance thermal and system anomaly monitoring.\n"
        "• **Cross-Platform AI Chatbot**: Interactive, multi-format RAG knowledge assistant."
    ),
    "skills": (
        "Tejas's key technical strengths include:\n"
        "• **Languages**: Python, JavaScript/TypeScript, HTML5, CSS3, C++, SQL\n"
        "• **AI & ML**: PyTorch, Scikit-Learn, LangChain, RAG Systems, Ollama, Vector Databases\n"
        "• **Web & Cloud**: FastAPI, React, Node.js, Express, REST APIs, Git, Docker"
    ),
    "contact": (
        "You can reach Tejas directly at **tejaspatil2629@gmail.com**, connect with him on LinkedIn & GitHub "
        "using the social links on this portfolio, or send a note via the contact section!"
    ),
    "heatshield": (
        "**HeatShield AI** is an intelligent thermal anomaly detection and predictive monitoring system. "
        "Tejas built it using AI/ML algorithms and Python to identify temperature spikes early and protect critical industrial and computing hardware from overheating."
    ),
    "eco_ai": (
        "**Eco-AI** is a smart energy and sustainability monitoring platform created by Tejas. "
        "It leverages machine learning predictive models to track energy efficiency, detect wastage patterns, and recommend optimal resource management."
    ),
    "studymate": (
        "**AI StudyMate** is an interactive learning companion built by Tejas. "
        "It integrates document RAG intelligence, automated notes summarization, flashcards, and conceptual Q&A to help students learn faster."
    ),
    "eureka": (
        "Tejas achieved **Rank 1 at EUREKA 26**, competing against top engineering innovators and presenting cutting-edge AI architectures that demonstrated technical excellence."
    ),
    "education": (
        "Tejas has a strong academic foundation in Computer Engineering / Artificial Intelligence and Machine Learning, with a focus on real-world engineering and software development."
    ),
    "resume": (
        "You can view and download Tejas's complete CV/Resume by clicking the **'Resume CV'** button directly on the portfolio homepage!"
    ),
    "more": (
        "Tejas is passionate about building scalable, production-grade AI solutions that solve real-world problems. "
        "He blends strong algorithmic problem-solving with full-stack software development to create robust, beautiful applications."
    ),
    "thanks": (
        "You're very welcome! Feel free to ask anything else about Tejas's projects, experience, or resume."
    ),
    "who_are_you": (
        "I am Shri, Tejas Patil's AI Assistant. I can tell you all about his projects, skills, education, and achievements!"
    )
}

def match_fast_answer(query: str):
    q = re.sub(r"[^a-zA-Z0-9\s]", "", query).strip().lower()
    if not q:
        return None
    
    if q in ["tell me about tejas", "who is tejas", "who is tejas patil", "about tejas", "tejas", "tell me about you", "tell me about yourself", "who are you", "who is shri", "shri"]:
        if "who are you" in q or "shri" in q:
            return FAST_ANSWERS["who_are_you"]
        return FAST_ANSWERS["about"]
    
    if any(k in q for k in ["heatshield", "heat shield"]):
        return FAST_ANSWERS["heatshield"]

    if any(k in q for k in ["ecoai", "eco ai", "sustainability"]):
        return FAST_ANSWERS["eco_ai"]

    if any(k in q for k in ["studymate", "study mate", "academic"]):
        return FAST_ANSWERS["studymate"]

    if any(k in q for k in ["eureka", "award", "achievement", "rank 1", "first prize", "won"]):
        return FAST_ANSWERS["eureka"]

    if any(k in q for k in ["education", "college", "degree", "study", "university"]):
        return FAST_ANSWERS["education"]

    if any(k in q for k in ["resume", "cv", "download resume"]):
        return FAST_ANSWERS["resume"]

    if any(k in q for k in ["what projects has he built", "show me projects", "what are his projects", "projects he built", "projects", "his projects"]):
        return FAST_ANSWERS["projects"]
    
    if any(k in q for k in ["what are his key skills", "key skills", "skills", "tech stack", "technologies", "what skills"]):
        return FAST_ANSWERS["skills"]
    
    if any(k in q for k in ["how can i contact", "how to contact", "contact tejas", "contact", "email", "reach out", "reach him"]):
        return FAST_ANSWERS["contact"]
    
    if q in ["thanks", "thank you", "thanks!", "thank you!"]:
        return FAST_ANSWERS["thanks"]
    
    if q in ["tell me more", "explain in detail", "more"]:
        return FAST_ANSWERS["more"]

    return None

@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    ai_provider: BaseAIProvider = Depends(get_ai_provider)
):
    try:
        # Check instant fast-path cache first for lightning speed (<10ms)
        cached_reply = match_fast_answer(request.message)
        if cached_reply:
            logger.info(f"Instant cache hit for: '{request.message[:40]}'")
            return ChatResponse(
                response=cached_reply,
                sources=[{"file_name": "tejas_patil_portfolio.txt", "chunk_index": 0}],
                rag_applied=True
            )

        # Limit conversation history to the last 4 messages (2 turns) to keep LLM context small and fast
        trimmed_history = request.history[-4:] if len(request.history) > 4 else request.history
        messages = [{"role": msg.role, "content": msg.content} for msg in trimmed_history]
        messages.append({"role": "user", "content": request.message})

        final_system_prompt = request.system_prompt
        sources = []
        rag_applied = False

        # Attempt RAG context retrieval if enabled (clamped to top 2 chunks)
        if settings.RAG_ENABLED and request.use_rag:
            try:
                context_str, retrieved_sources = retriever.retrieve_context(request.message, top_k=2)
                if context_str:
                    final_system_prompt = retriever.build_rag_system_prompt(
                        context_str=context_str,
                        base_prompt=request.system_prompt
                    )
                    sources = retrieved_sources
                    rag_applied = True
                    logger.info(f"RAG applied with {len(sources)} source chunks for query: '{request.message[:40]}'")
            except Exception as e:
                logger.warning(f"RAG retrieval skipped due to error: {e}")

        bot_reply = await ai_provider.generate_response(
            messages=messages,
            system_prompt=final_system_prompt
        )
        return ChatResponse(
            response=bot_reply,
            sources=sources,
            rag_applied=rag_applied
        )
    except Exception as e:
        logger.error(f"Chat completion failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")