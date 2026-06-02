export function canSpeakPhrase() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakPhrase(text: string, lang = "ja-JP") {
  if (!canSpeakPhrase() || text.trim().length === 0) {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return true;
}
