import React, { useState, useEffect, useCallback } from 'react';
import { SpeakerIcon, StopIcon, LoadingSpinner } from './components/icons';

// Helper Component: Header
const Header: React.FC = () => (
  <header className="text-center mb-8">
    <h1 className="text-4xl md:text-5xl font-bold">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Gemini Text-to-Speech
      </span>
    </h1>
    <p className="text-gray-400 mt-2">Bring your text to life with natural-sounding voices.</p>
  </header>
);

// Helper Component: TextArea
interface TextAreaInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isSpeaking: boolean;
}
const TextAreaInput: React.FC<TextAreaInputProps> = ({ value, onChange, isSpeaking }) => (
  <div className="relative w-full">
    <textarea
      value={value}
      onChange={onChange}
      disabled={isSpeaking}
      placeholder="Enter text to be spoken here..."
      className="w-full h-48 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50"
      aria-label="Text to be spoken"
    />
  </div>
);

// Helper Component: Voice Selector
interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isLoading: boolean;
  isSpeaking: boolean;
}
const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoiceURI, onChange, isLoading, isSpeaking }) => (
  <div className="flex flex-col w-full">
    <label htmlFor="voice" className="mb-2 text-sm font-medium text-gray-400">Voice</label>
    <div className="relative w-full">
      <select
        id="voice"
        value={selectedVoiceURI}
        onChange={onChange}
        disabled={isLoading || isSpeaking || voices.length === 0}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10"
        aria-busy={isLoading}
      >
        {voices.length > 0 ? (
          voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))
        ) : (
          <option value="" disabled>
            {isLoading ? 'Loading voices...' : 'No voices available'}
          </option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
        {isLoading ? (
          <LoadingSpinner className="h-5 w-5 text-gray-400" />
        ) : (
           <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.47-2.47a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  </div>
);


// Helper Component: Control Slider
interface ControlSliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
  isSpeaking: boolean;
}
const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, onChange, min, max, step, isSpeaking }) => (
  <div className="flex flex-col w-full">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">{value.toFixed(1)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      disabled={isSpeaking}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
    />
  </div>
);


// Main Application Component
const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [pitch, setPitch] = useState<number>(1);
  const [rate, setRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(true);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Set a default voice, prefer a US English one if available
        const defaultVoice = availableVoices.find(v => v.lang === 'en-US') || availableVoices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
        setIsLoadingVoices(false);
        // Detach the event listener once voices are loaded
        window.speechSynthesis.onvoiceschanged = null;
      }
    };

    // The 'voiceschanged' event is fired when the list of voices is ready
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial attempt in case they are already loaded

  }, []);

  const handleSpeak = useCallback(() => {
    if (!text.trim() || isSpeaking) return;

    // Cancel any ongoing speech before starting a new one
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, isSpeaking, voices, selectedVoiceURI, pitch, rate]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <main className="w-full max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
        <Header />
        
        <div className="space-y-6">
          <TextAreaInput 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            isSpeaking={isSpeaking} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <VoiceSelector 
                voices={voices}
                selectedVoiceURI={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                isLoading={isLoadingVoices}
                isSpeaking={isSpeaking}
              />
            </div>
            <ControlSlider 
              label="Pitch"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              min={0.5} max={2} step={0.1}
              isSpeaking={isSpeaking}
            />
            <ControlSlider 
              label="Speed"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              min={0.5} max={2} step={0.1}
              isSpeaking={isSpeaking}
            />
            <div className="flex items-end">
              {isSpeaking ? (
                <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Stop speaking"
                >
                  <StopIcon />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSpeak}
                  disabled={!text.trim() || isLoadingVoices || !selectedVoiceURI}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Speak text"
                >
                  {isLoadingVoices ? <LoadingSpinner /> : <SpeakerIcon isSpeaking={isSpeaking} />}
                  {isLoadingVoices ? 'Loading...' : 'Speak'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by the Web Speech API</p>
      </footer>
    </div>
  );
};

export default App;