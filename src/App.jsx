import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Camera,
  Check,
  Copy,
  FileText,
  Mic,
  Paperclip,
  RotateCcw,
  UploadCloud,
  Send,
  Sparkles,
  User,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function speak(text, { onEnd } = {}) {
  if (!window.speechSynthesis || !text) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
  return true;
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AttachmentPreview({ att, onRemove }) {
  const isImage = att.mime_type.startsWith("image/");
  const isVideo = att.mime_type.startsWith("video/");
  return (
    <div className="relative flex items-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] pr-2 text-[12px] text-white/70">
      {isImage ? (
        <img src={att.url} alt={att.name} className="h-10 w-10 object-cover" />
      ) : isVideo ? (
        <video src={att.url} className="h-10 w-10 object-cover" muted />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center bg-white/[0.04]">
          <FileText size={16} />
        </div>
      )}
      <span className="max-w-[110px] truncate">{att.name}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-white/40 hover:text-white">
          ×
        </button>
      )}
    </div>
  );
}

const MODES = [
  { key: "text", label: "Chat", icon: Sparkles },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "camera", label: "Camera", icon: Camera },
  { key: "files", label: "Files", icon: FileText },
  { key: "video", label: "Video", icon: Video },
];

function Orb({ active }) {
  return (
    <div className="relative h-9 w-9 shrink-0">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 blur-[6px]"
        animate={{ opacity: active ? [0.5, 1, 0.5] : 0.5, scale: active ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      />
      <div className="absolute inset-[3px] rounded-full bg-[#0b0c10] flex items-center justify-center">
        <Bot size={16} className="text-fuchsia-300" />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function useTypewriter(text, enabled) {
  const safeText = text ?? "";
  const [shown, setShown] = useState(enabled ? "" : safeText);
  useEffect(() => {
    if (!enabled) {
      setShown(safeText);
      return;
    }
    setShown("");
    let i = 0;
    const step = Math.max(1, Math.round(safeText.length / 120));
    const id = setInterval(() => {
      i += step;
      setShown(safeText.slice(0, i));
      if (i >= safeText.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);
  return shown;
}

function Bubble({ role, content, attachments, animate, onRegenerate, isLast }) {
  const isUser = role === "user";
  const shown = useTypewriter(content, !isUser && animate);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const started = speak(content, { onEnd: () => setSpeaking(false) });
    setSpeaking(started);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group flex w-full gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-white/10 text-white"
            : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>
      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {attachments && attachments.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
            {attachments.map((att, i) =>
              att.mime_type.startsWith("image/") ? (
                <a key={i} href={att.url} target="_blank" rel="noreferrer">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="h-32 w-32 rounded-xl object-cover border border-white/10"
                  />
                </a>
              ) : att.mime_type.startsWith("video/") ? (
                <video
                  key={i}
                  src={att.url}
                  controls
                  className="h-40 max-w-[220px] rounded-xl border border-white/10"
                />
              ) : (
                <a
                  key={i}
                  href={att.url}
                  download={att.name}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] text-white/70 hover:text-white"
                >
                  <FileText size={14} />
                  <span className="max-w-[160px] truncate">{att.name}</span>
                </a>
              )
            )}
          </div>
        )}
        {content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-sm"
                : "bg-white/[0.06] text-gray-100 border border-white/10 rounded-tl-sm backdrop-blur"
            }`}
          >
            {shown}
          </div>
        )}
        {!isUser && shown === content && (
          <div className="flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={copy}
              title="Copy"
              className="rounded-md p-1 text-white/30 hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button
              onClick={toggleSpeak}
              title={speaking ? "Stop speaking" : "Read aloud"}
              className={`rounded-md p-1 hover:bg-white/10 ${
                speaking ? "text-fuchsia-300" : "text-white/30 hover:text-white"
              }`}
            >
              {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            {isLast && (
              <button
                onClick={onRegenerate}
                title="Regenerate"
                className="rounded-md p-1 text-white/30 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VoicePanel({ listening, onToggle, draft }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl"
      >
        {listening && (
          <motion.span
            className="absolute inset-0 rounded-full bg-fuchsia-500/40"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Mic size={28} className="relative z-10 text-white" />
      </motion.button>
      <div className="text-[13px] text-white/60">
        {listening ? "Listening… tap to stop" : "Tap the mic and start talking"}
      </div>
      <div className="text-[11px] text-white/30">Replies are read aloud automatically</div>
      {draft && (
        <div className="max-w-md rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-[14px] text-white/80">
          {draft}
        </div>
      )}
    </div>
  );
}

function CameraPanel({ onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera access was denied or is unavailable."));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], `capture-${Date.now()}.png`, { type: "image/png" }));
    }, "image/png");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {error ? (
        <div className="py-10 text-center text-[13px] text-white/50">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-64 w-full rounded-xl bg-black object-cover"
          />
          <button
            onClick={capture}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-2 text-[13px] font-medium text-white"
          >
            <Camera size={15} /> Capture photo
          </button>
        </>
      )}
    </div>
  );
}

function VideoPanel({ onCapture }) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera/microphone access was denied or is unavailable."));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleRecord() {
    if (!stream) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onCapture(new File([blob], `clip-${Date.now()}.webm`, { type: "video/webm" }));
      setRecording(false);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {error ? (
        <div className="py-10 text-center text-[13px] text-white/50">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-64 w-full rounded-xl bg-black object-cover"
          />
          <button
            onClick={toggleRecord}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium text-white ${
              recording
                ? "bg-red-600"
                : "bg-gradient-to-br from-violet-600 to-fuchsia-600"
            }`}
          >
            <Video size={15} /> {recording ? "Stop & attach clip" : "Record clip"}
          </button>
        </>
      )}
    </div>
  );
}

function FilesPanel({ attachments, onPick, onRemove, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDrop(Array.from(e.dataTransfer.files || []));
      }}
      className={`mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center transition-colors ${
        dragOver ? "border-fuchsia-400 bg-fuchsia-500/5" : "border-white/15 bg-white/[0.03]"
      }`}
    >
      <UploadCloud size={26} className="text-white/40" />
      <div className="text-[13px] text-white/60">
        Drag & drop files here, or{" "}
        <button onClick={onPick} className="text-fuchsia-300 underline underline-offset-2">
          browse
        </button>
      </div>
      {attachments.length > 0 && (
        <div className="mt-2 flex w-full flex-wrap justify-center gap-1.5">
          {attachments.map((att, i) => (
            <AttachmentPreview key={i} att={att} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ sessionId }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-6">
        <Orb active />
        <div>
          <div className="text-sm font-semibold text-white">Aether Agent</div>
          <div className="text-[11px] text-white/40">Gemini · Multimodal</div>
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-white/30 mb-2">Session</div>
      <div className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] text-white/60 font-mono mb-6 truncate">
        {sessionId}
      </div>

      <div className="text-[11px] uppercase tracking-wide text-white/30 mb-2">
        Active layers
      </div>
      <div className="flex flex-col gap-1.5 mb-6">
        {[
          "API Gateway",
          "Orchestrator",
          "Gemini Brain",
          "Tool Layer",
          "Memory Engine",
        ].map((l, i) => (
          <motion.div
            key={l}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-white/70 hover:bg-white/[0.05]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400" />
            {l}
          </motion.div>
        ))}
      </div>

      <div className="mt-auto text-[11px] text-white/25">
        Core loop demo · Python + FastAPI + Gemini
      </div>
    </aside>
  );
}

export default function App() {
  const [embed] = useState(
    () => new URLSearchParams(window.location.search).get("embed") === "1"
  );
  const [sessionId] = useState(() => uid());
  const [mode, setMode] = useState("text");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Gemini-powered agent. Ask me anything — I can also use tools like a calculator or the current time.",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  function addFiles(files) {
    const withPreviews = files.map((file) => ({
      file,
      name: file.name,
      mime_type: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
    }));
    if (withPreviews.length) setAttachments((a) => [...a, ...withPreviews]);
  }

  function onPickFiles(e) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function removeAttachment(i) {
    setAttachments((a) => {
      URL.revokeObjectURL(a[i]?.url);
      return a.filter((_, idx) => idx !== i);
    });
  }

  function toggleMic() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Voice input isn't supported in this browser. Try Chrome or Edge.",
        },
      ]);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function ask(fullText, { replaceLast, apiAttachments } = {}) {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: fullText,
          attachments: apiAttachments,
        }),
      });
      if (res.status === 429) {
        setMessages((m) => {
          const next = replaceLast ? m.slice(0, -1) : m;
          return [
            ...next,
            {
              role: "assistant",
              content: "Gemini API quota exceeded. Please try again in a minute.",
              id: uid(),
            },
          ];
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "The agent hit an error.";
        setMessages((m) => {
          const next = replaceLast ? m.slice(0, -1) : m;
          return [...next, { role: "assistant", content: detail, id: uid() }];
        });
        return;
      }
      const reply = data.reply ?? "(empty response)";
      setMessages((m) => {
        const next = replaceLast ? m.slice(0, -1) : m;
        return [...next, { role: "assistant", content: reply, id: uid() }];
      });
      if (modeRef.current === "voice") speak(reply);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Couldn't reach the backend. Make sure the FastAPI server is running on " + API_BASE,
          id: uid(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || busy) return;
    const pending = attachments;
    setInput("");
    setAttachments([]);
    setMessages((m) => [
      ...m,
      { role: "user", content: text, attachments: pending, id: uid() },
    ]);
    const apiAttachments = await Promise.all(
      pending.map(async (a) => ({
        name: a.name,
        mime_type: a.mime_type,
        data: await fileToBase64(a.file),
      }))
    );
    await ask(text, { apiAttachments });
  }

  async function regenerate() {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    await ask(lastUser.content, { replaceLast: true });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#0b0c10] text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {!embed && <Sidebar sessionId={sessionId} />}

      <div className="flex flex-1 flex-col min-w-0">
        <header
          className={`flex items-center justify-between border-b border-white/10 bg-white/[0.02] backdrop-blur ${
            embed ? "px-3 py-2" : "px-6 py-3"
          }`}
        >
          {!embed && (
            <div className="flex items-center gap-3">
              <Orb active={busy} />
              <div>
                <div className="text-[15px] font-semibold">Aether Agent</div>
                <div className="text-[11px] text-white/40">
                  {busy ? "Thinking…" : "Ready"}
                </div>
              </div>
            </div>
          )}
          <div
            className={`flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 ${
              embed ? "ml-auto" : ""
            }`}
          >
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  mode === key ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {mode === key && (
                  <motion.div
                    layoutId="modePill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <Icon size={13} className="relative z-10" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <AnimatePresence mode="wait">
            {mode !== "text" && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-5"
              >
                {mode === "voice" && (
                  <VoicePanel listening={listening} onToggle={toggleMic} draft={input} />
                )}
                {mode === "camera" && (
                  <CameraPanel
                    onCapture={(file) => {
                      addFiles([file]);
                      setMode("text");
                    }}
                  />
                )}
                {mode === "video" && (
                  <VideoPanel
                    onCapture={(file) => {
                      addFiles([file]);
                      setMode("text");
                    }}
                  />
                )}
                {mode === "files" && (
                  <FilesPanel
                    attachments={attachments}
                    onPick={() => fileInputRef.current?.click()}
                    onRemove={removeAttachment}
                    onDrop={(files) => {
                      addFiles(files);
                      setMode("text");
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <Bubble
                  key={m.id ?? i}
                  role={m.role}
                  content={m.content}
                  attachments={m.attachments}
                  animate={m.role === "assistant"}
                  isLast={m.role === "assistant" && i === messages.length - 1}
                  onRegenerate={regenerate}
                />
              ))}
              {busy && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <Bot size={15} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4 sm:px-8">
          <div className="mx-auto max-w-2xl">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {attachments.map((att, i) => (
                  <AttachmentPreview key={i} att={att} onRemove={() => removeAttachment(i)} />
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-xl focus-within:border-fuchsia-500/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onPickFiles}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message your agent…"
                className="flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-white/30"
              />
              <button
                onClick={toggleMic}
                className={`rounded-xl p-2 transition-colors ${
                  listening
                    ? "bg-fuchsia-600/30 text-fuchsia-300"
                    : "text-white/40 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Mic size={18} className={listening ? "animate-pulse" : ""} />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={send}
                disabled={busy || (!input.trim() && attachments.length === 0)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 transition-opacity"
              >
                <Send size={17} />
              </motion.button>
            </div>
          </div>
          {!embed && (
            <div className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-white/25">
              Core loop demo — chat → gateway → orchestrator → Gemini → memory
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
