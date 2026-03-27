import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User as UserIcon, 
  Plus, 
  MessageSquare, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  LogOut, 
  ChevronRight, 
  Sword, 
  Map, 
  Shield, 
  Wand2,
  Menu,
  X,
  Send,
  Loader2,
  Trash2,
  LayoutDashboard,
  BookOpen,
  Scroll,
  Settings,
  Library,
  FileText,
  Users,
  Globe,
  Star,
  Search,
  Save
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  FirebaseUser,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  OperationType,
  handleFirestoreError,
  getCountFromServer,
  getDocs,
  limit,
  browserPopupRedirectResolver,
  updateDoc
} from './lib/firebase';
import { ai, MODELS, SYSTEM_INSTRUCTION } from './lib/gemini';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

const compressImage = async (base64Str: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- Types ---
import { COLLECTIONS, Personaje, Cronica, Message, Mundo, Bestiario, Faccion, Objeto, checkSecuritySync } from './schema-registry';

import { RightSidebar } from './components/RightSidebar';
import { ModoLectura } from './components/ModoLectura';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { InteractiveMap } from './components/InteractiveMap';

// --- Components ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'cronicas' | 'mundos' | 'personajes' | 'settings' | 'cronica' | 'motor' | 'manual'>('dashboard');
  const [selectedCronica, setSelectedCronica] = useState<Cronica | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [navigationTarget, setNavigationTarget] = useState<{ view: string, id?: string } | null>(null);

  const handleNavigate = async (type: string, id: string) => {
    let normalizedType = type;
    if (type === 'mundo') normalizedType = 'mundos';
    if (type === 'personaje') normalizedType = 'personajes';
    if (type === 'faccion') normalizedType = 'facciones';
    if (type === 'objeto') normalizedType = 'objetos';
    
    if (normalizedType === 'mundos') {
      setNavigationTarget({ view: 'mundos', id });
      setActiveView('mundos');
    } else if (['personajes', 'bestiario', 'facciones', 'objetos'].includes(normalizedType)) {
      setNavigationTarget({ view: normalizedType, id });
      setActiveView('personajes');
    } else if (normalizedType === 'cronica') {
      try {
        const docRef = doc(db, 'cronicas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSelectedCronica({ id: docSnap.id, ...docSnap.data() } as Cronica);
          setActiveView('cronica');
        } else {
          setActiveView('cronicas');
        }
      } catch (err) {
        console.error("Error loading cronica:", err);
        setActiveView('cronicas');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then((snap) => {
          if (!snap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              createdAt: serverTimestamp(),
              role: 'user'
            });
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0c]">
        <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-[#e2e8f0] overflow-hidden relative font-sans">
      <div className="atmosphere" />
      
      {/* Sidebar Inmersiva */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && !readMode && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-72 glass-panel border-r border-[#7c3aed]/20 flex flex-col z-30 relative"
          >
            <div className="p-8 flex items-center gap-4 border-b border-[#7c3aed]/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#c6a052] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-widest text-glow-violet serif-text">AURA AI</h1>
            </div>

            <div className="px-6 pt-6 pb-2">
              <button 
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-[#7c3aed]/20 rounded-xl text-[#94a3b8] hover:bg-white/10 hover:border-[#7c3aed]/40 transition-all group"
                onClick={() => setIsGlobalSearchOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 group-hover:text-[#c6a052] transition-colors" />
                  <span className="text-sm font-medium">Búsqueda Global</span>
                </div>
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-black/30 rounded border border-white/10 text-[#94a3b8]">Ctrl+K</kbd>
              </button>
            </div>

            <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
              <SidebarItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Inicio" 
                active={activeView === 'dashboard'} 
                onClick={() => { setActiveView('dashboard'); setSelectedCronica(null); }} 
              />
              <SidebarItem 
                icon={<Scroll className="w-5 h-5" />} 
                label="Crónicas" 
                active={activeView === 'cronicas' || (activeView === 'cronica' && !!selectedCronica)} 
                onClick={() => { setActiveView('cronicas'); setSelectedCronica(null); }} 
              />
              <SidebarItem 
                icon={<Globe className="w-5 h-5" />} 
                label="Mundos" 
                active={activeView === 'mundos'} 
                onClick={() => setActiveView('mundos')} 
              />
              <SidebarItem 
                icon={<Library className="w-5 h-5" />} 
                label="Biblioteca" 
                active={activeView === 'personajes'} 
                onClick={() => setActiveView('personajes')} 
              />
              
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold opacity-50">Sistemas</p>
              </div>
              
              <SidebarItem 
                icon={<Shield className="w-5 h-5" />} 
                label="Motor" 
                active={activeView === 'motor'} 
                onClick={() => setActiveView('motor')} 
              />
              <SidebarItem 
                icon={<FileText className="w-5 h-5" />} 
                label="Manual" 
                active={activeView === 'manual'} 
                onClick={() => setActiveView('manual')} 
              />

              <SidebarItem 
                icon={<Settings className="w-5 h-5" />} 
                label="Configuración" 
                active={activeView === 'settings'} 
                onClick={() => setActiveView('settings')} 
              />
            </nav>

            <div className="p-6 border-t border-[#7c3aed]/10">
              <div className="flex items-center gap-4 px-3 py-4 aura-card bg-[rgba(255,255,255,0.05)] border-[rgba(198,160,82,0.2)]">
                <img src={user.photoURL || ''} className="w-10 h-10 rounded-lg border border-[#c6a052]/30" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-[#e2e8f0]">{user.displayName}</p>
                  <p className="text-[10px] text-[#c6a052] uppercase tracking-tighter font-bold">Nivel 1: Observador del Nexo</p>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-[#7c3aed]/20 rounded-lg transition-all text-[#94a3b8] hover:text-[#7c3aed]">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        {!readMode && (
          <header className="h-20 flex items-center px-8 border-b border-[#7c3aed]/10 glass-panel backdrop-blur-md">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 hover:bg-[#7c3aed]/10 rounded-xl mr-6 transition-all border border-transparent hover:border-[#7c3aed]/20"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-[#c6a052]" /> : <Menu className="w-5 h-5 text-[#c6a052]" />}
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold serif-text text-glow-gold flex items-center gap-2">
                {activeView === 'dashboard' && "Inicio"}
                {activeView === 'cronicas' && "Crónicas"}
                {activeView === 'mundos' && "Mundos"}
                {activeView === 'personajes' && "Biblioteca"}
                {activeView === 'motor' && "Motor"}
                {activeView === 'manual' && "Manual"}
                {activeView === 'settings' && "Configuración"}
                {activeView === 'cronica' && selectedCronica && selectedCronica.title}
                
                {breadcrumb.length > 0 && breadcrumb.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-[#94a3b8] text-sm font-normal">/</span>
                    <span className="text-sm font-medium text-[#e2e8f0]">{crumb}</span>
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] font-medium">
                {activeView === 'cronica' ? "Sesión Activa" : "Exploración"}
              </p>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              <button 
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-3 hover:bg-[#7c3aed]/10 rounded-xl transition-all border border-transparent hover:border-[#7c3aed]/20"
                title="Bloc de Notas Global"
              >
                <FileText className="w-5 h-5 text-[#c6a052]" />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + (selectedCronica?.id || '')}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {activeView === 'dashboard' && (
                  <Dashboard 
                    user={user} 
                    onOpenCronica={(adv) => {
                      setSelectedCronica(adv);
                      setActiveView('cronica');
                    }}
                    onNewCronica={() => setActiveView('cronicas')} 
                  />
                )}
                {activeView === 'cronicas' && (
                  <CronicasDashboard 
                    user={user} 
                    onSelectCronica={(adv) => {
                      setSelectedCronica(adv);
                      setActiveView('cronica');
                    }} 
                  />
                )}
                {activeView === 'personajes' && (
                  <BibliotecaManager 
                    user={user} 
                    readMode={readMode}
                    setReadMode={setReadMode}
                    setBreadcrumb={setBreadcrumb}
                    navigationTarget={['personajes', 'bestiario', 'facciones', 'objetos'].includes(navigationTarget?.view || '') ? navigationTarget : undefined}
                    onNavigate={handleNavigate}
                  />
                )}
                {activeView === 'cronica' && selectedCronica && (
                  <div className="h-full aura-card p-1">
                    <CronicaChat user={user} cronica={selectedCronica} />
                  </div>
                )}
                {activeView === 'mundos' && (
                  <MundosManager 
                    user={user} 
                    readMode={readMode} 
                    setReadMode={setReadMode} 
                    setBreadcrumb={setBreadcrumb} 
                    navigationTarget={navigationTarget?.view === 'mundos' ? navigationTarget.id : undefined} 
                    onNavigate={handleNavigate}
                  />
                )}
                {activeView === 'motor' && <MotorManager user={user} />}
                {activeView === 'manual' && <ManualManager user={user} />}
                {activeView === 'settings' && (
                  <div className="flex items-center justify-center h-full aura-card">
                    <div className="text-center p-12">
                      <LayoutDashboard className="w-16 h-16 text-[#c6a052]/20 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold serif-text mb-4">Sección en desarrollo</h3>
                      <p className="text-[#94a3b8]">No hay registros disponibles en este momento.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <RightSidebar isOpen={isRightSidebarOpen} onClose={() => setIsRightSidebarOpen(false)} />
      <GlobalSearchModal 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setIsGlobalSearchOpen(false)} 
        user={user} 
        onNavigate={handleNavigate} 
      />
    </div>
  );
}

// --- Sub-components ---

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] text-[#e2e8f0] p-8 relative overflow-hidden">
      <div className="atmosphere" />
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl z-10"
      >
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#c6a052] mx-auto mb-10 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.5)] rotate-3">
          <Sparkles className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-8xl font-bold tracking-widest mb-8 serif-text text-glow-gold text-[#c6a052] uppercase">AURA AI</h1>
        <p className="text-2xl text-[#94a3b8] mb-14 leading-relaxed font-light">
          Donde la narrativa ancestral se encuentra con la inteligencia del mañana. 
          Explora crónicas infinitas.
        </p>
        <button 
          onClick={onLogin}
          className="btn-primary px-16 py-5 text-xl flex items-center gap-4 mx-auto"
        >
          Acceder al Sistema
          <ChevronRight className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="aura-card p-6 h-28 bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="aura-card p-6 h-[180px] bg-white/5" />
        ))}
      </div>
      <div className="w-full h-[56px] rounded-xl bg-white/5" />
    </div>
  );
}

function Dashboard({ user, onOpenCronica, onNewCronica }: { user: FirebaseUser, onOpenCronica: (adv: Cronica) => void, onNewCronica: () => void }) {
  const [metrics, setMetrics] = useState({ cronicas: 0, personajes: 0, mundos: 0 });
  const [recentCronicas, setRecentCronicas] = useState<Cronica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const advQuery = query(collection(db, 'cronicas'), where('userId', '==', user.uid));
        const charQuery = query(collection(db, 'personajes'), where('userId', '==', user.uid));
        const worldQuery = query(collection(db, 'mundos'), where('userId', '==', user.uid));

        const [advSnap, charSnap, worldSnap] = await Promise.all([
          getCountFromServer(advQuery),
          getCountFromServer(charQuery),
          getCountFromServer(worldQuery)
        ]);

        setMetrics({
          cronicas: advSnap.data().count,
          personajes: charSnap.data().count,
          mundos: worldSnap.data().count
        });

        const recentQuery = query(
          collection(db, 'cronicas'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const recentSnap = await getDocs(recentQuery);
        setRecentCronicas(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cronica)));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.uid]);

  return (
    <div className="flex flex-col p-[32px] gap-[24px] w-full max-w-7xl mx-auto">
      <header className="mb-4">
        <h1 className="text-[2.5rem] font-bold text-glow-gold serif-text mb-2">Inicio</h1>
        <p className="text-[1rem] text-[#94a3b8] font-sans">Gestión centralizada de contenidos y actividad</p>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aura-card p-6 border-l-4 border-l-[#c6a052] flex items-center gap-4">
              <div className="p-3 bg-[#c6a052]/10 rounded-lg"><FileText className="w-6 h-6 text-[#c6a052]" /></div>
              <div>
                <p className="text-sm text-[#94a3b8] uppercase tracking-wider">Crónicas</p>
                <p className="text-3xl font-bold text-[#e2e8f0]">{metrics.cronicas}</p>
              </div>
            </div>
            <div className="aura-card p-6 border-l-4 border-l-[#7c3aed] flex items-center gap-4">
              <div className="p-3 bg-[#7c3aed]/10 rounded-lg"><Users className="w-6 h-6 text-[#7c3aed]" /></div>
              <div>
                <p className="text-sm text-[#94a3b8] uppercase tracking-wider">Personajes</p>
                <p className="text-3xl font-bold text-[#e2e8f0]">{metrics.personajes}</p>
              </div>
            </div>
            <div className="aura-card p-6 border-l-4 border-l-[#10b981] flex items-center gap-4">
              <div className="p-3 bg-[#10b981]/10 rounded-lg"><Globe className="w-6 h-6 text-[#10b981]" /></div>
              <div>
                <p className="text-sm text-[#94a3b8] uppercase tracking-wider">Mundos</p>
                <p className="text-3xl font-bold text-[#e2e8f0]">{metrics.mundos}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold serif-text text-[#e2e8f0] mb-6">Actividad Reciente</h2>
            {recentCronicas.length === 0 ? (
              <div className="aura-card p-8 text-center border-dashed border-2 border-[#7c3aed]/20">
                <p className="text-[#94a3b8] italic">No hay registros disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentCronicas.map(adv => (
                  <div key={adv.id} className="aura-card p-6 h-[180px] flex flex-col relative group">
                    <div className="flex justify-between items-start mb-auto">
                      <span className="px-3 py-1 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded text-xs font-bold uppercase tracking-widest text-[#7c3aed]">
                        {adv.genre}
                      </span>
                      <span className="text-xs text-[#94a3b8]">
                        {adv.createdAt?.toDate ? adv.createdAt.toDate().toLocaleDateString('es-ES') : 'Reciente'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold serif-text text-[#e2e8f0] group-hover:text-[#c6a052] transition-colors line-clamp-2 mb-4">
                      {adv.title}
                    </h3>
                    <button 
                      onClick={() => onOpenCronica(adv)}
                      className="absolute bottom-6 right-6 text-sm font-bold text-[#c6a052] hover:text-[#e2e8f0] transition-colors flex items-center gap-2"
                    >
                      Abrir <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={onNewCronica}
            className="w-full p-[16px] bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-sans font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] mt-4"
          >
            Nueva Crónica
          </button>
        </>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, disabled }: { icon: any, label: string, active: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative",
        active 
          ? "bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]" 
          : "text-[#94a3b8] hover:bg-white/5 hover:text-[#e2e8f0]",
        disabled && "opacity-30 cursor-not-allowed grayscale"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        {icon}
      </div>
      <span className="font-medium tracking-wide">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-[#7c3aed] rounded-r-full"
        />
      )}
    </button>
  );
}

function CronicasDashboard({ user, onSelectCronica }: { user: FirebaseUser, onSelectCronica: (adv: Cronica) => void }) {
  const [cronicas, setCronicas] = useState<Cronica[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'cronicas'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setCronicas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cronica)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'cronicas'));
    return unsubscribe;
  }, [user.uid]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="text-4xl font-bold serif-text text-glow-gold mb-2">Mis Crónicas</h3>
          <p className="text-[#94a3b8]">Tus historias registradas.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="btn-primary flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Nueva Crónica
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cronicas.map((adv) => (
          <motion.div
            key={adv.id}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => onSelectCronica(adv)}
            className="aura-card p-8 cursor-pointer group relative overflow-hidden border-[#7c3aed]/10"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
              <ChevronRight className="w-8 h-8 text-[#7c3aed]" />
            </div>
            <div className="mb-6">
              <span className="px-4 py-1.5 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c3aed]">
                {adv.genre}
              </span>
            </div>
            <h4 className="text-2xl font-bold mb-4 group-hover:text-glow-violet transition-all serif-text">{adv.title}</h4>
            <p className="text-sm text-[#94a3b8] line-clamp-3 leading-relaxed">{adv.summary || "Una historia aún por ser escrita..."}</p>
            <div className="mt-8 pt-6 border-t border-[#7c3aed]/5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#94a3b8]/50">Estado: {adv.status}</span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30" />
                <div className="w-6 h-6 rounded-full bg-[#c6a052]/20 border border-[#c6a052]/30" />
              </div>
            </div>
          </motion.div>
        ))}
        {cronicas.length === 0 && (
          <div className="col-span-full py-24 text-center aura-card border-dashed border-2 border-[#7c3aed]/10">
            <Map className="w-16 h-16 text-[#7c3aed]/20 mx-auto mb-6" />
            <p className="text-[#94a3b8] text-lg italic">No hay crónicas registradas.</p>
          </div>
        )}
      </div>

      {showNewModal && <NuevaCronicaModal user={user} onClose={() => setShowNewModal(false)} onCreated={onSelectCronica} />}
    </div>
  );
}

function NuevaCronicaModal({ user, onClose, onCreated }: { user: FirebaseUser, onClose: () => void, onCreated: (adv: Cronica) => void }) {
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [selectedChar, setSelectedChar] = useState<string>('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Fantasía');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'personajes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPersonajes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Personaje)));
    });
    return unsubscribe;
  }, [user.uid]);

  const handleCreate = async () => {
    if (!selectedChar || !title) return;
    setCreating(true);
    try {
      const advRef = await addDoc(collection(db, 'cronicas'), {
        userId: user.uid,
        characterId: selectedChar,
        title,
        genre,
        summary: '',
        status: 'active',
        createdAt: serverTimestamp()
      });
      
      const char = personajes.find(c => c.id === selectedChar);
      const initialPrompt = `Comienza una nueva crónica de ${genre} titulada "${title}". 
      El protagonista es ${char?.name}, un ${char?.race} ${char?.class}. 
      Trasfondo: ${char?.bio}.
      Describe la escena inicial de forma inmersiva y pregunta al jugador qué desea hacer.`;

      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: initialPrompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });

      await addDoc(collection(db, 'cronicas', advRef.id, 'messages'), {
        cronicaId: advRef.id,
        role: 'model',
        content: response.text,
        type: 'text',
        createdAt: serverTimestamp()
      });

      onCreated({ id: advRef.id, userId: user.uid, characterId: selectedChar, title, genre, summary: '', status: 'active', createdAt: new Date() });
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="aura-card w-full max-w-xl p-10 border-[#7c3aed]/30"
      >
        <h3 className="text-3xl font-bold mb-8 serif-text text-glow-gold">Nueva Crónica</h3>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Título de la Crónica</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: El Susurro de las Sombras..."
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Género Narrativo</label>
            <select 
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0] appearance-none"
            >
              <option value="Fantasía">Fantasía</option>
              <option value="Ciencia Ficción">Ciencia Ficción</option>
              <option value="Cyberpunk">Cyberpunk</option>
              <option value="Terror">Terror</option>
              <option value="Steampunk">Steampunk</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Seleccionar Personaje</label>
            <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {personajes.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedChar(char.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left group",
                    selectedChar === char.id 
                      ? "bg-[#7c3aed]/20 border-[#7c3aed] shadow-[0_0_15px_rgba(124,58,237,0.1)]" 
                      : "bg-white/5 border-[#7c3aed]/10 hover:border-[#7c3aed]/30"
                  )}
                >
                  <p className={cn("font-bold transition-colors", selectedChar === char.id ? "text-[#7c3aed]" : "text-[#e2e8f0]")}>{char.name}</p>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-tighter">{char.race} · {char.class}</p>
                </button>
              ))}
              {personajes.length === 0 && (
                <p className="col-span-full text-sm text-[#94a3b8] text-center py-6 aura-card border-dashed">Primero debes crear un personaje en la Biblioteca.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] font-medium">Cancelar</button>
          <button 
            onClick={handleCreate}
            disabled={creating || !selectedChar || !title}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-3"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Scroll className="w-5 h-5" />
                Comenzar Crónica
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BibliotecaManager({ user, onNavigate, readMode, setReadMode, setBreadcrumb, navigationTarget }: { user: FirebaseUser, onNavigate?: (type: string, id: string) => void, readMode: boolean, setReadMode: (v: boolean) => void, setBreadcrumb?: (b: string[]) => void, navigationTarget?: { view: string, id?: string } | null }) {
  const [activeTab, setActiveTab] = useState<'personajes' | 'bestiario' | 'facciones' | 'objetos'>('personajes');
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (navigationTarget?.view && ['personajes', 'bestiario', 'facciones', 'objetos'].includes(navigationTarget.view)) {
      setActiveTab(navigationTarget.view as any);
    }
  }, [navigationTarget?.view]);

  useEffect(() => {
    if (navigationTarget?.id && items.length > 0) {
      const targetItem = items.find(i => i.id === navigationTarget.id);
      if (targetItem) {
        setSelectedItem(targetItem);
        setShowDetail(true);
      }
    }
  }, [navigationTarget?.id, items]);

  const toggleFavorite = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    let collectionName = '';
    switch (activeTab) {
      case 'personajes': collectionName = COLLECTIONS.PERSONAJES; break;
      case 'bestiario': collectionName = COLLECTIONS.BESTIARIO; break;
      case 'facciones': collectionName = COLLECTIONS.FACCIONES; break;
      case 'objetos': collectionName = COLLECTIONS.OBJETOS; break;
    }
    
    // Check limit of 15 favorites
    if (!item.isFavorite) {
      const favoritesCount = items.filter(i => i.isFavorite).length;
      if (favoritesCount >= 15) {
        alert("Límite de 15 favoritos alcanzado en esta sección.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, collectionName, item.id), {
        isFavorite: !item.isFavorite
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    if (setBreadcrumb) {
      if (selectedItem) {
        setBreadcrumb([activeTab.charAt(0).toUpperCase() + activeTab.slice(1), selectedItem.name]);
      } else {
        setBreadcrumb([activeTab.charAt(0).toUpperCase() + activeTab.slice(1)]);
      }
    }
  }, [activeTab, selectedItem, setBreadcrumb]);

  useEffect(() => {
    let collectionName = '';
    switch (activeTab) {
      case 'personajes': collectionName = COLLECTIONS.PERSONAJES; break;
      case 'bestiario': collectionName = COLLECTIONS.BESTIARIO; break;
      case 'facciones': collectionName = COLLECTIONS.FACCIONES; break;
      case 'objetos': collectionName = COLLECTIONS.OBJETOS; break;
    }
    
    const q = query(collection(db, collectionName), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort so favorites are pinned to the top
      fetchedItems.sort((a: any, b: any) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
      setItems(fetchedItems);
    });
    return unsubscribe;
  }, [user.uid, activeTab]);

  return (
    <div className="h-full flex flex-col max-w-[1200px] mx-auto w-full">
      {!readMode && (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-8 mb-10">
            <div>
              <h3 className="text-4xl font-bold serif-text text-glow-gold mb-2">Biblioteca</h3>
              <p className="text-[#94a3b8]">Archivo de expedientes y registros del multiverso.</p>
            </div>
            <button 
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center justify-center gap-3 w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Crear Entidad
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#c6a052]/20 pb-4">
            <div className="flex gap-4 overflow-x-auto custom-scrollbar flex-1">
              {(['personajes', 'bestiario', 'facciones', 'objetos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedItem(null); setShowDetail(false); }}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium uppercase tracking-widest text-xs transition-all whitespace-nowrap",
                    activeTab === tab 
                      ? "bg-[#c6a052]/10 text-[#c6a052] border border-[#c6a052]/30" 
                      : "bg-transparent text-[#94a3b8] hover:text-[#e2e8f0] border border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder={`Buscar en ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] focus:border-[#7c3aed] outline-none transition-all"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-10 pr-2 pt-6">
        {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
          <div 
            key={item.id} 
            className="relative bg-[#1a1a1a] border-[0.5px] border-[#c6a052]/30 rounded-b-xl rounded-tr-xl p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(198,160,82,0.1)] hover:border-[#c6a052]/60 hover:brightness-110"
            onClick={() => { setSelectedItem(item); setShowDetail(true); }}
          >
            {/* Pestaña de Carpeta */}
            <div className="absolute -top-6 left-[-0.5px] bg-[#1a1a1a] border-t-[0.5px] border-l-[0.5px] border-r-[0.5px] border-[#c6a052]/30 px-4 py-1 rounded-t-lg text-[10px] font-mono text-[#c6a052] uppercase tracking-widest group-hover:border-[#c6a052]/60 transition-colors">
              ENT-{item.id.slice(0,4)}
            </div>
            
            <button 
              onClick={(e) => toggleFavorite(e, item)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-all z-10"
            >
              <Star className={cn("w-5 h-5 transition-colors", item.isFavorite ? "text-[#c6a052] fill-[#c6a052]" : "text-[#94a3b8]")} />
            </button>

            {activeTab === 'personajes' && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded bg-black/50 border border-white/5 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-[#94a3b8]" />
                    )}
                  </div>
                  <span className="px-2 py-1 bg-black/50 rounded text-[10px] uppercase tracking-wider text-[#94a3b8] border border-white/5">
                    {item.class || 'Desconocido'}
                  </span>
                </div>
                
                <h4 className="text-xl font-bold serif-text text-[#e2e8f0] mb-2 group-hover:text-glow-gold transition-colors line-clamp-1">{item.name}</h4>
                <p className="text-xs text-[#7c3aed] font-medium uppercase tracking-widest mb-2">{item.race || 'Entidad'}</p>
                <p className="text-sm text-[#94a3b8] line-clamp-3 leading-relaxed italic">"{item.bio}"</p>
              </>
            )}
            {activeTab !== 'personajes' && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold serif-text text-[#e2e8f0] group-hover:text-glow-gold transition-colors line-clamp-1">{item.name}</h4>
                </div>
                <p className="text-xs text-[#7c3aed] font-medium mb-3 uppercase tracking-widest">
                  {activeTab === 'bestiario' ? `Peligro: ${item.dangerLevel || '?'}` : 
                   activeTab === 'facciones' ? `Influencia: ${item.influence || '?'}` : 
                   `Tipo: ${item.type || '?'}`}
                </p>
                <p className="text-sm text-[#94a3b8] line-clamp-4 leading-relaxed">{item.description}</p>
              </>
            )}
          </div>
        ))}
        {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="col-span-full py-24 text-center border border-dashed border-[#c6a052]/30 rounded-xl opacity-50 mt-6">
            <Library className="w-16 h-16 text-[#c6a052]/40 mx-auto mb-6" />
            <p className="text-[#94a3b8] text-lg italic">No hay registros encontrados.</p>
          </div>
        )}
      </div>

      {showCreate && <CrearEntidadModal user={user} activeTab={activeTab} onClose={() => setShowCreate(false)} />}
      
      {showDetail && selectedItem && (
        <DetalleEntidadModal 
          item={selectedItem} 
          type={activeTab} 
          onClose={() => setShowDetail(false)} 
          onEdit={() => { setShowDetail(false); setShowEdit(true); }}
          onNavigate={onNavigate}
          readMode={readMode}
          setReadMode={setReadMode}
        />
      )}

      {showEdit && selectedItem && (
        <EditarEntidadModal 
          item={selectedItem} 
          type={activeTab} 
          onClose={() => setShowEdit(false)} 
        />
      )}
    </div>
  );
}

function DetalleEntidadModal({ item, type, onClose, onEdit, onNavigate, readMode, setReadMode }: { item: any, type: string, onClose: () => void, onEdit: () => void, onNavigate?: (type: string, id: string) => void, readMode?: boolean, setReadMode?: (v: boolean) => void }) {
  if (readMode) {
    return (
      <ModoLectura
        title={item.name}
        image={item.imageUrl}
        content={
          <>
            <p className="lead">{item.bio || item.description}</p>
            {/* Additional content could go here */}
          </>
        }
        onClose={() => setReadMode?.(false)}
      />
    );
  }

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const regex = /entity:([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const type = match[1];
      const id = match[2];
      parts.push(
        <button
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(type, id);
          }}
          className="text-[#c6a052] hover:text-[#7c3aed] underline decoration-[#c6a052]/30 hover:decoration-[#7c3aed] transition-colors font-medium px-1 rounded hover:bg-[#7c3aed]/10"
          title={`Ver ${type}`}
        >
          [{type}:{id.slice(0, 4)}]
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/95 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="aura-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-[#7c3aed]/30"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="flex flex-col md:flex-row gap-10">
            {type === 'personajes' && item.imageUrl && (
              <div className="w-full md:w-72 shrink-0">
                <img src={item.imageUrl} className="w-full aspect-[4/5] object-cover rounded-2xl border border-[#7c3aed]/20 shadow-[0_0_30px_rgba(124,58,237,0.2)]" referrerPolicy="no-referrer" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-bold serif-text text-glow-gold mb-2">{item.name}</h3>
                  <p className="text-[#7c3aed] font-medium uppercase tracking-[0.3em] text-xs">
                    {type === 'personajes' ? `${item.race} · ${item.class}` : 
                     type === 'bestiario' ? `Criatura · Peligro ${item.dangerLevel}` :
                     type === 'facciones' ? `Facción · Influencia ${item.influence}` :
                     `Objeto · Tipo ${item.type}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setReadMode?.(true)}
                    className="p-2 hover:bg-white/5 rounded-full transition-all text-[#94a3b8] hover:text-[#7c3aed]"
                    title="Modo Lectura"
                  >
                    <BookOpen className="w-6 h-6" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-[#94a3b8]">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-4 border-b border-[#7c3aed]/10 pb-2">Descripción / Bio</h4>
                  <p className="text-[#e2e8f0] leading-relaxed italic whitespace-pre-wrap">
                    {renderTextWithLinks(item.bio || item.description)}
                  </p>
                </section>

                <section className="aura-card p-6 bg-white/5 border-[#c6a052]/20">
                  <h4 className="text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Presencia en el Multiverso
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Mundo de Origen</p>
                      {item.worldId ? (
                        <button 
                          onClick={() => onNavigate?.('mundos', item.worldId)}
                          className="text-sm font-bold text-[#7c3aed] hover:underline flex items-center gap-2"
                        >
                          <Map className="w-3 h-3" />
                          {item.worldId.slice(0,12)}...
                        </button>
                      ) : (
                        <p className="text-sm font-bold text-[#94a3b8]">Entidad Libre (Sin Mundo)</p>
                      )}
                    </div>
                    
                    {(item.padreId || item.aliadoId) && (
                      <>
                        {item.padreId && (
                          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Padre / Creador</p>
                            <button 
                              onClick={() => onNavigate?.('personajes', item.padreId)}
                              className="text-sm font-bold text-[#c6a052] hover:underline flex items-center gap-2"
                            >
                              <Users className="w-3 h-3" />
                              {item.padreId.slice(0,12)}...
                            </button>
                          </div>
                        )}
                        {item.aliadoId && (
                          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Aliado Principal</p>
                            <button 
                              onClick={() => onNavigate?.('personajes', item.aliadoId)}
                              className="text-sm font-bold text-[#c6a052] hover:underline flex items-center gap-2"
                            >
                              <Shield className="w-3 h-3" />
                              {item.aliadoId.slice(0,12)}...
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Estado Actual</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'Muerto' || item.status === 'Destruido' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <p className="text-sm font-bold text-[#e2e8f0]">{item.status || 'Activo / Vivo'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {item.instanceStates && Object.keys(item.instanceStates).length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-4">Instancias en Crónicas</h4>
                    <div className="space-y-3">
                      {Object.entries(item.instanceStates).map(([cronicaId, state]: [string, any]) => (
                        <div key={cronicaId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <button 
                            onClick={() => onNavigate?.('cronica', cronicaId)}
                            className="text-sm font-medium text-[#94a3b8] hover:text-[#7c3aed] transition-colors"
                          >
                            Crónica: {cronicaId.slice(0,8)}...
                          </button>
                          <span className="px-3 py-1 bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-bold rounded uppercase">
                            {state.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-[#7c3aed]/10 bg-black/20 flex gap-4">
          <button onClick={onEdit} className="flex-1 btn-primary py-4 flex items-center justify-center gap-3">
            <FileText className="w-5 h-5" />
            Editar Expediente
          </button>
          <button onClick={onClose} className="flex-1 py-4 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] font-medium border border-white/5">Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
}

function EditarEntidadModal({ item, type, onClose }: { item: any, type: string, onClose: () => void }) {
  const [name, setName] = useState(item.name || '');
  const [description, setDescription] = useState(item.bio || item.description || '');
  const [race, setRace] = useState(item.race || 'Humano');
  const [charClass, setCharClass] = useState(item.class || 'Guerrero');
  const [extraProp, setExtraProp] = useState(item.dangerLevel || item.influence || item.type || '');
  const [padreId, setPadreId] = useState(item.padreId || '');
  const [aliadoId, setAliadoId] = useState(item.aliadoId || '');
  const [status, setStatus] = useState(item.status || 'Activo / Vivo');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem(`history_${item.id}`);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, [item.id]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[0];
    setName(lastState.name || '');
    setDescription(lastState.bio || lastState.description || '');
    setRace(lastState.race || 'Humano');
    setCharClass(lastState.class || 'Guerrero');
    setExtraProp(lastState.dangerLevel || lastState.influence || lastState.type || '');
    setPadreId(lastState.padreId || '');
    setAliadoId(lastState.aliadoId || '');
    setStatus(lastState.status || 'Activo / Vivo');
    
    const newHistory = history.slice(1);
    setHistory(newHistory);
    localStorage.setItem(`history_${item.id}`, JSON.stringify(newHistory));
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try {
      let collectionName = '';
      let data: any = {
        name,
        status,
        updatedAt: serverTimestamp(),
      };

      if (type === 'personajes') {
        collectionName = COLLECTIONS.PERSONAJES;
        data = { ...data, race, class: charClass, bio: description, padreId, aliadoId };
      } else {
        data.description = description;
        if (type === 'bestiario') {
          collectionName = COLLECTIONS.BESTIARIO;
          data.dangerLevel = extraProp;
        } else if (type === 'facciones') {
          collectionName = COLLECTIONS.FACCIONES;
          data.influence = extraProp;
        } else if (type === 'objetos') {
          collectionName = COLLECTIONS.OBJETOS;
          data.type = extraProp;
        }
      }

      // Save to local history before updating
      const currentState = { ...item };
      const newHistory = [currentState, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem(`history_${item.id}`, JSON.stringify(newHistory));

      await setDoc(doc(db, collectionName, item.id), data, { merge: true });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, type);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="aura-card w-full max-w-xl p-10 border-[#7c3aed]/30 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-bold serif-text text-glow-gold">Editar Expediente</h3>
          {history.length > 0 && (
            <button 
              onClick={handleUndo}
              className="text-xs text-[#c6a052] hover:text-white transition-colors flex items-center gap-1 border border-[#c6a052]/30 px-3 py-1.5 rounded-full hover:bg-[#c6a052]/10"
              title="Deshacer último cambio"
            >
              Deshacer
            </button>
          )}
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Nombre</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
            />
          </div>

          {type === 'personajes' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Raza</label>
                  <input 
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Clase</label>
                  <input 
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">ID Padre / Creador</label>
                  <input 
                    value={padreId}
                    onChange={(e) => setPadreId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">ID Aliado Principal</label>
                  <input 
                    value={aliadoId}
                    onChange={(e) => setAliadoId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
            </>
          )}

          {type !== 'personajes' && (
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">
                {type === 'bestiario' ? 'Nivel de Peligro' : type === 'facciones' ? 'Nivel de Influencia' : 'Tipo de Objeto'}
              </label>
              <input 
                value={extraProp}
                onChange={(e) => setExtraProp(e.target.value)}
                className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Estado Global</label>
            <input 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Ej: Activo / Vivo, Muerto, Destruido..."
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Descripción / Bio</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] font-medium">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={saving || !name}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CrearEntidadModal({ user, activeTab, onClose }: { user: FirebaseUser, activeTab: string, onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [race, setRace] = useState('Humano');
  const [charClass, setCharClass] = useState('Guerrero');
  const [extraProp, setExtraProp] = useState('');
  const [padreId, setPadreId] = useState('');
  const [aliadoId, setAliadoId] = useState('');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const prompt = window.prompt(`Ingresa una directriz para generar ${activeTab === 'personajes' ? 'el personaje' : activeTab === 'bestiario' ? 'la criatura' : activeTab === 'facciones' ? 'la facción' : 'el objeto'} (ej: 'Guerrero veterano con cicatrices'):`);
    if (!prompt) return;
    
    setGenerating(true);
    try {
      const typeStr = activeTab === 'personajes' ? 'un personaje' : activeTab === 'bestiario' ? 'una criatura' : activeTab === 'facciones' ? 'una facción' : 'un objeto';
      const aiPrompt = `Genera detalles para ${typeStr} de fantasía basado en esta idea: "${prompt}".
      Devuelve SOLO un objeto JSON válido con las siguientes propiedades:
      - name: Nombre de la entidad.
      - description: Descripción detallada y atmosférica.
      ${activeTab === 'personajes' ? '- race: Raza (ej: Humano, Elfo, Orco, etc).\n- charClass: Clase (ej: Guerrero, Mago, Pícaro, etc).' : ''}
      ${activeTab === 'bestiario' ? '- extraProp: Nivel de peligro (ej: Alto, Medio, Bajo, Desconocido).' : ''}
      ${activeTab === 'facciones' ? '- extraProp: Nivel de influencia (ej: Global, Regional, Local).' : ''}
      ${activeTab === 'objetos' ? '- extraProp: Tipo de objeto (ej: Arma, Reliquia, Consumible).' : ''}
      `;

      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: aiPrompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (activeTab === 'personajes') {
        if (data.race) setRace(data.race);
        if (data.charClass) setCharClass(data.charClass);
      } else {
        if (data.extraProp) setExtraProp(data.extraProp);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error al generar contenido. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!name) return;
    if (activeTab === 'personajes' && !description) return;
    if (activeTab !== 'personajes' && !description) return;
    
    setCreating(true);
    let collectionName = '';
    try {
      let data: any = {
        userId: user.uid,
        name,
        createdAt: serverTimestamp(),
        worldId: null,
        status: 'Activo / Vivo'
      };

      if (activeTab === 'personajes') {
        collectionName = COLLECTIONS.PERSONAJES;
        const imagePrompt = `A high-quality, cinematic portrait of a ${race} ${charClass} named ${name}. ${description}. Fantasy art style, detailed lighting, epic atmosphere.`;
        const imageResponse = await ai.models.generateContent({
          model: MODELS.IMAGE,
          contents: imagePrompt,
          config: { imageConfig: { aspectRatio: "1:1" } }
        });

        let imageUrl = '';
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
            imageUrl = await compressImage(rawBase64, 512, 512);
            break;
          }
        }
        data = { ...data, race, class: charClass, bio: description, imageUrl, padreId, aliadoId };
      } else {
        if (activeTab === 'bestiario') {
          collectionName = COLLECTIONS.BESTIARIO;
          data = { ...data, description, dangerLevel: extraProp || 'Desconocido' };
        } else if (activeTab === 'facciones') {
          collectionName = COLLECTIONS.FACCIONES;
          data = { ...data, description, influence: extraProp || 'Desconocida' };
        } else if (activeTab === 'objetos') {
          collectionName = COLLECTIONS.OBJETOS;
          data = { ...data, description, type: extraProp || 'Común' };
        }
      }

      await addDoc(collection(db, collectionName), data);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl p-10 bg-[#0a0a0a] border-[0.5px] border-[#c6a052] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
      >
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-bold font-cinzel text-glow-gold">
            Crear {activeTab === 'personajes' ? 'Personaje' : activeTab === 'bestiario' ? 'Criatura' : activeTab === 'facciones' ? 'Facción' : 'Objeto'}
          </h3>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-[#c6a052]/10 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-all text-sm font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Sugerir
          </button>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Nombre</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la entidad..."
              className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] font-cinzel text-lg"
            />
          </div>

          {activeTab === 'personajes' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Raza</label>
                  <select 
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] appearance-none"
                  >
                    <option value="Humano" className="bg-[#0a0a0a]">Humano</option>
                    <option value="Elfo" className="bg-[#0a0a0a]">Elfo</option>
                    <option value="Enano" className="bg-[#0a0a0a]">Enano</option>
                    <option value="Orco" className="bg-[#0a0a0a]">Orco</option>
                    <option value="Mediano" className="bg-[#0a0a0a]">Mediano</option>
                    <option value="Dracónido" className="bg-[#0a0a0a]">Dracónido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Clase</label>
                  <select 
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] appearance-none"
                  >
                    <option value="Guerrero" className="bg-[#0a0a0a]">Guerrero</option>
                    <option value="Mago" className="bg-[#0a0a0a]">Mago</option>
                    <option value="Pícaro" className="bg-[#0a0a0a]">Pícaro</option>
                    <option value="Paladín" className="bg-[#0a0a0a]">Paladín</option>
                    <option value="Explorador" className="bg-[#0a0a0a]">Explorador</option>
                    <option value="Bardo" className="bg-[#0a0a0a]">Bardo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">ID Padre / Creador</label>
                  <input 
                    value={padreId}
                    onChange={(e) => setPadreId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">ID Aliado Principal</label>
                  <input 
                    value={aliadoId}
                    onChange={(e) => setAliadoId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab !== 'personajes' && (
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">
                {activeTab === 'bestiario' ? 'Nivel de Peligro' : activeTab === 'facciones' ? 'Nivel de Influencia' : 'Tipo de Objeto'}
              </label>
              <input 
                value={extraProp}
                onChange={(e) => setExtraProp(e.target.value)}
                placeholder={activeTab === 'bestiario' ? 'Ej: Alto, Medio, Bajo...' : activeTab === 'facciones' ? 'Ej: Global, Regional...' : 'Ej: Arma, Reliquia...'}
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Descripción</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los detalles de esta entidad..."
              rows={4}
              className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none"
            />
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4 border-t border-[#c6a052]/20 pt-6">
          <button onClick={onClose} className="px-6 py-3 rounded text-[#94a3b8] hover:text-white transition-all font-bold tracking-widest uppercase text-sm">Cancelar</button>
          <button 
            onClick={handleCreate}
            disabled={creating || !name || !description}
            className="px-8 py-3 bg-[#c6a052] text-black font-bold tracking-widest uppercase text-sm rounded hover:bg-[#d4af37] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Crear Entidad
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CronicaChat({ user, cronica }: { user: FirebaseUser, cronica: Cronica }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'cronicas', cronica.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return unsubscribe;
  }, [cronica.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input;
    setInput('');
    setSending(true);

    try {
      await addDoc(collection(db, 'cronicas', cronica.id, 'messages'), {
        cronicaId: cronica.id,
        role: 'user',
        content: userMsg,
        type: 'text',
        createdAt: serverTimestamp()
      });

      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: MODELS.TEXT,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history: history
      });

      const response = await chat.sendMessage({ message: userMsg });
      const aiText = response.text;

      await addDoc(collection(db, 'cronicas', cronica.id, 'messages'), {
        cronicaId: cronica.id,
        role: 'model',
        content: aiText,
        type: 'text',
        createdAt: serverTimestamp()
      });

      const summaryPrompt = `Summarize the current state of the cronica "${cronica.title}" in 2 sentences based on this chat history: ${aiText}`;
      const summaryRes = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: summaryPrompt
      });
      await setDoc(doc(db, 'cronicas', cronica.id), { summary: summaryRes.text }, { merge: true });

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cronicas/${cronica.id}/messages`);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateImage = async () => {
    if (sending) return;
    setSending(true);
    try {
      const lastMsg = messages[messages.length - 1]?.content || "";
      const imagePrompt = `A cinematic, atmospheric fantasy illustration of the following scene: ${lastMsg}. High detail, epic lighting.`;
      
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: imagePrompt,
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          imageUrl = await compressImage(rawBase64, 800, 450); // 16:9 aspect ratio roughly
          break;
        }
      }

      await addDoc(collection(db, 'cronicas', cronica.id, 'messages'), {
        cronicaId: cronica.id,
        role: 'system',
        content: "Aura ha visualizado el momento.",
        type: 'image',
        imageUrl,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cronicas/${cronica.id}/messages`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-col",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] rounded-2xl p-6 shadow-xl relative",
              msg.role === 'user' 
                ? "bg-[#7c3aed] text-white rounded-tr-none" 
                : "bg-white/5 text-[#e2e8f0] border border-[#7c3aed]/20 rounded-tl-none backdrop-blur-md"
            )}>
              {msg.type === 'text' && (
                <div className="markdown-body prose-sm max-w-none serif-text text-lg">
                  <Markdown
                    components={{
                      a: ({ node, ...props }) => {
                        const href = props.href || '';
                        if (href.startsWith('entity:')) {
                          const [, type, id] = href.split(':');
                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                // TODO: Implement navigation to entity
                                console.log('Navigate to entity', type, id);
                                alert(`Navegación a ficha: ${type} - ${id}`);
                              }}
                              className="text-[#c6a052] hover:text-[#e2e8f0] underline decoration-[#7c3aed]/50 hover:decoration-[#7c3aed] transition-colors cursor-pointer font-bold"
                            >
                              {props.children}
                            </button>
                          );
                        }
                        return <a {...props} className="text-[#7c3aed] hover:underline" />;
                      }
                    }}
                  >
                    {msg.content}
                  </Markdown>
                </div>
              )}
              {msg.type === 'image' && msg.imageUrl && (
                <div className="space-y-4">
                  <img src={msg.imageUrl} className="w-full rounded-xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
                  <p className="text-xs text-[#94a3b8] italic text-center">{msg.content}</p>
                </div>
              )}
            </div>
            <span className="text-[10px] text-[#94a3b8]/40 mt-2 uppercase tracking-[0.3em] font-bold">
              {msg.role === 'model' ? 'AURA AI' : msg.role === 'user' ? 'Usuario' : 'Sistema'}
            </span>
          </motion.div>
        ))}
        {sending && (
          <div className="flex items-center gap-3 text-[#7c3aed] text-sm italic animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Aura está canalizando la narrativa...</span>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-[#7c3aed]/10 bg-[#0a0a0c]/50 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex gap-4">
          <button 
            type="button"
            onClick={handleGenerateImage}
            disabled={sending || messages.length === 0}
            className="p-4 aura-card hover:bg-[#c6a052]/10 text-[#c6a052] transition-all disabled:opacity-30"
            title="Visualizar Escena"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="¿Qué harás ahora, viajero?..."
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-6 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0] placeholder-[#94a3b8]/50"
              disabled={sending}
            />
            <button 
              type="submit"
              disabled={sending || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#7c3aed] hover:text-[#8b5cf6] disabled:opacity-30 transition-all"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MundosManager({ user, readMode, setReadMode, setBreadcrumb, navigationTarget, onNavigate }: { user: FirebaseUser, readMode: boolean, setReadMode: (v: boolean) => void, setBreadcrumb?: (b: string[]) => void, navigationTarget?: string, onNavigate?: (type: string, id: string) => void }) {
  const [mundos, setMundos] = useState<Mundo[]>([]);
  const [selectedMundo, setSelectedMundo] = useState<Mundo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [facciones, setFacciones] = useState<Faccion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (navigationTarget && mundos.length > 0) {
      const targetMundo = mundos.find(m => m.id === navigationTarget);
      if (targetMundo) {
        setSelectedMundo(targetMundo);
      }
    }
  }, [navigationTarget, mundos]);

  const toggleFavorite = async (e: React.MouseEvent, mundo: Mundo) => {
    e.stopPropagation();
    
    if (!mundo.isFavorite) {
      const favoritesCount = mundos.filter(m => m.isFavorite).length;
      if (favoritesCount >= 15) {
        alert("Límite de 15 favoritos alcanzado en esta sección.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.MUNDOS, mundo.id), {
        isFavorite: !mundo.isFavorite
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    if (setBreadcrumb) {
      if (selectedMundo) {
        setBreadcrumb([selectedMundo.name]);
      } else {
        setBreadcrumb([]);
      }
    }
  }, [selectedMundo, setBreadcrumb]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.MUNDOS), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedMundos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mundo));
      fetchedMundos.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
      setMundos(fetchedMundos);
    });
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.FACCIONES), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFacciones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faccion)));
    });
    return unsubscribe;
  }, [user.uid]);

  return (
    <div className="h-full flex flex-col max-w-[900px] mx-auto w-full">
      {!readMode && (
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-4xl font-bold font-cinzel text-glow-gold mb-2">Mundos</h3>
            <p className="text-[#94a3b8]">Cartografía y lore de las realidades conocidas.</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Crear Mundo
          </button>
        </div>
      )}

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Lista de Mundos (Navegador Lateral) */}
        {!readMode && (
          <div className="w-64 flex flex-col gap-4 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Buscar mundo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] focus:border-[#7c3aed] outline-none transition-all"
              />
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {mundos.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(mundo => (
                <div
                  key={mundo.id}
                  onClick={() => setSelectedMundo(mundo)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all group relative overflow-hidden cursor-pointer",
                    selectedMundo?.id === mundo.id 
                      ? "bg-[#7c3aed]/10 border-[#7c3aed] shadow-[0_0_20px_rgba(124,58,237,0.1)]" 
                      : "bg-transparent border-transparent hover:border-[#7c3aed]/30"
                  )}
                >
                <button 
                  onClick={(e) => toggleFavorite(e, mundo)}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/5 transition-all z-20"
                >
                  <Star className={cn("w-4 h-4 transition-colors", mundo.isFavorite ? "text-[#c6a052] fill-[#c6a052]" : "text-[#94a3b8]")} />
                </button>
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-1">Mundo #{mundo.id.slice(0,4)}</p>
                  <h4 className="text-lg font-bold font-cinzel text-glow-gold group-hover:text-white transition-colors">{mundo.name}</h4>
                </div>
                {selectedMundo?.id === mundo.id && (
                  <motion.div layoutId="active-mundo" className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/20 to-transparent pointer-events-none" />
                )}
              </div>
            ))}
            {mundos.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="p-8 text-center border border-dashed border-[#c6a052]/30 rounded-xl opacity-50">
                <p className="text-sm italic">No hay mundos encontrados.</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Detalle del Mundo (Atlas View) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedMundo ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-5xl font-bold font-cinzel text-glow-gold mb-4">{selectedMundo.name}</h2>
                  <p className="text-lg text-[#e2e8f0] leading-[1.6] max-w-2xl">{selectedMundo.description}</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setReadMode(!readMode)}
                    className={cn(
                      "p-3 rounded-xl transition-all border",
                      readMode 
                        ? "bg-[#7c3aed]/20 border-[#7c3aed] text-[#7c3aed]" 
                        : "bg-transparent border-transparent hover:bg-[#7c3aed]/20 hover:border-[#7c3aed]/30 text-[#94a3b8]"
                    )}
                    title="Modo Lectura"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>
                  {!readMode && (
                    <button className="p-3 bg-transparent rounded-xl hover:bg-[#7c3aed]/20 transition-all border border-transparent hover:border-[#7c3aed]/30">
                      <Settings className="w-5 h-5 text-[#94a3b8]" />
                    </button>
                  )}
                </div>
              </div>

              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c6a052] to-transparent my-8" />

              <div className="space-y-10">
                {/* Geografía */}
                <section>
                  <h5 className="text-xl font-bold text-[#c6a052] font-cinzel mb-6 flex items-center gap-3">
                    <Globe className="w-5 h-5" />
                    Geografía y Clima
                  </h5>
                  <div className="space-y-6 border-l-2 border-[#8b5cf6] pl-6">
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Regiones Principales</p>
                      <p className="text-base text-[#e2e8f0] leading-[1.6] font-cinzel">{selectedMundo.geography?.regions || 'No definidas'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Clima Predominante</p>
                      <p className="text-base text-[#e2e8f0] leading-[1.6]">{selectedMundo.geography?.climate || 'No definido'}</p>
                    </div>
                  </div>
                </section>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c6a052] to-transparent my-8 opacity-50" />

                {/* Cronología */}
                <section>
                  <h5 className="text-xl font-bold text-[#c6a052] font-cinzel mb-6 flex items-center gap-3">
                    <Scroll className="w-5 h-5" />
                    Cronología y Eras
                  </h5>
                  <div className="space-y-6 border-l-2 border-[#8b5cf6] pl-6">
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Eras Históricas</p>
                      <p className="text-base text-[#e2e8f0] leading-[1.6] font-cinzel">{selectedMundo.chronology?.eras || 'No definidas'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Era Actual</p>
                      <p className="text-base font-bold text-[#7c3aed] font-cinzel">{selectedMundo.chronology?.currentEra || 'Desconocida'}</p>
                    </div>
                  </div>
                </section>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c6a052] to-transparent my-8 opacity-50" />

                {/* Lore */}
                <section>
                  <h5 className="text-xl font-bold text-[#c6a052] font-cinzel mb-6 flex items-center gap-3">
                    <Library className="w-5 h-5" />
                    Cultura y Mitología
                  </h5>
                  <div className="space-y-6 border-l-2 border-[#8b5cf6] pl-6">
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Cultura Dominante</p>
                      <p className="text-base text-[#e2e8f0] leading-[1.6]">{selectedMundo.lore?.culture || 'No definida'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-2 tracking-widest">Mitos y Deidades</p>
                      <p className="text-base text-[#e2e8f0] leading-[1.6] italic">{selectedMundo.lore?.mythology || 'No definidos'}</p>
                    </div>
                  </div>
                </section>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c6a052] to-transparent my-8 opacity-50" />

                {/* Facciones Dominantes */}
                <section>
                  <h5 className="text-xl font-bold text-[#c6a052] font-cinzel mb-6 flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    Facciones Dominantes
                  </h5>
                  <div className="flex flex-wrap gap-2 border-l-2 border-[#8b5cf6] pl-6">
                    {selectedMundo.dominantFactions?.map(fId => {
                      const fac = facciones.find(f => f.id === fId);
                      return (
                        <button 
                          key={fId} 
                          onClick={() => onNavigate?.('facciones', fId)}
                          className="px-4 py-2 bg-[#c6a052]/10 border border-[#c6a052]/30 rounded-lg text-xs font-bold text-[#c6a052] uppercase tracking-wider hover:bg-[#c6a052]/20 transition-colors"
                        >
                          {fac?.name || fId}
                        </button>
                      );
                    })}
                    {(!selectedMundo.dominantFactions || selectedMundo.dominantFactions.length === 0) && (
                      <p className="text-base text-[#94a3b8] italic">Sin facciones asignadas.</p>
                    )}
                  </div>
                </section>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c6a052] to-transparent my-8 opacity-50" />

                {/* Cartografía */}
                <section>
                  <h5 className="text-xl font-bold text-[#c6a052] font-cinzel mb-6 flex items-center gap-3">
                    <Map className="w-5 h-5" />
                    Cartografía
                  </h5>
                  <div className="border-l-2 border-[#8b5cf6] pl-6">
                    <InteractiveMap worldId={selectedMundo.id} worldName={selectedMundo.name} />
                  </div>
                </section>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-[#7c3aed]/5 flex items-center justify-center mb-8 border border-[#7c3aed]/20">
                <Globe className="w-12 h-12 text-[#7c3aed]/40" />
              </div>
              <h3 className="text-2xl font-bold font-cinzel mb-4 text-glow-gold">Selecciona un Mundo</h3>
              <p className="text-[#94a3b8] max-w-md">Explora la cartografía y el lore de las realidades registradas.</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CrearMundoModal user={user} onClose={() => setShowCreate(false)} facciones={facciones} />}
    </div>
  );
}

function CrearMundoModal({ user, onClose, facciones }: { user: FirebaseUser, onClose: () => void, facciones: Faccion[] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [regions, setRegions] = useState('');
  const [climate, setClimate] = useState('');
  const [eras, setEras] = useState('');
  const [currentEra, setCurrentEra] = useState('');
  const [culture, setCulture] = useState('');
  const [mythology, setMythology] = useState('');
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const prompt = window.prompt("Ingresa una directriz para generar el mundo (ej: 'Mundo cyberpunk decadente'):");
    if (!prompt) return;
    
    setGenerating(true);
    try {
      const aiPrompt = `Genera detalles para un mundo de fantasía o ciencia ficción basado en esta idea: "${prompt}".
      Devuelve SOLO un objeto JSON válido con las siguientes propiedades:
      - name: Nombre del mundo.
      - description: Descripción general y atmosférica.
      - regions: Regiones principales (ej: Norte Helado, Desierto de Cristal).
      - climate: Clima general.
      - eras: Eras históricas principales.
      - currentEra: Era actual.
      - culture: Cultura y sociedad.
      - mythology: Mitología y leyendas.
      `;

      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: aiPrompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.regions) setRegions(data.regions);
      if (data.climate) setClimate(data.climate);
      if (data.eras) setEras(data.eras);
      if (data.currentEra) setCurrentEra(data.currentEra);
      if (data.culture) setCulture(data.culture);
      if (data.mythology) setMythology(data.mythology);
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error al generar contenido. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !description) return;
    setCreating(true);
    try {
      await addDoc(collection(db, COLLECTIONS.MUNDOS), {
        userId: user.uid,
        name,
        description,
        geography: { regions, climate },
        chronology: { eras, currentEra },
        lore: { culture, mythology },
        dominantFactions: selectedFactions,
        cartography: { locations: [] },
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.MUNDOS);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl p-10 bg-[#0a0a0a] border-[0.5px] border-[#c6a052] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
      >
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-bold font-cinzel text-glow-gold">Registro de Nuevo Mundo</h3>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-[#c6a052]/10 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-all text-sm font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Sugerir
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-12">
          {/* Columna A */}
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Nombre del Mundo</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Aethelgard, Neo-Tokyo..."
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] font-cinzel text-lg"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Descripción General</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="La esencia de este mundo..."
                rows={3}
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Geografía (Regiones)</label>
              <input 
                value={regions} 
                onChange={(e) => setRegions(e.target.value)} 
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Clima Predominante</label>
              <input 
                value={climate} 
                onChange={(e) => setClimate(e.target.value)} 
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]" 
              />
            </div>
          </div>

          {/* Columna B */}
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Cultura</label>
              <textarea 
                value={culture} 
                onChange={(e) => setCulture(e.target.value)} 
                rows={2} 
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Mitología</label>
              <textarea 
                value={mythology} 
                onChange={(e) => setMythology(e.target.value)} 
                rows={2} 
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Eras</label>
                <input 
                  value={eras} 
                  onChange={(e) => setEras(e.target.value)} 
                  className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Era Actual</label>
                <input 
                  value={currentEra} 
                  onChange={(e) => setCurrentEra(e.target.value)} 
                  className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Facciones Dominantes</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {facciones.map(fac => (
                  <button
                    key={fac.id}
                    onClick={() => {
                      if (selectedFactions.includes(fac.id)) {
                        setSelectedFactions(selectedFactions.filter(id => id !== fac.id));
                      } else {
                        setSelectedFactions([...selectedFactions, fac.id]);
                      }
                    }}
                    className={cn(
                      "p-2 rounded border text-left text-xs transition-all",
                      selectedFactions.includes(fac.id) ? "bg-[#c6a052]/20 border-[#c6a052] text-[#c6a052]" : "bg-transparent border-[#94a3b8]/30 text-[#94a3b8] hover:border-[#c6a052]/50"
                    )}
                  >
                    {fac.name}
                  </button>
                ))}
                {facciones.length === 0 && (
                  <p className="text-xs text-[#94a3b8] italic col-span-2">No hay facciones registradas en la biblioteca.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4 border-t border-[#c6a052]/20 pt-6">
          <button onClick={onClose} className="px-6 py-3 rounded text-[#94a3b8] hover:text-white transition-all font-bold tracking-widest uppercase text-sm">Cancelar</button>
          <button 
            onClick={handleCreate}
            disabled={creating || !name || !description}
            className="px-8 py-3 bg-[#c6a052] text-black font-bold tracking-widest uppercase text-sm rounded hover:bg-[#d4af37] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Mundo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ManualManager({ user }: { user: FirebaseUser }) {
  const [activeTab, setActiveTab] = useState<'fisica' | 'magia' | 'protocolos'>('fisica');

  return (
    <div className="h-full flex flex-col max-w-[1000px] mx-auto w-full bg-[#f4f1ea] text-[#1a1a1a] rounded-r-2xl shadow-[20px_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Anillas de la carpeta */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#d1cbb8] to-[#f4f1ea] border-r border-[#d1cbb8] flex flex-col justify-evenly items-center py-10 z-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-[#0a0a0c] shadow-inner relative flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#f4f1ea] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" />
            <div className="absolute left-[-10px] w-4 h-1 bg-gradient-to-b from-[#94a3b8] to-[#475569] rounded-l-full shadow-sm" />
          </div>
        ))}
      </div>

      <div className="pl-16 pr-8 py-10 flex-1 flex flex-col h-full">
        <div className="flex justify-between items-end mb-10 border-b-2 border-[#1a1a1a] pb-6">
          <div>
            <h3 className="text-4xl font-bold font-serif text-[#1a1a1a] tracking-tight">Manual de Reglas</h3>
            <p className="text-[#4a4a4a] font-serif italic mt-2">Compendio de leyes físicas, arcanas y protocolos del sistema.</p>
          </div>
          <button className="px-4 py-2 bg-[#1a1a1a] text-[#f4f1ea] font-serif uppercase tracking-widest text-xs hover:bg-[#333] transition-colors">
            Añadir Entrada
          </button>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Pestañas Laterales */}
          <div className="w-48 flex flex-col gap-2 shrink-0">
            {(['fisica', 'magia', 'protocolos'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-left font-serif uppercase tracking-widest text-xs transition-all border-l-4",
                  activeTab === tab 
                    ? "border-[#1a1a1a] bg-[#e8e4d9] font-bold text-[#1a1a1a]" 
                    : "border-transparent text-[#666] hover:bg-[#e8e4d9]/50 hover:text-[#1a1a1a]"
                )}
              >
                [{tab}]
              </button>
            ))}
          </div>

          {/* Contenido del Manual */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 font-serif">
            {activeTab === 'fisica' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-2xl font-bold mb-4 border-b border-[#d1cbb8] pb-2">Leyes de la Física</h4>
                  <p className="text-[#333] leading-relaxed mb-4">
                    Las constantes universales que rigen la materia y la energía en la mayoría de las realidades estables.
                  </p>
                  <div className="bg-[#e8e4d9] p-6 rounded border border-[#d1cbb8]">
                    <h5 className="font-bold uppercase tracking-widest text-xs mb-2">Gravedad Estándar</h5>
                    <p className="text-sm leading-relaxed">Definida como 1G (9.8 m/s²). Modificable según el núcleo planetario o anomalías locales.</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'magia' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-2xl font-bold mb-4 border-b border-[#d1cbb8] pb-2">Sistemas Arcanos</h4>
                  <p className="text-[#333] leading-relaxed mb-4">
                    Reglas para la manipulación de la energía etérea y la alteración de la realidad.
                  </p>
                  <div className="bg-[#e8e4d9] p-6 rounded border border-[#d1cbb8]">
                    <h5 className="font-bold uppercase tracking-widest text-xs mb-2">Coste de Maná</h5>
                    <p className="text-sm leading-relaxed">Toda alteración requiere un intercambio equivalente de energía vital o ambiental.</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'protocolos' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-2xl font-bold mb-4 border-b border-[#d1cbb8] pb-2">Protocolos del Sistema</h4>
                  <p className="text-[#333] leading-relaxed mb-4">
                    Mecánicas de resolución de conflictos y tiradas de dados.
                  </p>
                  <div className="bg-[#e8e4d9] p-6 rounded border border-[#d1cbb8]">
                    <h5 className="font-bold uppercase tracking-widest text-xs mb-2">Resolución D20</h5>
                    <p className="text-sm leading-relaxed">Éxito = Tirada + Modificadores {'>='} Dificultad (DC).</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MotorManager({ user }: { user: FirebaseUser }) {
  return (
    <div className="h-full flex flex-col max-w-[1000px] mx-auto w-full bg-[#000000] text-[#00ff00] rounded-2xl border border-[#8b5cf6]/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-hidden relative font-mono">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      <div className="relative z-10 p-8 flex flex-col h-full">
        <div className="flex justify-between items-end mb-10 border-b border-[#8b5cf6]/30 pb-6">
          <div>
            <h3 className="text-4xl font-bold text-[#e2e8f0] tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(226,232,240,0.5)]">NÚCLEO DEL MOTOR</h3>
            <p className="text-[#8b5cf6] text-sm uppercase tracking-widest">Configuración de parámetros de simulación y probabilidades.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00] animate-pulse" />
              <span className="text-[10px] text-[#00ff00] uppercase tracking-widest">Sistema Online</span>
            </div>
            <button className="px-4 py-2 bg-[#8b5cf6]/20 text-[#e2e8f0] border border-[#8b5cf6]/50 uppercase tracking-widest text-xs hover:bg-[#8b5cf6]/40 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              Aplicar Cambios
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-4">
          {/* Panel Izquierdo: Diales */}
          <div className="space-y-8">
            <div className="bg-[#0a0a0c] border border-[#8b5cf6]/20 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent opacity-50" />
              <h4 className="text-[#e2e8f0] font-bold uppercase tracking-widest mb-6 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#8b5cf6]" />
                Probabilidades Base
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Dial 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#1a1a1a] relative flex items-center justify-center mb-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="44" cy="44" r="40" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="251.2" strokeDashoffset="62.8" className="drop-shadow-[0_0_5px_#8b5cf6]" />
                    </svg>
                    <span className="text-2xl font-bold text-[#e2e8f0]">75<span className="text-xs text-[#8b5cf6]">%</span></span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest text-center">Éxito Base</p>
                </div>
                
                {/* Dial 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#1a1a1a] relative flex items-center justify-center mb-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="44" cy="44" r="40" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="251.2" strokeDashoffset="200" className="drop-shadow-[0_0_5px_#ef4444]" />
                    </svg>
                    <span className="text-2xl font-bold text-[#e2e8f0]">15<span className="text-xs text-[#ef4444]">%</span></span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest text-center">Pifia Crítica</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0c] border border-[#8b5cf6]/20 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent opacity-50" />
              <h4 className="text-[#e2e8f0] font-bold uppercase tracking-widest mb-6 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#8b5cf6]" />
                Módulos Activos
              </h4>
              <div className="space-y-3">
                {['Sistema de Combate Avanzado', 'Magia Dinámica', 'Economía Simulada'].map((mod, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#333] rounded">
                    <span className="text-xs text-[#e2e8f0] uppercase tracking-wider">{mod}</span>
                    <div className="w-8 h-4 bg-[#8b5cf6]/20 rounded-full relative">
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#8b5cf6] rounded-full shadow-[0_0_10px_#8b5cf6]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Consola de Logs */}
          <div className="bg-[#0a0a0c] border border-[#8b5cf6]/20 rounded-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent opacity-50" />
            <div className="p-4 border-b border-[#8b5cf6]/20 bg-[#1a1a1a]">
              <h4 className="text-[#e2e8f0] font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8b5cf6]" />
                Registro del Sistema
              </h4>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] text-[#00ff00] space-y-2 opacity-80">
              <p>{'>'} INICIANDO SECUENCIA DE ARRANQUE...</p>
              <p>{'>'} CARGANDO MÓDULOS DE LÓGICA... [OK]</p>
              <p>{'>'} SINCRONIZANDO CON BASE DE DATOS MULTIVERSAL... [OK]</p>
              <p className="text-[#ef4444]">{'>'} ADVERTENCIA: ANOMALÍA DETECTADA EN SECTOR 7G.</p>
              <p>{'>'} RECALCULANDO PROBABILIDADES DE SUPERVIVENCIA... 32.4%</p>
              <p>{'>'} SISTEMA LISTO PARA RECIBIR INPUT.</p>
              <p className="animate-pulse">_</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
