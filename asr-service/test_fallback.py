"""Unit tests for the pure parakeet -> whisper fallback helpers (stdlib unittest)."""

import math
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import asr_server
import fallback


class ParseFallbackLanguagesTest(unittest.TestCase):
    def test_default_when_unset(self):
        self.assertEqual(fallback.parse_fallback_languages(None), ["en", "zh"])

    def test_comma_list(self):
        self.assertEqual(fallback.parse_fallback_languages("en,zh"), ["en", "zh"])

    def test_codes_are_lowercased(self):
        self.assertEqual(fallback.parse_fallback_languages("EN, ZH-CN"), ["en", "zh-cn"])

    def test_strips_spaces_and_drops_empty_entries(self):
        self.assertEqual(fallback.parse_fallback_languages(" en , , zh "), ["en", "zh"])

    def test_single_language(self):
        self.assertEqual(fallback.parse_fallback_languages("zh"), ["zh"])

    def test_empty_string_means_single_auto_pass(self):
        self.assertEqual(fallback.parse_fallback_languages(""), [None])

    def test_none_means_single_auto_pass(self):
        self.assertEqual(fallback.parse_fallback_languages("none"), [None])

    def test_none_is_case_insensitive(self):
        self.assertEqual(fallback.parse_fallback_languages("NONE"), [None])

    def test_only_separators_means_single_auto_pass(self):
        self.assertEqual(fallback.parse_fallback_languages(",,"), [None])


class GetFallbackLanguagesTest(unittest.TestCase):
    def get_with_env(self, value):
        env = {} if value is None else {"ASR_FALLBACK_LANGUAGES": value}
        with patch.dict(asr_server.os.environ, env, clear=True):
            return asr_server.get_fallback_languages()

    def test_unset_env_defaults_to_en_zh(self):
        self.assertEqual(self.get_with_env(None), ["en", "zh"])

    def test_env_value_is_parsed(self):
        self.assertEqual(self.get_with_env("zh"), ["zh"])

    def test_empty_env_value_means_auto_pass(self):
        self.assertEqual(self.get_with_env(""), [None])


