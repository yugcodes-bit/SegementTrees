import { useState, useEffect } from 'react';

function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'booking'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Trie Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Segment Tree / Booking State
  const [seats, setSeats] = useState(Array(50).fill('available'));
  const [numSeats, setNumSeats] = useState(1);
  const [userName, setUserName] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(0);
  
  // Admin State
  const [cancelStart, setCancelStart] = useState(0);
  const [cancelEnd, setCancelEnd] = useState(0);
  const [logs, setLogs] = useState([]);

  // --- MOCK DATA FOR BOOKMYSHOW HOMEPAGE ---
  const movies = [
    { id: 1, title: "Acoustic Night", type: "Concert", image: "https://images.unsplash.com/photo-1540039155733-d7696d4eb98b?w=500&q=80" },
    { id: 2, title: "Action Sports Expo", type: "Sports", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80" },
    { id: 3, title: "Art Gallery Opening", type: "Exhibition", image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=500&q=80" },
    { id: 4, title: "Jazz Festival", type: "Music", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80" }
  ];

  // --- FUNCTIONS ---
  const addLog = (message, type = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 5));
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

  const handleSelectEvent = (movie) => {
    setSelectedEvent(movie);
    setCurrentView('booking');
    setQuery('');
    setResults([]);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!userName) return alert("Please enter a user name!");
    addLog(`O(log N) Segment Tree query for ${numSeats} contiguous seats...`);

    try {
      const response = await fetch('http://localhost:5000/api/events/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.id, userName, numSeats: parseInt(numSeats), tier: 1 })
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
        addLog(`Row Full. Pushed ${userName} to Min-Heap Priority Waitlist.`, 'warning');
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* NAVBAR (BookMyShow Style) */}
      <nav className="bg-slate-900 text-white px-8 py-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-8 w-2/3">
          <div 
            className="text-2xl font-black tracking-tighter cursor-pointer text-rose-500"
            onClick={() => setCurrentView('home')}
          >
            SmartSeat.
          </div>
          
          {/* THE TRIE SEARCH BAR */}
          <div className="relative w-full max-w-xl">
            <input 
              type="text" 
              value={query} 
              onChange={handleSearch} 
              placeholder="Search for Movies, Events, Plays, Sports and Activities" 
              className="w-full px-4 py-2 rounded-md bg-white text-gray-900 focus:outline-none"
            />
            {results.length > 0 && (
              <div className="absolute w-full mt-1 bg-white text-gray-900 rounded-md shadow-2xl overflow-hidden border border-gray-200">
                <div className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">Trie Auto-Complete Results</div>
                {results.map((result, idx) => (
                  <div key={idx} onClick={() => handleSelectEvent(movies[0])} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-100 flex justify-between items-center">
                    <span className="font-semibold">{result.name}</span>
                    <span className="text-xs text-gray-400">{result.data.venue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-300">Pune, MH</div>
      </nav>

      {/* --- HOME VIEW --- */}
      {currentView === 'home' && (
        <div className="max-w-6xl mx-auto py-8 px-4">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Recommended Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {movies.map(movie => (
              <div 
                key={movie.id} 
                onClick={() => handleSelectEvent(movie)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <img src={movie.image} alt={movie.title} className="w-full h-72 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
                  <p className="text-sm text-gray-500">{movie.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BOOKING VIEW (Seat Matrix & DSA Dashboard) --- */}
      {currentView === 'booking' && selectedEvent && (
        <div className="max-w-6xl mx-auto py-8 px-4">
          <button onClick={() => setCurrentView('home')} className="mb-6 text-rose-500 font-semibold hover:underline flex items-center gap-2">
            ← Back to Home
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Event Details & Booking Tools */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-rose-500">
                <h1 className="text-3xl font-black mb-2">{selectedEvent.title}</h1>
                <p className="text-gray-500 mb-6">{selectedEvent.type} | VIP Section</p>
                
                <h3 className="font-bold mb-3 text-slate-800">Book Tickets</h3>
                <form onSubmit={handleBook} className="space-y-4">
                  <input required type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your Name" className="w-full px-4 py-2 border rounded-md" />
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold">Qty:</label>
                    <input required type="number" min="1" max="50" value={numSeats} onChange={(e) => setNumSeats(e.target.value)} className="w-20 px-2 py-2 border rounded-md" />
                  </div>
                  <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-md transition-colors">
                    Confirm Booking
                  </button>
                </form>
              </div>

              {/* Min-Heap Status */}
              <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center border-l-4 border-yellow-400">
                <div><h2 className="font-bold text-slate-800">Waitlist Queue</h2><p className="text-xs text-gray-500">Min-Heap Managed</p></div>
                <div className="text-3xl font-black text-yellow-500">{waitlistCount}</div>
              </div>

            </div>

            {/* Right: Seat Matrix & Admin Engine */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Screen & Seats */}
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="text-center mb-8">
                  <div className="w-3/4 h-2 bg-gray-300 mx-auto rounded-full mb-2"></div>
                  <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">Stage / Screen</span>
                </div>
                
                <div className="grid grid-cols-10 gap-2 mb-8">
                  {seats.map((status, index) => (
                    <div key={index} className={`aspect-square rounded-t-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'available' ? 'bg-white border-2 border-green-400 text-green-600 hover:bg-green-50' : status === 'resolved' ? 'bg-yellow-400 text-white shadow-md' : 'bg-slate-300 text-slate-500'}`}>
                      {index}
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 justify-center text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-green-400 rounded-t-sm"></div> Available</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-300 rounded-t-sm"></div> Booked</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-400 rounded-t-sm"></div> Waitlist Auto-Resolved</div>
                </div>
              </div>

              {/* DSA Admin / Guide View */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 p-4 rounded-xl text-white font-mono text-xs h-48 overflow-y-auto shadow-inner">
                  <div className="text-rose-400 mb-2">// Algorithm Real-Time Logs</div>
                  {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('SUCCESS') || log.includes('Auto-Resolve') ? 'text-green-400' : 'text-slate-300'}`}>
                      {log}
                    </div>
                  ))}
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <h3 className="font-bold text-red-600 text-sm mb-3">Guide Control: Free Seats</h3>
                  <form onSubmit={handleCancel} className="space-y-3">
                    <div className="flex gap-2">
                      <input required type="number" min="0" max="49" value={cancelStart} onChange={(e) => setCancelStart(e.target.value)} placeholder="Start" className="w-1/2 px-2 py-1 border rounded text-sm" />
                      <input required type="number" min="0" max="49" value={cancelEnd} onChange={(e) => setCancelEnd(e.target.value)} placeholder="End" className="w-1/2 px-2 py-1 border rounded text-sm" />
                    </div>
                    <button type="submit" className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded text-sm transition-colors border border-red-300">
                      Cancel & Trigger Heap
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;