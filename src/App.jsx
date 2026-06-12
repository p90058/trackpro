import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Toaster, toast } from 'sonner';
import { 
  MapPin, Battery, AlertTriangle, Navigation, Smartphone, 
  Shield, Bell, Menu, X, Activity, Users, Settings, LogOut,
  User, Plus
} from 'lucide-react';
import { supabase } from './lib/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import moment from 'moment';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ==================== LOGIN ====================
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toast.error('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    // Guardar sesión
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.email,
      role: 'admin'
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    onLogin(user);
    toast.success(`Bienvenido ${data.user.email}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">TrackPro</h1>
          <p className="text-slate-400">Sistema de Rastreo GPS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
              placeholder="p90058@gmail.com"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm mb-2 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-900 rounded-lg">
          <p className="text-slate-400 text-xs mb-2">Administrador:</p>
          <p className="text-slate-300 text-xs">p90058@gmail.com / P91357642</p>
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ user }) {
  const [tags, setTags] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const tagsChannel = supabase
      .channel('tags-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tags' }, 
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tagsChannel);
    };
  }, [user]);

  const loadData = async () => {
    try {
      const { data: tagsData, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTags(tagsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      moving: 'bg-blue-500',
      stopped: 'bg-yellow-500',
      inactive: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getBatteryColor = (level) => {
    if (level > 50) return 'text-green-400';
    if (level > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getIconForType = (type) => {
    const icons = { car: '', person: '👤', package: '', bike: '🚴', truck: '🚚', pet: '🐕' };
    return icons[type] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Panel de Administrador Maestro</p>
        </div>
        <button onClick={loadData} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
          <Navigation size={20} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <MapPin className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Tags</p>
              <p className="text-2xl font-bold text-white">{tags.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <Activity className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Activos</p>
              <p className="text-2xl font-bold text-white">{tags.filter(t => t.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Bell className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Con Alarma</p>
              <p className="text-2xl font-bold text-white">{tags.filter(t => t.movement_alarm_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Alertas</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 h-[500px]">
        <MapContainer center={[19.4326, -99.1332]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {tags.map(tag => (
            <Marker key={tag.id} position={[tag.latitude, tag.longitude]}>
              <Popup>
                <div className="text-slate-900 space-y-1">
                  <h3 className="font-bold">{tag.name}</h3>
                  <p className="text-sm">📍 {tag.tag_id}</p>
                  <p className="text-sm"> {tag.battery_level}%</p>
                  <p className="text-sm">🚀 {tag.speed} km/h</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map(tag => (
          <div key={tag.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getStatusColor(tag.status)} bg-opacity-20`}>
                  {getIconForType(tag.icon)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{tag.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tag.status)} bg-opacity-20`}>
                    {tag.status}
                  </span>
                </div>
              </div>
              {tag.movement_alarm_active && <AlertTriangle className="text-red-500 animate-pulse" size={24} />}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Código:</span>
                <span className="text-white font-mono">{tag.access_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batería:</span>
                <span className={getBatteryColor(tag.battery_level)}>{tag.battery_level}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad:</span>
                <span className="text-white">{tag.speed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Última vez:</span>
                <span className="text-slate-300">{moment(tag.last_seen).fromNow()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== MOBILE TRACKING ====================
function MobileTracking({ user }) {
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [tagId, setTagId] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const startTracking = async () => {
    if (!tagId || !accessCode) {
      toast.error('Ingresa Tag ID y Access Code');
      return;
    }

    const { data: tagData } = await supabase
      .from('tags')
      .select('*')
      .eq('tag_id', tagId)
      .eq('access_code', accessCode)
      .single();

    if (!tagData) {
      toast.error('Tag o código inválido');
      return;
    }

    setTracking(true);
    toast.info('Iniciando rastreo en segundo plano...');

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed || 0
          };
          setPosition(loc);

          await supabase
            .from('tags')
            .update({
              latitude: loc.latitude,
              longitude: loc.longitude,
              speed: loc.speed,
              status: loc.speed > 0 ? 'moving' : 'stopped',
              last_seen: new Date().toISOString()
            })
            .eq('tag_id', tagId)
            .eq('access_code', accessCode);

          await supabase
            .from('location_history')
            .insert({
              tag_id: tagId,
              latitude: loc.latitude,
              longitude: loc.longitude,
              speed: loc.speed,
              battery_level: 85
            });

          toast.success('Ubicación actualizada', { duration: 2000 });
        },
        (error) => toast.error('Error GPS: ' + error.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      localStorage.setItem('trackingWatchId', watchId);
    }
  };

  const stopTracking = () => {
    const watchId = localStorage.getItem('trackingWatchId');
    if (watchId) {
      navigator.geolocation.clearWatch(parseInt(watchId));
      localStorage.removeItem('trackingWatchId');
    }
    setTracking(false);
    toast.success('Rastreo detenido');
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
        <Smartphone className="text-emerald-500 w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-white">Mobile Tracking</h1>
      <p className="text-slate-400">Convierte tu celular en GPS</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <input type="text" placeholder="Tag ID (ej: DEMO001)" value={tagId} onChange={(e) => setTagId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white" />
        <input type="text" placeholder="Access Code" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white" />

        {tracking ? (
          <div className="space-y-4">
            <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Navigation className="animate-pulse" size={20} />
                <span>Rastreando en tiempo real...</span>
              </div>
            </div>
            {position && (
              <div className="text-left text-sm text-slate-300 space-y-1">
                <p> Lat: {position.latitude.toFixed(6)}</p>
                <p>📍 Lng: {position.longitude.toFixed(6)}</p>
                <p>🚀 Vel: {position.speed} m/s</p>
              </div>
            )}
            <button onClick={stopTracking} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors">
              Detener Rastreo
            </button>
          </div>
        ) : (
          <button onClick={startTracking} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors">
            Iniciar Rastreo 24/7
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== NAVBAR ====================
function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard', icon: <MapPin size={18} /> },
    { path: '/mobile', label: 'Tracking Móvil', icon: <Smartphone size={18} /> },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-white">TrackPro</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {links.map(link => (
              <Link key={link.path} to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${location.pathname === link.path ? 'bg-slate-800 text-emerald-500' : 'text-slate-300 hover:bg-slate-800'}`}>
                {link.icon} {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
              <User size={18} className="text-slate-400" />
              <span className="text-slate-300 text-sm">{user.email}</span>
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">ADMIN</span>
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-300">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          {links.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-slate-300 hover:bg-slate-700">
              {link.icon} {link.label}
            </Link>
          ))}
          <button onClick={onLogout} className="block w-full px-4 py-3 text-left text-red-500 hover:bg-slate-700">
            <LogOut size={18} className="inline mr-2" /> Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

// ==================== APP PRINCIPAL ====================
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Sesión cerrada correctamente');
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900">
        <Toaster position="top-right" theme="dark" richColors />
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/mobile" element={<MobileTracking user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
