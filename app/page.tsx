"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import FormField from '@/components/FormField';
import SubmitButton from '@/components/SubmitButton';
import ItemCard from '@/components/ItemCard';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  likes: number;
  created_at: string;
  user_id?: string;
}

export default function SchoolNewsPage() {
  // --- AUTH ТӨЛӨВ ---
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // --- ПОСТ ТӨЛӨВ ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Бүгд' | 'Мэдээ' | 'Зарлал' | 'Мэдэгдэл'>('Бүгд');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  // Формын төлөвүүд
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Мэдээ');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    checkUser();
    fetchPosts();

    const savedLikes = localStorage.getItem('school_news_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

    const channel = supabase
      .channel('school-news-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
    setFetching(false);
  }

  // --- AUTH FUNCTIONS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { nickname } }
      });
      if (error) alert(error.message);
      else alert("Бүртгэл амжилттай!");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setUser(data.user);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- POST FUNCTIONS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Талбаруудыг бөглөнө үү!");
    
    // Зарлал бол заавал user байх ёстой
    if (category === 'Зарлал' && !user) return;

    setLoading(true);
    const postData = { 
      title, 
      content, 
      category, 
      author: user ? (user.user_metadata?.nickname || user.email) : "Зочин хэрэглэгч",
      user_id: user?.id || null 
    };

    if (editingId) {
      await supabase.from('posts').update(postData).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('posts').insert([{ ...postData, likes: 0 }]);
    }
    
    resetForm();
    setLoading(false);
  };

  const resetForm = () => { setTitle(''); setContent(''); setCategory('Мэдээ'); };

  const handleLike = async (id: string, currentLikes: number) => {
    if (likedPosts.includes(id)) return;
    const { error } = await supabase.from('posts').update({ likes: currentLikes + 1 }).eq('id', id);
    if (!error) {
      const updatedLikes = [...likedPosts, id];
      setLikedPosts(updatedLikes);
      localStorage.setItem('school_news_likes', JSON.stringify(updatedLikes));
    }
  };

  const filteredPosts = useMemo(() => {
    return activeTab === 'Бүгд' ? posts : posts.filter(post => post.category === activeTab);
  }, [posts, activeTab]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-10">
      <header className="bg-[#1e293b] border-b border-slate-700 sticky top-0 z-50 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-white">SchoolNews<span className="text-indigo-500">.mn</span></h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400">@{user.user_metadata?.nickname}</span>
              <button onClick={handleLogout} className="text-[9px] bg-rose-500/10 text-rose-500 px-3 py-1 rounded-lg border border-rose-500/20">Гарах</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЗҮҮН ТАЛ: FORM ЭСВЭЛ AUTH */}
        <aside className="lg:col-span-4">
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-3xl sticky top-28 shadow-2xl">
            
            {/* Нөхцөл: Хэрэв Зарлал сонгогдсон ба нэвтрээгүй бол Auth харуулна */}
            {category === 'Зарлал' && !user ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-indigo-500/10 p-4 rounded-2xl mb-6 border border-indigo-500/20">
                  <p className="text-xs font-bold text-indigo-400">📣 Зарлал оруулахын тулд нэвтрэх шаардлагатай.</p>
                </div>
                <h2 className="text-lg font-bold text-white mb-4">{authMode === 'login' ? '🔑 Нэвтрэх' : '👤 Бүртгүүлэх'}</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && <FormField label="Nickname" value={nickname} onChange={(e: any) => setNickname(e.target.value)} />}
                  <FormField label="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  <FormField label="Password" value={password} type="password" onChange={(e: any) => setPassword(e.target.value)} />
                  <SubmitButton label={loading ? "Түр хүлээнэ үү..." : (authMode === 'login' ? "Нэвтрэх" : "Бүртгүүлэх")} />
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">
                    {authMode === 'login' ? "Шинэ бүртгэл үүсгэх үү?" : "Нэвтрэх хэсэг рүү буцах"}
                  </button>
                </form>
                <button onClick={() => setCategory('Мэдээ')} className="w-full mt-4 text-[10px] text-indigo-500 underline">Зочноор мэдээ бичих</button>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-2">{editingId ? '📝 Засварлах' : '✨ Шинэ нийтлэл'}</h2>
                <FormField label="Гарчиг" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ангилал</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0f172a] border-slate-700 text-slate-400'}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <FormField label="Агуулга" isTextArea value={content} onChange={(e: any) => setContent(e.target.value)} />
                <SubmitButton label={loading ? "..." : (editingId ? "Хадгалах" : "Нийтлэх")} />
                {editingId && <button onClick={() => { setEditingId(null); resetForm(); }} className="w-full text-[10px] text-slate-500 mt-2 hover:underline">Цуцлах</button>}
              </form>
            )}
          </div>
        </aside>

        {/* БАРУУН ТАЛ: ЖАГСААЛТ */}
        <div className="lg:col-span-8 space-y-6">
          <nav className="flex bg-[#1e293b] p-1 rounded-2xl border border-slate-700 gap-1 overflow-x-auto">
            {['Бүгд', 'Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
            ))}
          </nav>

          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="group bg-[#1e293b] border border-slate-700 p-6 rounded-3xl transition-all hover:border-indigo-500/50 relative overflow-hidden">
                {post.category === 'Зарлал' && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">Чухал</div>}
                <ItemCard 
                  title={post.title}
                  description={post.content}
                  badge={post.category}
                  footer={
                    <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {post.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{post.author}</p>
                          <p className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleLike(post.id, post.likes)} className="bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl border border-rose-500/10 flex items-center gap-2 text-[10px] font-bold">
                          {post.likes} {likedPosts.includes(post.id) ? '❤️' : '🤍'}
                        </button>
                        {user?.id === post.user_id && (
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingId(post.id); setTitle(post.title); setContent(post.content); setCategory(post.category); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs">✏️</button>
                            <button onClick={async () => { if(confirm("Устгах уу?")) await supabase.from('posts').delete().eq('id', post.id); }} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-xs">🗑️</button>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}