class GetParakeetConfidenceThresholdTest(unittest.TestCase):
    def test_default_when_unset(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertAlmostEqual(asr_server.get_parakeet_confidence_threshold(), 0.8)

    def test_env_value(self):
        with patch.dict(os.environ, {"ASR_PARAKEET_CONFIDENCE_THRESHOLD": "0.6"}, clear=True):
            self.assertAlmostEqual(asr_server.get_parakeet_confidence_threshold(), 0.6)

    def test_invalid_value_falls_back_to_default(self):
        with patch.dict(os.environ, {"ASR_PARAKEET_CONFIDENCE_THRESHOLD": "garbage"}, clear=True):
            self.assertAlmostEqual(asr_server.get_parakeet_confidence_threshold(), 0.8)

    def test_empty_value_falls_back_to_default(self):
        with patch.dict(os.environ, {"ASR_PARAKEET_CONFIDENCE_THRESHOLD": ""}, clear=True):
            self.assertAlmostEqual(asr_server.get_parakeet_confidence_threshold(), 0.8)


class OrderedFallbackLanguagesTest(unittest.TestCase):
    def test_explicit_language_is_prepended_and_deduped(self):
        self.assertEqual(fallback.ordered_fallback_languages(["en", "zh"], "zh"), ["zh", "en"])

    def test_explicit_language_is_lowercase_and_trimmed(self):
        self.assertEqual(fallback.ordered_fallback_languages(["en", "zh"], " ZH "), ["zh", "en"])

    def test_unknown_language_is_added_first(self):
        self.assertEqual(fallback.ordered_fallback_languages(["en", "zh"], "ja"), ["ja", "en", "zh"])

    def test_missing_request_leaves_configured_passes(self):
        self.assertEqual(fallback.ordered_fallback_languages(["en", None], None), ["en", None])

    def test_blank_request_leaves_configured_passes(self):
        self.assertEqual(fallback.ordered_fallback_languages(["en", "zh"], "  "), ["en", "zh"])

    def test_auto_pass_stays_after_explicit(self):
        self.assertEqual(fallback.ordered_fallback_languages([None], "zh"), ["zh", None])


class WhisperPassKwargsTest(unittest.TestCase):
    def test_mandarin_passes_get_simplified_prompt(self):
        for language in ("zh", "zh-CN", "zh-tw"):
            self.assertEqual(fallback.whisper_pass_kwargs(language), {"initial_prompt": "以下是普通话的句子。"})

    def test_other_passes_have_no_prompt(self):
        for language in ("en", None, ""):
            self.assertEqual(fallback.whisper_pass_kwargs(language), {})


class WhisperRunScoreTest(unittest.TestCase):
    def test_mean_of_dict_segments(self):
        segments = [{"avg_logprob": -0.2}, {"avg_logprob": -0.4}]
        self.assertAlmostEqual(fallback.whisper_run_score(segments), -0.3)

    def test_mean_of_object_segments(self):
        segments = [SimpleNamespace(avg_logprob=-0.5), SimpleNamespace(avg_logprob=-0.7)]
        self.assertAlmostEqual(fallback.whisper_run_score(segments), -0.6)

    def test_no_segments_is_negative_infinity(self):
        self.assertEqual(fallback.whisper_run_score([]), -math.inf)

    def test_none_segments_is_negative_infinity(self):
        self.assertEqual(fallback.whisper_run_score(None), -math.inf)

    def test_segments_without_avg_logprob_are_negative_infinity(self):
        segments = [{"end": 1.0}, {"end": 2.0}]
        self.assertEqual(fallback.whisper_run_score(segments), -math.inf)

    def test_mixed_segments_mean_available_values(self):
        segments = [{"avg_logprob": -0.3}, {"end": 2.0}]
        self.assertAlmostEqual(fallback.whisper_run_score(segments), -0.3)


class WhisperRunFromResultTest(unittest.TestCase):
    def test_dict_result(self):
        result = {"text": "  你好世界  ", "segments": [{"end": 1.0}, {"end": 2.5, "avg_logprob": -0.4}], "language": "zh"}
        run = fallback.whisper_run_from_result(result, "zh")
        self.assertEqual(run["language"], "zh")
        self.assertEqual(run["text"], "你好世界")
        self.assertEqual(run["duration"], 2.5)
        self.assertEqual(run["detected"], "zh")
        self.assertAlmostEqual(run["score"], -0.4)

    def test_object_result(self):
        result = SimpleNamespace(text="hello", segments=[SimpleNamespace(end=3.0, avg_logprob=-0.6)], language=None)
        run = fallback.whisper_run_from_result(result, None)
        self.assertEqual(run["text"], "hello")
        self.assertEqual(run["duration"], 3.0)
        self.assertIsNone(run["detected"])
        self.assertAlmostEqual(run["score"], -0.6)

    def test_missing_fields(self):
        run = fallback.whisper_run_from_result({"text": "", "segments": []}, "en")
        self.assertEqual(run["text"], "")
        self.assertIsNone(run["duration"])
        self.assertIsNone(run["detected"])
        self.assertEqual(run["score"], -math.inf)


class PickBestWhisperRunTest(unittest.TestCase):
    def test_higher_score_wins(self):
        en = {"language": "en", "text": "fake english", "score": -0.9}
        zh = {"language": "zh", "text": "中文", "score": -0.2}
        self.assertIs(fallback.pick_best_whisper_run([en, zh]), zh)

    def test_tie_prefers_earlier(self):
        en = {"language": "en", "text": "fake english", "score": -0.4}
        zh = {"language": "zh", "text": "中文", "score": -0.4}
        self.assertIs(fallback.pick_best_whisper_run([en, zh]), en)

    def test_no_runs_returns_none(self):
        self.assertIsNone(fallback.pick_best_whisper_run([]))


class WhisperRunLanguageTest(unittest.TestCase):
    def test_forced_language_wins(self):
        self.assertEqual(fallback.whisper_run_language({"language": "zh", "detected": "en"}), "zh")

    def test_auto_pass_uses_detected(self):
        self.assertEqual(fallback.whisper_run_language({"language": None, "detected": "zh"}), "zh")

    def test_auto_pass_without_detected_is_none(self):
        self.assertIsNone(fallback.whisper_run_language({"language": None, "detected": None}))


class MeanSentenceConfidenceTest(unittest.TestCase):
    def test_mean_over_sentences(self):
        sentences = [SimpleNamespace(confidence=0.9), SimpleNamespace(confidence=0.7)]
        self.assertAlmostEqual(fallback.mean_sentence_confidence(sentences), 0.8)

    def test_no_sentences_is_zero(self):
        self.assertEqual(fallback.mean_sentence_confidence([]), 0.0)
        self.assertEqual(fallback.mean_sentence_confidence(None), 0.0)

    def test_sentences_without_confidence_are_skipped(self):
        sentences = [SimpleNamespace(text="nope"), SimpleNamespace(confidence=0.5)]
        self.assertAlmostEqual(fallback.mean_sentence_confidence(sentences), 0.5)


class ShouldWhisperFallbackTest(unittest.TestCase):
    def test_below_threshold_triggers(self):
        self.assertTrue(fallback.should_whisper_fallback(0.7, 0.8))

    def test_at_or_above_threshold_does_not(self):
        self.assertFalse(fallback.should_whisper_fallback(0.8, 0.8))
        self.assertFalse(fallback.should_whisper_fallback(0.9, 0.8))

    def test_missing_confidence_triggers(self):
        self.assertTrue(fallback.should_whisper_fallback(None, 0.8))

    def test_zero_confidence_from_missing_sentences_triggers(self):
        self.assertTrue(fallback.should_whisper_fallback(fallback.mean_sentence_confidence([]), 0.8))


class TranscribeWithWhisperMultilangTest(unittest.TestCase):
    def transcribe_with(self, fake_whisper, languages, language=None):
        with patch.object(asr_server, "load_whisper", return_value=fake_whisper), patch.object(
            asr_server, "get_fallback_languages", return_value=languages
        ):
            return asr_server.transcribe_with_whisper_multilang("audio.wav", language=language)

    def test_best_scoring_language_wins(self):
        calls = []

        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            calls.append(language)
            if language == "en":
                return {"text": "fake english", "segments": [{"end": 1.0, "avg_logprob": -0.9}], "language": "en"}
            return {"text": "中文结果", "segments": [{"end": 2.0, "avg_logprob": -0.2}], "language": "zh"}

        text, duration, language = self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"])
        self.assertEqual(calls, ["en", "zh"])
        self.assertEqual(text, "中文结果")
        self.assertEqual(duration, 2.0)
        self.assertEqual(language, "zh")

    def test_empty_runs_are_discarded(self):
        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            if language == "en":
                return {"text": "   ", "segments": [], "language": "en"}
            return {"text": "好的", "segments": [{"end": 2.0, "avg_logprob": -0.2}], "language": "zh"}

        text, duration, language = self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"])
        self.assertEqual(text, "好的")
        self.assertEqual(language, "zh")

    def test_all_runs_empty_returns_empty_text(self):
        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            return {"text": "", "segments": [], "language": language}

        text, duration, language = self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"])
        self.assertEqual(text, "")
        self.assertIsNone(duration)
        self.assertIsNone(language)

    def test_failed_pass_is_skipped(self):
        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            if language == "en":
                raise RuntimeError("boom")
            return {"text": "好的", "segments": [{"end": 2.0, "avg_logprob": -0.2}], "language": "zh"}

        text, duration, language = self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"])
        self.assertEqual(text, "好的")
        self.assertEqual(language, "zh")

    def test_all_passes_failing_raises(self):
        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            raise RuntimeError("boom")

        with self.assertRaises(RuntimeError):
            self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"])

    def test_single_auto_pass(self):
        calls = []

        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            calls.append(language)
            self.assertEqual(kwargs, {})
            return {"text": "hello", "segments": [{"end": 1.0, "avg_logprob": -0.3}], "language": "en"}

        text, duration, language = self.transcribe_with(SimpleNamespace(transcribe=fake_transcribe), [None])
        self.assertEqual(calls, [None])
        self.assertEqual(text, "hello")
        self.assertEqual(language, "en")

    def test_explicit_request_language_runs_first_and_wins_ties(self):
        calls = []
        pass_kwargs = {}

        def fake_transcribe(audio_path, path_or_hf_repo=None, language=None, **kwargs):
            calls.append(language)
            pass_kwargs[language] = kwargs
            return {"text": "result", "segments": [{"end": 1.0, "avg_logprob": -0.4}], "language": language}

        text, duration, language = self.transcribe_with(
            SimpleNamespace(transcribe=fake_transcribe), ["en", "zh"], language="zh"
        )
        self.assertEqual(calls, ["zh", "en"])
        self.assertEqual(pass_kwargs["zh"], {"initial_prompt": "以下是普通话的句子。"})
        self.assertEqual(pass_kwargs["en"], {})
        self.assertEqual(text, "result")
        self.assertEqual(language, "zh")


class TranscribeWithParakeetResultTest(unittest.TestCase):
    def test_returns_mean_confidence(self):
        result = SimpleNamespace(
            text="hello",
            sentences=[SimpleNamespace(end=1.0, confidence=0.9), SimpleNamespace(end=2.0, confidence=0.7)],
        )
        model = SimpleNamespace(transcribe=lambda audio_path: result)
        with patch.object(asr_server, "get_model", return_value=model):
            text, duration, language, confidence = asr_server.transcribe_with_parakeet("audio.wav")
        self.assertEqual(text, "hello")
        self.assertEqual(duration, 1.0)
        self.assertEqual(language, "en")
        self.assertAlmostEqual(confidence, 0.8)


if __name__ == "__main__":
    unittest.main()
