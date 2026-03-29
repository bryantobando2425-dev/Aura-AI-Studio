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
import { cn, compressImage } from './lib/utils';
import { MundosManager } from './components/MundosManager';
import { BibliotecaManager } from './components/BibliotecaManager';

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
