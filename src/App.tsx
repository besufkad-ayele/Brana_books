import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Page, User } from './types';
import { generateStory, generatePageImage, speakText } from './services/geminiService';
import { BookOpen, Search, LogIn, Sparkles, Volume2, Play, Pause, ArrowLeft, Loader2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(circle_at_50%_50%,#fff9f0_0%,#f5f2ed_100%)]">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <div className="mb-8 inline-block p-4 bg-white rounded-full shadow-xl">
        <BookOpen className="w-16 h-16 text-amber-600" />
      </div>
      <h1 className="text-6xl font-display font-black mb-4 text-amber-900 leading-tight">
        Magic Tales
      </h1>
      <p className="text-xl font-serif italic text-amber-800/70 mb-12">
        Where every word comes to life and every page holds a new world.
      </p>
      <button
        onClick={onStart}
        className="px-10 py-4 bg-amber-600 text-white rounded-full font-bold text-lg shadow-lg hover:bg-amber-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
      >
        Open the Library <Sparkles className="w-5 h-5" />
      </button>
    </motion.div>
  </div>
);

const ParentLogin = ({ onLogin }: { onLogin: (name: string) => void }) => {
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f5f2ed]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full border border-amber-100"
      >
        <h2 className="text-3xl font-display font-bold mb-6 text-amber-900">Parent Access</h2>
        <p className="text-amber-800/60 mb-8">Enter your name to manage the story library.</p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-amber-50 focus:border-amber-400 outline-none transition-colors"
          />
          <button
            onClick={() => name && onLogin(name)}
            className="w-full py-4 bg-amber-900 text-white rounded-xl font-bold hover:bg-amber-950 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BookCard = ({ book, onClick }: { book: Book, onClick: () => void }) => (
  <motion.div
    whileHover={{ y: -10 }}
    onClick={onClick}
    className="cursor-pointer group"
  >
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xl mb-4 border-4 border-white">
      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
        <p className="text-white text-sm font-medium">Read Now</p>
      </div>
    </div>
    <h3 className="font-display text-lg font-bold text-amber-900">{book.title}</h3>
    <p className="text-sm text-amber-800/60 font-serif italic">{book.author}</p>
  </motion.div>
);

