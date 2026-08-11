import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySpeechRecognitionError,
  combineVoiceTranscript,
  getSpeechRecognitionLanguage,
} from "../lib/voice/speech-recognition.ts";

test("voice recognition uses Indian English and Hindi hints from the selected locale", () => {
  assert.equal(getSpeechRecognitionLanguage("en"), "en-IN");
  assert.equal(getSpeechRecognitionLanguage("hi"), "hi-IN");
});

test("voice transcript is preserved and appended without aggressive correction", () => {
  assert.equal(
    combineVoiceTranscript("", "Meri policy mein room rent kitna hai"),
    "Meri policy mein room rent kitna hai",
  );
  assert.equal(
    combineVoiceTranscript("Please check", "co pay ka rule"),
    "Please check co pay ka rule",
  );
  assert.equal(combineVoiceTranscript("  ", "  linguistic modern art  "), "linguistic modern art");
});

test("speech recognition errors map to user-actionable states", () => {
  assert.equal(classifySpeechRecognitionError("not-allowed"), "permission");
  assert.equal(classifySpeechRecognitionError("no-speech"), "no-speech");
  assert.equal(classifySpeechRecognitionError("network"), "service");
  assert.equal(classifySpeechRecognitionError("language-not-supported"), "language");
  assert.equal(classifySpeechRecognitionError("aborted"), "aborted");
  assert.equal(classifySpeechRecognitionError("unknown-error"), "unknown");
});
