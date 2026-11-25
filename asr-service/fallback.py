"""Pure helpers for the parakeet -> whisper fallback logic.

No model loading and no side effects: every function takes plain data (strings,
floats, dicts or objects) so it can be unit-tested without loading models.
"""

from typing import Optional


def parse_fallback_languages(raw: Optional[str]) -> list[Optional[str]]:
    """Parse the ASR_FALLBACK_LANGUAGES env value into whisper fallback passes.

    Unset defaults to "en,zh". An empty value or "none" means a single
    auto-detect pass; a None entry lets whisper detect the language instead of
    forcing a code.
    """
    if raw is None:
        raw = "en,zh"
    cleaned = raw.strip()
    if not cleaned or cleaned.lower() == "none":
        return [None]
    languages = []
    for part in cleaned.split(","):
        code = part.strip().lower()
        if code:
            languages.append(code)
    return languages or [None]


def ordered_fallback_languages(languages: list[Optional[str]], requested: Optional[str]) -> list[Optional[str]]:
    """Prepend an explicit request language to the configured passes, deduped.

    The explicit code is lowercased and trimmed on entry; because ties keep the
    earliest pass, a requested language wins ties against a later configured one.
    """
    if requested is None or not requested.strip():
        return languages
    code = requested.strip().lower()
    ordered = [code]
    for language in languages:
        if language is None or language.lower() != code:
            ordered.append(language)
    return ordered


def whisper_pass_kwargs(language: Optional[str]) -> dict:
    """Extra mlx_whisper.transcribe kwargs for one pass.

    Whisper tends to return traditional characters for Mandarin, so zh passes get
    a simplified-Mandarin initial_prompt to bias Mandarin and simplified output.
    """
    if language is not None and language.lower().startswith("zh"):
        return {"initial_prompt": "以下是普通话的句子。"}
    return {}


def mean_sentence_confidence(sentences) -> float:
    """Mean confidence over parakeet sentence objects; 0.0 when there are none."""
    confidences = []
    for sentence in sentences or []:
        confidence = getattr(sentence, "confidence", None)
        if confidence is not None:
            confidences.append(float(confidence))
    if not confidences:
        return 0.0
    return sum(confidences) / len(confidences)


def should_whisper_fallback(confidence: Optional[float], threshold: float) -> bool:
    """True when a parakeet result's mean confidence triggers the whisper fallback.

    Missing confidence (no sentences) counts as 0.0 and triggers the fallback.
    """
    if confidence is None:
        confidence = 0.0
    return confidence < threshold


def whisper_run_score(segments) -> float:
    """Mean avg_logprob over whisper segments; -inf when no segment carries one."""
    logprobs = []
    for segment in segments or []:
        if isinstance(segment, dict):
            value = segment.get("avg_logprob")
        else:
            value = getattr(segment, "avg_logprob", None)
        if value is not None:
            logprobs.append(float(value))
    if not logprobs:
        return float("-inf")
    return sum(logprobs) / len(logprobs)


def whisper_run_from_result(result, attempted_language: Optional[str]) -> dict:
    """Build a plain-data whisper run record from a raw whisper result.

    Keys: language (attempted code), text, score (mean segment avg_logprob),
    duration (last segment end) and detected (whisper's detected language).
    Works for both dict and object results.
    """
    if isinstance(result, dict):
        text = result.get("text", "")
        segments = result.get("segments", []) or []
        detected = result.get("language")
    else:
        text = getattr(result, "text", "")
        segments = getattr(result, "segments", []) or []
        detected = getattr(result, "language", None)

    duration = None
    if segments:
        last_segment = segments[-1]
        if isinstance(last_segment, dict):
            duration = last_segment.get("end")
        else:
            duration = getattr(last_segment, "end", None)

    return {
        "language": attempted_language,
        "text": text.strip(),
        "score": whisper_run_score(segments),
        "duration": duration,
        "detected": detected,
    }


def pick_best_whisper_run(runs: list[dict]) -> Optional[dict]:
    """Pick the highest-scoring whisper run; ties keep the earliest one."""
    best = None
    for run in runs:
        if best is None or run["score"] > best["score"]:
            best = run
    return best


def whisper_run_language(run: dict) -> Optional[str]:
    """Language of a whisper run: the forced code, or whisper's detection for auto passes."""
    return run["detected"] if run["language"] is None else run["language"]