const BookReader = ({ book, onBack }: { book: Book, onBack: () => void }) => {
  const [isReading, setIsReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bookRef = useRef<any>(null);

  const handleWordClick = async (word: string) => {
    try {
      const audioUrl = await speakText(word);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error(err);
    }
  };

  const readPage = async (pageIndex: number) => {
    if (pageIndex >= book.pages.length) {
      setIsReading(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    setIsReading(true);
    try {
      const text = book.pages[pageIndex].text;
      const audioUrl = await speakText(text);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          if (isReading) {
            const next = pageIndex + 1;
            if (next < book.pages.length) {
              bookRef.current?.pageFlip().flipNext();
              // The flip event will trigger the next readPage call via useEffect
            } else {
              setIsReading(false);
            }
          }
        };
        audioRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setIsReading(false);
    }
  };

  useEffect(() => {
    if (isReading) {
      readPage(currentPage);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isReading, currentPage]);

  return (
    <div className="fixed inset-0 bg-[#2d2a26] flex flex-col items-center justify-center z-50 p-4 lg:p-12">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white/80">
        <button onClick={onBack} className="flex items-center gap-2 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" /> Back to Library
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsReading(!isReading)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isReading ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {isReading ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isReading ? 'Stop Reading' : 'Bedtime Story Mode'}
          </button>
        </div>
      </div>

      {/* Book Container */}
      <div className="w-full max-w-6xl aspect-[16/10] flex items-center justify-center">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e) => setCurrentPage(e.data)}
          className="book-shadow"
          ref={bookRef}
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={false}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* Cover */}
          <div className="bg-amber-900 flex flex-col items-center justify-center p-12 text-center text-amber-50 border-r-4 border-amber-950">
            <h1 className="text-5xl font-display font-black mb-6">{book.title}</h1>
            <div className="w-32 h-1 bg-amber-400/50 mb-6"></div>
            <p className="text-xl font-serif italic opacity-80">By {book.author}</p>
          </div>

          {/* Pages */}
          {book.pages.map((page, idx) => (
            <div key={idx} className="bg-[#fdfbf7] p-12 flex flex-col h-full relative overflow-hidden page-shadow">
              <div className="flex-1 rounded-2xl overflow-hidden mb-8 shadow-inner border border-amber-100">
                <img src={page.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="text-center">
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                  {page.text.split(' ').map((word, wIdx) => (
                    <span
                      key={wIdx}
                      onClick={() => handleWordClick(word.replace(/[.,!?;:]/g, ''))}
                      className="text-2xl font-serif text-amber-900 cursor-pointer hover:text-amber-600 hover:scale-110 transition-all inline-block"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <div className="mt-8 text-amber-800/30 font-serif italic text-sm">
                  Page {idx + 1}
                </div>
              </div>
            </div>
          ))}

          {/* Back Cover */}
          <div className="bg-amber-900 flex flex-col items-center justify-center p-12 text-center text-amber-50 border-l-4 border-amber-950">
            <h2 className="text-3xl font-display font-bold mb-4">The End</h2>
            <p className="font-serif italic opacity-60">We hope you enjoyed this magical journey!</p>
            <button onClick={onBack} className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              Read Another Story
            </button>
          </div>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'landing' | 'login' | 'library' | 'reading'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample initial books
  useEffect(() => {
    const initialBooks: Book[] = [
      {
        id: '1',
        title: 'The Moon\'s Secret Party',
        author: 'Magic Tales AI',
        coverUrl: 'https://picsum.photos/seed/moon/800/1000',
        description: 'A story about what the moon does when we are all asleep.',
        pages: [
          { text: 'Once upon a time, the moon decided to throw a party.', imageUrl: 'https://picsum.photos/seed/moon1/800/600' },
          { text: 'She invited all the stars and the little clouds too.', imageUrl: 'https://picsum.photos/seed/moon2/800/600' },
          { text: 'They danced across the night sky until the sun started to wake up.', imageUrl: 'https://picsum.photos/seed/moon3/800/600' }
        ]
      },
      {
        id: '2',
        title: 'Oliver the Brave Otter',
        author: 'Magic Tales AI',
        coverUrl: 'https://picsum.photos/seed/otter/800/1000',
        description: 'Oliver finds a shiny shell and goes on an underwater adventure.',
        pages: [
          { text: 'Oliver was a very small otter with a very big heart.', imageUrl: 'https://picsum.photos/seed/otter1/800/600' },
          { text: 'One morning, he found a shell that glowed like a rainbow.', imageUrl: 'https://picsum.photos/seed/otter2/800/600' },
          { text: 'He followed the light deep into the blue river.', imageUrl: 'https://picsum.photos/seed/otter3/800/600' }
        ]
      }
    ];
    setBooks(initialBooks);
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryPrompt, setNewStoryPrompt] = useState('');

  const handleCreateBook = async () => {
    if (!newStoryPrompt) return;
    setIsGenerating(true);
    setShowCreateModal(false);
    try {
      const storyData = await generateStory(newStoryPrompt);
      const pagesWithImages: Page[] = [];
      
      for (const page of storyData.pages || []) {
        const imageUrl = await generatePageImage(page.text, storyData.title || "");
        pagesWithImages.push({ text: page.text, imageUrl });
      }

      const newBook: Book = {
        id: Date.now().toString(),
        title: storyData.title || "Untitled Story",
        author: user?.name || "Magic Tales AI",
        coverUrl: pagesWithImages[0]?.imageUrl || "https://picsum.photos/seed/cover/800/1000",
        description: storyData.description || "",
        pages: pagesWithImages
      };

      setBooks([newBook, ...books]);
      setSelectedBook(newBook);
      setStep('reading');
      setNewStoryPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <LandingPage key="landing" onStart={() => setStep('login')} />
        )}

        {step === 'login' && (
          <ParentLogin key="login" onLogin={(name) => {
            setUser({ role: 'parent', name });
            setStep('library');
          }} />
        )}

        {step === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 lg:p-12 max-w-7xl mx-auto"
          >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-display font-bold text-amber-900">Welcome, {user?.name}</h1>
                <p className="text-amber-800/60 font-serif italic">Choose a story or create a new one together.</p>
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-amber-100 shadow-sm focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                />
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Create New Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => !isGenerating && setShowCreateModal(true)}
                className="aspect-[3/4] rounded-xl border-4 border-dashed border-amber-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all group"
              >
                {isGenerating ? (
                  <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
                ) : (
                  <Plus className="w-12 h-12 text-amber-300 group-hover:text-amber-500 mb-4 transition-colors" />
                )}
                <h3 className="font-display text-lg font-bold text-amber-900">
                  {isGenerating ? 'Magic in progress...' : 'Create New Story'}
                </h3>
                <p className="text-sm text-amber-800/60 mt-2">
                  {isGenerating ? 'Gemini is writing and drawing your tale' : 'Use AI to generate a unique story for your child'}
                </p>
              </motion.div>

              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => {
                    setSelectedBook(book);
                    setStep('reading');
                  }}
                />
              ))}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
              {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full"
                  >
                    <h2 className="text-2xl font-display font-bold mb-4 text-amber-900">What should the story be about?</h2>
                    <textarea
                      value={newStoryPrompt}
                      onChange={(e) => setNewStoryPrompt(e.target.value)}
                      placeholder="e.g., A brave squirrel who finds a magic acorn..."
                      className="w-full h-32 p-4 rounded-xl border-2 border-amber-50 focus:border-amber-400 outline-none transition-colors mb-6 resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-3 border-2 border-amber-100 rounded-xl font-bold text-amber-800 hover:bg-amber-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBook}
                        disabled={!newStoryPrompt}
                        className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                      >
                        Create Magic
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'reading' && selectedBook && (
          <BookReader
            key="reading"
            book={selectedBook}
            onBack={() => setStep('library')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
