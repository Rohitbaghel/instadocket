import React, { useState, useRef } from "react";

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);

  const startRecording = () => {
    setRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        audioStreamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.addEventListener("dataavailable", handleData);
        mediaRecorderRef.current.start();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const pauseRecording = () => {
    if (recording && !paused) {
      setPaused(true);
      mediaRecorderRef.current.pause();
    } else if (recording && paused) {
      setPaused(false);
      mediaRecorderRef.current.resume();
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    setPaused(false);
    mediaRecorderRef.current.stop();
    audioStreamRef.current.getTracks().forEach((track) => {
      track.stop();
    });

    setLoading(true);
    const audioBlob = new Blob(audioChunks, {
      type: "audio/webm",
    });
    const response = await fetch("/api/whisper", {
      method: "POST",
      body: audioBlob,
    });
    const { text } = await response.json();
    setText(text);
    setShowRefresh(true);

    setLoading(false);
  };

  const handleData = (event) => {
    if (event.data.size > 0) {
      setAudioChunks((prevAudioChunks) => [...prevAudioChunks, event.data]);
    }
  };

  const handleCancel = () => {
    setRecording(false);
    setPaused(false);
    setAudioChunks([]);
    setAudioBlob(null);
    setAudioUrl(null);
    setText("");
    setShowRefresh(false);
  };

  const handleRefresh = () => {
    setAudioUrl(null);
    setText("");
    setShowRefresh(false);
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : text ? (
        <div>
          <p>{text}</p>
          <p>Response from ChatGPT API goes here</p>
          {showRefresh && <button onClick={handleRefresh}>Refresh</button>}
        </div>
      ) : audioUrl ? (
        <audio controls src={audioUrl} />
      ) : (
        <div>
          <button onClick={startRecording}>Record</button>
          <button onClick={pauseRecording} disabled={!recording}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button onClick={stopRecording} disabled={!recording}>
            Stop
          </button>
          <button onClick={handleCancel} disabled={!recording}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
