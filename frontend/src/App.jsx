import { useState, useEffect } from 'react';

function App() {
  // --- ROUTING & VIEW STATE ---
  // We start at 'login' now.
  const [currentView, setCurrentView] = useState('login'); 
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- USER STATE ---
  const [globalUser, setGlobalUser] = useState('');

  // Trie Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Segment Tree / Booking State
  const [seats, setSeats] = useState(Array(50).fill('available'));
  const [numSeats, setNumSeats] = useState(1);
  const [waitlistCount, setWaitlistCount] = useState(0);
  
  // Admin State
  const [cancelStart, setCancelStart] = useState(0);
  const [cancelEnd, setCancelEnd] = useState(0);
  const [logs, setLogs] = useState([]);

  // --- MOCK DATA ---
 const heroBanners = [
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1600&q=80"
  ];

  const movies = [
    // 📸 CHANGE THE IMAGE STRING BELOW TO "/your-photo-name.jpg" AFTER PUTTING IT IN THE PUBLIC FOLDER
    { id: 1, title: "Acoustic Night", type: "Concert", rating: "9.2/10", votes: "45.2K", formats: "Live", lang: "English, Hindi", image: "./public/my-photo.jpg" },
    { id: 2, title: "Action Sports Expo", type: "Sports", rating: "8.8/10", votes: "12.1K", formats: "Stadium", lang: "English", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80" },
    { id: 3, title: "Art Gallery Opening", type: "Exhibition", rating: "7.5/10", votes: "3.4K", formats: "Gallery", lang: "Silent", image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=500&q=80" },
    { id: 4, title: "Jazz Festival", type: "Music", rating: "9.5/10", votes: "89.3K", formats: "Park VIP", lang: "Instrumental", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80" }
  ];

  // --- BROWSER BACK BUTTON FIX (HISTORY API) ---
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else {
        // Default fallback if history is weird
        setCurrentView(globalUser ? 'home' : 'login'); 
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [globalUser]);

  // Safe Navigation Function
  const navigateTo = (view, eventData = null) => {
    window.history.pushState({ view: view }, '', `#${view}`);
    setCurrentView(view);
    if (eventData) setSelectedEvent(eventData);
  };

  // Carousel Logic
  useEffect(() => {
    if (currentView === 'home') {
      const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroBanners.length), 4000);
      return () => clearInterval(timer);
    }
  }, [currentView, heroBanners.length]);

  // --- FUNCTIONS ---
  const addLog = (message, type = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 5));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (globalUser.trim().length > 0) {
      navigateTo('home');
    }
  };

  const handleSearch = async (e) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);
    if (searchTerm.length > 0) {
      try {
        const response = await fetch(`http://localhost:5000/api/events/search?query=${searchTerm}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      }
    } else {
      setResults([]);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    addLog(`O(log N) Segment Tree query for ${numSeats} contiguous seats...`);

    try {
      const response = await fetch('http://localhost:5000/api/events/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.id, userName: globalUser, numSeats: parseInt(numSeats), tier: 1 })
      });
      const data = await response.json();

      if (data.status === 'success') {
        addLog(`SUCCESS: Seats ${data.seats.start} to ${data.seats.end} allocated`, 'success');
        setSeats(prev => {
          const newSeats = [...prev];
          for (let i = data.seats.start; i <= data.seats.end; i++) newSeats[i] = 'booked';
          return newSeats;
        });
      } else if (data.status === 'waitlisted') {
        addLog(`Row Full. Pushed ${globalUser} to Min-Heap Priority Waitlist.`, 'warning');
        setWaitlistCount(data.waitlist_size);
      }
    } catch (error) {
      addLog("Server error during booking.", 'error');
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    addLog(`Admin freeing seats ${cancelStart} to ${cancelEnd}...`);
    try {
      const response = await fetch('http://localhost:5000/api/events/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startIndex: parseInt(cancelStart), endIndex: parseInt(cancelEnd) })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSeats(prev => {
          const newSeats = [...prev];
          for (let i = parseInt(cancelStart); i <= parseInt(cancelEnd); i++) newSeats[i] = 'available';
          if (data.waitlistResolved) {
             for (let i = data.resolvedSeats.start; i <= data.resolvedSeats.end; i++) newSeats[i] = 'resolved';
             addLog(`Heap Auto-Resolve: ${data.resolvedUser} assigned seat ${data.resolvedSeats.start}`, 'success');
          }
          return newSeats;
        });
        setWaitlistCount(data.waitlist_size);
      }
    } catch (error) {
      addLog("Server error during cancellation.", 'error');
    }
  };

  const handleSystemReset = async () => {
    try {
      addLog("Triggering global DSA memory wipe...");
      const response = await fetch('http://localhost:5000/api/events/reset', { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSeats(Array(50).fill('available'));
        setWaitlistCount(0);
        addLog("SYSTEM RESET SUCCESSFUL. Memory clean.", 'success');
      }
    } catch (error) {
      addLog("Failed to reset backend memory.", 'error');
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* --- LOGIN VIEW --- */}
      {currentView === 'login' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-600/20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]"></div>
          
          <div className="bg-black/40 p-10 rounded-3xl backdrop-blur-xl border border-gray-800 shadow-2xl w-full max-w-md relative z-10 text-center">
            <h1 className="text-5xl font-black tracking-tighter text-rose-500 mb-2">SmartSeat.</h1>
            <p className="text-gray-400 text-sm mb-8 tracking-widest uppercase">DSA Ticketing Engine</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-left">
                <label className="text-gray-300 text-xs uppercase font-bold tracking-wider mb-2 block">Enter Your Name to Begin</label>
                <input 
                  required 
                  type="text" 
                  value={globalUser} 
                  onChange={(e) => setGlobalUser(e.target.value)} 
                  placeholder="e.g. Dnyanesh" 
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
                />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)]">
                Initialize Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MAIN APP WRAPPER (Shown only if not login) --- */}
      {currentView !== 'login' && (
        <div className="pb-20">
          {/* PRIMARY NAVBAR */}
          <nav className="bg-white px-8 py-3 shadow-sm flex justify-between items-center relative z-50">
            <div className="flex items-center gap-8 w-2/3">
              <div onClick={() => navigateTo('home')} className="text-3xl font-black tracking-tighter cursor-pointer text-rose-600">
                SmartSeat<span className="text-gray-900">.</span>
              </div>
              
              <div className="relative w-full max-w-2xl">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-2 focus-within:bg-white focus-within:border-rose-400 transition-all">
                  <span className="text-gray-400 mr-3">🔍</span>
                  <input type="text" value={query} onChange={handleSearch} onFocus={() => setIsSearchFocused(true)} placeholder="Search for Events (Try 'Ac')" className="w-full bg-transparent outline-none text-sm"/>
                </div>
                {isSearchFocused && results.length > 0 && (
                  <div className="absolute w-full mt-2 bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden border-t-rose-500 border-t-4">
                    {results.map((result, idx) => (
                      <div key={idx} onClick={() => { navigateTo('booking', movies[result.data.id - 1]); setQuery(''); setIsSearchFocused(false); }} className="px-5 py-3 hover:bg-gray-50 cursor-pointer border-b flex items-center gap-4">
                        <div className="font-bold">{result.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="text-gray-500">Hi, <span className="text-rose-600">{globalUser}</span></span>
              <button onClick={() => { setGlobalUser(''); navigateTo('login'); }} className="text-gray-400 hover:text-gray-900">Logout</button>
            </div>
          </nav>

          {/* SECONDARY NAVBAR */}
          <nav className="bg-gray-900 text-gray-300 text-sm py-2 px-8 shadow-md">
            <ul className="flex gap-6 font-medium">
              <li onClick={() => navigateTo('home')} className="hover:text-white cursor-pointer">Events</li>
              <li className="hover:text-white cursor-pointer">Sports</li>
            </ul>
          </nav>

          {/* --- HOME VIEW --- */}
          {currentView === 'home' && (
            <div className="animate-fade-in">
              <div className="w-full h-[400px] relative overflow-hidden bg-gray-900 mb-10 shadow-2xl">
                {heroBanners.map((img, index) => (
                  <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={img} className="w-full h-full object-cover opacity-70" alt={`Banner ${index}`} />
                  </div>
                ))}
              </div>

              <div className="max-w-7xl mx-auto px-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Recommended Events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  {movies.map(movie => (
                    <div key={movie.id} onClick={() => navigateTo('booking', movie)} className="group cursor-pointer">
                      <div className="relative rounded-xl overflow-hidden shadow-lg mb-3">
                        <img src={movie.image} alt={movie.title} className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute bottom-0 w-full bg-black/80 text-white p-2 text-sm font-bold flex items-center gap-2">
                          <span className="text-rose-500">⭐</span> {movie.rating}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-rose-600 transition-colors">{movie.title}</h3>
                      <p className="text-sm text-gray-500">{movie.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- BOOKING VIEW --- */}
          {currentView === 'booking' && selectedEvent && (
            <div className="animate-fade-in">
              {/* Cinematic Header with UI Back Button */}
              <div className="w-full h-[350px] relative overflow-hidden bg-black shadow-2xl mb-10 flex items-center">
                 <img src={selectedEvent.image} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110" alt="Backdrop" />
                 <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                 
                 <div className="relative z-10 max-w-7xl mx-auto px-8 w-full flex gap-8 items-start">
                   {/* Dedicated UI Back Button */}
                   <button onClick={() => navigateTo('home')} className="mt-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 transition-all">
                     ← Back
                   </button>
                   
                   <img src={selectedEvent.image} className="w-56 h-72 object-cover rounded-xl shadow-2xl border border-gray-700" alt="Poster" />
                   <div className="text-white mt-4">
                     <h1 className="text-5xl font-black mb-4">{selectedEvent.title}</h1>
                     <p className="text-gray-300 mb-6 max-w-lg">Advanced DSA-powered booking engine. Securing contiguous seats instantly.</p>
                   </div>
                 </div>
              </div>

              <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: Consumer Booking Tools */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Booking: {globalUser}</h3>
                    <form onSubmit={handleBook} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quantity (Contiguous)</label>
                        <input required type="number" min="1" max="50" value={numSeats} onChange={(e) => setNumSeats(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-rose-400 focus:bg-white transition-colors" />
                      </div>
                      <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-rose-500/30">
                        Process Booking
                      </button>
                    </form>
                  </div>

                  {/* Min-Heap Status */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-yellow-800 text-lg">Waitlist Queue</h2>
                      <p className="text-xs text-yellow-600 font-medium">Min-Heap Managed</p>
                    </div>
                    <div className="text-4xl font-black text-yellow-600 bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-inner">
                      {waitlistCount}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Seat Matrix & DSA Dashboard */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Theater View */}
                  <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="text-center mb-16 relative">
                      <div className="w-3/4 h-3 bg-blue-100 mx-auto rounded-t-[100%] border-t-4 border-blue-400 shadow-[0_-15px_30px_rgba(96,165,250,0.4)]"></div>
                      <span className="text-xs text-gray-400 font-bold tracking-[0.3em] uppercase absolute -bottom-6 left-1/2 transform -translate-x-1/2">Screen</span>
                    </div>
                    
                    <div className="grid grid-cols-10 gap-3 mb-10 max-w-2xl mx-auto">
                      {seats.map((status, index) => (
                        <div key={index} className={`aspect-square rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] font-bold transition-all ${status === 'available' ? 'bg-white border-2 border-green-400 text-green-600' : status === 'resolved' ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-white scale-105' : 'bg-gray-300 text-gray-500 shadow-inner'}`}>
                          {index}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hacker Terminal & Admin Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-800">
                    <div className="md:col-span-2 bg-black p-4 rounded-xl border border-gray-800 font-mono text-[11px] h-48 overflow-y-auto">
                      <div className="sticky top-0 bg-black/90 pb-2 mb-2 border-b border-gray-800 flex justify-between items-center text-gray-500">
                        <span>root@smart-seat:~/dsa-engine$ tail -f logs</span>
                        <span className="text-green-500 animate-pulse">● Live</span>
                      </div>
                      {logs.map((log, i) => (
                        <div key={i} className={`mb-1.5 ${log.includes('SUCCESS') || log.includes('Auto-Resolve') ? 'text-green-400 font-bold' : log.includes('Waitlist') ? 'text-yellow-400' : log.includes('error') ? 'text-red-400' : 'text-cyan-400'}`}>
                          <span className="text-gray-600 opacity-50 mr-2">&gt;</span>{log}
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-1 space-y-4">
                      {/* Original Delete Function */}
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                        <h3 className="font-bold text-red-400 text-xs mb-3 uppercase tracking-wider">Free Seat Range</h3>
                        <form onSubmit={handleCancel} className="space-y-3">
                          <div className="flex gap-2">
                            <input required type="number" min="0" max="49" value={cancelStart} onChange={(e) => setCancelStart(e.target.value)} placeholder="Start" className="w-1/2 px-2 py-1 bg-black border border-gray-700 rounded text-white text-xs outline-none focus:border-red-500" />
                            <input required type="number" min="0" max="49" value={cancelEnd} onChange={(e) => setCancelEnd(e.target.value)} placeholder="End" className="w-1/2 px-2 py-1 bg-black border border-gray-700 rounded text-white text-xs outline-none focus:border-red-500" />
                          </div>
                          <button type="submit" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-bold py-1.5 rounded text-xs transition-colors">EXECUTE</button>
                        </form>
                      </div>

                      {/* NEW SYSTEM RESET BUTTON */}
                      <button onClick={handleSystemReset} className="w-full bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 font-bold py-3 rounded-xl text-xs transition-all tracking-widest uppercase flex items-center justify-center gap-2">
                        ⚠️ Hard Reset Engine
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;